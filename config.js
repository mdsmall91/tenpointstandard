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

  /* Marks people who sign up for the AGA session on aga.html, so the
     "Welcome new contacts" journey can be told to leave them alone.
     An ungrouped signup enters that journey and receives the Field
     Guide scorecard email with every merge field empty. aga.js
     refuses to submit if this is blank rather than risk that.

     Set up in Mailchimp Sep 6 2026: option "AGA Resort Reality Game"
     (interest id 270438) added to the existing hidden "Subscriptions"
     category (70477), alongside Field Notes (bit 1 / 270437). The bit
     below was read off the HOSTED signup form
     (tenpointservicestx.us4.list-manage.com/subscribe?u=..&id=..) —
     it is NOT the interest id shown in the admin URL, which does not
     work here. Journey 694's trigger filter now reads `Subscriptions
     none of Field Notes, AGA Resort Reality Game`, and the trigger was
     re-saved and the flow reactivated; skipping that re-save leaves
     the trigger stale and NOBODY enters the journey. */
  MAILCHIMP_GROUP_AGA: 'group[70477][2]=1',

  /* Merge tag carrying the optional note from the AGA form. A note
     sent to a tag Mailchimp does not know is accepted, answered with
     success, and silently dropped, so aga.js refuses to submit if this
     is blank.

     The audience is at Mailchimp's 30 merge-field cap (MERGE0-MERGE29)
     and "Create a new field" is a silent no-op there. Rather than
     delete a field and destroy its column for every contact, the
     unused COMPANY default (MERGE6) was RELABELLED on Sep 6 2026:
     field name Company -> Note, merge tag COMPANY -> NOTE. Nothing was
     deleted, and MERGE6 is still the underlying slot. Merge fields
     truncate at 255 characters, which is why the textarea on aga.html
     is capped at 255. */
  MAILCHIMP_FIELD_NOTE: 'NOTE'
};
