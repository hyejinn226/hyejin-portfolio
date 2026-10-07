/* =========================================================
   프로젝트별 모티프 그래픽
   메인 카드, 서브 미리보기, 인트로 모션이 모두 같은 그래픽을 씁니다.
   색은 부모 요소의 --bg / --ink / --accent 를 따라갑니다.
   ========================================================= */

let seed = 7;
const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

function wavePath(base, amp, period, width = 800) {
  let d = `M0 ${base}`;
  for (let x = 0; x <= width; x += 10) d += ` L${x} ${(base + Math.sin((x / period) * Math.PI * 2) * amp).toFixed(1)}`;
  return `${d} L${width} 320 L0 320 Z`;
}

const ROUTE = 'M-20 230 C 60 230, 80 120, 160 130 S 250 220, 310 150 S 380 60, 430 70';

const STARS = (() => {
  seed = 11;
  const dots = Array.from({ length: 70 }, () => [rnd() * 400, rnd() * 300, 0.6 + rnd() * 1.6, rnd() * 3]);
  return dots;
})();
const CONSTELLATION = [[70, 210], [120, 150], [175, 165], [215, 105], [270, 120], [300, 70], [345, 95]];

const STRATA = (() => {
  seed = 23;
  return Array.from({ length: 7 }, (_, i) => ({
    d: wavePath(40 + i * 40, 4 + rnd() * 8, 160 + rnd() * 160),
    mix: [88, 70, 55, 78, 40, 62, 30][i],
    dur: 14 + rnd() * 10,
  }));
})();

export function motifHTML(type) {
  switch (type) {
    case 'vr':
      return `<div class="motif m-vr"><i class="m-vr-floor"></i><i class="m-vr-glow"></i><span class="m-vr-lenses"><i></i><i></i></span></div>`;

    case 'ocean':
      return `<div class="motif m-ocean">
        <div class="m-cat"><i class="ear l"></i><i class="ear r"></i><i class="face"></i></div>
        <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <g class="m-wave w1"><path d="${wavePath(170, 10, 200)}"/></g>
          <g class="m-wave w2"><path d="${wavePath(190, 12, 200)}"/></g>
          <g class="m-wave w3"><path d="${wavePath(215, 8, 200)}"/></g>
        </svg>
        <i class="m-bubble"></i><i class="m-bubble"></i><i class="m-bubble"></i><i class="m-bubble"></i>
      </div>`;

    case 'route':
      return `<div class="motif m-route">
        <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <path class="m-route-ghost" d="${ROUTE}"/>
          <path class="m-route-line" d="${ROUTE}" pathLength="1"/>
          <circle class="m-route-stop" cx="160" cy="130" r="6"/>
          <circle class="m-route-stop" cx="310" cy="150" r="6"/>
          <circle class="m-route-dot" r="9"><animateMotion dur="3.2s" repeatCount="indefinite" path="${ROUTE}"/></circle>
        </svg>
      </div>`;

    case 'strata':
      return `<div class="motif m-strata">
        <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          ${STRATA.map((s, i) => `<g class="m-layer" style="--mix:${s.mix}%;--dur:${s.dur.toFixed(1)}s;--i:${i}"><path d="${s.d}"/></g>`).join('')}
        </svg>
      </div>`;

    case 'stars':
      return `<div class="motif m-stars">
        <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          ${STARS.map(([x, y, r, d]) => `<circle class="m-star" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(2)}" style="--d:${d.toFixed(2)}s"/>`).join('')}
          <polyline class="m-const" points="${CONSTELLATION.map((p) => p.join(',')).join(' ')}" pathLength="1"/>
          ${CONSTELLATION.map(([x, y], i) => `<circle class="m-const-dot" cx="${x}" cy="${y}" r="3.2" style="--i:${i}"/>`).join('')}
        </svg>
      </div>`;

    default:
      return `<div class="motif"></div>`;
  }
}

/* 프로젝트 테마 색을 요소에 입힙니다 */
export function applyTheme(el, theme) {
  el.style.setProperty('--bg', theme.bg);
  el.style.setProperty('--ink', theme.ink);
  el.style.setProperty('--accent', theme.accent);
}
