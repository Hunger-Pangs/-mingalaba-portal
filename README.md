# Mingalaba Portal - front-end demo

A frozen copy of the portal's screens as plain HTML, with sample data, for showing the front end.
No server and no database are needed, and nothing here is real: every name, outlet, number and
document is made up.

## Put it on GitHub Pages
1. Create a repository and upload **everything in this folder** (keep the `static` and `data` folders and `demo.js`).
2. Repository **Settings > Pages > Build and deployment**: Source = *Deploy from a branch*,
   Branch = `main`, folder = `/ (root)`. Save.
3. After a minute the demo opens at `https://<your-user>.github.io/<repository>/` (start page: `index.html`).

Or open `index.html` through any web server (for example `python -m http.server` in this folder).
Opening the files straight from disk (double-click) will not load the sample data.

## How it behaves
- The pages use the internet for fonts and Tailwind (the same CDN the real portal uses), so show it online.
- Sign in with any employee ID and password: the demo accepts it and opens the Dashboard.
- Anything that saves, sends or downloads shows "Demo only" and stores nothing.
- Log Book reports, jobs, announcements, outlets and the Admin usage numbers come from the sample files in `data/`.

## Use a private repository
The screens carry the company's branding and layout. If the demo should not be public, make the repository private
(GitHub Pages from a private repository needs a paid GitHub plan) or share the zip instead.
