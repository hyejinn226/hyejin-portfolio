/* =========================================================
   메인: 스크롤 연출, 프로젝트 목록, 스킬, 연락처
   ========================================================= */
import { profile, skills, projects } from './data.js';
import { initCase, openCase } from './case.js';
import { motifHTML, applyTheme } from './motifs.js';

const root = document.documentElement;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const canHover = matchMedia('(hover: hover) and (pointer: fine)').matches;
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const ease = (t) => 1 - Math.pow(1 - t, 3);
const pad2 = (n) => String(n).padStart(2, '0');
root.classList.add('js');

/* ---------- 1. 프로필 채우기 ---------- */
document.querySelectorAll('[data-bind]').forEach((el) => {
  const v = profile[el.dataset.bind];
  if (v) el.textContent = v;
});
document.querySelectorAll('[data-link]').forEach((el) => {
  const v = profile[el.dataset.link];
  if (v) el.href = v;
});
document.getElementById('hero-title').innerHTML = profile.heroLines
  .map((l, i) => `<span class="hl${l.soft ? ' is-soft' : ''}"><span style="--i:${i}">${l.text}</span></span>`)
  .join('');
requestAnimationFrame(() => root.classList.add('is-ready'));
document.getElementById('year').textContent = new Date().getFullYear();
if (profile.photo) document.getElementById('about-photo').innerHTML = `<img src="${profile.photo}" alt="${profile.name}">`;
document.getElementById('about-facts').innerHTML = profile.facts.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('');

const mail = document.getElementById('mail');
mail.textContent = profile.email;
mail.href = `mailto:${profile.email}`;
document.getElementById('copy-mail').addEventListener('click', async (e) => {
  const b = e.currentTarget;
  try { await navigator.clipboard.writeText(profile.email); b.textContent = '복사했어요'; }
  catch { getSelection().selectAllChildren(mail); b.textContent = '선택했어요'; }
  setTimeout(() => { b.textContent = '주소 복사'; }, 1600);
});

/* ---------- 2. 스크롤 ---------- */
const lenis = window.Lenis
  ? new window.Lenis({ lerp: 0.1, smoothWheel: !reduce })
  : { get scroll() { return scrollY; }, raf() {}, stop() { root.style.overflow = 'hidden'; }, start() { root.style.overflow = ''; }, scrollTo(t) { t.scrollIntoView?.(); } };

document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;
  const t = document.querySelector(a.getAttribute('href'));
  if (!t) return;
  e.preventDefault();
  lenis.scrollTo(t);
});

/* ---------- 3. 커서 라벨 (프로젝트 위에서만) ---------- */
const cursor = document.getElementById('cursor');
const cursorText = cursor.querySelector('span');
const cur = { x: innerWidth / 2, y: innerHeight / 2, sx: innerWidth / 2, sy: innerHeight / 2 };
function showCursor(label) {
  if (!canHover) return;
  cursor.classList.toggle('is-on', Boolean(label));
  if (label) cursorText.textContent = label;
}
if (canHover) {
  addEventListener('pointermove', (e) => { cur.x = e.clientX; cur.y = e.clientY; });
  document.addEventListener('pointerover', (e) => {
    const t = e.target.closest('[data-cursor]');
    if (t) showCursor(t.dataset.cursor);
  });
  document.addEventListener('pointerout', (e) => {
    const t = e.target.closest('[data-cursor]');
    if (t && !t.contains(e.relatedTarget)) showCursor(null);
  });
}

/* ---------- 4. 프로젝트 소개 화면 ---------- */
let caseOpen = false;
initCase(projects, {
  onOpen() { caseOpen = true; lenis.stop(); showCursor(null); },
  onClose() { caseOpen = false; lenis.start(); },
});

/* ---------- 6. 메인 프로젝트: 카드가 화면 전체로 펼쳐짐 ---------- */
const mains = projects.filter((p) => p.tier === 'main');
const subs = projects.filter((p) => p.tier === 'sub');
document.getElementById('main-count').textContent = pad2(mains.length);
document.getElementById('sub-count').textContent = pad2(subs.length);

