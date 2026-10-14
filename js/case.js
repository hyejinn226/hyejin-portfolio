/* =========================================================
   프로젝트 소개 화면
   인트로 모션 → Overview · Problem · Solution · Skills · 3D Asset → 다음 프로젝트
   ========================================================= */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { buildPlaceholder, fitToSize } from './models.js';
import { motifHTML, applyTheme } from './motifs.js';

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const intro = document.getElementById('intro');
const introMotif = intro.querySelector('.intro-motif');
const introVideo = intro.querySelector('video');
const caseEl = document.getElementById('case');
const scroller = caseEl.querySelector('.case-scroll');
const content = document.getElementById('case-content');

let list = [];
let hooks = {};
let viewer = null;
let current = null;
let busy = false;
let lastFocus = null;

export function initCase(projects, h) {
  list = projects;
  hooks = h;
}

export async function openCase(p, origin) {
  if (busy) return;
  busy = true;
  if (!current) {
    lastFocus = origin || document.activeElement;
    hooks.onOpen?.();
  }
  await playIntro(p, () => {
    render(p);
    caseEl.hidden = false;
    caseEl.classList.add('is-open');
    scroller.scrollTop = 0;
  });
  current = p;
  busy = false;
  caseEl.querySelector('.case-back').focus({ preventScroll: true });
}

export function closeCase() {
  if (!current || busy) return;
  current = null;
  closeLightbox();
  caseEl.classList.remove('is-open');
  viewer?.dispose();
  viewer = null;
  setTimeout(() => { caseEl.hidden = true; content.innerHTML = ''; }, reduce ? 0 : 600);
  hooks.onClose?.();
  lastFocus?.focus?.({ preventScroll: true });
}

caseEl.addEventListener('click', (e) => {
  if (e.target.closest('.case-back')) closeCase();
  const next = e.target.closest('[data-next]');
  if (next) openCase(list.find((x) => x.id === next.dataset.next));
  const shot = e.target.closest('[data-zoom]');
  if (shot) openLightbox(shot.dataset.zoom, shot.dataset.caption);
  if (e.target.closest('.lightbox')) closeLightbox();
});
addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (caseEl.querySelector('.lightbox')) closeLightbox();
  else if (current) closeCase();
});

/* ---------- 이미지 크게 보기 ---------- */
function openLightbox(src, caption) {
  closeLightbox();
  caseEl.insertAdjacentHTML('beforeend', `
    <div class="lightbox" role="dialog" aria-label="이미지 크게 보기">
      <img src="${src}" alt="${caption || ''}">
      ${caption ? `<p>${caption}</p>` : ''}
      <span class="lightbox-close">닫기 ✕</span>
    </div>`);
}
function closeLightbox() {
  caseEl.querySelector('.lightbox')?.remove();
}

/* ---------- 인트로 모션 ---------- */
function playIntro(p, midway) {
  return new Promise((resolve) => {
    applyTheme(intro, p.theme);
    intro.querySelector('.intro-cat').textContent = `${p.tier === 'main' ? 'Main' : 'Sub'} Project — ${p.category}`;
    intro.querySelector('.intro-title').textContent = p.title;

    const useVideo = Boolean(p.intro.video);
    introMotif.innerHTML = useVideo ? '' : motifHTML(p.intro.type);
    introVideo.hidden = !useVideo;
    if (useVideo) {
      introVideo.src = p.intro.video;
      introVideo.currentTime = 0;
      introVideo.play().catch(() => {});
    }

    intro.hidden = false;
    intro.className = 'intro';
    void intro.offsetWidth;
    intro.classList.add('is-in');

    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      midway();
      intro.classList.add('is-out');
      setTimeout(() => {
        intro.hidden = true;
        intro.className = 'intro';
        introVideo.pause();
        introVideo.removeAttribute('src');
        resolve();
      }, reduce ? 0 : 900);
    };
    const timer = setTimeout(finish, reduce ? 250 : useVideo ? 8000 : 2100);
    introVideo.onended = finish;
    intro.onclick = finish;
  });
}

