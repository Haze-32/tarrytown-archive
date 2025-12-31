<?php
$videoDir = __DIR__ . DIRECTORY_SEPARATOR . 'videos';

$allowed = ['mp4','m4v','webm','mov','mkv'];
$files = [];

if (is_dir($videoDir)) {
  foreach (scandir($videoDir) as $name) {
    if ($name === '.' || $name === '..') continue;

    $full = $videoDir . DIRECTORY_SEPARATOR . $name;
    if (!is_file($full)) continue;

    $ext = strtolower(pathinfo($name, PATHINFO_EXTENSION));
    if (in_array($ext, $allowed, true)) {
      $files[] = $name;
    }
  }
}

sort($files, SORT_NATURAL | SORT_FLAG_CASE);

header('Content-Type: application/json');
echo json_encode($files);
