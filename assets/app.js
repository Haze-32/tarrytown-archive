/* assets/app.js
  What this file does:
  - Injects a shared navbar onto any page that has <div id="site-nav"></div>
  - Loads site.json (optional) without crashing if elements are missing
  - Populates homepage counts (tapes/clips/photos) by calling your PHP list endpoint(s)
    - It tries multiple URL patterns because your endpoints changed during debugging
    - It accepts several JSON shapes and extracts a file list safely
*/

(function () {
  "use strict";

  // ---------- small helpers ----------
  function $(id) {
    return document.getElementById(id);
  }

  function setTextIfExists(id, text) {
    var el = $(id);
    if (!el) return;
    el.textContent = text;
  }

  function setHtmlIfExists(id, html) {
    var el = $(id);
    if (!el) return;
    el.innerHTML = html;
  }

  function safeJson(resp) {
    // If the server returns HTML or something weird, this prevents a crash.
    return resp.json().catch(function () { return null; });
  }

  function extractFiles(payload) {
    // Accepts multiple possible formats and returns an array of filenames.
    // Examples supported:
    // { found: ["a.mp4"] }
    // { files: ["a.mp4"] }
    // { data: { files: [...] } }
    // ["a.mp4", "b.mp4"]
    if (!payload) return [];
    if (Array.isArray(payload)) return payload;

    if (payload.found && Array.isArray(payload.found)) return payload.found;
    if (payload.files && Array.isArray(payload.files)) return payload.files;

    if (payload.data) {
      if (payload.data.found && Array.isArray(payload.data.found)) return payload.data.found;
      if (payload.data.files && Array.isArray(payload.data.files)) return payload.data.files;
    }

    return [];
  }

  function firstWorkingJson(urls) {
    // Tries each URL until one returns valid JSON.
    // Returns a Promise that resolves to the JSON payload (or null).
    var i = 0;

    function tryNext() {
      if (i >= urls.length) return Promise.resolve(null);
      var url = urls[i++];

      return fetch(url, { cache: "no-store" })
        .then(function (r) {
          if (!r.ok) return null;
          return safeJson(r);
        })
        .then(function (data) {
          // If we got null/invalid json, continue
          if (!data) return tryNext();
          return data;
        })
        .catch(function () {
          return tryNext();
        });
    }

    return tryNext();
  }

  // ---------- shared navbar ----------
  function injectNavbar() {
    // Only inject if the placeholder exists on the page.
    var host = $("site-nav");
    if (!host) return;

    // You can tweak brand text here later
    var html =
      '<nav class="navbar navbar-dark bg-dark navbar-expand-lg border-bottom border-secondary">' +
      '  <div class="container">' +
      '    <a class="navbar-brand fw-semibold" href="index.html">Tarrytown</a>' +
      '    <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navMain" aria-controls="navMain" aria-expanded="false" aria-label="Toggle navigation">' +
      '      <span class="navbar-toggler-icon"></span>' +
      "    </button>" +
      '    <div class="collapse navbar-collapse" id="navMain">' +
      '      <div class="navbar-nav ms-auto">' +
      '        <a class="nav-link" href="tapes.html">Full VHS Tapes</a>' +
      '        <a class="nav-link" href="clips.html">Clips</a>' +
      '        <a class="nav-link disabled" href="#" tabindex="-1" aria-disabled="true">Photos</a>' +
      "      </div>" +
      "    </div>" +
      "  </div>" +
      "</nav>";

    host.innerHTML = html;
  }

  // ---------- optional site.json (won't crash if ids don't exist) ----------
  function loadSiteMeta() {
    // You referenced these IDs before; this version won't throw if they aren't on a page.
    return fetch("data/site.json", { cache: "no-store" })
      .then(function (r) { return safeJson(r); })
      .then(function (site) {
        if (!site) return;

        // Optional fields
        if (site.title) setTextIfExists("site-title", site.title);
        if (site.intro) setTextIfExists("site-intro", site.intro);
      })
      .catch(function () { /* ignore */ });
  }

  // ---------- counts on the homepage cards ----------
  function setCountBadge(id, n) {
    var el = $(id);
    if (!el) return;

    // Display "0" if empty; looks nicer than blank
    el.textContent = String(n);
  }

  function loadCounts() {
    // Only run counts if the placeholders exist (homepage).
    var needsCounts = $("count-tapes") || $("count-clips") || $("count-photos");
    if (!needsCounts) return;

    // We will try multiple endpoints for each folder.
    // This is defensive because your endpoints changed names during debugging.
    function countFor(folderType) {
      // folderType: "tapes" | "clips" | "photos"

      // Common places you might have ended up with:
      // - /api/list.php?type=tapes
      // - /api/list.php?folder=tapes
      // - /list-videos.php?type=tapes
      // - /list-videos.php?folder=videos/tapes
      // - /list-videos.php?dir=/videos/tapes
      var urls = [
        "api/list.php?type=" + encodeURIComponent(folderType),
        "api/list.php?folder=" + encodeURIComponent(folderType),
        "api/list.php?dir=" + encodeURIComponent("videos/" + folderType),
        "list-videos.php?type=" + encodeURIComponent(folderType),
        "list-videos.php?folder=" + encodeURIComponent("videos/" + folderType),
        "list-videos.php?dir=" + encodeURIComponent("/videos/" + folderType)
      ];

      return firstWorkingJson(urls).then(function (payload) {
        var files = extractFiles(payload);

        // Filter out junk filenames just in case
        files = files.filter(function (name) {
          return name && name !== "." && name !== "..";
        });

        return files.length;
      });
    }

    // Load all counts in parallel
    Promise.all([
      countFor("tapes"),
      countFor("clips"),
      countFor("photos")
    ]).then(function (counts) {
      setCountBadge("count-tapes", counts[0]);
      setCountBadge("count-clips", counts[1]);
      setCountBadge("count-photos", counts[2]);
    }).catch(function () {
      // If endpoints are unavailable, leave them as "--"
      // (You can also swap this to "0" if you prefer.)
    });
  }

  // ---------- boot ----------
  document.addEventListener("DOMContentLoaded", function () {
    injectNavbar();
    loadSiteMeta();
    loadCounts();
  });
})();
