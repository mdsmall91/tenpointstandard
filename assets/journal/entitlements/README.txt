Drop the hero photo here as hero.jpg (2400px on the long edge, 16:9),
and the author photo as author.jpg (square, 400px).

Then, to switch the page off the placeholder:
  1. posts.js  -> set hero: 'assets/journal/entitlements/hero.jpg'
                  and author.photo likewise
  2. journal/entitlements.html and the tile in journal.html ->
     replace the <span class="jr-media-note">...</span> inside
     .jr-media with:
       <img src="../assets/journal/entitlements/hero.jpg"
            alt="Lit safari tent under a night sky"
            width="2400" height="1350" loading="eager">
     (drop the ../ for the tile on journal.html)
  3. Leave the aspect-ratio on .jr-media alone — it is what stops the
     masonry columns reflowing as images load.
  4. Bump ?v=N on the journal assets.
