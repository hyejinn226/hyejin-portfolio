/* =========================================================
   임시 3D 모델 (직접 만든 .glb가 생기기 전까지 쓰는 자리 표시용)
   ========================================================= */
import * as THREE from 'three';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const mat = (color, extra = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.7, flatShading: true, ...extra });
const mesh = (geo, material, [x, y, z] = [0, 0, 0]) => {
  const m = new THREE.Mesh(geo, material);
  m.position.set(x, y, z);
  return m;
};

/* 모델을 size 크기 상자에 맞추고, 바닥(y=0) 가운데에 세웁니다. 반환값: 맞춘 뒤의 높이 */
export function fitToSize(obj, size) {
  obj.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(obj);
  const s = box.getSize(new THREE.Vector3());
  obj.scale.multiplyScalar(size / Math.max(s.x, s.y, s.z, 1e-6));
  obj.updateMatrixWorld(true);
  box.setFromObject(obj);
  const c = box.getCenter(new THREE.Vector3());
  obj.position.x -= c.x;
  obj.position.z -= c.z;
  obj.position.y -= box.min.y;
  return box.getSize(new THREE.Vector3()).y;
}

export function buildPlaceholder(kind, accent, variant = 0) {
  if (kind === 'cat') return cat(accent);
  if (kind === 'headset') return headset(accent);
  if (kind === 'blocks') return blocks(accent);
  return specimen(accent, variant);
}

/* 해양오염 게임: 스카프를 두른 고양이 */
function cat(accent) {
  const g = new THREE.Group();
  const fur = mat('#f0a35e');
  const cream = mat('#fbe9d2');
  const dark = mat('#2a1d14');
  const scarf = mat(accent);

  const body = mesh(new THREE.IcosahedronGeometry(0.55, 1), fur, [0, 0.62, 0]);
  body.scale.set(1, 1.15, 0.9);
  const belly = mesh(new THREE.IcosahedronGeometry(0.36, 1), cream, [0, 0.62, 0.32]);
  belly.scale.set(1, 1.2, 0.6);
  const head = mesh(new THREE.IcosahedronGeometry(0.42, 1), fur, [0, 1.38, 0.08]);
  const muzzle = mesh(new THREE.SphereGeometry(0.16, 8, 6), cream, [0, 1.28, 0.42]);
  muzzle.scale.set(1.25, 0.8, 0.8);
  const nose = mesh(new THREE.SphereGeometry(0.035, 6, 4), mat('#d9727a'), [0, 1.33, 0.54]);
  g.add(body, belly, head, muzzle, nose);

  for (const sx of [-1, 1]) {
    const ear = mesh(new THREE.ConeGeometry(0.14, 0.3, 4), fur, [0.22 * sx, 1.76, 0.05]);
    ear.rotation.z = -0.3 * sx;
    const eye = mesh(new THREE.SphereGeometry(0.05, 8, 6), dark, [0.15 * sx, 1.46, 0.45]);
    const leg = mesh(new THREE.CylinderGeometry(0.09, 0.11, 0.62, 6), fur, [0.2 * sx, 0.31, 0.3]);
    const paw = mesh(new THREE.SphereGeometry(0.11, 6, 4), cream, [0.2 * sx, 0.04, 0.36]);
    paw.scale.y = 0.6;
    g.add(ear, eye, leg, paw);
  }

  const tailPath = new THREE.CatmullRomCurve3([V(0, 0.15, -0.42), V(0.38, 0.12, -0.62), V(0.62, 0.38, -0.42), V(0.6, 0.72, -0.2)]);
  g.add(new THREE.Mesh(new THREE.TubeGeometry(tailPath, 20, 0.07, 6), fur));

  const ring = mesh(new THREE.TorusGeometry(0.3, 0.06, 6, 16), scarf, [0, 1.05, 0.05]);
  ring.rotation.x = Math.PI / 2;
  const knot = mesh(new THREE.ConeGeometry(0.12, 0.22, 3), scarf, [0.12, 0.92, 0.32]);
  knot.rotation.set(0.3, 0, Math.PI);
  g.add(ring, knot);
  return g;
}

/* VR 게임: 헤드셋 */
function headset(accent) {
  const g = new THREE.Group();
  const shell = mat('#2b303b');
  const glow = mat(accent, { emissive: accent, emissiveIntensity: 0.35 });
  const pad = mat('#d9dde3');

  g.add(mesh(new THREE.BoxGeometry(1.6, 0.9, 0.85), shell, [0, 0.45, 0]));
  g.add(mesh(new THREE.BoxGeometry(1.5, 0.8, 0.06), glow, [0, 0.45, 0.45]));
  g.add(mesh(new THREE.BoxGeometry(1.45, 0.72, 0.22), pad, [0, 0.45, -0.52]));

  const back = mesh(new THREE.TorusGeometry(0.82, 0.06, 6, 24, Math.PI), shell, [0, 0.45, -0.55]);
  back.rotation.x = -Math.PI / 2;
  const top = mesh(new THREE.TorusGeometry(0.6, 0.05, 6, 16, Math.PI), shell, [0, 0.9, -0.9]);
  top.rotation.y = Math.PI / 2;
  g.add(back, top);
  return g;
}

/* 건축 모형 느낌의 블록 */
function blocks(accent) {
  const g = new THREE.Group();
  const white = mat('#f3f4f6');
  const tint = mat(accent);
  g.add(mesh(new THREE.BoxGeometry(2, 0.12, 1.4), white, [0, 0.06, 0]));
  g.add(mesh(new THREE.BoxGeometry(0.6, 1.4, 0.6), white, [-0.55, 0.82, -0.2]));
  g.add(mesh(new THREE.BoxGeometry(0.9, 0.7, 0.8), white, [0.35, 0.47, 0.1]));
  g.add(mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), tint, [0.35, 1.07, 0.1]));
  return g;
}

/* 방 C 받침대 위에 올리는 추상 오브젝트 */
function specimen(accent, variant) {
  const g = new THREE.Group();
  const tint = mat(accent);
  const white = mat('#f3f4f6');
  switch (variant % 4) {
    case 0:
      g.add(mesh(new THREE.IcosahedronGeometry(0.7, 0), tint, [0, 0.7, 0]));
      break;
    case 1:
      g.add(mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.6, 12), white, [0, 0.3, 0]));
      g.add(mesh(new THREE.ConeGeometry(0.5, 0.9, 12), tint, [0, 1.05, 0]));
      break;
    case 2: {
      const t = mesh(new THREE.TorusGeometry(0.55, 0.2, 8, 20), tint, [0, 0.75, 0]);
      t.rotation.y = Math.PI / 4;
      g.add(t);
      break;
    }
    default:
      g.add(mesh(new THREE.OctahedronGeometry(0.7, 0), tint, [0, 0.7, 0]));
  }
  return g;
}
