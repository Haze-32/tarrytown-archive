/* assets/app.js
  - Inject shared navbar into <div id="site-nav"></div>
  - Home page: fill #count-tapes, #count-clips, #count-photos
  - Tapes/Clips pages: provide loadPage({ path, listId, playerId })
*/

(function () {
  "use strict";

  function $(id) { return document.getElementById(id); }

  function setTextIfExists(id, text) {
    var el = $(id);
    if (!el) return;
    el.textContent = text;
  }

  // ---------- NAV ----------
  function injectNavbar() {
    var host = $("site-nav");
    if (!host) return;

    host.innerHTML =
      '<nav class="navbar navbar-dark bg-dark navbar-expand-lg border-bottom border-secondary">' +
      '  <div class="container">' +
      '    <a class="navbar-brand fw-semibold" href="index.html">Tarrytown</a>' +
      '    <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navMain">' +
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
  }

  // ---------- API ----------
  function listFiles(path) {
    // The ONLY supported endpoint now:
    // /api/list.php?path=/videos/clips/
    var url = "api/list.php?path=" + encodeURIComponent(path);

    return fetch(url, { cache: "no-store" })
      .then(function (r) {
        if (!r.ok) throw new Error("List failed: " + r.status);
        return r.json();
      })
      .then(function (data) {
        if (!data || !Array.isArray(data.files)) return [];
        return data.files;
      });
  }

  function isPlayableInBrowser(filename) {
    // Most browsers play mp4/webm. MKV is usually NOT playable.
    var ext = filename.split(".").pop().toLowerCase();
    return ext === "mp4" || ext === "webm" || ext === "m4v";
  }

  // ---------- HOME COUNTS ----------
  function loadCounts() {
    // Only run on pages that have these ids
    var needsCounts = $("count-tapes") || $("count-clips") || $("count-photos");
    if (!needsCounts) return;

    Promise.all([
      listFiles("/videos/tapes/").catch(function () { return []; }),
      listFiles("/videos/clips/").catch(function () { return []; }),
      listFiles("/videos/photos/").catch(function () { return []; })
    ]).then(function (arr) {
      setTextIfExists("count-tapes", arr[0].length);
      setTextIfExists("count-clips", arr[1].length);
      setTextIfExists("count-photos", arr[2].length);
    });
  }

  // ---------- PAGE LOADER (tapes/clips) ----------
  // Expose as global so clips.html/tapes.html can call it.
  window.loadPage = function loadPage(opts) {
    // opts = { path: "/videos/clips/", listId: "video-list", playerId: "video-player" }
    opts = opts || {};
    var path = opts.path;
    var listId = opts.listId;
    var playerId = opts.playerId;

    var listEl = $(listId);
    var playerEl = $(playerId);

    if (!path || !listEl || !playerEl) return;

    listEl.innerHTML = '<div class="text-muted">Loading…</div>';

    listFiles(path)
      .then(function (files) {
        if (!files.length) {
          listEl.innerHTML = '<div class="alert alert-secondary">No videos found in ' + path + '</div>';
          return;
        }

        // Build list of buttons
        var html = "";
        files.forEach(function (name, idx) {
          var playable = isPlayableInBrowser(name);
          html +=
            '<button type="button" class="list-group-item list-group-item-action bg-dark text-light border-secondary d-flex justify-content-between align-items-center" ' +
            'data-file="' + encodeURIComponent(name) + '">' +
            '<span class="text-truncate me-2">' + name + '</span>' +
            (playable
              ? '<span class="badge text-bg-success">Play</span>'
              : '<span class="badge text-bg-warning">Download</span>') +
            "</button>";
        });

        listEl.innerHTML = '<div class="list-group">' + html + "</div>";

        // Click handler (event delegation)
        listEl.onclick = function (e) {
          var btn = e.target.closest("button[data-file]");
          if (!btn) return;

          var file = decodeURIComponent(btn.getAttribute("data-file"));
          var url = path.replace(/\/$/, "") + "/" + file; // /videos/clips + /file

          if (isPlayableInBrowser(file)) {
            playerEl.innerHTML =
              '<video controls playsinline style="width:100%; max-height:70vh;" src="' + url + '"></video>' +
              '<div class="mt-2 d-flex gap-2">' +
              '  <a class="btn btn-outline-light btn-sm" href="' + url + '" download>Download</a>' +
              '  <a class="btn btn-outline-secondary btn-sm" href="' + url + '" target="_blank" rel="noopener">Open</a>' +
              "</div>";
          } else {
            // MKV: show download + note
            playerEl.innerHTML =
              '<div class="alert alert-warning">' +
              "<div><strong>This file may not play in the browser:</strong> " + file + "</div>" +
              "<div>Most browsers don’t support MKV playback. Download it to watch.</div>" +
              "</div>" +
              '<a class="btn btn-light" href="' + url + '" download>Download ' + file + "</a>";
          }
        };

        // Auto-select first file
        var firstBtn = listEl.querySelector("button[data-file]");
        if (firstBtn) firstBtn.click();
      })
      .catch(function (err) {
        listEl.innerHTML = '<div class="alert alert-danger">Error loading list: ' + (err && err.message ? err.message : err) + "</div>";
      });
  };

  // ---------- boot ----------
  document.addEventListener("DOMContentLoaded", function () {
    injectNavbar();
    loadCounts();
  });
})();
