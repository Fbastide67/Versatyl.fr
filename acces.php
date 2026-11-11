<?php
/* ==========================================================
   VERSATYL — page d'accès « site en construction »
   Le bon mot de passe pose un cookie (30 jours) que .htaccess vérifie.
   Pour changer le mot de passe : modifier SALT/HASH (sha256 de SALT . motdepasse).
   ========================================================== */
const SALT = '326bcec3c8f1af91';
const HASH = '2e81decc5fa9218f85ed7f4f5f895002429f97c8797b8d7042983826ba69b777';
const TOKEN = '517fa6058b8554662da6d51ad825a40c';   // même valeur que dans .htaccess

header('X-Robots-Tag: noindex, nofollow');
header('Cache-Control: no-store');

// page demandée : on y renvoie après connexion (chemin local uniquement)
function safe_next($n) {
  if (!is_string($n) || $n === '' || $n[0] !== '/' || strpos($n, '//') === 0 || strpos($n, '\\') !== false) return '/';
  if (strpos($n, '/acces.php') === 0) return '/';
  return $n;
}

$error = false;
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  $next = safe_next($_POST['next'] ?? '/');
  $pw = (string)($_POST['pw'] ?? '');
  if (hash_equals(HASH, hash('sha256', SALT . $pw))) {
    setcookie('vt_acces', TOKEN, [
      'expires' => time() + 30 * 24 * 3600, 'path' => '/',
      'secure' => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
      'httponly' => true, 'samesite' => 'Lax'
    ]);
    header('Location: ' . $next, true, 303);
    exit;
  }
  $error = true;
} else {
  $next = safe_next($_SERVER['REQUEST_URI'] ?? '/');
}
?><!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex, nofollow">
  <title>Versatyl — Site en construction</title>
  <meta name="theme-color" content="#0E0118">
  <link rel="icon" href="/assets/img/chauve-souris.png">
  <style>
    @font-face { font-family: "Redband"; src: url("/assets/fonts/Redband-Regular.ttf") format("truetype"); font-display: swap; }
    @font-face { font-family: "Good Times"; src: url("/assets/fonts/GoodTimesRg-Bold.ttf") format("truetype"); font-weight: 700; font-display: swap; }
    :root { --nuit: #0E0118; --aubergine: #1C0333; --fuchsia: #ED01B6; --texte: #F3E6F7; --doux: #C9A6D6; }
    * { box-sizing: border-box; }
    html, body { margin: 0; min-height: 100%; }
    body {
      min-height: 100vh; min-height: 100svh; display: grid; place-items: center; padding: 24px 16px;
      background: radial-gradient(60% 50% at 50% 30%, rgba(152, 6, 184, .35), transparent 70%), var(--nuit);
      color: var(--texte); font: 700 14px/1.5 "Good Times", "Arial Black", sans-serif; text-transform: uppercase; letter-spacing: .06em;
    }
    main { width: min(100%, 460px); display: grid; justify-items: center; gap: 26px; text-align: center; }
    .logo { width: min(80%, 300px); height: auto; }
    h1 { margin: 0; font: 400 clamp(38px, 11vw, 64px)/1.2 "Redband", Impact, sans-serif; color: var(--fuchsia); }
    p { margin: 0; color: var(--doux); font-size: 12px; letter-spacing: .14em; }
    form { width: 100%; display: grid; gap: 12px; }
    input {
      width: 100%; padding: 16px 18px; border-radius: 12px; border: 1px solid var(--fuchsia);
      background: var(--aubergine); color: #fff; font: inherit; font-size: 18px; text-align: center; letter-spacing: .3em;
    }
    input:focus { outline: 2px solid var(--fuchsia); outline-offset: 2px; }
    button {
      padding: 16px 22px; border: 0; border-radius: 12px; cursor: pointer;
      background: var(--fuchsia); color: var(--nuit); font: inherit; font-size: 14px; letter-spacing: .08em; text-transform: uppercase;
      box-shadow: 6px 6px 0 #4A0163; transition: transform .2s, background .2s, color .2s;
    }
    button:hover { background: #fff; transform: translate(-2px, -2px); }
    .err { color: var(--fuchsia); }
  </style>
</head>
<body>
  <main>
    <img class="logo" src="/assets/img/logo-versatyl.svg" alt="Versatyl" width="300" height="124">
    <h1>Site en construction</h1>
    <p>Le nouveau site Versatyl arrive bientôt.</p>
    <form method="post" action="/acces.php">
      <input type="password" name="pw" inputmode="numeric" autocomplete="current-password" placeholder="Mot de passe" aria-label="Mot de passe" required autofocus>
      <input type="hidden" name="next" value="<?= htmlspecialchars($next, ENT_QUOTES, 'UTF-8') ?>">
      <button type="submit">Entrer</button>
      <?php if ($error): ?><p class="err" role="alert">Mot de passe incorrect</p><?php endif; ?>
    </form>
  </main>
</body>
</html>
