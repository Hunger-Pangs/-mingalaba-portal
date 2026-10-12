# Mingalaba Portal - front-end site (updated)

Same layout as the earlier version (dashboard.html, knowledge-center.html, task-checklist.html, ...), now updated with
everything built since: the new Log Book registers and reports, Announcements and Jobs boards, document libraries by
department, Restaurant Details, and the full Admin portal.

* `index.html` is the sign-in page. Any ID and password opens the Dashboard (demo mode).
* `all-pages.html` lists every screen, including the Admin pages (`admin-*.html`).
* `sop-<department>.html` and `forms-<department>.html` are the department pages of the document libraries.
  `company-info-directory.html` and `company-forms-directory.html` open the Operations department of each library.
* `header.html` is still the single source of the header; edit it and run `sync-header.ps1` to copy it into every page.
* `data/` holds the sample data; `static/` the Admin styles and document viewers; `demo.js` switches the pages to sample data.
* All names, outlets, numbers and documents are made up. Anything that saves, sends or downloads shows "Demo only".

Preview locally: double-click `start-local-server.bat` (needs Python). On GitHub: upload everything to the repository root and turn on
Settings > Pages (branch `main`, folder `/ (root)`). Fonts and styles load from the internet, as before.
`announcements-store-targets.html` is the old designer page, kept unchanged because the portal has no newer version of it.

## Updating the GitHub repository (important)
The earlier upload contained only the .html and .js files, so the `data` and `static` folders were missing on GitHub
(no sample data, no Admin styles). Upload the **folders** too:
1. In the repository click **Add file > Upload files** and drag the whole contents of this zip (after unzipping), including the `data` and `static`
   folders, into the page. Commit to `main`.
2. Delete the old duplicate files listed in `FILES-TO-DELETE.txt` (open each file > trash icon > Commit).
3. Settings > Pages: Branch `main`, folder `/ (root)`.
