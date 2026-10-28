(() => {
  const $ = id => document.getElementById(id);
  const body = document.body, track = $('track'), comp = $('comp'), walker = $('walker');
  const pages = [...track.children];
  const pts = [...document.querySelectorAll('.pt')];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const N = pages.length;

  /* ---------- Gait ---------- */
  const legs = [...walker.querySelectorAll('.leg')].map((el, i) => ({
    el, s: +el.dataset.side, g: +el.dataset.grp, r: +el.dataset.rank,
    x: el.dataset.x, y: el.dataset.y,
    jitter: [0.02, -0.025, 0.015, -0.01, 0.03, -0.02, 0.01, -0.03][i],
    joints: [...el.querySelectorAll('.j')].map(j => ({ el: j, x: j.dataset.x, y: j.dataset.y, fs: +j.dataset.fs }))
  }));
  const SWING = 4;           // hip sweep, degrees each way (kept small on purpose: calm, not creepy)
  const LIFT = [5, 3, 2];    // how far each joint folds while the foot is in the air
  const PLANT = 2;           // knee fold/straighten while the foot is on the ground
  const STRIDE = 260;        // artwork units per step cycle; larger = fewer, slower steps
  const DUTY = 0.62;         // share of the cycle each foot stays planted
  const WAVE = 0.08;         // each leg steps a little after the one behind it
  const LAG = 0.06;          // each joint moves a little after the one before it
  const REACH = [1.15, 1.0, 0.95, 0.7];
  const PULL = [1, 0.5, -0.5, -1];
  const SPREAD = { '-1': 9, '1': -12 };     // back legs held a little apart
  const REAR_BEAT = { '-1': 0, '1': 0.27 }; // back legs step on their own beat

  function swingAt(q) { q = ((q % 1) + 1) % 1; return q < DUTY ? { st: true, v: q / DUTY } : { st: false, v: (q - DUTY) / (1 - DUTY) }; }
  function pose(phase, amt) {
    for (const L of legs) {
      const rear = L.r === 3;
      const q = phase + L.g * 0.5 + L.r * WAVE + L.jitter + (rear ? REAR_BEAT[L.s] : 0);
      const h = swingAt(q);
      const a = (h.st ? -Math.cos(Math.PI * h.v) : Math.cos(Math.PI * h.v)) * SWING * REACH[L.r];
      const base = rear ? SPREAD[L.s] : 0;
      L.el.setAttribute('transform', `rotate(${(base + L.s * a * amt).toFixed(2)} ${L.x} ${L.y})`);
      const w = PULL[L.r];
      L.joints.forEach((J, n) => {
        const p = swingAt(q - LAG * (n + 1));
        let f = p.st ? (w > 0 ? w * p.v : -w * (1 - p.v)) : (w > 0 ? w * (1 - p.v) : -w * p.v);
        f *= PLANT * (n === 0 ? 1 : 0.4);
        if (!p.st) f += LIFT[Math.min(n, 2)] * Math.sin(Math.PI * p.v);
        J.el.setAttribute('transform', `rotate(${(J.fs * f * amt).toFixed(2)} ${J.x} ${J.y})`);
      });
    }
  }

  /* ---------- Where the spider stands ----------
     Artwork units: the spider box is 990 x 900, body centre at (460, 370) inside it.
     The drawing faces 60.44 degrees left of up; rotating it -29.56 degrees stands it upright. */
  const HEAD = -60.44, UPRIGHT = -29.56;
  const UP_TOP = 341, UP_H = 901, UP_RIGHT = 260, SPIN = { x: -8, y: 251 }; // upright extents, abdomen tip
  const TOP_IN_ART = 335;   // how far the highest leg reaches above the body centre in the drawing
  let k = 1, bx = 0, by = 0, cur = { x: 0, y: 0, th: 0, s: 1 }, ph = 0;

  function introPose() {
    const r = comp.getBoundingClientRect(), s = document.getElementById('stage').getBoundingClientRect();
    return { x: r.left + 460 * k, y: r.top - s.top + 370 * k, th: 0, s: 1 };
  }
  function menuPose() {
    const vw = document.documentElement.clientWidth;   // excludes the scrollbar
    const hPx = vw < 700 ? 74 : 100;
    const sk = hPx / UP_H;   // px per artwork unit at menu size
    return { x: vw - 22 - UP_RIGHT * sk, y: 14 + UP_TOP * sk, th: UPRIGHT, s: sk / k };
  }
  function apply(p, wob = 0) {
    walker.style.transform = `translate(${(p.x - bx).toFixed(1)}px, ${(p.y - by).toFixed(1)}px) rotate(${(p.th + wob).toFixed(2)}deg) scale(${p.s.toFixed(4)})`;
  }
  function measure() {
    const r = comp.getBoundingClientRect();
    k = r.width / 990; bx = 460 * k; by = 370 * k;
    walker.style.width = r.width + 'px'; walker.style.height = r.height + 'px';
    walker.style.transformOrigin = `${bx}px ${by}px`;
    layoutMenu();
  }

  /* ---------- Motion helpers ---------- */
  let token = 0;
  const easeIO = x => 0.5 - 0.5 * Math.cos(Math.PI * x);
  const norm = a => ((a + 540) % 360) - 180;
  function tween(ms, step, t, ease = easeIO) {
    return new Promise(res => {
      if (reduce || ms <= 0) { step(1); return res(t === token); }
      const t0 = performance.now();
      const f = now => {
        if (t !== token) return res(false);
        const x = Math.min(1, (now - t0) / ms);
        step(ease(x));
        x < 1 ? requestAnimationFrame(f) : res(true);
      };
      requestAnimationFrame(f);
    });
  }
  const wait = ms => new Promise(r => setTimeout(r, reduce ? 0 : ms));

  async function settle(t) {
    return tween(450, e => pose(ph, ENTRY_AMP * (1 - e)), t, x => x);
  }
  /* ---------- Typing (first visit) ---------- */
  const keys = [...document.querySelectorAll('.wordmark .ch, .wordmark .sp')];
  const intro = pages[0];
  function typeIn() {
    return new Promise(res => {
      intro.classList.remove('typed'); intro.classList.add('typing');
      if (reduce) { keys.forEach(c => c.classList.add('on')); intro.classList.add('typed'); return res(); }
      let i = 0;
      const next = () => {
        keys[i++].classList.add('on');
        if (i < keys.length) setTimeout(next, 80 + Math.random() * 90);
        else { intro.classList.add('typed'); res(); }
      };
      setTimeout(next, 450);
    });
  }

  /* ---------- Scroll: the spider walks up, drops a straight thread to the word, and tows it away ----------
     p = 0 at the top of the intro, 1 when its sticky stage is used up.
     0 - P1  : the spider walks up along its own heading until it is one thread-length from the word.
     P1 - P2 : it stops; a straight thread shoots from its abdomen to the start of the word.
     P2 - 1  : it walks on and out, towing the word behind it on the taut thread.
     Everything is a pure function of p, so scrolling back plays it in reverse. */
  const P1 = 0.3, P2 = 0.4;
  const SPIN_ART = { x: -130.3, y: 213.9 };  // abdomen tip relative to the body centre, artwork units
  const wordmark = document.querySelector('.wordmark');
  const ropePath = $('ropePath');
  let A, B, ux, uy, D, T0, L, ang0, eT;
  function plan() {
    A = introPose(); B = menuPose();
    ux = Math.cos(HEAD * Math.PI / 180); uy = Math.sin(HEAD * Math.PI / 180);
    const prev = wordmark.style.transform; wordmark.style.transform = 'none';
    const r = wordmark.getBoundingClientRect(); wordmark.style.transform = prev;
    // measured inside the stage, like the spider's home, so it holds even if this runs while scrolled down the page
    const stageTop = document.getElementById('stage').getBoundingClientRect().top;
    T0 = { x: r.left - 3, y: r.top - stageTop + r.height * 0.55 };
    const S0 = spinAt(A);
    L = Math.hypot(T0.x - S0.x, T0.y - S0.y) * 1.8;   // slack at first: it pulls tight after a few steps
    ang0 = Math.atan2(S0.y - T0.y, S0.x - T0.x);
    // far enough that the spider and the word it tows both leave the screen
    D = (A.y + L + r.width + 260 * k) / -uy;
    // how far along the walk the thread is exactly one length from the word
    eT = 1;
    for (let i = 1; i <= 400; i++) {
      const S = spinAt(bodyAt(i / 400, { x: 0, y: 0 }));
      if (Math.hypot(T0.x - S.x, T0.y - S.y) >= L) { eT = i / 400; break; }
    }
  }
  const spinAt = P => ({ x: P.x + SPIN_ART.x * k, y: P.y + SPIN_ART.y * k });
  const smooth = x => x * x * (3 - 2 * x);
  function bodyAt(e, off) { const d = D * e * e * (2.2 - 1.2 * e); return { x: A.x + off.x + ux * d, y: A.y + off.y + uy * d, th: 0, s: 1, d }; }
  // Where the word's tie point is after the spider has walked to e: step the rope along the path.
  function towAt(e, off) {
    let T = { ...T0 };
    const n = Math.ceil(e * 90);
    for (let i = 1; i <= n; i++) {
      const S = spinAt(bodyAt(e * i / n, off));
      const dx = T.x - S.x, dy = T.y - S.y, d = Math.hypot(dx, dy);
      if (d > L) { T.x = S.x + dx / d * L; T.y = S.y + dy / d * L; }
    }
    return T;
  }

  let shown = 0, started = false, onpage = false;
  function target() {
    const span = intro.offsetHeight - innerHeight;
    return Math.max(0, Math.min(1, scrollY / span));
  }
  function showMenuSpider() {
    walker.classList.remove('menu-mode');
    walker.style.opacity = 0;
    B = menuPose(); layoutMenu();   // spider and thread from the same, current width
    cur = { ...B }; pose(0, 0); apply(cur);
    requestAnimationFrame(() => requestAnimationFrame(() => { walker.classList.add('menu-mode'); walker.style.opacity = 1; }));
  }
  function render(p) {
    const now = p >= 0.999;
    if (now !== onpage) {
      onpage = now; body.classList.toggle('onpage', now);
      if (now) { showMenuSpider(); ropePath.setAttribute('d', ''); }
      else { closeMenu(); walker.classList.remove('menu-mode'); walker.style.opacity = 1; }
    }
    intro.classList.toggle('moved', p > 0.002);
    if (onpage) return;

    const off = { x: 0, y: 0 };
    const e = p < P1 ? eT * (p / P1) : p < P2 ? eT : eT + (1 - eT) * ((p - P2) / (1 - P2));
    const P = bodyAt(e, off);
    cur = P; apply(P);
    pose(P.d / (STRIDE * k), Math.min(1, e / 0.03));

    // thread + towed word: nothing until the spider has climbed one thread-length away
    if (p < P1) { ropePath.setAttribute('d', ''); wordmark.style.transform = ''; return; }
    const S = spinAt(P);
    const T = p > P2 ? towAt(e, off) : T0;
    const reach = smooth(Math.min(1, (p - P1) / (P2 - P1)));
    const ex = S.x + (T.x - S.x) * reach, ey = S.y + (T.y - S.y) * reach;
    const d = Math.hypot(T.x - S.x, T.y - S.y);
    ropePath.setAttribute('d', `M${S.x.toFixed(1)} ${S.y.toFixed(1)} L${ex.toFixed(1)} ${ey.toFixed(1)}`);
    // the word swings a little toward the pull, then trails along
    // only once the thread has reached the word and starts pulling
    const taut = p > P2 ? Math.min(1, (p - P2) / 0.05) : 0;
    const ang = Math.atan2(S.y - T.y, S.x - T.x);
    const tilt = Math.max(-22, Math.min(22, norm((ang - ang0) * 180 / Math.PI) * 0.4)) * taut;
    wordmark.style.transform = `translate(${(T.x - T0.x).toFixed(1)}px, ${(T.y - T0.y).toFixed(1)}px) rotate(${tilt.toFixed(2)}deg)`;
  }
  function loop() {
    const tp = target();
    shown += (tp - shown) * (reduce ? 1 : 0.1);
    if (Math.abs(tp - shown) < 0.0004) shown = tp;
    render(shown);
    markCurrent();
    requestAnimationFrame(loop);
  }

  /* ---------- Current page ---------- */
  function markCurrent() {
    let page = 0;
    pages.forEach((p, i) => { if (p.getBoundingClientRect().top <= innerHeight * 0.5) page = i; });
    if (shown < 0.999) page = 0;
    pages.forEach((p, i) => {
      if (!i) return;
      const top = p.getBoundingClientRect().top;
      if (top < innerHeight * 0.82) p.classList.add('in');
      else if (top > innerHeight) p.classList.remove('in');
    });
    pts.forEach(b => b.dataset.page == page ? b.setAttribute('aria-current', 'page') : b.removeAttribute('aria-current'));
  }
  function scrollToPage(i) {
    closeMenu();
    const y = i === 0 ? 0 : pages[i].getBoundingClientRect().top + scrollY;
    scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' });
  }

  /* ---------- Menu ---------- */
  const thread = $('thread'), menuBtn = $('menuBtn');
  function layoutMenu() {
    const M = menuPose(), sk = M.s * k;
    const sx = M.x + SPIN.x * sk, sy = M.y + SPIN.y * sk;
    const len = Math.max(120, innerHeight - sy - 40);
    Object.assign(thread.style, { left: sx + 'px', top: sy + 'px', height: len + 'px' });
    Object.assign(menuBtn.style, { left: (M.x - 290 * sk) + 'px', top: (M.y - UP_TOP * sk) + 'px', width: (560 * sk) + 'px', height: (UP_H * sk) + 'px' });
    const gap = Math.max(40, innerHeight * 0.043);
    const start = Math.max(sy + 60, innerHeight * 0.36);
    pts.forEach((b, n) => {
      const y = start + n * gap;
      b.style.top = (y - 16) + 'px';
      b.style.left = (sx + 2.5) + 'px';   // measured from the left like the thread, so the dot centre sits on it
      b.style.setProperty('--d', (0.12 + ((y - sy) / len) * 0.75 * 0.85).toFixed(2) + 's');
    });
  }
  let flutter = 0;
  function openMenu() {
    if (!onpage) return;
    body.classList.add('menu-open'); menuBtn.setAttribute('aria-expanded', 'true'); menuBtn.setAttribute('aria-label', '메뉴 닫기');
    if (reduce) return;
    // a little leg flutter as it lets the thread out
    const id = ++flutter, t0 = performance.now(), base = 0;
    const f = now => {
      if (id !== flutter || !onpage) return;
      const e = Math.min(1, (now - t0) / 900);
      pose(base + e * 0.9, 0.5 * Math.sin(Math.PI * e));
      if (e < 1) requestAnimationFrame(f);
    };
    requestAnimationFrame(f);
  }
  function closeMenu() {
    body.classList.remove('menu-open'); menuBtn.setAttribute('aria-expanded', 'false'); menuBtn.setAttribute('aria-label', '메뉴 열기');
  }
  menuBtn.addEventListener('click', () => body.classList.contains('menu-open') ? closeMenu() : openMenu());
  pts.forEach(b => b.addEventListener('click', () => scrollToPage(+b.dataset.page)));
  $('logo').addEventListener('click', () => scrollToPage(0));
  $('scrim').addEventListener('click', closeMenu);
  addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (!$('lightbox').hidden) $('lightbox').hidden = true;   // a big image closes first, then the page
    else viewing ? (kb = true, leaveView()) : closeMenu();
  });

  /* ---------- Projects ----------
     Edit the project text here; the labels, list rows and project pages are all filled from it.
     link: the project's address (the button appears once it is set). ts: troubleshooting, p = problem, s = solution. */
  const INFO = {
    'jaltayo-vr': {
      no: '01', name: '잘타요VR', desc: '어린이를 위한 대중교통 이용 교육 VR 게임', team: '3인 팀 프로젝트',
      tags: ['3D 모델링', 'UI/UX 디자인', 'Unity UI 구현', '소개 영상'],
      roles: ['3D 에셋 모델링', 'UI/UX 디자인', 'Unity UI 구현 및 기능 연동', '프로젝트 소개 영상 제작'],
      tools: ['Blender', 'Unity', 'C#', 'After Effects'],
      link: 'https://day-n2375.github.io/jaltayo_vr/', linkLabel: '프로젝트 보기',
      model: 'bus1.glb', modelNote: '직접 모델링해 게임에 사용한 버스입니다. 드래그해서 돌려 볼 수 있습니다.',
      modelView: { minAz: 0, maxAz: 180 },   // front → right side → back; the unfinished left side stays hidden
      video: 'jaltayo-intro.mp4',
      story: [
        { en: 'Planning', ko: '기획',
          lead: '어린이가 처음 혼자 버스를 탈 때 겪는 어려움에서 출발한 프로젝트입니다.',
          blocks: [
            { type: 'cards', items: [
              { h: '“버스를 혼자 타기 무서워요”', p: '처음 혼자 타는 버스에 대한 막연한 두려움' },
              { h: '“카드를 태그하는 게 어려워요”', p: '승차할 때와 내릴 때의 결제 방법' },
              { h: '“하차벨은 언제 눌러야 하나요?”', p: '내려야 할 정류장을 알아차리는 순간' },
              { h: '“환승은 어떻게 하는 건가요?”', p: '버스를 갈아타는 낯선 과정' }] },
            { type: 'text', title: '게임의 목표', paras: [
              '아이들이 실제 버스 승하차 과정을 VR 안에서 그대로 경험해 볼 수 있도록 설계했습니다.',
              '“어린이도 걱정 없이”, “실제 버스와 같은 생생함”, “단계별 튜토리얼 구조” 세 가지를 핵심 방향으로 잡았습니다.'] },
            { type: 'steps', items: [
              { h: '조작 익히기', p: '튜토리얼에서 컨트롤러 스틱으로 이동하고, 뒤쪽 스위치로 카드를 집는 법을 배웁니다.' },
              { h: '미션 확인', p: '“현재 정류장에서 버스를 타고, 두 정거장 뒤에 하차하세요!” 같은 미션을 받습니다.' },
              { h: '탑승과 카드 태그', p: '노선을 확인하고 버스에 오른 뒤, 카드를 태그합니다.' },
              { h: '알맞은 정류장에 하차', p: '목적지 정류장에서 내리면 미션 성공입니다.' }] }
          ] },
        { en: 'Design', ko: '2D 디자인',
          lead: 'Illustrator로 로고, 튜토리얼 UI, 2D 일러스트를 직접 디자인했습니다. 손 스케치에서 시작해 여러 시안을 비교하며 다듬었습니다.',
          blocks: [
            { type: 'gallery', cols: 2, items: [
              { src: 'images/jaltayo/ai-sketch-logo.webp', tag: '스케치 → 시안', cap: '손 스케치와 로고·UI 시안을 한 보드에 모아 비교한 작업 화면' },
              { src: 'images/jaltayo/logo-variants.jpg', tag: '로고', cap: '“잘타요” 로고 시안 — 파란 버전과 주황 버전' },
              { src: 'images/jaltayo/ui-color-variants.jpg', tag: 'UI 컬러', cap: '튜토리얼 UI 컬러 시안 6종' },
              { src: 'images/jaltayo/ai-tutorial-ui.webp', tag: '튜토리얼 UI', cap: '게임 방법 · 조작 방법 · 미션 카드 UI 작업 화면' },
              { src: 'images/jaltayo/ai-illustrations.webp', tag: '일러스트', cap: '캐릭터, 버스, 정류장, 리서치 자료까지 2D 그래픽 작업 화면' },
              { src: 'images/jaltayo/bus-illust.jpg', tag: '일러스트', cap: '2D 버스와 정류장 일러스트' }] }
          ] },
        { en: '3D Modeling', ko: '3D 모델링',
          lead: '게임 속 도시와 버스, 정류장을 Blender로 직접 모델링했습니다. 도로와 횡단보도 배치부터 설계한 뒤 건물을 올렸습니다.',
          blocks: [
            { type: 'gallery', cols: 2, items: [
              { src: 'images/jaltayo/map-top.webp', tag: '맵 설계', cap: '위에서 본 도시 맵 — 도로, 횡단보도, 건물 자리 배치' },
              { src: 'images/jaltayo/city-3d.webp', tag: '도시', cap: '건물을 올려 완성한 도시 맵' },
              { src: 'images/jaltayo/buses-color.jpg', tag: '버스', cap: '노선 번호로 구분한 버스 3종 (53 · 02 · 302)' },
              { src: 'images/jaltayo/bus-stop.webp', tag: '정류장', cap: '노선도가 들어간 버스 정류장과 표지판' }] }
          ] },
        { en: 'In Unity', ko: 'Unity 구현',
          lead: '디자인한 UI를 이미지로 넘기는 데서 끝내지 않고, Unity에 직접 넣어 C#으로 VR 안에서 작동하도록 연결했습니다.',
          blocks: [
            { type: 'gallery', cols: 2, items: [
              { src: 'images/jaltayo/vr-tutorial-sky.jpg', tag: 'VR UI', cap: 'VR 안에 띄운 조작 방법 튜토리얼 — 컨트롤러 레이로 버튼을 누릅니다' },
              { src: 'images/jaltayo/vr-tutorial-city.jpg', tag: 'VR UI', cap: '직접 모델링한 도시 위에서 보이는 튜토리얼 UI' }] }
          ] },
        { en: 'Motion', ko: '소개 영상',
          lead: '완성된 게임은 After Effects로 소개 영상을 만들어, 기획 의도와 체험 과정을 전달했습니다.',
          blocks: [
            { type: 'gallery', cols: 1, items: [
              { src: 'images/jaltayo/research.jpg', tag: '영상 소스', cap: '소개 영상에 쓰기 위해 직접 만든 그래픽 소스입니다. 맞벌이 가구 수 추이 그래프(국가데이터처 지역별 고용조사)와 아이들의 고민을 담은 말풍선을 디자인했습니다.' }] },
            { type: 'gallery', cols: 2, items: [
              { src: 'images/jaltayo/ae-structure.webp', tag: '키 메시지', cap: '“어린이도 걱정 없이!” · “실제 버스와 같은 생생함” · “단계별 튜토리얼 구조”' },
              { src: 'images/jaltayo/ae-scenario.webp', tag: '플레이 장면', cap: '실제 플레이 화면 위에 단계별 설명을 얹은 장면 (튜토리얼 및 시나리오 1)' }] }
          ] }
      ],
      tsLead: 'Blender → Unity → VR로 옮기며 생긴 문제를, 원인을 찾아 하나씩 해결했습니다.',
      ts: [
        { p: 'Blender에서 작업한 모델을 Unity로 옮기는 과정에서 모델에 적용한 색상이 사라졌습니다.',
          s: 'Unity에서 적용될 수 있도록 Export 설정을 변경하고, Unity에서 다시 확인하며 적용되지 않은 부분은 직접 다시 적용했습니다.' },
        { p: 'VR 화면에서 안내 메시지 UI가 거울처럼 180도 뒤집혀 보였습니다.',
          s: '스크립트에서 카메라를 바라보는 방향을 계산한 뒤 Y축 회전을 180도 보정해, UI가 항상 정면을 보도록 수정했습니다.' },
        { p: 'VR 컨트롤러로 UI를 눌러도 클릭 이벤트가 반응하지 않았습니다.',
          s: 'Canvas의 Scale을 VR 표준인 0.001 수준으로 맞추고 Pos Z 위치를 미세 조정해, 물리 충돌 간섭 문제를 해결했습니다.' },
        { p: '모니터에서는 잘 보이던 UI가 VR 화면 안에서는 너무 작거나 가까워 잘 보이지 않았습니다.',
          s: 'UI의 크기, 거리, 배치를 바꿔 가며 직접 기기를 착용하고 테스트하기를 반복해, 어린이의 시선에서도 편하게 읽히는 위치를 찾았습니다.' }
      ]
    },
    'nyangnyang-harbor': {
      no: '02', name: '냥냥 항구마을', desc: '해양오염의 심각성을 알리는 웹 기반 시리어스 게임', team: '개인 프로젝트',
      tags: ['기획', '디자인', '개발'],
      roles: ['게임 기획', '아트 · UI 디자인', '웹 개발', '기획부터 구현까지 전 과정 단독 수행'],
      tools: ['HTML', 'CSS', 'JavaScript', 'Illustrator'],
      link: 'https://porttown-github-io.onrender.com', linkLabel: '게임 해보기',
      story: [
        { en: 'Planning', ko: '기획',
          lead: '해양 환경 오염과 과도한 어업 문제를 주제로, 횡스크롤 이동과 선택지 방식을 합친 게임입니다.',
          blocks: [
            { type: 'text', title: '기획 의도', paras: [
              '개인의 이익을 위한 사소한 선택들이 쌓이면, 환경과 공동체에 큰 영향을 미칠 수 있다는 것을 전하고 싶었습니다.',
              '악의적인 선택뿐 아니라 “나만 그러는 게 아니니까 괜찮겠지”, “그래도 괜찮겠지” 같은 자기 합리화적인 선택이 모여 좋지 않은 결과를 만든다는 메시지입니다.'] },
            { type: 'cards', items: [
              { h: '두 개의 선택지', p: '도덕적이지 못한 선택지와 비교적 덜 부도덕한 선택지 중 반드시 하나를 골라야 하고, 결과는 둘 다 같습니다.' },
              { h: '민심 점수', p: '선택할 때마다 주민들의 민심 점수가 오르내려, 내가 고른 해결책이 마을에 어떤 영향을 줬는지 보여줍니다.' },
              { h: '정해진 결말', p: '어떤 선택을 해도 결말은 같습니다. 덜 나쁜 선택도 결국 공동체와 환경에 올바른 선택이 될 수 없다는 의미를 남깁니다.' }] },
            { type: 'steps', items: [
              { h: '초반 — 평화로운 마을', p: '플레이어는 새로 부임한 이장이 되어 마을의 사소한 갈등을 해결합니다. 선택이 가볍고, 민심 게이지가 점점 올라갑니다.' },
              { h: '중반 — 커지는 욕심', p: '어업으로 이익을 얻은 주민들이 과도한 어업을 하려 하고, 쓰레기와 폐수를 바다에 버리는 선택이 이어집니다.' },
              { h: '후반 — 무너지는 바다', p: '물고기가 줄고 바다가 오염되어 손님이 끊기고, 주민들은 생계를 잃습니다. 민심이 바닥으로 떨어지며 게임이 끝납니다.' }] },
            { type: 'cards', items: [
              { h: '벤치마킹 · The Walking Dead', p: '선택에 따라 디테일은 바뀌어도 결말은 바꿀 수 없는 구조를 참고했습니다.' },
              { h: '벤치마킹 · Endling', p: '풍요롭던 자연이 쓰레기로 뒤덮이며 황폐해지는 과정을 시간의 흐름으로 보여주는 연출을 참고했습니다.' }] }
          ] },
        { en: 'Design', ko: '디자인',
          lead: '캐릭터, 배경, UI까지 모든 그래픽을 Illustrator로 직접 그렸습니다.',
          blocks: [
            { type: 'gallery', cols: 2, items: [
              { src: 'images/nyang/title.jpg', tag: '타이틀', cap: '고양이 얼굴과 파도 패턴, 손글씨 로고로 만든 시작 화면' },
              { src: 'images/nyang/player-sprite.png', tag: '캐릭터', cap: '플레이어(이장) 스프라이트 — 4방향 × 4프레임 걷기 동작' },
              { src: 'images/nyang/talk-day1.webp', tag: '대화 UI', cap: '주민 NPC와 이장이 대화하는 화면' },
              { src: 'images/nyang/journal.jpg', tag: '마을 일지', cap: '정책에 도장을 찍고, 주민들의 반응을 확인하는 마을 일지' }] },
            { type: 'text', title: '작업 과정', paras: [
              '레퍼런스를 모아 항구의 분위기를 잡은 뒤, 건물과 캐릭터, 대화 장면을 하나씩 Illustrator로 그려 나갔습니다.'] },
            { type: 'gallery', cols: 1, items: [
              { src: 'images/nyang/ai-board.webp', tag: '전체 보드', cap: '타이틀, 건물, 레퍼런스, 마을 일지, 결과 화면까지 모아 둔 Illustrator 작업 보드' }] },
            { type: 'gallery', cols: 2, items: [
              { src: 'images/nyang/ai-characters.webp', tag: '캐릭터', cap: '플레이어 스프라이트 시트와 주민 NPC 5종 작업 화면' },
              { src: 'images/nyang/ai-buildings.jpg', tag: '건물', cap: '수산물 가게, 어부 쉼터, 냥냥 민박 등 가게마다 간판과 소품을 따로 그린 항구 건물 에셋' },
              { src: 'images/nyang/ai-dialogues.webp', tag: '대화 장면', cap: '1일차부터 6일차까지 대화 장면을 날짜별로 배치한 작업 화면' },
              { src: 'images/nyang/ai-dialogues-zoom.jpg', tag: '대화 장면', cap: '주민마다 다른 캐릭터와 대사로 만든 대화 장면들' }] }
          ] },
        { en: 'Mood', ko: '분위기 변화',
          lead: '이야기가 진행될수록 항구의 모습이 달라집니다. 같은 장소를 세 단계로 다시 그려, 선택의 결과가 화면으로 쌓이게 했습니다.',
          blocks: [
            { type: 'gallery', cols: 3, items: [
              { src: 'images/nyang/bg-0.jpg', tag: '초반', cap: '맑은 바다와 조용한 항구' },
              { src: 'images/nyang/bg-2.jpg', tag: '중반', cap: '가게가 늘어나며 북적이는 항구' },
              { src: 'images/nyang/bg-4.jpg', tag: '후반', cap: '오염된 바다와 어두워진 마을' }] }
          ] },
        { en: 'Development', ko: '개발',
          lead: '프레임워크 없이 HTML · CSS · JavaScript로 게임 전체를 구현했습니다.',
          blocks: [
            { type: 'cards', items: [
              { h: '6일간의 이야기', p: '1일차부터 6일차까지 하루 단위로 진행되고, 대화 장면은 모두 38개입니다.' },
              { h: '데이터로 관리하는 대화', p: '챕터와 NPC, 대화 순서를 하나의 데이터 목록으로 정리해, 코드를 고치지 않고 내용을 바꿀 수 있게 했습니다.' },
              { h: '어떤 화면에서도 같은 장면', p: '모든 좌표를 1920×1080 하나의 기준으로 두고, 화면 크기에 맞춰 비율을 유지한 채 확대·축소합니다.' }] },
            { type: 'gallery', cols: 1, items: [
              { src: 'images/nyang/talk-day6.webp', tag: '6일차', cap: '후반 대화 — 주민들이 마을을 떠나기로 마음먹는 장면' }] }
          ] },
        { en: 'Ending', ko: '결과 화면',
          lead: '선택이 쌓이며 보여주는 결과 화면입니다. 처음엔 모두가 웃지만, 마지막엔 되돌릴 수 없는 결말에 이릅니다.',
          blocks: [
            { type: 'gallery', cols: 2, items: [
              { src: 'images/nyang/result-1.jpg', tag: '01', cap: '어획량 규제를 풀자 물고기가 넘쳐나고, 주민들이 웃습니다' },
              { src: 'images/nyang/result-2.jpg', tag: '02', cap: '대형 선박을 들이며 마을이 북적이기 시작합니다' },
              { src: 'images/nyang/result-3.jpg', tag: '03', cap: '그물이 바다 밑바닥까지 긁으며 생명체들이 파괴됩니다' },
              { src: 'images/nyang/result-4.jpg', tag: '04', cap: '바다는 색을 잃고, 마을의 생명줄도 끊어집니다' }] }
          ] }
      ],
      tsLead: '기획 의도와 화면이 어긋나는 순간을 발견하고, 디자인과 코드를 함께 고쳤습니다.',
      ts: [
        { p: '해양오염이라는 주제와 맞지 않게, 게임이 지나치게 밝고 귀여운 분위기로 만들어졌습니다.',
          s: '이야기가 후반부에 들어서면 배경을 어두운 장면으로 바꾸고, 밝은 배경음악 대신 파도 소리가 흐르도록 구현해 진행에 따라 분위기가 점차 어두워지게 했습니다.' },
        { p: '화면 크기에 따라 배경 이미지와 캐릭터의 위치가 틀어졌습니다.',
          s: '게임의 모든 좌표를 1920×1080 하나의 기준으로 고정하고, 실제 화면 크기에 맞춰 비율을 유지한 채 게임 화면 전체를 확대·축소하도록 구현했습니다.' },
        { p: '대화 내용을 바꾸거나 챕터를 추가할 때마다 코드를 고쳐야 하는 구조는 수정과 확장이 어려웠습니다.',
          s: '챕터와 NPC, 대화 순서를 하나의 데이터 목록으로 정리해, 코드를 고치지 않고 데이터만 수정하면 되도록 설계했습니다.' }
      ]
    },
    // Sub projects
    'phosphate': {
      no: '01', name: 'Phosphate', type: 'Interactive Web', year: '2026',
      desc: '모로코의 인산염을 소개하는 인터랙션 웹페이지', team: '개인 프로젝트',
      tags: ['기획', '디자인', '개발'],
      roles: ['기획', 'UI · 인터랙션 디자인', '웹 개발'],
      tools: ['Figma', 'HTML', 'CSS', 'JavaScript'],
      link: '', linkLabel: '웹사이트 보기',
      ts: [], tsEmpty: '현재 제작 중인 프로젝트입니다. 완성되면 트러블 슈팅을 추가할 예정입니다.'
    },
    'rockrockrock': {
      no: '02', name: 'ROCKROCKROCK', type: 'Web', year: '2026',
      desc: '락 페스티벌에 가기 전 알아두면 좋은 정보를 모은 웹페이지', team: '개인 프로젝트',
      tags: ['기획', '디자인', '개발'],
      roles: ['콘텐츠 기획', 'UI 디자인', '웹 개발'],
      tools: ['React', 'JavaScript'],
      link: 'https://festival-zau6.onrender.com', linkLabel: '웹사이트 보기',
      tsLead: '다섯 개의 화면을 컴포넌트로 나누고, 상호작용이 어긋나는 지점을 하나씩 바로잡았습니다.',
      ts: [
        { p: '페스티벌 상세 팝업 안쪽을 클릭해도, 바깥 배경을 누른 것처럼 팝업이 닫혔습니다.',
          s: '팝업 본문에서 클릭 이벤트가 배경으로 전달되지 않도록 stopPropagation()으로 막아, 바깥 배경을 누를 때만 닫히게 했습니다.' },
        { p: '플레이리스트 슬라이드가 첫 곡과 마지막 곡에서 범위를 벗어나고, 양옆 앨범이 비면서 가운데 정렬이 틀어졌습니다.',
          s: '현재 위치를 Math.max/Math.min으로 처음과 끝 사이에 묶고 끝에서는 버튼을 비활성화했으며, 빈 자리에는 같은 크기의 빈 칸을 두어 가운데 앨범의 위치를 고정했습니다.' },
        { p: '스크롤하기 전부터 아래쪽 카드와 가이드 섹션의 등장 애니메이션이 미리 재생되었습니다.',
          s: 'IntersectionObserver로 요소가 화면에 들어오는 순간을 감지해 그때 애니메이션이 시작되게 하고, 컴포넌트가 사라질 때 관찰을 해제했습니다.' }
      ]
    },
    'shuim': {
      no: '03', name: '쉼', type: 'VR Video', year: '2025',
      desc: '고군산군도를 소개하는 VR 홍보 영상', team: '5인 팀 프로젝트',
      tags: ['영상 편집', '촬영 보조'],
      roles: ['메인 편집', '촬영 보조'],
      tools: ['Premiere Pro', 'Insta360 카메라', 'Insta360 Studio'],
      link: '', linkLabel: 'YouTube에서 보기',
      tsLead: '5일이라는 짧은 기간 안에 촬영과 편집을 모두 마쳐야 했습니다.',
      ts: [
        { p: '5일 안에 촬영과 편집을 모두 마쳐야 해서 시간이 부족했습니다.',
          s: '본 촬영 전에 사전 답사를 진행해 촬영 스팟을 미리 탐색했습니다.' },
        { p: '편집 과정에서 촬영본이 부족한 상황이 생겼습니다.',
          s: '추가 촬영을 빠르게 마쳐 편집 일정에 무리가 없도록 진행했습니다.' },
        { p: '편집 중 나레이션 오디오의 볼륨 편차가 생겼습니다.',
          s: '클립마다 볼륨 수치를 조절해 나레이션에서 튀는 부분이 없도록 맞췄습니다.' }
      ]
    }
  };
  const projs = [...document.querySelectorAll('.proj')].map(el => ({
    el, id: el.dataset.id, info: INFO[el.dataset.id],
    rings: [...el.querySelectorAll('.ring')], spokes: [...el.querySelectorAll('.spoke')],
    mark: el.querySelector('.mark'), label: el.querySelector('.proj-label'),
    cx: +el.dataset.cx, cy: +el.dataset.cy, tw: 0, twAmp: 0
  }));
  projs.forEach(P => {
    P.label.querySelector('.pl-name').textContent = P.info.name;
    P.label.querySelector('.pl-desc').textContent = P.info.desc;
    P.label.querySelector('.pl-tags').textContent = [P.info.team, ...P.info.tags].join(' · ');
    P.label.setAttribute('aria-label', `${P.info.name} 프로젝트 보기`);
  });

  // Pluck: the rings breathe out and in, the inner ones a beat later, and the spokes rock a little.
  function twang(P, amp) {
    if (reduce || (P.tw && P.twAmp > amp)) return;   // a bigger pluck is still ringing
    const id = ++P.tw, t0 = performance.now(); P.twAmp = amp;
    const around = (s) => `translate(${P.cx} ${P.cy}) scale(${s.toFixed(4)}) translate(${-P.cx} ${-P.cy})`;
    const f = now => {
      if (id !== P.tw) return;
      const t = (now - t0) / 1000, env = amp * Math.exp(-t * 4.5);
      P.rings.forEach((r, i) => r.setAttribute('transform', around(1 + 0.045 * env * Math.sin(2 * Math.PI * 3.2 * t - i * 0.55))));
      const a = 1.6 * env * Math.sin(2 * Math.PI * 2.4 * t);
      P.spokes.forEach(s => s.setAttribute('transform', `rotate(${a.toFixed(3)} ${P.cx} ${P.cy})`));
      if (P.mark) P.mark.setAttribute('transform', around(1 + 0.06 * env * Math.sin(2 * Math.PI * 3.2 * t - 4)));
      if (t < 1.2) requestAnimationFrame(f); else { P.tw = 0; P.twAmp = 0; }
    };
    requestAnimationFrame(f);
  }

  const centreOf = el => { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, R: Math.max(r.width, r.height) / 2 }; };

  // Each leg turns about its hip (its point nearest the body); every other leg around the body steps together.
  function rigLegs(root, c) {
    const legs = [...root.querySelectorAll('.sleg')].map(el => {
      const pts = [...el.querySelectorAll('polygon')].flatMap(p => [...p.points].map(q => ({ x: q.x, y: q.y })));
      const hip = pts.reduce((a, q) => Math.hypot(q.x - c.x, q.y - c.y) < Math.hypot(a.x - c.x, a.y - c.y) ? q : a);
      const m = pts.reduce((a, q) => ({ x: a.x + q.x / pts.length, y: a.y + q.y / pts.length }), { x: 0, y: 0 });
      return { el, hip, ang: Math.atan2(m.y - c.y, m.x - c.x) };
    }).sort((a, b) => a.ang - b.ang);
    legs.forEach((L, i) => L.set = i % 2);
    return legs;
  }

  /* The spider on each web walks to that web's logo: two alternating sets of legs, body turning to face the logo.
     data-c* is the body, data-h* the mouth, data-o* where the drawing sits in the web, all in the drawing's units;
     data-heading is the way the drawing faces. */
  projs.forEach(P => {
    const g = P.el.querySelector('.wsp'); if (!g) return;
    const d = g.dataset, c = { x: +d.cx, y: +d.cy };
    const legs = rigLegs(g, c);
    P.spider = { g, legs, c, head: { x: +d.hx, y: +d.hy }, off: { x: +d.ox, y: +d.oy }, heading: +d.heading };
  });
  function legPose(S, phase, amt) {
    for (const L of S.legs) {
      const a = 9 * amt * Math.sin(2 * Math.PI * phase + L.set * Math.PI);
      L.el.setAttribute('transform', `rotate(${a.toFixed(2)} ${L.hip.x} ${L.hip.y})`);
    }
  }
  function resetSpider(P) {
    if (!P.spider) return;
    P.spider.g.removeAttribute('transform'); legPose(P.spider, 0, 0);
  }

  let running = false;
  async function walkTo(P) {
    closeMenu();
    const L = centreOf(P.mark), S = P.spider;
    if (reduce || !S) return L;
    running = true;
    const c = { x: S.c.x + S.off.x, y: S.c.y + S.off.y }, h = { x: S.head.x + S.off.x, y: S.head.y + S.off.y };
    const dx = P.cx - c.x, dy = P.cy - c.y, n = Math.hypot(dx, dy);
    const turn = norm(Math.atan2(dy, dx) * 180 / Math.PI - S.heading);
    const go = n - +P.el.dataset.r - Math.hypot(h.x - c.x, h.y - c.y);   // stop with the mouth at the logo's edge
    const tx = dx / n * go, ty = dy / n * go;
    const t = ++token;
    await tween(1000, u => {
      const r = turn * smooth(Math.min(1, u / 0.3));
      S.g.setAttribute('transform', `translate(${(tx * u).toFixed(2)} ${(ty * u).toFixed(2)}) rotate(${r.toFixed(2)} ${c.x} ${c.y})`);
      legPose(S, u * 3.5, Math.max(0, Math.min(1, u / 0.08, (1 - u) / 0.12)));
    }, t);
    running = false;
    return L;
  }

  /* ---------- Project page: opens as a circle out of the logo, closes back into it ---------- */
  const view = $('projView'), pvBack = $('pvBack');
  const behind = [track, document.querySelector('nav'), $('logo'), $('menuBtn')];
  let viewing = null, pushed = false, pendingAt = null, savedY = 0, kb = false;   // kb: closed from the keyboard
  let returnTo = null;   // a skill's project link the view was opened from, so it closes back onto it
  const make = (tag, cls, text) => Object.assign(document.createElement(tag), { className: cls, textContent: text });
  function renderDetail(I) {
    const facts = [['TEAM', I.team], ['ROLE', I.roles.join(' · ')], ['TOOLS', (I.tools || []).join(' · ')], ['YEAR', I.year]];
    $('pvFacts').replaceChildren(...facts.filter(f => f[1]).map(([k, v]) => {
      const d = document.createElement('div'); d.append(make('dt', '', k), make('dd', '', v)); return d;
    }));
    $('pvTsLead').textContent = I.tsLead || '';
    const ts = I.ts || [];
    $('pvTs').replaceChildren(...(ts.length ? ts.map((t, i) => {
      const n = String(i + 1).padStart(2, '0'), li = document.createElement('li');
      const card = (cls, k, text) => { const c = make('div', `ts-card ${cls}`); c.append(make('span', 'ts-k', `${k} ${n}`), make('p', 'ts-t', text)); return c; };
      li.append(card('ts-p', 'PROBLEM', t.p), card('ts-s', 'SOLUTION', t.s));
      return li;
    }) : [make('li', 'ts-empty', I.tsEmpty || '트러블 슈팅 내용을 준비 중입니다.')]));
    renderStory(I.story || []);
  }

  /* The long middle of a project page: sections of text, cards, numbered steps and image galleries (see INFO[...].story). */
  const STORY_BLOCKS = {
    text: b => { const d = make('div', 'st-text'); if (b.title) d.append(make('h4', '', b.title)); b.paras.forEach(p => d.append(make('p', '', p))); return d; },
    cards: b => { const d = make('div', 'st-cards'); b.items.forEach(it => { const c = make('div', 'st-card'); c.append(make('h4', '', it.h), make('p', '', it.p)); d.append(c); }); return d; },
    steps: b => { const ol = make('ol', 'st-steps'); b.items.forEach(it => { const li = document.createElement('li'); li.append(make('h4', '', it.h), make('p', '', it.p)); ol.append(li); }); return ol; },
    gallery: b => {
      const d = make('div', 'st-gallery'); d.style.setProperty('--cols', b.cols || 2);
      b.items.forEach(it => {
        const f = document.createElement('figure');
        const img = Object.assign(document.createElement('img'), { src: it.src, alt: it.cap, loading: 'lazy', decoding: 'async' });
        const cap = document.createElement('figcaption');
        if (it.tag) cap.append(make('b', '', it.tag + ' '));
        cap.append(it.cap);
        f.append(img, cap); d.append(f);
      });
      return d;
    }
  };
  function renderStory(story) {
    $('pvStory').replaceChildren(...story.map((s, i) => {
      const sec = make('section', 'st-sec'), head = make('div', 'st-head'), h = make('h3', 'pv-h', s.en);
      if (s.ko) h.append(make('small', '', s.ko));
      head.append(make('span', 'st-no', String(i + 1).padStart(2, '0')), h);
      sec.append(head);
      if (s.lead) sec.append(make('p', 'st-lead', s.lead));
      s.blocks.forEach(b => sec.append(STORY_BLOCKS[b.type](b)));
      return sec;
    }));
  }
  // any story image opens large
  const lightbox = $('lightbox');
  $('pvStory').addEventListener('click', e => {
    const img = e.target.closest('.st-gallery img'); if (!img) return;
    lightbox.querySelector('img').src = img.src;
    lightbox.querySelector('figcaption').textContent = img.alt;
    lightbox.hidden = false;
  });
  lightbox.addEventListener('click', () => { lightbox.hidden = true; });
  /* A model you can turn with the mouse: three.js is fetched the first time a page with a model opens. */
  let model3d = null;
  function closeModel() {
    if (model3d) { model3d.stop(); model3d = null; }
    $('pvModel').textContent = '';
  }
  async function showModel(url, view) {
    closeModel();
    const box = $('pvModel'), mine = {};
    model3d = { stop() { mine.dead = true; } };   // stops a load that is still on its way
    const self = model3d;
    box.textContent = '3D 모델을 불러오는 중…';
    try {
      const [THREE, { GLTFLoader }, { OrbitControls }] = await Promise.all([
        import('three'), import('three/addons/loaders/GLTFLoader.js'), import('three/addons/controls/OrbitControls.js')
      ]);
      const gltf = await new GLTFLoader().loadAsync(url);
      if (mine.dead) return;
      const W = () => box.clientWidth, H = () => box.clientHeight;
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
      renderer.setSize(W(), H());
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      box.textContent = ''; box.append(renderer.domElement);
      const scene = new THREE.Scene();
      scene.add(new THREE.HemisphereLight(0xffffff, 0xffe6d4, 2.2));
      const sun = new THREE.DirectionalLight(0xffffff, 2.2); sun.position.set(3, 5, 4); scene.add(sun);
      // centre the model and frame it whatever size it was modelled at
      const obj = gltf.scene, bounds = new THREE.Box3().setFromObject(obj);
      obj.position.sub(bounds.getCenter(new THREE.Vector3()));
      scene.add(obj);
      const r = bounds.getSize(new THREE.Vector3()).length() / 2;
      const camera = new THREE.PerspectiveCamera(35, W() / H(), r / 100, r * 100);
      camera.position.set(1.15, 0.5, 1.4).setLength(r * 2.3);   // three-quarter view from a little above
      const controls = new OrbitControls(camera, renderer.domElement);
      Object.assign(controls, { enableDamping: true, enablePan: false, autoRotate: !reduce, autoRotateSpeed: 1.2, minDistance: r * 0.9, maxDistance: r * 4 });
      // view: which way round the model may be turned, in degrees (0 = from +Z, 90 = from +X); never from below
      const rad = Math.PI / 180, lim = view && { min: view.minAz * rad, max: view.maxAz * rad };
      if (lim) Object.assign(controls, { minAzimuthAngle: lim.min, maxAzimuthAngle: lim.max, minPolarAngle: 0, maxPolarAngle: Math.PI / 2 });
      let raf = 0;
      const tick = () => {
        if (lim && controls.autoRotate) {   // swing back and forth between the limits instead of stopping at one
          const a = controls.getAzimuthalAngle();
          if (a <= lim.min + 0.02) controls.autoRotateSpeed = -Math.abs(controls.autoRotateSpeed);
          else if (a >= lim.max - 0.02) controls.autoRotateSpeed = Math.abs(controls.autoRotateSpeed);
        }
        controls.update(); renderer.render(scene, camera); raf = requestAnimationFrame(tick);
      };
      tick();
      const ro = new ResizeObserver(() => { renderer.setSize(W(), H()); camera.aspect = W() / H(); camera.updateProjectionMatrix(); });
      ro.observe(box);
      self.stop = () => { cancelAnimationFrame(raf); ro.disconnect(); controls.dispose(); renderer.dispose(); };
    } catch (err) {
      if (!mine.dead) box.textContent = '3D 모델을 불러오지 못했습니다.';
    }
  }
  function openView(P, at) {
    if (!viewing) savedY = scrollY;
    viewing = P;
    const I = P.info;
    $('pvNo').textContent = [P.sub ? `WORK ${I.no}` : `LEARN BY DOING ${I.no}`, I.type, I.year].filter(Boolean).join(' · ');
    pvBack.textContent = `\u2190 ${returnTo ? 'Skills' : P.sub ? 'Work' : 'Learn by Doing'}`;
    $('pvTitle').textContent = I.name;
    $('pvDesc').textContent = I.desc;
    renderDetail(I);
    $('pvMediaSec').hidden = !I.model && !I.video;
    $('pvModelFig').hidden = !I.model;
    $('pvVideoFig').hidden = !I.video;
    $('pvModelNote').textContent = I.modelNote || '';
    if (I.model) showModel(I.model, I.modelView); else closeModel();
    const video = $('pvVideo');
    const clip = I.video && I.video + '#t=1';   // start the still at 1s, past the black first frame
    if (clip) { if (video.getAttribute('src') !== clip) video.src = clip; } else video.removeAttribute('src');
    if (P.sub) {
      $('pvMark').replaceChildren(Object.assign(document.createElement('img'), { src: P.mark.querySelector('img').src, alt: '' }));
    } else {
      const mark = P.mark.cloneNode(true); mark.removeAttribute('transform');
      $('pvMark').innerHTML = `<svg viewBox="${P.el.dataset.vb}"></svg>`; $('pvMark').firstChild.append(mark);
    }
    const link = $('pvLink'); link.hidden = !I.link;
    if (I.link) { link.href = I.link; link.textContent = `${I.linkLabel || '\ud504\ub85c\uc81d\ud2b8 \ubcf4\uae30'} \u2197`; }
    const o = at || { x: innerWidth / 2, y: innerHeight / 2 };
    view.style.setProperty('--ox', o.x + 'px'); view.style.setProperty('--oy', o.y + 'px');
    view.scrollTop = 0;
    view.classList.add('open');
    behind.forEach(el => el.inert = true);
    setTimeout(() => {
      if (viewing !== P) return;
      // only once the page is covered: hiding the scrollbar shifts everything behind
      document.documentElement.classList.add('viewing');
      resetSpider(P);
    }, reduce ? 0 : 650);
    pvBack.focus({ preventScroll: true });
  }
  function closeView() {
    if (!viewing) return;
    const P = viewing; viewing = null; pushed = false;
    document.documentElement.classList.remove('viewing');
    scrollTo({ top: savedY, behavior: 'instant' });   // back where the project was clicked
    behind.forEach(el => el.inert = false);
    const back = returnTo || P.mark; returnTo = null;
    const o = centreOf(back);   // measured now that the page is back
    view.style.setProperty('--ox', o.x + 'px'); view.style.setProperty('--oy', o.y + 'px');
    view.classList.remove('open');
    $('pvVideo').pause();
    $('lightbox').hidden = true;
    closeModel();
    // hand focus back to the project only for keyboard users; a mouse click would leave a focus ring on it
    if (kb) (back === P.mark ? P.label : back).focus({ preventScroll: true }); else document.activeElement.blur();
    kb = false;
  }
  function leaveView() {
    if (pushed) return history.back();   // hashchange closes it
    history.replaceState(null, '', location.pathname + location.search);
    closeView();
  }
  function syncHash() {
    const P = [...projs, ...subs].find(p => p.id === location.hash.slice(1));
    if (P && viewing !== P) openView(P, pendingAt);
    else if (!P && viewing) closeView();
    pendingAt = null;
  }
  addEventListener('hashchange', syncHash);
  pvBack.addEventListener('click', e => { kb = e.detail === 0; leaveView(); });

  projs.forEach(P => {
    const go = async e => {
      e.preventDefault();
      if (running) { ++token; return; }   // a second click skips the walk
      if (viewing) return;
      twang(P, 1);
      pendingAt = await walkTo(P);
      pushed = true;
      location.hash = P.id;
    };
    const hot = on => () => { P.el.classList.toggle('hot', on); if (on) twang(P, 0.35); };
    for (const el of [P.el.querySelector('.hit'), P.label]) {
      el.addEventListener('click', go);
      el.addEventListener('pointerenter', hot(true));
      el.addEventListener('pointerleave', hot(false));
    }
    P.label.addEventListener('focus', hot(true));
    P.label.addEventListener('blur', hot(false));
  });

  // Sub projects open the same project page, straight out of their thumbnail.
  const subs = [...document.querySelectorAll('.sub')].map(el => ({
    el, id: el.dataset.id, info: INFO[el.dataset.id], sub: true,
    mark: el.querySelector('.sub-thumb'), label: el.querySelector('.sub-link')
  }));
  subs.forEach(P => {
    const I = P.info, q = s => P.el.querySelector(s);
    q('.sub-no').textContent = I.no;
    q('.sub-name').textContent = I.name;
    q('.sub-meta').textContent = `${I.type} · ${I.year}`;
    q('.sub-desc').textContent = I.desc;
    q('.sub-tags').textContent = [I.team, ...I.tags].join(' · ');
    P.label.setAttribute('aria-label', `${I.name} 프로젝트 보기`);
    P.label.addEventListener('click', e => {
      e.preventDefault();
      if (viewing) return;
      pendingAt = centreOf(P.mark); pushed = true;
      location.hash = P.id;
    });
  });

  /* ---------- Skills: each tool toggles its spider out to the level and back ---------- */
  const skills = [...document.querySelectorAll('.skill')].map(el => {
    const walk = el.querySelector('.sk-walk');
    walk.prepend($('skSpider').content.firstElementChild.cloneNode(true));
    const pill = el.querySelector('.sk-pill'), pct = +el.dataset.pct;
    pill.setAttribute('aria-label', `${pill.textContent} ${pct}%`);
    return {
      el, pill, walk, pct, p: 0, run: 0,
      track: el.querySelector('.sk-track'), line: el.querySelector('.sk-line'), num: el.querySelector('.sk-pct'),
      legs: rigLegs(walk, { x: 130.5, y: 76 })
    };
  });
  function drawSkill(R) {
    const W = R.track.clientWidth;
    R.line.style.transform = `scaleX(${R.p.toFixed(4)})`;
    R.walk.style.transform = `translateX(${(R.p * W).toFixed(1)}px)`;
    R.walk.style.opacity = Math.min(1, R.p * W / 14);   // fades in over its first steps off the button
    R.num.textContent = Math.round(R.p * 100) + '%';
  }
  function toggleSkill(R) {
    const open = R.pill.getAttribute('aria-pressed') !== 'true';
    R.pill.setAttribute('aria-pressed', open);
    const from = R.p, to = open ? R.pct / 100 : 0, id = ++R.run, t0 = performance.now();
    const ms = reduce ? 0 : 700 + 1700 * Math.abs(to - from);
    const step = now => {
      if (id !== R.run) return;
      const u = ms ? Math.min(1, (now - t0) / ms) : 1;
      R.p = from + (to - from) * easeIO(u);
      drawSkill(R);
      // one unhurried step cycle every 70px, legs swinging a little less than the web spiders'
      legPose(R, R.p * R.track.clientWidth / 70, u < 1 ? 0.65 * Math.min(1, u / 0.1, (1 - u) / 0.15) : 0);
      if (u < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  skills.forEach(R => { drawSkill(R); R.pill.addEventListener('click', () => toggleSkill(R)); });

  // the projects each tool was used in, opening that project's page inside the site
  skills.forEach(R => {
    const ids = (R.el.dataset.projects || '').split(/\s+/).filter(id => INFO[id]);
    if (!ids.length) return;
    const row = document.createElement('p');
    row.className = 'sk-projects';
    ids.forEach(id => {
      const a = document.createElement('a');
      a.href = '#' + id; a.textContent = INFO[id].name;
      a.addEventListener('click', e => {
        e.preventDefault();
        returnTo = a; pendingAt = centreOf(a); pushed = true;
        location.hash = id;
      });
      row.append(a);
    });
    R.el.append(row);
  });
  addEventListener('resize', () => skills.forEach(drawSkill));

  /* ---------- Profile → Main projects: the hanging spider paddles its legs while you point at it, drops on a click ---------- */
  const nextDrop = document.querySelector('.next-drop');
  const hanger = { legs: [] };
  nextDrop.querySelector('.nd-spider').append($('skSpider').content.firstElementChild.cloneNode(true));
  hanger.legs = rigLegs(nextDrop.querySelector('.nd-spider'), { x: 130.5, y: 76 });
  let hangRaf = 0;
  function paddle(on, speed = 900) {
    cancelAnimationFrame(hangRaf);
    if (!on || reduce) { legPose(hanger, 0, 0); return; }
    const t0 = performance.now();
    const f = now => { legPose(hanger, (now - t0) / speed, 0.6); hangRaf = requestAnimationFrame(f); };
    hangRaf = requestAnimationFrame(f);
  }
  nextDrop.addEventListener('pointerenter', () => paddle(true));
  nextDrop.addEventListener('pointerleave', () => { if (!nextDrop.classList.contains('drop')) paddle(false); });
  nextDrop.addEventListener('click', () => {
    nextDrop.classList.add('drop'); paddle(true, 350);   // legs scramble as it falls
    if (!nextDrop.matches(':focus-visible')) nextDrop.blur();   // no focus ring left behind after a mouse click
    setTimeout(() => scrollToPage(2), reduce ? 0 : 420);
    setTimeout(() => { nextDrop.classList.remove('drop'); paddle(false); }, reduce ? 0 : 1600);
  });

  /* ---------- Contact: hovering a link plucks the web and the spider turns and steps toward it ---------- */
  const CONTACT = {
    mail: 'jtt0226@naver.com',
    resume: '이력서.pdf'   // the PDF in this folder
  };
  const ctSvg = document.querySelector('.ct-web svg');
  const ct = {
    g: ctSvg.querySelector('.ct-spider'), c: { x: 1112, y: 535 }, heading: -79.8,   // home and facing, in the web's units
    at: { x: 0, y: 0, r: 0 }, run: 0,
    web: { rings: [...ctSvg.querySelectorAll('.ring')], spokes: [...ctSvg.querySelectorAll('.spoke')], mark: null, cx: 1113, cy: 540.6, tw: 0, twAmp: 0 }
  };
  ct.legs = rigLegs(ct.g, { x: 130.5, y: 76 });
  function ctStep(to) {
    const from = { ...ct.at }, id = ++ct.run, t0 = performance.now(), ms = reduce ? 0 : 750;
    const dist = Math.hypot(to.x - from.x, to.y - from.y), turn = norm(to.r - from.r);
    const f = now => {
      if (id !== ct.run) return;
      const u = ms ? Math.min(1, (now - t0) / ms) : 1, e = easeIO(u);
      ct.at = { x: from.x + (to.x - from.x) * e, y: from.y + (to.y - from.y) * e, r: from.r + turn * e };
      ct.g.setAttribute('transform', `translate(${ct.at.x.toFixed(2)} ${ct.at.y.toFixed(2)}) rotate(${ct.at.r.toFixed(2)} ${ct.c.x} ${ct.c.y})`);
      legPose(ct, (dist * e + Math.abs(turn) * e) / 28, u < 1 ? 0.65 * Math.min(1, u / 0.1, (1 - u) / 0.15) : 0);
      if (u < 1) requestAnimationFrame(f);
    };
    requestAnimationFrame(f);
  }
  // a few steps (at most 90 units) toward the link, facing it
  function toward(link) {
    const r = link.getBoundingClientRect();
    const p = new DOMPoint(r.left + r.width / 2, r.top + r.height / 2).matrixTransform(ctSvg.getScreenCTM().inverse());
    const dx = p.x - ct.c.x, dy = p.y - ct.c.y, n = Math.hypot(dx, dy) || 1, go = Math.min(90, n * 0.3);
    return { x: dx / n * go, y: dy / n * go, r: norm(Math.atan2(dy, dx) * 180 / Math.PI - ct.heading) };
  }
  let toastT;
  function toast(msg) {
    const el = $('ctToast'); el.textContent = msg; el.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('show'), 2400);
  }
  async function copyText(s) {
    try { await navigator.clipboard.writeText(s); return true; }
    catch {   // older browsers, or a page opened from a file
      const ta = Object.assign(document.createElement('textarea'), { value: s });
      ta.style.cssText = 'position:fixed;opacity:0'; document.body.append(ta); ta.select();
      const ok = document.execCommand('copy'); ta.remove(); return ok;
    }
  }
  // Mail on the contact web and the address in the profile both copy it; both resume links open the PDF.
  const resume = $('ctResume');
  document.querySelectorAll('.copy-mail').forEach(el => { if (!el.textContent) el.textContent = CONTACT.mail; });
  [$('ctMail'), ...document.querySelectorAll('.copy-mail')].forEach(el => {
    el.title = `${CONTACT.mail} · 클릭하면 복사됩니다`;
    el.setAttribute('aria-label', `메일 주소 복사 (${CONTACT.mail})`);
    el.addEventListener('click', async () => {
      toast(await copyText(CONTACT.mail) ? `메일 주소를 복사했습니다 · ${CONTACT.mail}` : CONTACT.mail);
    });
  });
  [resume, ...document.querySelectorAll('.resume-link')].forEach(el => {
    if (CONTACT.resume) Object.assign(el, { href: CONTACT.resume, target: '_blank', rel: 'noopener' });
    el.addEventListener('click', e => { if (!CONTACT.resume) { e.preventDefault(); toast('자기소개서는 준비 중입니다'); } });
  });
  document.querySelectorAll('.ct-link').forEach(el => {
    const near = () => { twang(ct.web, 0.35); ctStep(toward(el)); }, home = () => ctStep({ x: 0, y: 0, r: 0 });
    el.addEventListener('pointerenter', near); el.addEventListener('focus', near);
    el.addEventListener('pointerleave', home); el.addEventListener('blur', home);
    el.addEventListener('click', () => twang(ct.web, 1));
  });

  let rt;
  addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { measure(); if (started) { plan(); if (onpage) { cur = { ...B }; apply(cur); } } }, 120); });

  /* ---------- First visit: blank screen, then the spider walks up in bursts ---------- */
  const DELAY = 0.4;
  const ENTRY_AMP = 1.5;   // legs move a bit wider on the way in than while scrolling
  const PLAN = [
    { t0: 0.00, t1: 1.35, f0: 0.00, f1: 0.46 },
    { t0: 1.70, t1: 2.80, f0: 0.46, f1: 0.82 },
    { t0: 3.10, t1: 3.95, f0: 0.82, f1: 1.00 }
  ];
  const END = 3.95;
  function travel(t) {
    let f = 0;
    for (const b of PLAN) {
      if (t >= b.t1) f = b.f1;
      else if (t > b.t0) { f = b.f0 + (b.f1 - b.f0) * easeIO((t - b.t0) / (b.t1 - b.t0)); break; }
      else break;
    }
    return f;
  }
  function begin() {
    // unlock first: the scrollbar coming back changes the width the menu spot is measured against
    document.documentElement.classList.remove('locked');
    started = true; plan();
    shown = target(); intro.classList.add('ready');
    requestAnimationFrame(loop);
  }
  /* Right after the typing, scroll down to the profile for the visitor: the tow-away plays exactly as if they
     had scrolled. Only on arrival; scrolling back up later is theirs. Any wheel, touch or key hands it back at once. */
  function autoTour() {
    if (reduce) return;
    intro.classList.add('auto');   // no "SCROLL" hint while it plays
    const from = scrollY, to = pages[1].getBoundingClientRect().top + scrollY;   // profile at the top of the screen
    const t0 = performance.now() + 500, ms = 3000;
    const evs = ['wheel', 'touchstart', 'keydown', 'mousedown'];
    let done = false;
    const finish = () => { if (done) return; done = true; evs.forEach(e => removeEventListener(e, finish)); intro.classList.remove('auto'); };
    evs.forEach(e => addEventListener(e, finish, { passive: true }));
    const f = now => {
      if (done) return;
      const u = Math.max(0, Math.min(1, (now - t0) / ms));
      scrollTo(0, from + (to - from) * easeIO(u));
      if (u < 1) requestAnimationFrame(f); else finish();
    };
    requestAnimationFrame(f);
  }
  async function enter() {
    // every arrival, reload included, starts from the top so the intro always plays
    scrollTo(0, 0);
    measure();
    walker.style.visibility = 'visible';
    document.documentElement.classList.add('locked');
    const home = introPose();
    if (reduce) { cur = home; apply(cur); pose(0, 0); await typeIn(); return begin(); }
    const ux = Math.cos(HEAD * Math.PI / 180), uy = Math.sin(HEAD * Math.PI / 180);
    const D = (innerHeight - (home.y - TOP_IN_ART * k)) / -uy + 60;
    cur = { ...home, x: home.x - ux * D, y: home.y - uy * D }; apply(cur); pose(0, ENTRY_AMP);
    const t = ++token;
    await tween((DELAY + END) * 1000, e => {
      const tt = e * (DELAY + END) - DELAY;
      if (tt < 0) return;
      const d = D * travel(tt);
      ph = d / (STRIDE * k);
      cur = { ...home, x: home.x - ux * (D - d), y: home.y - uy * (D - d) };
      pose(ph, ENTRY_AMP); apply(cur);
    }, t, x => x);
    await settle(t);
    await typeIn();
    begin();
    autoTour();
  }
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';   // a reload must not jump back down the page
  syncHash();   // arriving on a project link opens that project
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(enter);
})();
