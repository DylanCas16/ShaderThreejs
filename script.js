import * as THREE from "three";

let scene, renderer, camera;
let uniforms;

init();
animationLoop();

function init() {
  scene = new THREE.Scene();
  camera = new THREE.Camera();

  renderer = new THREE.WebGLRenderer();
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  //Variables uniform compartidas por el shader
  uniforms = {
    u_time: { value: 0.0 },
    u_mouse: { value: new THREE.Vector2(0.5, 0.5) },
    u_res: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
  };

  PlanoPantalla();

  window.addEventListener("resize", onWindowResize, false);
  window.addEventListener("mousemove", onMouseMove, false);
}

//Redimensionado de la ventana
function onWindowResize() {
  renderer.setSize(window.innerWidth, window.innerHeight);
  uniforms.u_res.value.set(window.innerWidth, window.innerHeight);
}

//Posición del ratón normalizada (0,0 abajo a la izquierda)
function onMouseMove(e) {
  uniforms.u_mouse.value.set(
    e.clientX / window.innerWidth,
    1.0 - e.clientY / window.innerHeight
  );
}

function vertexShader() {
  return `
    varying vec2 vUv;

    void main() {
      vUv = uv;
      gl_Position = vec4(position.xy, 0.0, 1.0);
    }
  `;
}

function fragmentShader() {
  return `
    uniform float u_time;
    uniform vec2 u_mouse;
    uniform vec2 u_res;

    varying vec2 vUv;

    void main() {
      float aspect = u_res.x / u_res.y;
      vec2 p = (vUv - 0.5) * vec2(aspect, 1.0);
      float t = u_time;

      //Color formado por la posición del ratón
      vec3 mc = vec3(u_mouse.x, u_mouse.y, 1.0 - u_mouse.x);
      mc /= max(max(mc.r, mc.g), 0.001 + mc.b);

      vec3 col = vec3(0.0);

      // Pantalla del fondo con las ondas
      vec2 centroP = vec2(0.0, 0.15);
      vec2 mediaP = vec2(0.42, 0.24);
      vec2 b = abs(p - centroP) - mediaP;
      float dPant = length(max(b, 0.0)) + min(max(b.x, b.y), 0.0);

      //Coordenadas dentro de la pantalla
      vec2 q = (p - centroP) / mediaP * 4.0;
      vec2 ratonP = (u_mouse - 0.5) * vec2(aspect, 1.0);
      vec2 centro = (ratonP - centroP) / mediaP * 4.0;

      float h = sin(length(q) * 3.0 - t) * 0.25;
      float d1 = length(q - centro);
      h += sin(d1 * 5.0 - t * 2.0) * 0.35 / (1.0 + d1 * d1);
      vec3 ondas = mix(mc * 0.12, mc * 0.85, smoothstep(-0.4, 0.4, h));

      col += mc * exp(-max(dPant, 0.0) * 14.0) * 0.15;
      col = mix(col, vec3(0.04), smoothstep(0.003, 0.0, dPant - 0.012));
      col = mix(col, ondas, smoothstep(0.003, 0.0, dPant)); 

      // Pasarela central
      float horizonte = -0.12;
      float suelo = step(p.y, horizonte);
      float s = clamp((horizonte - p.y) / (0.5 + horizonte), 0.0, 1.0);
      float ancho = mix(0.02, 0.32, s);
      float ax = abs(p.x);

      float pasarela = suelo * smoothstep(0.0, 0.004, ancho - ax);
      col = mix(col, vec3(0.03, 0.03, 0.04), pasarela);

      col += mc * 0.03 * pasarela;

      //Focos en los bordes de la pasarela
      for (int i = 0; i < 5; i++) {
        float si = 0.12 + 0.17 * float(i);
        float yb = horizonte - si * (0.5 + horizonte);
        float xb = mix(0.02, 0.32, si);

        for (int j = 0; j < 2; j++) {
          float lado = j == 0 ? -1.0 : 1.0;
          float a = 0.30 + 0.20 * sin(t * 0.4 + float(i) * 1.3 + lado);
          vec2 dir = vec2(-lado * sin(a), cos(a));

          vec2 v = p - vec2(lado * xb, yb);
          float along = dot(v, dir);
          float across = v.x * dir.y - v.y * dir.x;
          float wd = 0.006 + max(along, 0.0) * 0.16;

          float r = abs(across) / wd;
          float cono = smoothstep(1.0, 0.2, r) * (0.4 + 0.6 * exp(-r * r * 3.0));
          cono *= smoothstep(0.0, 0.02, along) * exp(-max(along, 0.0) / (0.2 + 0.4 * si));
          cono *= min(1.0, 0.03 / wd);

          float pulso = 0.6 + 0.4 * sin(t * 1.5 + float(i) * 0.8 + lado);
          col += mc * cono * pulso * 0.55;
          col += mc * exp(-length(v) * 60.0) * 0.6;
        }
      }

      // Leds laterales con pulsos
      float dx = aspect * 0.5 - abs(p.x);
      vec2 g = fract(vec2(dx, p.y) / 0.035) - 0.5;
      float led = smoothstep(0.24, 0.14, length(g)) * step(0.0, dx) * step(dx, 0.175);
      float pl = pow(0.5 + 0.5 * sin(p.y * 7.0 - t * 1.2 + step(0.0, p.x) * 3.0), 6.0);
      vec3 colLed = mix(vec3(1, 1, 1) * 0.35, mc * 1.3, pl);

      float largo = 1.8;
      float fade = 1.0 - smoothstep(largo * 0.5, largo, 0.5 - p.y);

      col += colLed * led * fade;
      col += colLed * exp(-dx * 10.0) * 0.12 * fade;

      col *= 1.0 - 0.35 * dot(p, p);

      gl_FragColor = vec4(col, 1.0);
    }
  `;
}

function PlanoPantalla() {
  let geometry = new THREE.PlaneGeometry(2, 2);
  let material = new THREE.ShaderMaterial({
    uniforms: uniforms,
    vertexShader: vertexShader(),
    fragmentShader: fragmentShader(),
  });

  scene.add(new THREE.Mesh(geometry, material));
}

//Bucle de animación
function animationLoop() {
  requestAnimationFrame(animationLoop);

  uniforms.u_time.value += 0.05;

  renderer.render(scene, camera);
}
