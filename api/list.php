<?php
$allowedDirs = ['tapes', 'clips'];

$dir = $_GET['dir'] ?? '';
if (!in_array($dir, $allowedDirs, true)) {
  http_response_code(400);
  echo json_encode([]);
  exit;
}

$base = realpath(__DIR__ . '/../videos/' . $dir);
$files = [];
$allowedExt = ['mp4','m4v','webm','mov','mkv'];

foreach (scandir($base) as $name) {
  if ($name === '.' || $name === '..') continue;
  $full = $base . DIRECTORY_SEPARATOR . $name;
  if (!is_file($full)) continue;

  $ext = strtolower(pathinfo($name, PATHINFO_EXTENSION));
  if (in_array($ext, $allowedExt, true)) {
    $files[] = $name;
  }
}

sort($files, SORT_NATURAL | SORT_FLAG_CASE);
header('Content-Type: application/json');
echo json_encode($files);