/* ---------- 내용 ---------- */
const tags = (arr) => `<ul class="tags">${arr.map((x) => `<li>${x}</li>`).join('')}</ul>`;
const points = (arr) => {
  const list = (arr || []).filter((x) => x && x.trim());   // 빈 항목은 표시하지 않음
  return list.length ? `<ol class="cs-points">${list.map((x) => `<li>${x}</li>`).join('')}</ol>` : '';
};
const lead = (text) => (text && text.trim() ? `<p>${text}</p>` : '');

/* 유튜브 주소 전체를 넣어도, 영상 ID만 넣어도 동작 */
function youtubeId(src) {
  const m = /(?:youtu\.be\/|v=|embed\/|shorts\/|live\/)([\w-]{11})/.exec(src);
  return m ? m[1] : src.trim();
}

function media(p) {
  const v = p.video;
  if (v?.type === 'youtube') {
    if (!v.src) return `${motifHTML(p.intro.type)}<figcaption>유튜브 영상 자리 — data.js의 video.src에 유튜브 주소를 넣으세요</figcaption>`;
    return `<iframe src="https://www.youtube-nocookie.com/embed/${youtubeId(v.src)}" title="${p.title} 영상" allow="accelerometer; gyroscope; encrypted-media; picture-in-picture; fullscreen" allowfullscreen loading="lazy"></iframe>`;
  }
  if (v?.type === 'file' && v.src) return `<video src="${v.src}" controls playsinline preload="metadata"></video>`;
  if (p.thumb) return `<img src="${p.thumb}" alt="${p.title} 대표 이미지">`;
  return `${motifHTML(p.intro.type)}<figcaption>시연 영상 · 대표 이미지 자리 — data.js의 video 또는 thumb</figcaption>`;
}

function render(p) {
  viewer?.dispose();
  viewer = null;
  applyTheme(caseEl, p.theme);

  const same = list.filter((x) => x.tier === p.tier);
  const idx = String(same.indexOf(p) + 1).padStart(2, '0');
  const next = list[(list.indexOf(p) + 1) % list.length];
  const hasModel = Boolean(p.model || p.placeholderModel);
  const filled = (x) => Boolean(x && (x.lead?.trim() || (x.points || []).some((t) => t && t.trim())));
  const hasPS = filled(p.problem) || filled(p.solution);

  const ps = hasPS ? `
    <section class="cs-sec">
      <h2 class="cs-label">Problem<br>&amp; Solution</h2>
      <div class="cs-body cs-ps">
        <div class="cs-card">
          <h3>Problem</h3>
          ${lead(p.problem.lead)}
          ${points(p.problem.points)}
        </div>
        <div class="cs-card is-solution">
          <h3>Solution</h3>
          ${lead(p.solution.lead)}
          ${points(p.solution.points)}
        </div>
      </div>
    </section>` : '';

  // 캐릭터 시트 · 일러스트 이미지
  const gallery = p.gallery?.length ? `
    <section class="cs-sec">
      <h2 class="cs-label">${p.galleryTitle || 'Artwork'}</h2>
      <div class="cs-body">
        <div class="gallery">
          ${p.gallery.map((g) => (g.src
            ? `<button class="shot${g.wide ? ' is-wide' : ''}" type="button" data-zoom="${g.src}" data-caption="${g.caption || ''}">
                 <img src="${g.src}" alt="${g.caption || ''}" loading="lazy">
                 ${g.caption ? `<span>${g.caption}</span>` : ''}
               </button>`
            : `<div class="shot is-empty${g.wide ? ' is-wide' : ''}"><span>${g.caption || '이미지'}</span><small>data.js → gallery에 png 경로</small></div>`)).join('')}
        </div>
        <p class="cs-note">이미지를 누르면 크게 볼 수 있습니다.</p>
      </div>
    </section>` : '';

  content.innerHTML = `
    <header class="cs-hero">
      <p class="cs-kicker">${p.tier === 'main' ? 'Main' : 'Sub'} Project ${idx} — ${p.category}</p>
      <h1 class="cs-title">${p.title}</h1>
      <p class="cs-summary">${p.summary}</p>
      <dl class="cs-meta">
        <div><dt>기간</dt><dd>${p.period}</dd></div>
        <div><dt>팀</dt><dd>${p.team}</dd></div>
        <div><dt>역할</dt><dd>${p.role.join(', ')}</dd></div>
      </dl>
    </header>

    <figure class="cs-media">${media(p)}</figure>

    <section class="cs-sec">
      <h2 class="cs-label">Overview</h2>
      <div class="cs-body"><p class="cs-lead">${p.overview}</p></div>
    </section>

    ${ps}

    <section class="cs-sec">
      <h2 class="cs-label">Skills</h2>
      <div class="cs-body cs-skills">
        <div><h3>맡은 역할</h3>${tags(p.role)}</div>
        <div><h3>사용 툴</h3>${tags(p.tools)}</div>
      </div>
    </section>

    ${gallery}

    ${hasModel ? `
    <section class="cs-sec">
      <h2 class="cs-label">3D Asset</h2>
      <div class="cs-body">
        <div class="viewer">
          <canvas aria-label="${p.title}에 사용한 3D 에셋. 드래그해서 돌리고 휠로 확대합니다."></canvas>
          <p class="viewer-hint">드래그해서 360° 돌려 보기</p>
        </div>
        <p class="cs-note">${p.model ? '프로젝트에 직접 사용한 3D 에셋입니다.' : '임시 모델입니다. data.js의 model에 .glb 경로를 넣으면 실제 에셋으로 바뀝니다.'}</p>
      </div>
    </section>` : ''}

    ${p.links?.length ? `<div class="cs-links">${p.links.map((l) => `<a href="${l.href}" target="_blank" rel="noopener">${l.label} ↗</a>`).join('')}</div>` : ''}

    <button class="cs-next" type="button" data-next="${next.id}"
      style="--n-bg:${next.theme.bg};--n-ink:${next.theme.ink};--n-accent:${next.theme.accent}">
      <span class="cs-next-k">다음 프로젝트</span>
      <span class="cs-next-t">${next.title}</span>
      <span class="cs-next-c">${next.category} →</span>
    </button>`;

  const canvas = content.querySelector('.viewer canvas');
  if (canvas) viewer = createViewer(canvas, p);

  // 섹션이 보일 때 살짝 떠오르기
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
  }, { root: scroller, threshold: 0.15 });
  content.querySelectorAll('.cs-sec, .cs-media, .cs-next').forEach((el) => io.observe(el));
}

