# AdSense review build — 19 November 2026

This release supersedes the earlier runtime-loader integration. It preserves publisher account `ca-pub-4791337719438849` through Google's supported `google-adsense-account` meta tag. The root `ads.txt` already contains the matching publisher entry.

Advertising is disabled in this review build. No AdSense or Monetag runtime loader is included. This is a release choice while content and navigation are repaired, not a general Google requirement to remove advertising code.

The former Monetag homepage script and verification tag are removed. `sw.js` is replaced with a worker that activates and unregisters itself. The scoped cleanup script updates only registrations for `/free-tools-online/sw.js`; it does not remove workers belonging to other applications on the origin. Browser notification permissions are not changed by this code.

Privacy now describes this release's actual requests and storage. About identifies the public source publisher and the existing correction email. Existing file-processing tool engines and local vendor libraries remain in place.

Before enabling advertising, configure any applicable consent solution in the publisher account, including a Google-certified CMP for personalized advertising where required. Update the privacy policy to reflect the providers actually activated. Do not substitute a homemade cookie banner for a certified CMP requirement.

The Termux delivery `DCH_AdSense_Repair.py` applies both this repository and the root calculator repository from verified file hashes. Python and Git are sufficient. `--apply` prepares local files; `--publish` commits and pushes without force, then checks whether the expected files appear on GitHub Pages. It does not submit an AdSense review or alter the publisher account.

The supplied refusal notice allows a new review only after 26 November. Successful source publication is not AdSense approval. See the root repository's `ADSENSE_REVIEW.md` for the audit scope and remaining review limits.

Official references:

- https://support.google.com/adsense/answer/7584263?hl=en
- https://support.google.com/adsense/answer/7299563?hl=en
- https://support.google.com/adsense/answer/13554116?hl=en
