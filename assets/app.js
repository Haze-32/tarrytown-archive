/* assets/app.js
   Shared JS for Tarrytown archive pages.
   - Loads site title/intro from data/site.json (if elements exist)
   - Loads folder file list from api/list.php?dir=tapes|clips
   - Loads metadata (titles/descriptions) from a JSON file
   - Renders Bootstrap cards with <video> + download link
*/

async function loadJson(url) {
  const res = await fetch(url, { cache: 'no-store', credentials: 'include' });
  if (!res.ok) throw new Error(`Failed to load ${url} (${res.status})`);
  return res.json();
}

function setTextIfExists(id, text) {
  var el = document.getElementById(id);
  if (el) el.textContent = text;
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, function (c) {
    return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" })[c];
  });
}

function fileExt(name) {
  var m = String(name).toLowerCase().match(/\.([a-z0-9]+)$/);
  return m ? m[1] : "";
}

function mimeForFile(name) {
  // Helps some browsers decide how to handle the source.
  // NOTE: MKV generally still won't play natively.
  var ext = fileExt(name);
  if (ext === "mp4" || ext === "m4v") return "video/mp4";
  if (ext === "webm") return "video/webm";
  if (ext === "mov") return "video/quicktime";
  if (ext === "mkv") return "video/x-matroska";
  return "";
}

async function loadPage(config) {
  // config: { dir: "tapes"|"clips", meta: "data/tapes.json", titleElId?, introElId? }
  var titleElId = config.titleElId || "site-title";
  var introElId = config.introElId || "site-intro";
  var container = document.getElementById("content");
  var navPlace = document.getElementById("navbar-placeholder");

  if (!container) {
    console.warn("No #content element found on this page. Nothing to render.");
    return;
  }

if (navPlace) {
  fetch('navbar.html') // Fetch the HTML file
        .then(response => response.text()) // Get the response as text
        .then(html => {
            document.getElementById('navbar-placeholder').innerHTML = html; // Insert into the placeholder
        })
        .catch(error => {
            console.error('Error loading the navigation bar:', error);
        })
}

  // 1) Load site config (title/intro) if those elements exist
  try {
    var site = await loadJson("data/site.json");
    if (site && site.title) setTextIfExists(titleElId, site.title);
    if (site && site.intro) setTextIfExists(introElId, site.intro);
  } catch (e) {
    console.warn("Could not load site.json:", e);
  }

  // 2) Load file list + metadata
  var files, meta;
  try {
    files = await loadJson("api/list.php?dir=" + encodeURIComponent(config.dir));
  } catch (e) {
    console.error("Could not load file list:", e);
    container.innerHTML = '<div class="alert alert-danger">Could not load video list.</div>';
    return;
  }

  try {
    meta = await loadJson(config.meta);
  } catch (e) {
    console.warn("Could not load metadata JSON (" + config.meta + "). Continuing with filenames only.");
    meta = {};
  }

  if (!Array.isArray(files) || files.length === 0) {
    container.innerHTML = '<div class="alert alert-secondary">No videos found in <code>/videos/' + escapeHtml(config.dir) + '/</code>.</div>';
    return;
  }

  // 3) Render cards
  container.innerHTML = ""; // clear existing

  files.forEach(function (file) {
    var info = (meta && meta[file]) ? meta[file] : {};
    var title = info.title ? info.title : file;
    var desc = info.description ? info.description : "";

    // IMPORTANT: These pages live in /tarrytown/, so relative path "videos/dir/file" is correct.
    var videoUrl = "videos/" + config.dir + "/" + encodeURIComponent(file);
    var mime = mimeForFile(file);

    var html = ''
      + '<div class="col-md-6 col-lg-4 mb-4">'
      + '  <div class="card h-100">'
      + '    <div class="card-body">'
      + '      <h5 class="card-title">' + escapeHtml(title) + '</h5>'
      + (desc ? '      <p class="card-text">' + escapeHtml(desc) + '</p>' : '')
      + '    </div>'
      + '    <video controls preload="metadata" class="w-100" style="background:#000; max-height:240px;">'
      + '      <source src="' + videoUrl + '"' + (mime ? ' type="' + mime + '"' : "") + '>'
      + '      Sorry, your browser cannot play this file format.'
      + '    </video>'
      + '    <div class="card-footer text-center">'
      + '      <a href="' + videoUrl + '" download>Download</a>'
      + '    </div>'
      + '  </div>'
      + '</div>';

    container.insertAdjacentHTML("beforeend", html);
  });
}
