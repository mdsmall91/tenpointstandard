# The session confirmation email

Signups at `/glamping-show/` land in Mailchimp tagged to the AGA interest
group. Nothing emails them yet: the only live journey, "Welcome new
contacts", is deliberately filtered to **exclude** that group so a seat
request never receives a scorecard. So a second journey is needed, and
until it exists a signup gets silence even though the page promises an
email straight away.

Blocked on a Mailchimp login. Everything below is ready to paste.

---

## The journey

**Audience → Automations → Create → Customer Journey → Build from scratch**

- **Name:** Session seat confirmed
- **Trigger:** Signs up for Email
- **Filter:** Group category `Subscriptions` → **is one of** → the AGA
  group. Note this is `is one of`, the opposite of the existing journey's
  `none of`. Between them every signup is covered exactly once.
- **Delay:** none. "Every day as soon as possible."
- **One step:** Send email.

Check the group id against the live signup form rather than trusting a
number written down here. `CONFIG.MAILCHIMP_GROUP_AGA` is
`group[70477][2]=1`, and Mailchimp numbers group options in powers of
two, so bit 2 is the second option, not the third. This has already been
got wrong once on the consultation group, which is bit 4 and not 3.

---

## From

**Ten Point Standard · letstalk@tenpointstandard.com** — the same sender
as the scorecard, which is already domain-authenticated.

## Subject

    Your seat is held: The Resort Reality Game, Wednesday 9:40 AM

## Preview text

    Wednesday, September 30, 9:40 AM, at the American Glamping Association booth.

## Body

Paste into the **Code** tab of a text block, not the visual editor. The
visual editor has added a stray `|*` after a merge tag here before, and
it went out to thirteen people before anyone noticed.

```html
<h1>Your seat is held.</h1>
<p>Thanks for telling us you are coming, *|FNAME|*. We have you down for
The Resort Reality Game, and there is nothing else you need to do.</p>
<p><strong>Wednesday, September 30, 2026</strong><br>
9:40 AM, runs 45 minutes<br>
American Glamping Association booth, Glamping Show Americas, Aurora,
Colorado</p>
<p>It is a table session rather than a lecture. You will work through
five operator dilemmas, choose a path, and see what it costs. Seats are
the seats at the table, so arriving a few minutes early is worth it.</p>
<p><strong>You will leave with</strong></p>
<p>A Business Model Canvas.<br>
The Ten Point Field Guide.<br>
An invitation to a post-show Operator Reality Check session.</p>
<p>If you want the thinking started before you sit down, the Quick Scan
takes about ninety seconds on a phone. Six questions about who the
project is for and what it is meant to do. Nothing is scored and it does
not ask for an email.</p>
<p>Either of us is reachable before the show.</p>
<p>Kenny Reed, Ten Point Services<br>
512.557.8762 · kenny@tenpointservicestx.com</p>
<p>Matt Small, RVi Planning &amp; Landscape Architecture<br>
303.728.4694 · msmall@rviplanning.com</p>
<p>See you Wednesday.</p>
```

Button under the text block: **Start the Quick Scan** →
`https://tenpointstandard.com/read/`

---

## Before activating

- **Preview with live merge tag info on**, against a real contact, and
  read the rendered `*|FNAME|*`. A blank there means the name split in
  `aga.js` did not land.
- **Re-save the trigger** after editing the email. The trigger filter has
  needed re-saving after an edit before.
- **Send a test to a real inbox** and click the Quick Scan button. Mailchimp
  rewrites links for click tracking at send time, so the only proof a
  link works is a real click.

## After the show

Pause it. A seat confirmation for a session that has happened is worse
than no email, and this one names a date in the subject line.