const mainList = document.getElementById('main-list');
mains.forEach((p, i) => {
  const sec = document.createElement('article');
  sec.className = 'mp';
  applyTheme(sec, p.theme);
  sec.innerHTML = `
    <div class="mp-stage">
      <p class="mp-word mp-word-a" aria-hidden="true">${p.category}</p>
      <p class="mp-word mp-word-b" aria-hidden="true">${p.category}</p>
      <div class="mp-panel" data-cursor="OPEN" role="button" tabindex="0" aria-label="${p.title} 프로젝트 열기">
        ${p.thumb ? `<img class="mp-thumb" src="${p.thumb}" alt="">` : motifHTML(p.intro.type)}
        <div class="mp-info">
          <p class="mp-kicker">Main Project ${pad2(i + 1)} · ${p.year}</p>
          <h3 class="mp-title">${p.title}</h3>
          <p class="mp-summary">${p.summary}</p>
          <span class="mp-cta">프로젝트 보기 <i aria-hidden="true">→</i></span>
        </div>
      </div>
    </div>`;
  const panel = sec.querySelector('.mp-panel');
  panel.addEventListener('click', () => openCase(p, panel));
  panel.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openCase(p, panel); } });
  mainList.append(sec);
});
const mainSecs = [...mainList.children];

/* ---------- 7. 서브 프로젝트: 줄 목록 + 따라다니는 미리보기 ---------- */
const subList = document.getElementById('sub-list');
const preview = document.getElementById('sp-preview');
subs.forEach((p, i) => {
  const li = document.createElement('li');
  li.innerHTML = `
    <button class="sp-row" type="button" data-cursor="OPEN">
      <span class="sp-idx">${pad2(i + 1)}</span>
      <span class="sp-title">${p.title}</span>
      <span class="sp-cat">${p.category}</span>
      <span class="sp-year">${p.year}</span>
      <span class="sp-arrow" aria-hidden="true">→</span>
    </button>`;
  const row = li.firstElementChild;
  applyTheme(row, p.theme);
  row.addEventListener('click', () => openCase(p, row));
  row.addEventListener('pointerenter', () => {
    if (!canHover) return;
    applyTheme(preview, p.theme);
    preview.innerHTML = p.thumb ? `<img src="${p.thumb}" alt="">` : motifHTML(p.intro.type);
    preview.classList.add('is-on');
  });
  row.addEventListener('pointerleave', () => preview.classList.remove('is-on'));
  subList.append(li);
});
const pv = { x: 0, y: 0 };

