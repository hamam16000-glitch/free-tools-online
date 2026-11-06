# AdSense integration — 6 November 2026

This update adds the same publisher loader already present on the calculator site to the Free Tools Online site. It does not submit another AdSense site or restart the review in the account.

- Publisher: `ca-pub-4791337719438849`, copied from the live root site's script and matching the publisher shown in the supplied AdSense screenshot.
- Base commit: `9f424e5795153518c5f5d51c0d688d486fdefb8f` in `hamam16000-glitch/free-tools-online`.
- Loader added once inside `<head>` on 54 content pages: homepage, 48 tools and 5 guide pages.
- The loader has the standard `async` and `crossorigin="anonymous"` attributes. No fabricated ad-unit ID or manual ad placement was added.
- Existing tool code, inputs, outputs, styles, canonical URLs and links are preserved. The insertion is the only change in each of the 54 content pages.
- About, contact and terms pages remain unchanged; no loader is added to them or to privacy. Privacy now describes Google's advertising requests and identifiers, and links to Google's explanation. Only the privacy entry's sitemap date changes.
- The root calculator repository and root ads.txt are outside this update. The existing root ads.txt already contains the matching publisher entry.

## Verification and scope

The preparation checks one correctly configured head loader per content page, unchanged content after removing that insertion, and preservation of the other tracked files. Local browser checks use a stub in place of Google's advertising response so they do not generate real ad requests. The Termux package is tested against a private local Git remote before delivery.

This is an integration change, not a new content review or an AdSense approval. Actual ad serving depends on account/site approval and the ad configuration in AdSense. Any required consent and account setup is managed in the publisher account.

## Termux

`fto-adsense.py --prepare-repo` prepares a separate checkout in `~/fto-adsense/repo`, keeps an archive of the pinned published source, and saves the installer itself in `~/fto-adsense/fto-adsense.py`.

`--publish` pushes a backup branch and then main without force push. It refuses changed source history, extra local work, an unexpected staged tree or a changed backup. `--status`, `--diff` and `--preview` are available. Python and Git are sufficient; no nano, pip or npm is required.

Sources:

- https://support.google.com/adsense/answer/7584263?hl=en
- https://support.google.com/publisherpolicies/answer/10437794?hl=en
- https://policies.google.com/technologies/partner-sites
