/* =========================================================
   포트폴리오 내용은 이 파일에서만 고치면 됨
   ========================================================= */

export const profile = {
  logo: 'Hyejin',
  name: '정혜진',
  nameEn: 'Jung Hyejin',
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
               type  → 'vr' | 'ocean' | 'route' | 'strata' | 'stars' | 'horizon'
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
    model: 'assets/glb/bus1.glb',
    placeholderModel: 'headset',
    video: { type: 'file', src: 'assets/mp4/하나둘셋_발표자료.mp4' },
    summary: '3인 팀으로 만든 VR 게임. 3D 모델링, 그래픽 디자인, 소개 영상을 맡았습니다.',
    overview: '잘타요VR은 어린이가 실제 버스를 타기 전, 안전한 가상환경에서 승차부터 환승까지 단계별로 연습하는 행동 기반 대중교통 교육 플랫폼입니다.',
    // problem.points 와 solution.points 는 같은 순서로 짝을 맞춰 적습니다 (01 ↔ 01)
    problem: {
      lead: 'Blender → Unity → VR로 옮기며 세 가지 문제가 생겼습니다.',
      points: [
        '블렌더에서 작업 후 유니티로 옮기는 과정에서 모델링에 적용한 색상이 사라졌습니다.',
        'VR 화면에서 안내 메시지 UI가 거울처럼 180도 뒤집혀 보였습니다.',
        'VR 컨트롤러로 UI를 눌러도 클릭/이벤트 반응이 없었습니다.',
      ],
    },
    solution: {
      lead: '문제마다 원인을 찾아 하나씩 해결했습니다.',
      points: [
        '유니티에서 적용될 수 있도록 Export 설정을 변경하고, 유니티에서 다시 확인하며 적용되지 않은 부분은 직접 다시 적용했습니다.',
        '스크립트에서 카메라를 바라보는 방향을 계산한 뒤 Y축 회전을 180도 보정해 정면을 보도록 수정했습니다.',
        'Canvas의 Scale을 VR 표준인 0.001 수준으로 맞추고 Pos Z 위치를 미세 조율해 물리 충돌 간섭을 해결했습니다.',
      ],
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
    model: null,              // 3D 모델을 쓰지 않은 프로젝트 → 3D 영역 숨김
    placeholderModel: null,
    video: { type: 'none', src: '' },
    // 캐릭터 시트 · 게임 일러스트 (png를 assets/img/nyang/ 에 넣고 src에 경로)
    // wide: true 면 가로로 두 칸을 차지합니다 (캐릭터 시트처럼 넓은 이미지)
    galleryTitle: 'Character<br>&amp; Illustration',
    gallery: [
      { src: 'assets/nyang/Artboard 1@2x.png', caption: '캐릭터 시트', wide: true },
      { src: 'assets/nyang/catP.png', caption: '플레이어 고양이' },
      { src: 'assets/nyang/npc2.png', caption: 'NPC 고양이' },
      { src: 'assets/nyang/background2.png', caption: '게임 배경 일러스트' },
    ],
    summary: '고양이 주인공과 함께 바다 쓰레기 문제를 풀어 가는 해양오염 시리어스 게임. 기획부터 디자인, 개발까지 혼자 만들었습니다.',
    overview: '항구마을의 주민이 되어 마을의 어업 문제를 해결하며 해양오염의 심각성을 깨닫게 하는 게임입니다.',
    problem: {
      lead: '트러블',
      points: ['해양오염이라는 주제에 맞지 않게 지나치게 밝은 분위기의 게임으로 제작되어 해결 방법을 찾아야했습니다.'],
    },
    solution: {
      lead: '해결과정',
      points: ['플레이어가 게임을 진행에 따라 분위기가 점차 어두워지도록 배경, 색감, 사운드를 변경하여 해결하였습니다.'],
    },
    links: [],
  },
  {
    id: 'shim',
    tier: 'sub',
    title: '쉼',
    category: 'VR Film · V-log',
    year: '2025',
    period: '5일',
    team: '5인',
    role: ['편집'],
    tools: ['insta360', 'Premiere Pro'],
    theme: { bg: '#e6f0f3', ink: '#123241', accent: '#2c7da0' },
    intro: { type: 'horizon', video: '' },
    thumb: '',
    model: null,
    placeholderModel: null,
    // 유튜브 주소를 통째로 붙여 넣어도 됩니다 (예: 'https://youtu.be/xxxxxxxxxxx')
    video: { type: 'youtube', src: '' },
    summary: '고군산군도를 홍보하는 V-log 형식의 VR 영상.',
    overview: '20~30대 여성, 남성을 타겟으로 쉼, 아름다운 관광지들을 시청자가 편안하고, 가까이 느끼게 하는 것을 목표로 제작하였습니다. 360도 카메라의 장점을 이용하여 섬에 있는 아름답고, 넓은 전경을 사람들이 모두 볼 수 있도록 촬영하여 섬을 홍보합니다.',
    problem: { lead: '트러블', points: ['편집 과정 중 촬영본이 부족한 상황과 편집 중 나레이션 오디오의 볼륨 편차가 발생하는 문제상황이 있었습니다.'] },     // 비워 두면 Problem & Solution 칸이 나오지 ,않습니다
    solution: { lead: '해결과정', points: ['추가 촬영을 빠르게 마치며 편집에 무리가 없도록 진행하였고, 각 클립의 db 수치를 조절하여 나레이션에서 튀는 부분이 없도록 조정하여 해결하였습니다.'] },
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
    id: 'your-gaze',
    tier: 'sub',
    title: '너의 시선',
    category: 'VR Essay Film',
    year: '2025',
    period: '3개월',
    team: '5인',
    role: ['촬영 및 편집'],
    tools: ['insta360', 'Premiere Pro'],
    theme: { bg: '#f2ebe3', ink: '#2e2420', accent: '#b8674a' },
    intro: { type: 'route', video: '' },
    thumb: '',
    model: null,
    placeholderModel: null,
    video: { type: 'youtube', src: 'https://youtu.be/tve7BX_bh9o' },
    summary: '딸의 스케치를 따라가는 엄마를 그린 로드무비.',
    overview: '딸을 잃은 엄마가 딸의 흔적을 좆아가는 로드무비 형식 영상으로, 대한민국의 공통된 사회적 상실의 기억을 간접적으로 형상화해, 멀지 않은 아픔을이 우리 일상에 자연스럽게 스며들어 있음을 상기하도록 합니다.',
    problem: { lead: '[문제]', points: [] },
    solution: { lead: '[해결]', points: [] },
    links: [],
  },
];
