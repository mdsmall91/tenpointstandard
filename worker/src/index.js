import Anthropic from '@anthropic-ai/sdk';
import prompts from '../prompts.json';

/* =============================================================
   TEN POINT — MODEL PROXY
   The server side of the AI layer. The site calls this; this calls
   Claude. The API key lives here as a Worker secret and never
   reaches the repository, the browser, or a page's source.

   WHAT IT DOES
     intake         reads a sentence the owner typed and pulls out
                    the facts they actually stated
     read           rewrites lane one's four sentence read in their
                    own project language
     standard_read  the same for lane two's longer read

   WHAT IT REFUSES TO DO
     Anything that would put a cost, a schedule, a yield figure, or
     a ruling on what a jurisdiction will approve in front of an
     owner. That boundary is enforced three times: in the system
     prompt, by the output schema, and by a regex check on the way
     out. See worker/prompts.json.

   IT IS ALSO OPTIONAL, ALWAYS. Every response the site can get from
   here has a deterministic template behind it. If this Worker is
   down, slow, rate limited, or never deployed, the visitor still
   gets a complete read and never learns a call was attempted. That
   is a design rule, not a fallback: the product must not depend on
   a model being up.
   ============================================================= */

const MODEL = 'claude-opus-5';

/* Low effort is the right setting here, not a cost compromise. These
   are short, tightly specified rewrites with the facts already
   supplied, and they sit inside a six second budget on somebody's
   phone. Thinking stays on (adaptive, the default on this model):
   turning it off on Opus 5 can leak reasoning into the visible text,
   and lowering effort achieves the same saving without that risk. */
const EFFORT = 'low';

/* Generous enough that adaptive thinking has room, tight enough that
   a pathological input cannot run up a bill. */
const MAX_TOKENS = 4000;

const ALLOWED_ORIGINS = [
  'https://tenpointstandard.com',
  'https://www.tenpointstandard.com',
  'http://localhost:4173',
  'http://127.0.0.1:4173',
];

const FORBIDDEN = prompts.forbidden.patterns.map((p) => new RegExp(p, 'i'));

function corsHeaders(origin) {
  const allow = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

function json(body, status, origin) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
  });
}

/* The system prompt is the shared rules plus the task's own. Kept in
   this order so the long, stable half sits first and can be cached. */
function systemFor(task) {
  return [prompts.shared_rules.join('\n'), '', prompts.tasks[task].system.join('\n')].join('\n');
}

/* The third guard. Even a response that satisfied the prompt and the
   schema is thrown away if it carries a price, a duration, a yield
   figure, or a promise about an approval. Throwing it away is safe:
   the client already has a correct template on screen. */
function violatesBoundary(text) {
  return FORBIDDEN.some((re) => re.test(text));
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }
    if (request.method !== 'POST') {
      return json({ error: 'method_not_allowed' }, 405, origin);
    }
    if (origin && !ALLOWED_ORIGINS.includes(origin)) {
      return json({ error: 'origin_not_allowed' }, 403, origin);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: 'bad_json' }, 400, origin);
    }

    const task = body && body.task;
    if (!task || !Object.prototype.hasOwnProperty.call(prompts.tasks, task)) {
      return json({ error: 'unknown_task' }, 400, origin);
    }

    /* Rate limited per caller. The address is used as the key and is
       never stored or logged; the binding keeps its own counter. */
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    if (env.READ_LIMITER) {
      const { success } = await env.READ_LIMITER.limit({ key: ip });
      if (!success) return json({ error: 'rate_limited' }, 429, origin);
    }

    /* The payload is the visitor's own words plus the template we
       already built. It is data, not instruction: the system prompt
       says so, and it is passed inside a labelled block rather than
       concatenated into the instructions. */
    const userContent = JSON.stringify(body.payload || {}).slice(0, 8000);

    const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

    let response;
    try {
      response = await client.messages.create({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: [
          {
            type: 'text',
            text: systemFor(task),
            /* The stable half of every request. Whether it is long
               enough to qualify for caching depends on the model's
               minimum prefix, so check usage.cache_read_input_tokens
               before assuming it helps. */
            cache_control: { type: 'ephemeral' },
          },
        ],
        output_config: {
          effort: EFFORT,
          format: { type: 'json_schema', schema: prompts.tasks[task].schema },
        },
        messages: [
          {
            role: 'user',
            content: '<project_data>\n' + userContent + '\n</project_data>',
          },
        ],
      });
    } catch (err) {
      /* Never leak an upstream message to the browser: it can carry
         request details. The client treats every failure the same
         way, by keeping its template. */
      console.error('upstream_error', err && err.status);
      return json({ error: 'upstream_error' }, 502, origin);
    }

    /* A policy decline is not an error here. The client keeps its
       template, which is what a decline should produce anyway. */
    if (response.stop_reason === 'refusal') {
      return json({ error: 'refused' }, 422, origin);
    }

    const textBlock = response.content.find((b) => b.type === 'text');
    if (!textBlock) return json({ error: 'no_content' }, 502, origin);

    if (violatesBoundary(textBlock.text)) {
      console.warn('boundary_violation_discarded', task);
      return json({ error: 'boundary' }, 422, origin);
    }

    let parsed;
    try {
      parsed = JSON.parse(textBlock.text);
    } catch {
      return json({ error: 'unparseable' }, 502, origin);
    }

    /* Shape the reply to exactly what the client expects, so a schema
       change here cannot hand the page a field it will render raw. */
    if (task === 'intake') {
      return json({ fields: parsed }, 200, origin);
    }
    return json({ lines: Array.isArray(parsed.lines) ? parsed.lines : [] }, 200, origin);
  },
};
