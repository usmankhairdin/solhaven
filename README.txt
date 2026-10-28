SOLHAVEN
A free, single-page residential rooftop solar website template.
Plain HTML, CSS and vanilla JavaScript. No install or build is required.

START LOCALLY
1. Keep index.html, assets/ and the licence/notices together.
2. Open index.html in a modern browser for a quick look. For dependable
   font/clipboard behaviour, serve this folder with a local static server.
   Example if Python is installed: python -m http.server 8080
   Then open http://localhost:8080/ and stop the server with Ctrl+C.
3. No npm, React, Vite, API key, database or remote font is required.
   JavaScript, fonts, photographs and illustrations are bundled locally.

EDIT THE WEBSITE
- Text, section order, form labels, footer and metadata: index.html.
- Palette, type, spacing, responsive layouts: assets/css/solhaven.css.
- Scope explanations and unsent-brief text: assets/js/solhaven.js.
- Main photo, brand mark and equipment diagram: assets/img/.
- Change the brand and page description before publication. Solhaven is a
  fictional demonstration; photography is illustrative stock, not proof of
  installations or a business portfolio. Check rights to your new identity.
- The diagram is an explanatory illustration, not a wiring/engineering plan.
- Keep meaningful heading order, labels, image descriptions and focus states.
- Three scope radios update the explanation and carry the selected scope
  into the project brief. No system size, savings or generation calculator.
- The draft is assembled when Prepare my brief is pressed. After editing
  fields or scope, prepare it again to update the output. Copy or download
  the text yourself. Downloads are local text files, not submitted enquiries.

DOMAIN ROOT UPLOAD
Upload index.html and the entire assets folder to your host's public root
(e.g. public_html). Keep spelling and case unchanged. Serve over HTTPS.
No build step, SPA fallback, redirect rule or server runtime is needed.
Retain README.txt, LICENSE, THIRD_PARTY_NOTICES.txt and licenses/ in source
and any package you redistribute. Do not upload private credentials.

SUBFOLDER UPLOAD
Upload the whole directory to /solhaven/ or any chosen path, then visit
https://your-domain.example/solhaven/ (with the trailing slash).
All runtime asset URLs are relative; there is no hardcoded base path.
In-page links stay on index.html. Test direct loads and refresh after upload.
Do not add a <base> tag or prepend the folder name to the existing paths.

CUSTOM DOMAIN
Use your chosen static host's current domain/DNS instructions. This package
cannot configure DNS or HTTPS. No analytics, cookies, trackers, backend,
provider account, payment service, form endpoint or external runtime request
is configured. Add only services you control and document their privacy use.

FRONTEND LIMITATIONS
- The contact form NEVER sends email, books visits or stores your data.
  It validates fields and prepares an explicitly UNSENT draft on-device.
  Copy requires clipboard permission/secure context; selection and download
  are available as fallbacks. Download files may be handled by browser rules.
- Details entered remain in the current page state only. Reload clears the
  generated draft; a browser may independently remember/autofill fields.
- With JavaScript disabled, content, anchor navigation and native FAQ details
  remain usable. Brief generation is disabled and an explanation is shown.
- The menu, smooth scrolling and custom scrollbars are progressive
  enhancements. Native touch/keyboard scrolling is retained. Reduced-motion
  preferences remove animated motion and use native scrolling.
- Native radio controls provide accessible choices. No custom select/date/time
  fields are necessary in this template. No real appointment availability.
- No warranties about roof suitability, engineering, tariffs, incentives,
  savings, costs, compliance or energy performance are represented. Arrange
  an assessment with an appropriately qualified local installer.
- Parent browser acceptance review is recorded separately in docs/QA.md.

LICENCES
Original template: MIT, see LICENSE. Keep its copyright/grant when copying.
Shared free UI mechanics: Nookwell and Taskline MIT grants in licenses/.
Lenis 1.3.27: MIT. Bricolage Grotesque and Manrope: SIL OFL 1.1.
Photo: Unsplash License; do not resell as standalone stock.
Read THIRD_PARTY_NOTICES.txt and licenses/photo-sources.json for origins.
The author-credit display links only the bold name Usman Khair Din to
https://www.usmankhairdin.com/ as requested by the template owner.