/* ---------- 8. 스킬: 호버하면 채워짐 ---------- */
const skillList = document.getElementById('skill-list');
skills.forEach((s) => {
  const li = document.createElement('li');
  li.className = 'skill';
  li.tabIndex = 0;
  li.style.setProperty('--pct', s.pct / 100);
  li.setAttribute('aria-label', `${s.name} ${s.pct}%`);
  li.innerHTML = `<span class="skill-name">${s.name}</span><span class="skill-val" aria-hidden="true"><b>0</b>%</span><span class="skill-track" aria-hidden="true"><i></i></span>`;
  const num = li.querySelector('b');
  let val = 0, raf = 0;
  const count = (to) => {
    cancelAnimationFrame(raf);
    const from = val, t0 = performance.now(), dur = reduce ? 1 : 800;
    const step = (t) => {
      const k = Math.min(1, (t - t0) / dur);
      val = Math.round(from + (to - from) * ease(k));
      num.textContent = val;
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
  };
  const set = (on) => {
    if (li.classList.contains('is-on') === on) return;
    li.classList.toggle('is-on', on);
    count(on ? s.pct : 0);
  };
  if (canHover) {
    li.addEventListener('pointerenter', () => set(true));
    li.addEventListener('pointerleave', () => set(false));
  } else {
    li.addEventListener('click', () => set(!li.classList.contains('is-on')));
  }
  li.addEventListener('focus', () => { if (li.matches(':focus-visible')) set(true); });
  li.addEventListener('blur', () => set(false));
  skillList.append(li);
});
document.getElementById('skill-hint').textContent = canHover ? '스킬 위에 마우스를 올려 보세요' : '스킬을 탭해 보세요';

/* ---------- 9. 글자 나타나기 ---------- */
document.querySelectorAll('[data-split]').forEach((el) => {
  const words = el.textContent.trim().split(/\s+/);
  el.innerHTML = words.map((w, i) => `<span class="w"><span style="--i:${i}">${w}</span></span>`).join(' ');
});
const io = new IntersectionObserver((entries) => {
  entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
}, { threshold: 0.2 });
document.querySelectorAll('[data-reveal], [data-split]').forEach((el) => io.observe(el));

/* ---------- 10. 매 프레임 ---------- */
const heroSec = document.getElementById('hero');
const heroCopy = document.getElementById('hero-copy');
const heroFoot = document.getElementById('hero-foot');
const heroGlow = document.getElementById('hero-glow');
const heroWash = document.getElementById('hero-wash');
const glow = { x: 0.62, y: 0.45, sx: 0.62, sy: 0.45 };
addEventListener('pointermove', (e) => {
  glow.x = 0.45 + (e.clientX / innerWidth) * 0.35;
  glow.y = 0.3 + (e.clientY / innerHeight) * 0.3;
});
const header = document.querySelector('.site-header');
const nav = [...document.querySelectorAll('.nav a')];
const navTargets = nav.map((a) => document.querySelector(a.getAttribute('href')));

function progressOf(el) {
  const r = el.getBoundingClientRect();
  return clamp01(-r.top / Math.max(1, r.height - innerHeight));
}

let lastY = 0;
function frame(t) {
  lenis.raf(t);
  const y = lenis.scroll;

  // 히어로: 빛이 마우스를 천천히 따라오고, 스크롤하면 문장이 물러나며 밝아짐
  const hp = progressOf(heroSec);
  if (!reduce) {
    glow.sx += (glow.x - glow.sx) * 0.04;
    glow.sy += (glow.y - glow.sy) * 0.04;
  }
  heroGlow.style.setProperty('--gx', `${(glow.sx * 100).toFixed(2)}%`);
  heroGlow.style.setProperty('--gy', `${(glow.sy * 100).toFixed(2)}%`);
  heroGlow.style.scale = 1 + hp * 1.6;
  heroCopy.style.transform = `translate3d(0, calc(-50% - ${hp * 18}vh), 0) scale(${1 - hp * 0.08})`;
  heroCopy.style.opacity = 1 - clamp01(hp * 1.6);
  heroFoot.style.opacity = 1 - clamp01(hp * 3);
  const w = ease(clamp01((hp - 0.45) / 0.55));
  heroWash.style.transform = `translate3d(0, ${((1 - w) * 100).toFixed(2)}%, 0)`;
  heroWash.style.borderRadius = `${((1 - w) * 48).toFixed(1)}px ${((1 - w) * 48).toFixed(1)}px 0 0`;

  // 메인 프로젝트: 작은 카드 → 전체 화면
  const wide = innerWidth > 760;
  mainSecs.forEach((sec) => {
    const p = progressOf(sec);
    const e = ease(clamp01(p / 0.55));
    const ix = (1 - e) * (wide ? 30 : 8);
    const iy = (1 - e) * (wide ? 20 : 22);
    sec.style.setProperty('--clip', `inset(${iy}% ${ix}% ${iy}% ${ix}% round ${(1 - e) * 24}px)`);
    sec.style.setProperty('--drift', p.toFixed(4));
    sec.classList.toggle('is-full', p > 0.5);
  });

  // 서브 미리보기: 커서를 살짝 늦게 따라감
  cur.sx += (cur.x - cur.sx) * 0.16;
  cur.sy += (cur.y - cur.sy) * 0.16;
  cursor.style.transform = `translate3d(${cur.sx}px,${cur.sy}px,0)`;
  pv.x += (cur.x - pv.x) * 0.1;
  pv.y += (cur.y - pv.y) * 0.1;
  preview.style.transform = `translate3d(${pv.x + 28}px,${pv.y}px,0) translateY(-50%) rotate(${(cur.x - pv.x) * 0.03}deg)`;

  // 헤더: 내려갈 때 숨고 올라올 때 나타남, 현재 섹션 표시
  header.classList.toggle('is-hidden', y > lastY + 2 && y > innerHeight * 0.5);
  if (y < lastY - 2) header.classList.remove('is-hidden');
  lastY = y;
  let active = -1;
  navTargets.forEach((s, i) => { if (s && s.getBoundingClientRect().top < innerHeight * 0.5) active = i; });
  nav.forEach((a, i) => a.classList.toggle('is-active', i === active));

  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
