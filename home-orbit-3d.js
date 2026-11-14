import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.168.0/build/three.module.js';

const orbit = document.querySelector('.hero-orbit');
const visual = orbit?.querySelector('.hero-orbit__visual');
const links = [...(orbit?.querySelectorAll('.hero-orbit__item') || [])];
if (!orbit || !visual || links.length !== 5) throw new Error('Homepage wheel markup is incomplete.');

const renderer = new THREE.WebGLRenderer({ alpha:true, antialias:true, powerPreference:'high-performance', premultipliedAlpha:false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setClearColor(0x000000, 0);
renderer.domElement.className = 'hero-orbit__3d-wheel';
renderer.domElement.setAttribute('aria-hidden', 'true');
visual.prepend(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
const lookTarget = new THREE.Vector3(0, .7, 0);
const root = new THREE.Group();
scene.add(root);

scene.add(new THREE.AmbientLight(0xffffff, .62));
scene.add(new THREE.HemisphereLight(0xf8fbff, 0x65535b, 1.15));
const keyLight = new THREE.DirectionalLight(0xffffff, 3.1);
keyLight.position.set(-7, 11, 8);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(1024, 1024);
keyLight.shadow.camera.left = -8;
keyLight.shadow.camera.right = 8;
keyLight.shadow.camera.top = 8;
keyLight.shadow.camera.bottom = -8;
keyLight.shadow.camera.near = 1;
keyLight.shadow.camera.far = 36;
keyLight.shadow.bias = -.00025;
keyLight.shadow.normalBias = .035;
keyLight.shadow.radius = 4;
scene.add(keyLight);
const fillLight = new THREE.DirectionalLight(0xc7dbe7, 1.0);
fillLight.position.set(7, 5, 6);
scene.add(fillLight);

const base = new THREE.Group();
root.add(base);
const wheelSideMaterial = new THREE.MeshPhysicalMaterial({ color:0x897d80, roughness:.55, metalness:.15, clearcoat:.2 });
const wheelTopMaterial = new THREE.MeshPhysicalMaterial({ color:0xe7dbd6, roughness:.62, metalness:.06, clearcoat:.22, clearcoatRoughness:.5 });
const wheelBottomMaterial = new THREE.MeshStandardMaterial({ color:0x81777a, roughness:.72, metalness:.1 });
const cylinder = new THREE.Mesh(
  new THREE.CylinderGeometry(6.2, 6.2, .72, 160, 1, false),
  [wheelSideMaterial, wheelTopMaterial, wheelBottomMaterial]
);
cylinder.position.y = -.155;
cylinder.castShadow = true;
cylinder.receiveShadow = true;
base.add(cylinder);

const topFace = new THREE.Mesh(
  new THREE.CircleGeometry(6.16, 160),
  new THREE.MeshPhysicalMaterial({ color:0xe7dbd6, roughness:.67, metalness:.035, clearcoat:.18 })
);
topFace.rotation.x = -Math.PI / 2;
topFace.position.y = .205;
topFace.receiveShadow = true;
base.add(topFace);

function makeGridTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  const ink = new THREE.Color(getComputedStyle(document.documentElement).getPropertyValue('--ink').trim() || '#302326');
  const line = `#${ink.getHexString()}`;
  ctx.strokeStyle = line;
  ctx.globalAlpha = .2;
  ctx.lineWidth = 1;
  for (let n = 0; n <= 1024; n += 24) {
    ctx.beginPath(); ctx.moveTo(n + .5, 0); ctx.lineTo(n + .5, 1024); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, n + .5); ctx.lineTo(1024, n + .5); ctx.stroke();
  }
  ctx.globalAlpha = .3;
  ctx.lineWidth = 1.2;
  for (let x = 24; x < 1024; x += 96) for (let y = 24; y < 1024; y += 96) {
    ctx.beginPath(); ctx.moveTo(x - 6, y); ctx.lineTo(x + 6, y); ctx.moveTo(x, y - 6); ctx.lineTo(x, y + 6); ctx.stroke();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);
  return texture;
}
const grid = new THREE.Mesh(
  new THREE.CircleGeometry(6.145, 160),
  new THREE.MeshBasicMaterial({ map:makeGridTexture(), transparent:true, opacity:.48, depthWrite:false, side:THREE.DoubleSide, toneMapped:false })
);
grid.rotation.x = -Math.PI / 2;
grid.position.y = .213;
base.add(grid);

const outerRim = new THREE.Mesh(
  new THREE.RingGeometry(6.13, 6.2, 160),
  new THREE.MeshStandardMaterial({ color:0xf8f4f2, roughness:.26, metalness:.3, side:THREE.DoubleSide, emissive:0x48353a, emissiveIntensity:.12 })
);
outerRim.rotation.x = -Math.PI / 2;
outerRim.position.y = .216;
base.add(outerRim);
const accentColor = new THREE.Color(getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#a45f63');
const innerRim = new THREE.Mesh(
  new THREE.TorusGeometry(5.78, .018, 6, 160),
  new THREE.MeshStandardMaterial({ color:accentColor, roughness:.42, metalness:.18, emissive:accentColor, emissiveIntensity:.18 })
);
innerRim.rotation.x = Math.PI / 2;
innerRim.position.y = .225;
base.add(innerRim);

function makeNeonBand(innerRadius, outerRadius) {
  const geometry = new THREE.RingGeometry(innerRadius, outerRadius, 256);
  const positions = geometry.getAttribute('position');
  const colors = new Float32Array(positions.count * 3);
  const color = new THREE.Color();
  for (let i = 0; i < positions.count; i += 1) {
    const hue = (Math.atan2(positions.getY(i), positions.getX(i)) / (Math.PI * 2) + 1) % 1;
    color.setHSL(hue, .98, .56);
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
  }
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  return geometry;
}
const neonRingGlow = new THREE.Mesh(
  makeNeonBand(5.96, 6.2),
  new THREE.MeshBasicMaterial({ vertexColors:true, transparent:true, opacity:.42, blending:THREE.AdditiveBlending, depthWrite:false, toneMapped:false, side:THREE.DoubleSide })
);
neonRingGlow.rotation.x = -Math.PI / 2;
neonRingGlow.position.y = .247;
base.add(neonRingGlow);
const neonRingCore = new THREE.Mesh(
  makeNeonBand(6.09, 6.18),
  new THREE.MeshBasicMaterial({ vertexColors:true, toneMapped:false, side:THREE.DoubleSide })
);
neonRingCore.rotation.x = -Math.PI / 2;
neonRingCore.position.y = .256;
base.add(neonRingCore);

function makeGroundShadowTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(128, 128, 4, 128, 128, 128);
  gradient.addColorStop(0, 'rgba(33,24,29,.34)');
  gradient.addColorStop(1, 'rgba(33,24,29,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(canvas);
}
const groundShadow = new THREE.Mesh(
  new THREE.PlaneGeometry(15, 15),
  new THREE.MeshBasicMaterial({ map:makeGroundShadowTexture(), transparent:true, depthWrite:false, opacity:.5, toneMapped:false })
);
groundShadow.rotation.x = -Math.PI / 2;
groundShadow.position.y = -.53;
base.add(groundShadow);

function syncTheme() {
  const dark = document.documentElement.dataset.theme === 'dark';
  const ink = new THREE.Color(getComputedStyle(document.documentElement).getPropertyValue('--ink').trim());
  const platformTop = new THREE.Color(dark ? '#4a373f' : '#e7dbd6');
  wheelTopMaterial.color.copy(platformTop);
  topFace.material.color.copy(platformTop);
  wheelSideMaterial.color.copy(platformTop).multiplyScalar(dark ? .66 : .7);
  wheelBottomMaterial.color.copy(ink).multiplyScalar(dark ? .38 : .7);
  const gridTexture = grid.material.map;
  grid.material.map = makeGridTexture();
  grid.material.needsUpdate = true;
  gridTexture?.dispose();
  const accent = new THREE.Color(getComputedStyle(document.documentElement).getPropertyValue('--accent').trim());
  innerRim.material.color.copy(accent);
  innerRim.material.emissive.copy(accent);
  renderer.render(scene, camera);
}
const themeObserver = new MutationObserver(syncTheme);
themeObserver.observe(document.documentElement, { attributes:true, attributeFilter:['data-theme'] });

const homeRadius = 4.95;
const mascotHeight = 2.72;
const mascotWidth = 2.72;
function makeMascotShadowTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(128, 128, 4, 128, 128, 128);
  gradient.addColorStop(0, 'rgba(25,16,21,.78)');
  gradient.addColorStop(.42, 'rgba(25,16,21,.42)');
  gradient.addColorStop(1, 'rgba(30,20,25,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(canvas);
}
const mascotShadowTexture = makeMascotShadowTexture();
const mascotGroups = links.map((link, index) => {
  const homeAngle = index * Math.PI * 2 / links.length;
  const group = new THREE.Group();
  group.position.set(Math.sin(homeAngle) * homeRadius, .205, Math.cos(homeAngle) * homeRadius);
  root.add(group);
  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(4.0, 2.5),
    new THREE.MeshBasicMaterial({ map:mascotShadowTexture, transparent:true, depthWrite:false, opacity:.4, toneMapped:false })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.set(-Math.sin(homeAngle) * .32, .018, -Math.cos(homeAngle) * .32);
  group.add(shadow);
  return { group, shadow, link };
});

function resize() {
  const width = Math.max(1, visual.clientWidth);
  const height = Math.max(1, visual.clientHeight);
  const mobile = matchMedia('(max-width:720px)').matches;
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.fov = 42;
  const focalPixels = height / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));
  const targetDiameter = mobile ? width * 1.1 : Math.min(width * .75, 880);
  const distance = 12.4 * focalPixels / Math.max(1, targetDiameter);
  const elevation = THREE.MathUtils.degToRad(18);
  camera.position.set(0, lookTarget.y + Math.sin(elevation) * distance, Math.cos(elevation) * distance);
  camera.lookAt(lookTarget);
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld(true);
  keyLight.shadow.mapSize.set(mobile ? 768 : 1024, mobile ? 768 : 1024);
  keyLight.shadow.camera.updateProjectionMatrix();
  renderWheel(0);
}

