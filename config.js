'use strict';

/* =============================================================
   TEN POINT — SHARED CONFIG
   The only values that need editing after launch. Loaded by both
   the assessment (index.html) and the Field Journal, so these
   live in exactly one place. Load this BEFORE any other script.
   ============================================================= */
var CONFIG = {
  // Mailchimp embedded-form action URL for the audience signup form.
  // Mailchimp: Audience > Signup forms > Embedded forms > copy the <form action="..."> URL.
  MAILCHIMP_FORM_ACTION: 'https://tenpointservicestx.us4.list-manage.com/subscribe/post?u=ca6a6d0df8860fb34744c0490&id=32ae7807af&f_id=0046d6e0f0',

  // Google Analytics 4 measurement ID. Leave empty to disable.
  GA_MEASUREMENT_ID: 'G-DK01ZN4VLE',

  /* Marks Field Notes subscribers so they are distinguishable from
     scorecard leads inside the one audience. The "Welcome new
     contacts" journey is filtered to `Subscriptions none of Field
     Notes` so these people do not receive the scorecard email, and
     the RSS campaign targets the matching segment.

     CRITICAL: this is a GROUP (interest), not a tag. `tags=<id>` on
     the post-json endpoint is accepted and then SILENTLY DISCARDED —
     the contact subscribes, the response says success, and the tag
     never lands. Verified by live test Aug 9 2026. Same class of
     trap as the f_id parameter stripped in submitToMailchimp().

     The field name is Mailchimp's own, group[<categoryId>][<bit>].
     Read it off the hosted signup form
     (tenpointservicestx.us4.list-manage.com/subscribe?u=..&id=..) —
     70477 is the "Subscriptions" category, 1 is the bit for the
     "Field Notes" option. It is NOT the interest id shown in the
     admin URL; that value does not work here. */
  MAILCHIMP_GROUP_FIELD_NOTES: 'group[70477][1]=1',

  /* Marks people who sign up for the AGA session on aga.html.

     THIS MUST BE SET BEFORE aga.html GOES LIVE. Until it is, aga.js
     refuses to submit and shows the reader an error, on purpose. An
     ungrouped signup falls into the "Welcome new contacts" journey and
     receives the Field Guide scorecard email with every merge field
     empty, which is worse than the form being briefly broken.

     Two Mailchimp steps, in this order:
       1. Audience > Subscriber preferences > the existing hidden
          "Subscriptions" category (id 70477) > add an option for the
          session. Then open the HOSTED signup form
          (tenpointservicestx.us4.list-manage.com/subscribe?u=..&id=..)
          and read the new checkbox's real field name off the HTML.
          It will be group[70477][<bit>]; the bit is NOT the interest
          id shown in the admin URL. Paste the whole name=value here.
       2. "Welcome new contacts" (journey 694): Pause & Edit, widen the
          trigger filter from `Subscriptions none of Field Notes` to
          `none of Field Notes, <the new option>`, then trigger ⋮ >
          Edit > Save Trigger, then Turn back on. Skipping the trigger
          re-save leaves it stale and NOBODY enters the journey. */
  MAILCHIMP_GROUP_AGA: '',

  /* Merge tag that carries the optional note from the AGA form.

     THIS MUST BE SET BEFORE aga.html GOES LIVE, for the same reason:
     aga.js refuses to submit without it. A note typed into a field
     Mailchimp does not know about is accepted, reported as success,
     and silently dropped, so the reader believes it was read.

     The audience sits at the 30 merge-field cap, so a slot has to be
     freed before the field can be created. ADDRESS, PHONE and
     BIRTHDAY are the unused defaults. Audience > Settings > Audience
     fields and *|MERGE|* tags > delete one > Add a field > Text >
     tag NOTE. Merge fields truncate at 255 characters, which is why
     the textarea on aga.html is capped at 255. */
  MAILCHIMP_FIELD_NOTE: ''
};
