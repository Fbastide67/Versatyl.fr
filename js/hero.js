/* ==========================================================
   VERSATYL — hero WebGL
   Le logo sert de fenêtre sur les vidéos Absolem / Danceteria,
   il s'incline vers la souris, ondule, et change de clip avec
   une transition glitch pixelisée. Derrière : rangées de texte
   qui ondulent et défilent.
   ========================================================== */
(function () {
  "use strict";

  const CFG = window.VERSATYL_CONFIG;
  const hero = document.getElementById("hero");
  if (!hero) return;
  const sticky = hero.querySelector(".hero-sticky");
  const canvas = hero.querySelector(".hero-canvas");
  const hudPlace = hero.querySelector(".hud-place");
  const hudIndex = hero.querySelector(".hud-index");
  const hudTotal = hero.querySelector(".hud-total");
  const hudBar = hero.querySelector(".hud-bar i");
  const cursor = document.querySelector(".cursor");
  const cursorLabel = cursor && cursor.querySelector(".cursor-label");

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isFile = location.protocol === "file:" || /[?&]fallback\b/.test(location.search);

  const LOGO_W = 867.18, LOGO_H = 358.54;
  const PAD = 80; // marge autour du logo (unités SVG) pour le halo
  const PLANE_W = LOGO_W + PAD * 2, PLANE_H = LOGO_H + PAD * 2;
  const PLANE_AR = PLANE_W / PLANE_H;
  const LOGO_AR = LOGO_W / LOGO_H;

  const PHASES = {
    absolem: { word: "ABSOLEM", list: CFG.videos.absolem },
    danceteria: { word: "DANCETERIA", list: CFG.videos.danceteria }
  };

  const state = {
    mouse: { x: 0.5, y: 0.5 }, smooth: { x: 0.5, y: 0.5 },
    vel: 0, velSmooth: 0, scroll: 0,
    phase: "absolem", index: 0, lastSwitch: performance.now(),
    hover: 0, hoverTarget: 0, visible: true, intro: 0
  };

  /* ---------- SVG du logo -> image ---------- */
  function logoSvg(colors) {
    const sym = document.getElementById("vt-logo");
    let paths = "";
    sym.querySelectorAll("path").forEach((p) => {
      const c = p.classList.contains("lg-body") ? colors.body
        : p.classList.contains("lg-dark") ? colors.dark : colors.light;
      if (c && c !== "none") paths += '<path fill="' + c + '" d="' + p.getAttribute("d") + '"/>';
    });
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + LOGO_W + " " + LOGO_H +
      '" width="' + LOGO_W + '" height="' + LOGO_H + '">' + paths + "</svg>";
  }
  const svgUrl = (s) => "data:image/svg+xml;charset=utf-8," + encodeURIComponent(s);
  function loadImg(src) {
    return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
  }

  /* ---------- Vidéos ---------- */
  function makeVideo() {
    const v = document.createElement("video");
    v.muted = true; v.loop = true; v.playsInline = true; v.preload = "auto";
    v.setAttribute("muted", ""); v.setAttribute("playsinline", "");
    return v;
  }
  function ready(v) {
    return new Promise((res, rej) => {
      const go = () => { v.play().catch(() => {}); res(v); };
      if (v.readyState >= 2) return go();
      const ok = () => { cleanup(); go(); };
      const ko = () => { cleanup(); rej(new Error("video")); };
      const cleanup = () => { v.removeEventListener("loadeddata", ok); v.removeEventListener("error", ko); };
      v.addEventListener("loadeddata", ok); v.addEventListener("error", ko);
    });
  }
  const src = (name) => "assets/video/" + name + ".mp4";

  function updateHud() {
    const list = PHASES[state.phase].list;
    if (hudPlace) hudPlace.textContent = PHASES[state.phase].word;
    if (hudIndex) hudIndex.textContent = String(state.index + 1).padStart(2, "0");
    if (hudTotal) hudTotal.textContent = String(list.length).padStart(2, "0");
  }

  /* ---------- Souris / scroll ---------- */
  window.addEventListener("pointermove", (e) => {
    const r = sticky.getBoundingClientRect();
    const nx = (e.clientX - r.left) / r.width, ny = (e.clientY - r.top) / r.height;
    const dx = nx - state.mouse.x, dy = ny - state.mouse.y;
    state.vel = Math.min(1, state.vel + Math.hypot(dx, dy) * 4);
    state.mouse.x = nx; state.mouse.y = ny;
  }, { passive: true });

  function readScroll() {
    const r = hero.getBoundingClientRect();
    const total = r.height - window.innerHeight;
    state.scroll = Math.min(1, Math.max(0, -r.top / Math.max(1, total)));
    return state.scroll < 0.5 ? "absolem" : "danceteria";
  }

  new IntersectionObserver((entries) => {
    state.visible = entries[0].isIntersecting;
  }, { threshold: 0 }).observe(sticky);

  /* ======================================================
     Mode de repli : vidéo masquée en CSS (sans WebGL vidéo)
     ====================================================== */
  function startFallback(withGL) {
    hero.classList.add("is-fallback");
    if (!withGL) hero.classList.add("no-gl");
    const inner = hero.querySelector(".hero-fallback-inner");
    const fv = inner.querySelector("video");
    const mask = 'url("' + svgUrl(logoSvg({ body: "#000", dark: "#000", light: "#000" })) + '")';
    fv.style.webkitMaskImage = mask; fv.style.maskImage = mask;
    inner.style.position = "relative";
    const over = new Image();
    over.src = svgUrl(logoSvg({ body: "none", dark: "#10022b", light: "#dbc8fa" }));
    over.alt = "";
    over.style.cssText = "position:absolute;inset:0;width:100%;height:100%;pointer-events:none;opacity:.9";
    inner.appendChild(over);

    function show(name) {
      inner.classList.add("is-glitch");
      setTimeout(() => {
        fv.src = src(name); fv.play().catch(() => {});
        setTimeout(() => inner.classList.remove("is-glitch"), 260);
      }, 180);
      state.lastSwitch = performance.now();
      updateHud();
    }
    function next() {
      const list = PHASES[state.phase].list;
      state.index = (state.index + 1) % list.length;
      show(list[state.index]);
    }
    sticky.addEventListener("click", next);
    show(PHASES[state.phase].list[0]);

    let rx = 0, ry = 0;
    (function loop() {
      requestAnimationFrame(loop);
      const ph = readScroll();
      if (ph !== state.phase) { state.phase = ph; state.index = -1; next(); }
      const t = performance.now();
      if (state.visible && !reduce && t - state.lastSwitch > CFG.clipDuration) next();
      ry += (((state.mouse.x - 0.5) * 34) - ry) * 0.08;
      rx += ((-(state.mouse.y - 0.5) * 24) - rx) * 0.08;
      inner.style.transform = "rotateY(" + ry.toFixed(2) + "deg) rotateX(" + rx.toFixed(2) + "deg)";
      if (hudBar) hudBar.style.width = Math.min(100, (t - state.lastSwitch) / CFG.clipDuration * 100) + "%";
    })();
  }

  /* ======================================================
     WebGL
     ====================================================== */
  if (!window.THREE) { startFallback(false); return; }
  const THREE = window.THREE;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: "high-performance" });
  } catch (e) { startFallback(false); return; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.autoClear = false;
  renderer.setClearColor(0x0e0118, 1);

  /* ---------- Fond : texte qui ondule ---------- */
  const strip = document.createElement("canvas");
  strip.width = 2048; strip.height = 256;
  const stripTex = new THREE.CanvasTexture(strip);
  stripTex.wrapS = THREE.RepeatWrapping; stripTex.wrapT = THREE.ClampToEdgeWrapping;
  stripTex.anisotropy = 4;

  function drawStrip(word) {
    const ctx = strip.getContext("2d");
    ctx.clearRect(0, 0, strip.width, strip.height);
    ctx.font = '228px "Redband"';
    ctx.textBaseline = "middle";
    const unit = word + "  ";
    const ww = ctx.measureText(unit).width;
    const n = Math.max(1, Math.round(strip.width / ww));
    ctx.save();
    ctx.scale(strip.width / (n * ww), 1);
    ctx.fillStyle = "#fff";
    for (let i = 0; i < n; i++) ctx.fillText(unit, i * ww, strip.height / 2 + 12);
    ctx.restore();
    stripTex.needsUpdate = true;
  }

  const bgUniforms = {
    uText: { value: stripTex },
    uTime: { value: 0 },
    uRows: { value: 5 },
    uAspect: { value: 1 },
    uStripAR: { value: 6.2 },
    uMouse: { value: new THREE.Vector2(0.5, 0.5) },
    uVel: { value: 0 },
    uIntro: { value: 0 },
    uGlitch: { value: 0 },
    uScroll: { value: 0 }
  };
  const bgMat = new THREE.ShaderMaterial({
    uniforms: bgUniforms,
    vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }",
    fragmentShader: `
      precision highp float;
      uniform sampler2D uText;
      uniform float uTime, uRows, uAspect, uStripAR, uVel, uIntro, uGlitch, uScroll;
      uniform vec2 uMouse;
      varying vec2 vUv;
      float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      void main(){
        vec2 uv = vUv;
        vec2 d = uv - uMouse; d.x *= uAspect;
        float dist = length(d);
        float near = smoothstep(0.5, 0.0, dist);
        uv.y += sin(dist * 26.0 - uTime * 4.0) * 0.014 * near;
        uv += normalize(d + 1e-5) * 0.05 * near * near;
        float amp = 0.028 + uVel * 0.05;
        uv.y += sin(uv.x * 4.0 + uTime * 1.1) * amp;
        uv.x += sin(uv.y * 8.0 + uTime * 0.7) * 0.012;

        // glitch par blocs
        vec2 blk = floor(vUv * vec2(22.0, 14.0));
        float gb = step(0.62, hash(blk + floor(uTime * 18.0)));
        uv.x += (hash(blk.yx + floor(uTime * 24.0)) - 0.5) * 0.22 * uGlitch * gb;

        float row = floor(uv.y * uRows);
        float dir = mod(row, 2.0) * 2.0 - 1.0;
        float tx = uv.x * uAspect * uRows / uStripAR + uTime * 0.035 * dir + row * 0.37 + uScroll * 1.5 * dir;
        float ty = fract(uv.y * uRows);
        float a = texture2D(uText, vec2(tx, ty)).a;

        vec3 nuit = vec3(0.055, 0.004, 0.094);
        vec3 fuchsia = vec3(0.93, 0.0, 0.71);
        vec3 lavande = vec3(0.73, 0.45, 0.78);
        vec3 ink = mod(row, 2.0) < 0.5 ? fuchsia * 0.9 : lavande * 0.5;
        float centre = length((vUv - 0.5) * vec2(uAspect, 1.0));
        float dim = mix(0.32, 1.0, smoothstep(0.15, 0.75, centre));
        vec3 col = mix(nuit, ink, a * dim);

        // intro : neige de pixels qui se résout
        float k = 1.0 - uIntro;
        if (k > 0.001) {
          vec2 cell = floor(vUv * vec2(150.0, 90.0) / (1.0 + k * 3.0));
          float nz = hash(cell + floor(uTime * 16.0));
          vec3 snow = mix(nuit, fuchsia, step(0.5, nz));
          col = mix(col, snow, step(hash(cell * 1.31 + 7.0), k));
        }
        gl_FragColor = vec4(col, 1.0);
      }`,
    depthTest: false, depthWrite: false
  });
  const bgScene = new THREE.Scene();
  const bgCam = new THREE.Camera();
  bgScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), bgMat));

  /* ---------- Logo 3D ---------- */
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
  camera.position.z = 4;

  const logoCanvas = document.createElement("canvas");
  const glowCanvas = document.createElement("canvas");
  const TW = 2048, TH = Math.round(TW / PLANE_AR);
  logoCanvas.width = glowCanvas.width = TW;
  logoCanvas.height = glowCanvas.height = TH;
  const logoTex = new THREE.CanvasTexture(logoCanvas);
  const glowTex = new THREE.CanvasTexture(glowCanvas);
  let alphaData = null;

  const blank = new THREE.DataTexture(new Uint8Array([20, 3, 50, 255]), 1, 1, THREE.RGBAFormat);
  blank.needsUpdate = true;

  const vids = [makeVideo(), makeVideo()];
  const vtex = vids.map((v) => {
    const t = new THREE.VideoTexture(v);
    t.minFilter = THREE.LinearFilter; t.magFilter = THREE.LinearFilter; t.generateMipmaps = false;
    return t;
  });

  const u = {
    uLogo: { value: logoTex }, uGlow: { value: glowTex },
    uVidA: { value: blank }, uVidB: { value: blank },
    uCoverA: { value: new THREE.Vector2(1, 1) }, uCoverB: { value: new THREE.Vector2(1, 1) },
    uInner: { value: new THREE.Vector4(PAD / PLANE_W, PAD / PLANE_H, LOGO_W / PLANE_W, LOGO_H / PLANE_H) },
    uMix: { value: 0 }, uTime: { value: 0 }, uVel: { value: 0 }, uIntro: { value: 0 },
    uHasA: { value: 0 }, uHover: { value: 0 },
    uPoint: { value: new THREE.Vector2(0, 0) }, uWave: { value: reduce ? 0.2 : 1 }
  };

  const logoMat = new THREE.ShaderMaterial({
    uniforms: u, transparent: true, depthWrite: false,
    vertexShader: `
      uniform float uTime, uHover, uWave;
      uniform vec2 uPoint;
      varying vec2 vUv;
      varying float vZ;
      void main(){
        vUv = uv;
        vec3 p = position;
        float w = sin(p.x * 5.0 + uTime * 1.4) * 0.018 + sin(p.y * 9.0 + uTime * 0.9) * 0.012;
        p.z += w * uWave;
        float d = distance(p.xy, uPoint);
        p.z += exp(-d * d * 28.0) * 0.07 * uHover;
        vZ = p.z;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }`,
    fragmentShader: `
      precision highp float;
      uniform sampler2D uLogo, uGlow, uVidA, uVidB;
      uniform vec2 uCoverA, uCoverB;
      uniform vec4 uInner;
      uniform float uMix, uTime, uVel, uIntro, uHasA, uHover;
      varying vec2 vUv;
      varying float vZ;
      float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      vec3 vid(sampler2D t, vec2 uv, vec2 cover, float ca){
        uv = (uv - 0.5) * cover + 0.5;
        uv = clamp(uv, 0.001, 0.999);
        float r = texture2D(t, uv + vec2(ca, 0.0)).r;
        float g = texture2D(t, uv).g;
        float b = texture2D(t, uv - vec2(ca, 0.0)).b;
        return vec3(r, g, b);
      }
      void main(){
        vec4 L = texture2D(uLogo, vUv);
        float glow = texture2D(uGlow, vUv).a;
        vec2 vuv = (vUv - uInner.xy) / uInner.zw;

        float g = sin(uMix * 3.14159);
        g = max(g, (1.0 - uIntro) * 0.9);
        if (g > 0.02) {
          vec2 b = vec2(0.03, 0.03 * ${LOGO_AR.toFixed(4)}) * g;
          vuv = (floor(vuv / b) + 0.5) * b;
          float row = floor(vuv.y * 16.0);
          vuv.x += (hash(vec2(row, floor(uTime * 14.0))) - 0.5) * 0.16 * g;
        }
        float ca = 0.0015 + uVel * 0.014 + g * 0.014;
        vec3 a = vid(uVidA, vuv, uCoverA, ca);
        vec3 c2 = vid(uVidB, vuv, uCoverB, ca);
        float cell = hash(floor(vuv * vec2(30.0, 12.0)));
        vec3 col = mix(a, c2, step(cell, uMix));

        // étalonnage violet/magenta
        col = pow(col, vec3(0.85)) * 1.2;
        col = mix(col, col * vec3(1.08, 0.72, 1.18), 0.3);
        vec3 body = mix(vec3(0.133, 0.016, 0.31), vec3(0.46, 0.2, 0.85), vUv.y);
        col = mix(body, col, uHasA);
        col += vec3(0.46, 0.2, 0.85) * 0.10 * vUv.y;

        // détails du logo (contours sombres + reflets)
        col = mix(col, vec3(0.063, 0.008, 0.17), L.g * 0.6);
        col += vec3(0.86, 0.78, 0.98) * L.b * 0.8;
        col *= 1.0 + vZ * 4.0 + uHover * 0.08;

        // lettres VERSATYL (trous du logo) : encre nuit, léger reflet de la vidéo
        vec3 letter = mix(vec3(0.055, 0.004, 0.094), col * vec3(0.4, 0.08, 0.5), 0.3);
        col = mix(col, letter, L.r);

        // apparition en pixels
        float m = L.a;
        float appear = step(hash(floor(vUv * vec2(70.0, 34.0))), uIntro * 1.15);
        m *= appear;

        vec3 fuchsia = vec3(0.93, 0.0, 0.71);
        float ga = glow * (0.55 + 0.2 * sin(uTime * 2.2) + uHover * 0.25) * uIntro;
        vec3 outc = mix(fuchsia, col, m);
        float alpha = max(m, ga * (1.0 - m));
        gl_FragColor = vec4(outc, alpha);
      }`
  });

  const geo = new THREE.PlaneGeometry(1, 1 / PLANE_AR, 120, 50);
  const mesh = new THREE.Mesh(geo, logoMat);
  scene.add(mesh);

  async function buildLogo() {
    const s = TW / PLANE_W;
    const code = await loadImg(svgUrl(logoSvg({ body: "#ff0000", dark: "#00ff00", light: "#0000ff" })));
    const sil = await loadImg(svgUrl(logoSvg({ body: "#ffffff", dark: "#ffffff", light: "#ffffff" })));
    const lc = logoCanvas.getContext("2d");
    lc.clearRect(0, 0, TW, TH);
    lc.drawImage(code, PAD * s, PAD * s, LOGO_W * s, LOGO_H * s);
    // Les lettres du logo sont des trous : on les repère (tout ce qui
    // n'est pas joignable depuis le bord) et on les code dans le canal R.
    const img = lc.getImageData(0, 0, TW, TH);
    const d = img.data, N = TW * TH;
    const outside = new Uint8Array(N);
    const stack = new Int32Array(N);
    let sp = 0;
    const push = (i) => { if (!outside[i] && d[i * 4 + 3] < 128) { outside[i] = 1; stack[sp++] = i; } };
    for (let x = 0; x < TW; x++) { push(x); push((TH - 1) * TW + x); }
    for (let y = 0; y < TH; y++) { push(y * TW); push(y * TW + TW - 1); }
    while (sp) {
      const i = stack[--sp], x = i % TW;
      if (x > 0) push(i - 1);
      if (x < TW - 1) push(i + 1);
      if (i >= TW) push(i - TW);
      if (i < N - TW) push(i + TW);
    }
    for (let i = 0; i < N; i++) {
      const o = i * 4, a = d[o + 3];
      if (outside[i]) { d[o] = 0; }
      else { d[o] = 255 - a; d[o + 1] = d[o + 1] * a / 255; d[o + 2] = d[o + 2] * a / 255; d[o + 3] = 255; }
    }
    lc.putImageData(img, 0, 0);
    alphaData = d;
    const gc = glowCanvas.getContext("2d");
    gc.clearRect(0, 0, TW, TH);
    gc.shadowColor = "#fff"; gc.shadowBlur = 70 * s / 2; gc.shadowOffsetX = 10000;
    gc.drawImage(sil, PAD * s - 10000, PAD * s, LOGO_W * s, LOGO_H * s);
    gc.shadowBlur = 22 * s / 2;
    gc.drawImage(sil, PAD * s - 10000, PAD * s, LOGO_W * s, LOGO_H * s);
    logoTex.needsUpdate = true; glowTex.needsUpdate = true;
  }

  function coverFor(v) {
    const va = (v.videoWidth || 16) / (v.videoHeight || 9);
    return va > LOGO_AR ? new THREE.Vector2(LOGO_AR / va, 1) : new THREE.Vector2(1, va / LOGO_AR);
  }

  // Vérifie qu'on a le droit d'envoyer la vidéo au GPU (sinon : repli)
  function videoUsable(v) {
    try {
      const c = document.createElement("canvas"); c.width = c.height = 2;
      const x = c.getContext("2d"); x.drawImage(v, 0, 0, 2, 2); x.getImageData(0, 0, 1, 1);
      return true;
    } catch (e) { return false; }
  }

  let cur = 0, busy = false, mixAnim = null, useFallback = false;

  async function firstClip() {
    const name = PHASES[state.phase].list[0];
    vids[0].src = src(name);
    try { await ready(vids[0]); } catch (e) { return; }
    if (!videoUsable(vids[0])) { useFallback = true; mesh.visible = false; vids[0].pause(); startFallback(true); return; }
    u.uVidA.value = vtex[0]; u.uCoverA.value = coverFor(vids[0]); u.uHasA.value = 1;
    state.lastSwitch = performance.now();
    updateHud();
  }

  async function showClip(name) {
    if (busy || useFallback) return;
    busy = true;
    const ni = 1 - cur, nv = vids[ni];
    nv.src = src(name);
    try { await ready(nv); } catch (e) { busy = false; return; }
    u.uVidB.value = vtex[ni]; u.uCoverB.value = coverFor(nv);
    const t0 = performance.now(), dur = reduce ? 200 : 750;
    bgUniforms.uGlitch.value = 1;
    mixAnim = (t) => {
      const k = Math.min(1, (t - t0) / dur);
      u.uMix.value = k;
      if (k >= 1) {
        u.uVidA.value = vtex[ni]; u.uCoverA.value = u.uCoverB.value; u.uMix.value = 0; u.uHasA.value = 1;
        vids[cur].pause(); cur = ni; busy = false; mixAnim = null;
      }
    };
    state.lastSwitch = performance.now();
    updateHud();
  }

  function nextClip() {
    if (busy) return;
    const list = PHASES[state.phase].list;
    state.index = (state.index + 1) % list.length;
    showClip(list[state.index]);
  }

  sticky.addEventListener("click", () => { if (!useFallback) nextClip(); });

  /* ---------- Survol du logo ---------- */
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  function hitLogo() {
    if (!alphaData || !mesh.visible) return null;
    ndc.set(state.mouse.x * 2 - 1, -(state.mouse.y * 2 - 1));
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObject(mesh)[0];
    if (!hit || !hit.uv) return null;
    const px = Math.floor(hit.uv.x * (TW - 1)), py = Math.floor((1 - hit.uv.y) * (TH - 1));
    const a = alphaData[(py * TW + px) * 4 + 3];
    return a > 40 ? hit.uv : null;
  }

  /* ---------- Taille ---------- */
  function resize() {
    const w = sticky.clientWidth, h = sticky.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    bgUniforms.uAspect.value = w / h;
    bgUniforms.uRows.value = w / h < 0.8 ? 7 : 5;
    const vh = 2 * camera.position.z * Math.tan((camera.fov * Math.PI) / 360);
    const vw = vh * camera.aspect;
    const s = Math.min(vw * (camera.aspect < 1 ? 1.1 : 0.9), vh * 1.55);
    mesh.userData.baseScale = s;
  }
  window.addEventListener("resize", resize);

  /* ---------- Boucle ---------- */
  let last = performance.now();
  let bgPhase = null;
  function loop(t) {
    requestAnimationFrame(loop);
    const dt = Math.min(0.05, (t - last) / 1000); last = t;

    const ph = readScroll();
    if (ph !== bgPhase) {
      bgPhase = ph;
      drawStrip(PHASES[ph].word);
      bgUniforms.uGlitch.value = 1;
    }
    if (!useFallback && ph !== state.phase && !busy) {
      state.phase = ph; state.index = 0;
      showClip(PHASES[ph].list[0]);
    }
    if (!state.visible) return;

    if (!state.introStart) state.introStart = t;
    state.intro = Math.min(1, (t - state.introStart) / (reduce ? 300 : 1700));
    const ease = 1 - Math.pow(1 - state.intro, 3);

    state.smooth.x += (state.mouse.x - state.smooth.x) * 0.07;
    state.smooth.y += (state.mouse.y - state.smooth.y) * 0.07;
    state.vel *= 0.92;
    state.velSmooth += (state.vel - state.velSmooth) * 0.1;

    const time = t / 1000;
    bgUniforms.uTime.value = time;
    bgUniforms.uMouse.value.set(state.smooth.x, 1 - state.smooth.y);
    bgUniforms.uVel.value = reduce ? 0 : state.velSmooth;
    bgUniforms.uIntro.value = ease;
    bgUniforms.uScroll.value = state.scroll;
    bgUniforms.uGlitch.value *= 0.9;

    const hit = hitLogo();
    state.hoverTarget = hit ? 1 : 0;
    state.hover += (state.hoverTarget - state.hover) * 0.12;
    if (hit) u.uPoint.value.set(hit.x - 0.5, (hit.y - 0.5) / PLANE_AR);
    if (cursor) {
      cursor.classList.toggle("is-big", !!hit);
      if (cursorLabel && hit) cursorLabel.textContent = "Suivant";
    }

    const mx = state.smooth.x - 0.5, my = state.smooth.y - 0.5;
    const sway = reduce ? 0 : 1;
    mesh.rotation.y = mx * 0.95 + Math.sin(time * 0.45) * 0.06 * sway;
    mesh.rotation.x = my * 0.7 + Math.sin(time * 0.6) * 0.04 * sway;
    mesh.rotation.z = -mx * 0.08;
    mesh.position.x = mx * 0.12; mesh.position.y = -my * 0.08;
    const sc = (mesh.userData.baseScale || 1) * (0.86 + 0.14 * ease) * (1 + Math.sin(state.scroll * Math.PI * 2) * 0.05);
    mesh.scale.set(sc, sc, sc);

    u.uTime.value = time;
    u.uVel.value = reduce ? 0 : state.velSmooth;
    u.uIntro.value = ease;
    u.uHover.value = state.hover;
    if (mixAnim) mixAnim(t);

    if (useFallback) { renderer.clear(); renderer.render(bgScene, bgCam); return; }
    if (!busy && !reduce && t - state.lastSwitch > CFG.clipDuration && u.uHasA.value) nextClip();
    if (hudBar) hudBar.style.width = Math.min(100, (t - state.lastSwitch) / CFG.clipDuration * 100) + "%";

    renderer.clear();
    renderer.render(bgScene, bgCam);
    renderer.render(scene, camera);
  }

  /* ---------- Démarrage ---------- */
  resize();
  state.phase = readScroll();
  updateHud();
  drawStrip(PHASES[state.phase].word);
  (document.fonts ? document.fonts.load('228px "Redband"') : Promise.resolve())
    .then(() => drawStrip(PHASES[state.phase].word)).catch(() => {});
  buildLogo().catch(() => {});
  if (isFile) {
    // Ouvert en double-clic : le navigateur bloque la vidéo dans WebGL.
    useFallback = true; mesh.visible = false; startFallback(true);
  } else {
    firstClip();
  }
  requestAnimationFrame(loop);
})();
