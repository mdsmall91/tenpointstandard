#!/usr/bin/env python3
"""
The model proxy, for local testing.

Same contract, same prompts, and the same three-layer boundary as the
Cloudflare Worker in worker/ - it reads worker/prompts.json rather than
keeping its own copy, so the two cannot drift. The difference is that
this one runs on your machine and needs no Cloudflare account, so the
AI layer can be tested today.

    python tools/dev-proxy.py

Then open the site at http://localhost:4173. config.js points at this
proxy automatically when the page is served from localhost, so nothing
else needs changing.

THE KEY. Never passed on the command line and never written into this
repository. It is read from, in order:

    1. the ANTHROPIC_API_KEY environment variable
    2. C:\\Users\\<you>\\.secrets\\anthropic_api_key.txt

The second is the same convention the Placer key already uses. Create
the file with the key as its only line, and nothing else has to change.

Every call prints one line with the tokens it used and what it cost, so
the running total is visible while testing rather than a surprise on a
statement.
"""

import http.server
import json
import os
import re
import socketserver
import sys
import threading

PORT = 8788
REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROMPTS_PATH = os.path.join(REPO, 'worker', 'prompts.json')

MODEL = 'claude-sonnet-5'
EFFORT = 'low'
MAX_TOKENS = 4000

# Claude Sonnet 5, dollars per million tokens. Only used for the running
# total printed below; it changes nothing about the request.
PRICE_IN = 2.00
PRICE_OUT = 10.00
PRICE_CACHE_READ = 0.20

ALLOWED_ORIGINS = ['http://localhost:4173', 'http://127.0.0.1:4173']

_spent = {'usd': 0.0, 'calls': 0}
_lock = threading.Lock()


def load_prompts():
    with open(PROMPTS_PATH, encoding='utf-8') as f:
        return json.load(f)


PROMPTS = load_prompts()
FORBIDDEN = [re.compile(p, re.I) for p in PROMPTS['forbidden']['patterns']]


def find_key():
    key = os.environ.get('ANTHROPIC_API_KEY')
    if key:
        return key.strip(), 'ANTHROPIC_API_KEY'
    path = os.path.join(os.path.expanduser('~'), '.secrets', 'anthropic_api_key.txt')
    if os.path.isfile(path):
        with open(path, encoding='utf-8') as f:
            k = f.read().strip()
        if k:
            return k, path
    return None, None


def system_for(task):
    return '\n'.join([
        '\n'.join(PROMPTS['shared_rules']),
        '',
        '\n'.join(PROMPTS['tasks'][task]['system']),
    ])


def violates_boundary(text):
    return any(r.search(text) for r in FORBIDDEN)


class Handler(http.server.BaseHTTPRequestHandler):
    protocol_version = 'HTTP/1.1'

    def _cors(self):
        origin = self.headers.get('Origin') or ALLOWED_ORIGINS[0]
        if origin not in ALLOWED_ORIGINS:
            origin = ALLOWED_ORIGINS[0]
        self.send_header('Access-Control-Allow-Origin', origin)
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.send_header('Vary', 'Origin')

    def _send(self, obj, status=200):
        payload = json.dumps(obj).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(payload)))
        self._cors()
        self.end_headers()
        self.wfile.write(payload)

    def do_OPTIONS(self):
        self.send_response(204)
        self._cors()
        self.send_header('Content-Length', '0')
        self.end_headers()

    def do_POST(self):
        try:
            length = int(self.headers.get('Content-Length') or 0)
            body = json.loads(self.rfile.read(length) or b'{}')
        except Exception:
            self._send({'error': 'bad_json'}, 400)
            return

        task = body.get('task')
        if task not in PROMPTS['tasks']:
            self._send({'error': 'unknown_task'}, 400)
            return

        # The visitor's own words, passed as data inside a labelled
        # block rather than concatenated into the instructions.
        content = json.dumps(body.get('payload') or {})[:8000]

        try:
            resp = CLIENT.messages.create(
                model=MODEL,
                max_tokens=MAX_TOKENS,
                system=[{
                    'type': 'text',
                    'text': system_for(task),
                    'cache_control': {'type': 'ephemeral'},
                }],
                output_config={
                    'effort': EFFORT,
                    'format': {'type': 'json_schema', 'schema': PROMPTS['tasks'][task]['schema']},
                },
                messages=[{
                    'role': 'user',
                    'content': '<project_data>\n' + content + '\n</project_data>',
                }],
            )
        except Exception as e:
            print('  upstream error: ' + type(e).__name__ + ' ' + str(e)[:200])
            self._send({'error': 'upstream_error'}, 502)
            return

        u = resp.usage
        cost = (
            (u.input_tokens or 0) * PRICE_IN
            + (u.output_tokens or 0) * PRICE_OUT
            + (getattr(u, 'cache_read_input_tokens', 0) or 0) * PRICE_CACHE_READ
        ) / 1_000_000.0
        with _lock:
            _spent['usd'] += cost
            _spent['calls'] += 1
            running = _spent['usd']
            calls = _spent['calls']
        print(
            '  %-14s in %5d  out %4d  cached %5d  =  $%.5f   (%d calls, $%.4f total)'
            % (task, u.input_tokens or 0, u.output_tokens or 0,
               getattr(u, 'cache_read_input_tokens', 0) or 0, cost, calls, running)
        )

        if resp.stop_reason == 'refusal':
            self._send({'error': 'refused'}, 422)
            return

        text = next((b.text for b in resp.content if b.type == 'text'), None)
        if not text:
            self._send({'error': 'no_content'}, 502)
            return

        if violates_boundary(text):
            print('  BOUNDARY VIOLATION discarded, the page keeps its template')
            self._send({'error': 'boundary'}, 422)
            return

        try:
            parsed = json.loads(text)
        except Exception:
            self._send({'error': 'unparseable'}, 502)
            return

        if task == 'intake':
            self._send({'fields': parsed})
        else:
            lines = parsed.get('lines')
            self._send({'lines': lines if isinstance(lines, list) else []})

    def log_message(self, fmt, *args):
        pass        # the per-call cost line above is the only log wanted


class Server(socketserver.ThreadingTCPServer):
    allow_reuse_address = True
    daemon_threads = True


if __name__ == '__main__':
    key, source = find_key()
    if not key:
        sys.exit(
            'No Anthropic API key found.\n\n'
            'Put the key in either of these and run this again:\n'
            '  the ANTHROPIC_API_KEY environment variable\n'
            '  ' + os.path.join(os.path.expanduser('~'), '.secrets', 'anthropic_api_key.txt') + '\n\n'
            'The key is never written into this repository.'
        )

    try:
        import anthropic
    except ImportError:
        sys.exit('The Anthropic SDK is missing. Run:  python -m pip install anthropic')

    CLIENT = anthropic.Anthropic(api_key=key)

    print('Ten Point model proxy')
    print('  key      ' + ('environment variable' if source == 'ANTHROPIC_API_KEY' else source))
    print('  model    ' + MODEL + ', effort ' + EFFORT)
    print('  serving  http://localhost:' + str(PORT))
    print('  site     http://localhost:4173')
    print('')
    print('Every call prints its tokens and cost. Ctrl+C to stop.')
    print('')
    with Server(('127.0.0.1', PORT), Handler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print('\nstopped after %d calls, $%.4f total' % (_spent['calls'], _spent['usd']))