/* ---------- 360° 뷰어 ---------- */
function createViewer(canvas, p) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(32, 16 / 9, 0.01, 100);
  cam.position.set(3.4, 2, 4.2);

  scene.add(new THREE.HemisphereLight(0xffffff, 0x80808a, 1.3));
  const key = new THREE.DirectionalLight(0xffffff, 2);
  key.position.set(3, 5, 4);
  scene.add(key);

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(1.3, 1.33, 96),
    new THREE.MeshBasicMaterial({ color: p.theme.accent, side: THREE.DoubleSide, transparent: true, opacity: 0.8 }),
  );
  ring.rotation.x = -Math.PI / 2;
  scene.add(ring);

  const controls = new OrbitControls(cam, canvas);
  controls.enableDamping = true;
  controls.enablePan = false;
  controls.minDistance = 2.2;
  controls.maxDistance = 9;
  controls.autoRotate = !reduce;
  controls.autoRotateSpeed = 1.4;
  controls.target.set(0, 1, 0);
  controls.addEventListener('start', () => { controls.autoRotate = false; });

  const place = (obj) => {
    const h = fitToSize(obj, 2);
    scene.add(obj);
    controls.target.set(0, h / 2, 0);
  };
  if (p.model) {
    const loader = new GLTFLoader();
    const draco = new DRACOLoader();
    draco.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
    loader.setDRACOLoader(draco);
    loader.load(p.model, (g) => place(g.scene), undefined, () => place(buildPlaceholder(p.placeholderModel, p.theme.accent)));
  } else {
    place(buildPlaceholder(p.placeholderModel, p.theme.accent));
  }

  const ro = new ResizeObserver(() => {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    cam.aspect = w / h;
    cam.updateProjectionMatrix();
  });
  ro.observe(canvas);

  let raf = 0;
  const tick = () => { controls.update(); renderer.render(scene, cam); raf = requestAnimationFrame(tick); };
  tick();

  return {
    dispose() {
      cancelAnimationFrame(raf);
      ro.disconnect();
      controls.dispose();
      scene.traverse((o) => { o.geometry?.dispose(); [].concat(o.material || []).forEach((m) => m.dispose()); });
      renderer.dispose();
    },
  };
}
