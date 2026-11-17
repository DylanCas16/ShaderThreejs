// Author: Dylan A. Castrillón Suárez
// Title: Ying Yang Zen

#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 u_resolution;
uniform float u_time;

// 1 dentro de la forma (d < 0), 0 fuera, con borde suavizado de ~1 píxel
#define F(d) smoothstep(e, -e, d)

void main() {
  vec2 r = u_resolution;
  vec2 p = (gl_FragCoord.xy - r / 2.) / r.y;  // centro en (0,0), altura = 1
  vec2 a = vec2(0, .2);                       // centros de los círculos pequeños

  float t = mod(u_time * .4, 6.2832);        // giro lento y constante; mod evita perder precisión con u_time grande
  float e = 1. / r.y;                         // tamaño de un píxel
  float c = cos(t), s = sin(t);
  float l = length(p);                        // distancia al centro (sin rotar)

  p *= mat2(c, -s, s, c);                     // rotación de la figura

  float A = length(p - a);                    // distancia al círculo superior
  float B = length(p + a);                    // distancia al círculo inferior

  // Construcción del ying yang (1 = blanco, 0 = negro)
  float v = F(-p.x);                          // mitad derecha blanca
  v = mix(v, 1., F(A - .2));                  // abultamiento blanco superior
  v = mix(v, 0., F(B - .2));                  // abultamiento negro inferior
  v = mix(v, 0., F(A - .05));                 // punto negro dentro del blanco
  v = mix(v, 1., F(B - .05));                 // punto blanco dentro del negro

  // Halo: color que cambia despacio con el tiempo (paleta coseno), se apaga
  // con la distancia y late hacia fuera
  vec3 halo = (.5 + .5 * cos(t + vec3(0, 2, 4)))
            * exp(-max(l - .4, 0.) * 6.)
            * (.8 + .2 * sin(l * 20. - t * 4.));

  // Dentro del círculo de radio .4 se ve el ying yang; fuera, el halo
  gl_FragColor = vec4(mix(halo, vec3(v), F(l - .4)), 1.);
}
