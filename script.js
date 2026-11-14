import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

let scene, renderer, camera;
let camcontrols;
let uniforms;

init();
animationLoop();

function init() {
  //Cámara
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, -7, 6);

  renderer = new THREE.WebGLRenderer();
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  //Variables uniform compartidas por los shaders
  uniforms = {
    u_time: { value: 0.0 },
    u_mouse: { value: new THREE.Vector2(0.5, 0.5) },
  };

  //Plano muy subdividido para poder deformarlo en el vertex shader
  PlanoOndas(8, 8, 150, 150);

  camcontrols = new OrbitControls(camera, renderer.domElement);

  window.addEventListener("resize", onWindowResize, false);
  window.addEventListener("mousemove", onMouseMove, false);
}

//Redimensionado de la ventana
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

//Posición del ratón normalizada (0,0 abajo a la izquierda)
function onMouseMove(e) {
  uniforms.u_mouse.value.set(
    e.clientX / window.innerWidth,
    1.0 - e.clientY / window.innerHeight
  );
}

//Ondas radiales desde el centro + onda que sigue al puntero
function vertexShader() {
  return `
    uniform float u_time;
    uniform vec2 u_mouse;

    varying float vH;
    varying vec2 vUv;

    void main() {
      vUv = uv;

      //Punto del plano (8x8) sobre el que está el ratón
      vec2 centro = (u_mouse - 0.5) * 8.0;

      float d0 = length(position.xy);
      float d1 = length(position.xy - centro);

      //Onda desde el centro y onda más intensa alrededor del ratón
      float h = sin(d0 * 3.0 - u_time) * 0.25;
      h += sin(d1 * 5.0 - u_time * 2.0) * 0.35 / (1.0 + d1 * d1);

      vH = h;

      vec3 p = position;
      p.z += h;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
    }
  `;
}

//Color por altura, tintado por el ratón y el tiempo
function fragmentShader() {
  return `
    uniform float u_time;
    uniform vec2 u_mouse;

    varying float vH;
    varying vec2 vUv;

    void main() {
      vec3 valle = vec3(0.05, 0.15, 0.50);
      vec3 cresta = vec3(1.00, 0.45, 0.75);

      float t = smoothstep(-0.4, 0.4, vH);
      vec3 col = mix(valle, cresta, t);

      //El color del ratón tiñe la superficie y pulsa con el tiempo
      vec3 tinte = vec3(u_mouse.x, u_mouse.y, abs(sin(u_time * 0.5)));
      col = mix(col, tinte, 0.3);

      gl_FragColor = vec4(col, 1.0);
    }
  `;
}

function PlanoOndas(sx, sy, nx, ny) {
  let geometry = new THREE.PlaneGeometry(sx, sy, nx, ny);
  let material = new THREE.ShaderMaterial({
    uniforms: uniforms,
    vertexShader: vertexShader(),
    fragmentShader: fragmentShader(),
    side: THREE.DoubleSide,
  });

  scene.add(new THREE.Mesh(geometry, material));
}

//Bucle de animación
function animationLoop() {
  requestAnimationFrame(animationLoop);

  uniforms.u_time.value += 0.05;

  renderer.render(scene, camera);
}
