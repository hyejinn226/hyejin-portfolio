/* =========================================================
   포트폴리오 내용은 이 파일에서만 고치면 됨
   ========================================================= */

export const profile = {
  logo: 'Hyejin',
  name: '정혜진',
  nameEn: '[YOUR NAME]',
  role: 'Interaction Designer & Developer',
  // 첫 화면 문장: soft: true 인 줄은 흐리게 표시
  heroLines: [
    { text: 'Design the Space,' },
    { text: 'Complete It with', soft: true },
    { text: 'Interaction' },
  ],
  heroDesc: '3D, 인터랙션, 모션 그리고 웹. 직접 만든 공간과 움직임을 하나의 경험으로 연결합니다.',
  bio: '3D 모델링과 모션, 웹 개발을 오가며 사람이 직접 움직이고 반응하는 경험을 만듭니다. 화면을 하나의 공간으로 보고, 그 안에서 일어나는 인터랙션을 설계합니다.',
  photo: '',                                   // 예: 'assets/images/profile.jpg'
  facts: [
    ['학교', '계원예술대학교 디지털미디어디자인학과'],
    ['관심', '3D · Motion · Interactive Web'],
    ['위치', ''],
  ],
  email: 'jtt0226@gmail.com',
  github: 'https://github.com/hyejinn226',
  resume: 'assets/자기소개서.pdf',
};

export const skills = [
  { name: 'Illustrator', pct: 80 },
  { name: 'Figma', pct: 70 },
  { name: 'After Effects', pct: 70 },
  { name: 'JavaScript · CSS · HTML · React', pct: 70 },
  { name: 'Photoshop', pct: 65 },
  { name: 'Unity', pct: 65 },
  { name: 'Premiere Pro', pct: 60 },
  { name: 'Blender', pct: 50 },
];

/* ---------------------------------------------------------
   프로젝트 항목
   tier      : 'main' | 'sub'
   theme     : 프로젝트 소개 화면 색  { bg, ink, accent }
   intro     : 프로젝트에 들어갈 때 나오는 인트로 모션
               type  → 'vr' | 'ocean' | 'route' | 'strata' | 'stars'
               video → 직접 만든 모션그래픽 mp4 경로를 넣으면 그 영상이 대신 재생됩니다
   model     : 프로젝트에 쓴 3D 에셋 .glb 경로 (없으면 placeholderModel)
   placeholderModel : 'headset' | 'cat' | 'blocks' | null(3D 영역 숨김)
   video     : { type: 'file', src } | { type: 'youtube', src: '영상ID' } | { type: 'none' }
   --------------------------------------------------------- */

export const projects = [
  {
    id: 'vr-game',
    tier: 'main',
    title: '잘타요VR',
    category: 'VR Game',
    year: '2025',
    period: '20XX.XX – 20XX.XX',
    team: '3인 팀',
    role: ['3D 모델링', '그래픽 · UI 디자인', '소개 영상'],
    tools: ['Blender', 'Unity', 'Photoshop', 'Illustrator', 'After Effects', 'Premiere Pro'],
    theme: { bg: '#0f0c1d', ink: '#f2efff', accent: '#8f7cff' },
    intro: { type: 'vr', video: '' },
    thumb: '',
    model: null,
    placeholderModel: 'headset',
    video: { type: 'none', src: '' },
    summary: '3인 팀으로 만든 VR 게임. 3D 모델링, 그래픽 디자인, 소개 영상을 맡았습니다.',
    overview: '게임을 소개',
    problem: {
      lead: '트러블슈팅',
      points: [''],
    },
    solution: {
      lead: '해결과정',
      points: [''],
    },
    links: [],
  },
  {
    id: 'ocean-game',
    tier: 'main',
    title: '냥냥 항구마을',
    category: 'Web Serious Game',
    year: '2026',
    period: '2026.XX – 2026.XX',
    team: '1인 프로젝트',
    role: ['기획', '캐릭터 · 그래픽 디자인', '프론트엔드 개발'],
    tools: ['JavaScript', 'HTML · CSS', 'Illustrator'],
    theme: { bg: '#e3f4f2', ink: '#0b3b40', accent: '#0f9aa0' },
    intro: { type: 'ocean', video: '' },
    thumb: '',
    model: null,
    placeholderModel: 'cat',
    video: { type: 'none', src: '' },
    summary: '고양이 주인공과 함께 바다 쓰레기 문제를 풀어 가는 해양오염 시리어스 게임. 기획부터 디자인, 개발까지 혼자 만들었습니다.',
    overview: '게임 소개',
    problem: {
      lead: '트러블',
      points: [''],
    },
    solution: {
      lead: '해결과정',
      points: [''],
    },
    links: [],
  },
  {
    id: '',
    tier: 'sub',
    title: '',
    category: 'Interactive Web',
    year: '2025',
    period: '2025',
    team: '[인원]',
    role: ['Interaction', 'Design', 'Web'],
    tools: ['Figma', 'JavaScript'],
    theme: { bg: '#fff0e6', ink: '#3a1606', accent: '#ff5b1f' },
    intro: { type: 'route', video: '' },
    thumb: '',
    model: null,
    placeholderModel: null,
    video: { type: 'none', src: '' },
    summary: '',
    overview: '',
    problem: { lead: '[문제]', points: [] },
    solution: { lead: '[해결]', points: [] },
    links: [],
  },
  {
    id: 'phosphate',
    tier: 'sub',
    title: 'PHOSPHATE',
    category: 'Web · Visual',
    year: '2026',
    period: '2026',
    team: '개인 프로젝트',
    role: ['Web Design', 'Interaction', 'Visual'],
    tools: ['Figma', 'Photoshop', 'Web'],
    theme: { bg: '#1d1712', ink: '#f3e7d3', accent: '#d8a55a' },
    intro: { type: 'strata', video: '' },
    thumb: '',
    model: null,
    placeholderModel: null,
    video: { type: 'none', src: '' },
    summary: '모로코의 인산염을 하나의 시각적 이야기로 풀어낸 웹 프로젝트.',
    overview: '모로코의 인산염이라는 산업적 소재를 단순한 정보 전달에서 벗어나 지층, 사막, 광물과 같은 시각적 언어로 연결해 보여 주는 웹사이트를 설계했습니다.',
    problem: { lead: '[문제]', points: [] },
    solution: { lead: '[해결]', points: [] },
    links: [],
  },
  {
    id: '',
    tier: 'sub',
    title: '',
    category: 'Interactive Media',
    year: '2025',
    period: '2025',
    team: '3인',
    role: ['Concept', 'Unity', 'Interaction'],
    tools: ['Unity', 'Kinect'],
    theme: { bg: '#080b1f', ink: '#eef0ff', accent: '#ffd84d' },
    intro: { type: 'stars', video: '' },
    thumb: '',
    model: null,
    placeholderModel: null,
    video: { type: 'none', src: '' },
    summary: '',
    overview: '',
    problem: { lead: '[문제]', points: [] },
    solution: { lead: '[해결]', points: [] },
    links: [],
  },
];