function project(vector, width, height) {
  const point = vector.clone().project(camera);
  return { x:(point.x * .5 + .5) * width, y:(-.5 * point.y + .5) * height };
}

function renderWheel(angle) {
  const width = Math.max(1, visual.clientWidth);
  const height = Math.max(1, visual.clientHeight);
  root.rotation.y = angle;
  root.updateMatrixWorld(true);
  camera.updateMatrixWorld(true);
  const cameraRight = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
  const cameraUp = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion);
  mascotGroups.forEach(({ group, shadow, link }, index) => {
    const center = group.localToWorld(new THREE.Vector3(0, mascotHeight / 2, 0));
    const screen = project(center, width, height);
    const halfWidth = project(center.clone().addScaledVector(cameraRight, mascotWidth / 2), width, height);
    const halfHeight = project(center.clone().addScaledVector(cameraUp, mascotHeight / 2), width, height);
    const pxWidth = Math.abs(halfWidth.x - screen.x) * 2;
    const pxHeight = Math.abs(halfHeight.y - screen.y) * 2;
    link.style.width = `${pxWidth.toFixed(2)}px`;
    link.style.height = `${pxHeight.toFixed(2)}px`;
    link.style.transform = `translate3d(${(screen.x - width / 2).toFixed(2)}px,${(screen.y - height / 2).toFixed(2)}px,0) translate(-50%,-50%)`;
    link.dataset.orbitScreenX = screen.x.toFixed(2);
    link.dataset.orbitScreenY = screen.y.toFixed(2);
    const localDepth = Math.cos((index * Math.PI * 2 / mascotGroups.length) + angle);
    shadow.material.opacity = .24 + ((localDepth + 1) / 2) * .32;
    shadow.scale.set(1 + ((localDepth + 1) / 2) * .14, 1, 1);
    shadow.rotation.y = -angle - Math.PI / 4;
  });
  renderer.render(scene, camera);
}

function onFrame(event) {
  renderWheel(Number(event.detail?.angle) || 0);
}
window.addEventListener('shuyi:home-orbit-frame', onFrame);
const resizeObserver = new ResizeObserver(resize);
resizeObserver.observe(visual);
visual.classList.add('has-three-wheel');
window.shuyiHomeOrbit3D = true;
resize();
syncTheme();
