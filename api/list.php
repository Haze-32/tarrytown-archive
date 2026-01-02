<?php
// api/list.php
// Usage: /api/list.php?path=/videos/clips/
// Returns: { "path": "...", "files": ["a.mp4", "b.mkv"] }

header('Content-Type: application/json; charset=utf-8');

$root = realpath(__DIR__ . '/../');                 // .../public_html/tarrytown
$videosRoot = realpath($root . '/videos');          // .../public_html/tarrytown/videos

$path = isset($_GET['path']) ? $_GET['path'] : '';
$path = trim($path);

// Require a path
if ($path === '') {
  http_response_code(400);
  echo json_encode(["error" => "Missing ?path=/videos/.../"]);
  exit;
}

// Only allow paths under /videos/
if (strpos($path, '/videos/') !== 0) {
  http_response_code(400);
  echo json_encode(["error" => "Only /videos/ paths are allowed."]);
  exit;
}

// Resolve the requested directory
$requested = realpath($root . $path);
if ($requested === false || !is_dir($requested)) {
  http_response_code(404);
  echo json_encode(["error" => "Folder not found.", "path" => $path]);
  exit;
}

// Security: ensure the resolved path is inside videos root
if (strpos($requested, $videosRoot) !== 0) {
  http_response_code(403);
  echo json_encode(["error" => "Access denied."]);
  exit;
}

$items = scandir($requested);
$files = [];

foreach ($items as $f) {
  if ($f === '.' || $f === '..') continue;
  $full = $requested . DIRECTORY_SEPARATOR . $f;
  if (!is_file($full)) continue;

  // Allow common media extensions
  $ext = strtolower(pathinfo($f, PATHINFO_EXTENSION));
  if (in_array($ext, ['mp4','mkv','mov','m4v','webm'])) {
    $files[] = $f;
  }
}

sort($files, SORT_NATURAL | SORT_FLAG_CASE);

echo json_encode([
  "path" => $path,
  "files" => $files
], JSON_PRETTY_PRINT);
