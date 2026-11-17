# ShaderThreejs

## Escenario de concierto

Se ha implementado una imagen que simula un escenario para la prueba de shaders con `Threejs`, con efectos de iluminación y movimiento.

### Variables globales

Existen dos variables globales imprescindibles para los efectos, el tiempo (`u_time`) y la posición del cursor (`u_mouse`). 

La primera variable permite crear las animaciones de movimiento para las luces de las columnas, los conos de luces de la pasarela central y el movimiento de las ondas de la pantalla. 

Por otro lado, la posición del cursor modifica el color en tiempo real. Ya que según donde se encuentre, el vector que forma la posición generará un color distinto. Además, si se posiciona el cursor en la pantalla, se generará otra onda en su posición, formando otro efecto.

### Efecto de la pantalla

La pantalla del fondo muestra unas ondas que salen del centro y se mueven con el tiempo. Estas se forman sumando dos ondas hechas con la función seno. 

En cuanto a las ondas del cursor, también tienen una función de suavizado llamada `smoothstep()`, que genera el efecto de desvanecimiento al alejarse irse alejando.

Por último, alrededor del marco de la pantalla hay un pequeño halo de luz.

### Efecto de la pasarela

La pasarela está formada por un trapecio en el centro de la parte inferior que se estrecha hacia el fondo, lo que da sensación de profundidad. En sus bordes se encuentra cinco focos por cada lado. Cada uno lanza un cono de luz hacia arriba, el cual es estrecho en la base y se va abriendo y apagando con la altura utilizando la función `exp()`.

Estos conos se inclinan hacia el centro y se balancean despacio, cada uno con un desfase distinto para que no se muevan todos a la vez, además de realizar pulsos suaves en brillo. En la base se encuentra una luz brillante que simula la bombilla y brilla con más intensidad.

### Efecto de las columnas

Las columnas son dos bandas de leds que recorren todo el largo de la pantalla, una en cada lado de la pantalla. Por defecto los leds son blancos y tenues, pero por ellos sube un pulso de luz del color del cursor. Cada lado tiene el pulso un poco desfasado para que no vayan iguales.

### Vídeo demostración

A continuación, se compartirá un enlace a un [vídeo demostración](https://youtu.be/EPmKyrkrfT0) de la ejecución.


## Ying Yang Zen (The Book of Shaders)

A continuación se comentará la implementación que se encuentra en el directorio `BookOfShaders/`. Esta formado por los ficheros `yinyang_min.frag` (versión mínima) y `yinyang.frag` (versión comentada con el mismo comportamiento).

Se pegan directamente en el [editor online de The Book of Shaders](https://thebookofshaders.com/edit.php).

### Motivación

El escenario de la versión Three.js (`script.js`) era demasiado pesado y dependía de Three.js, por lo que se buscó una imagen simple y reconocible que diera sensación de movimiento continuo y fluido: un ying yang girando. Es una figura con simetría rotacional y construida solo con círculos, lo que la hace muy compacta en código. 

Para conservar parte de la idea de las ondas del escenario original se añade un aura de color alrededor que late hacia fuera y cambia de tono lentamente, aunque no se implementó nada con el ratón para ahorrar recursos.

### Desarrollo

**Coordenadas.** `p = (gl_FragCoord.xy - r/2.) / r.y` centra el origen y normaliza por la altura para ubicar el círculo, siendo este de radio 0,4 para caber en cualquier formato.

**Formas con distancias.** Cada forma se define por su distancia con signo (negativa dentro). La macro `F(d) = smoothstep(e, -e, d)` la convierte en una máscara 0..1 con un borde de un píxel (`e = 1/r.y`), lo que da bordes suaves sin escalones al girar.

**Construcción del ying yang.** Se parte de la mitad derecha blanca (`F(-p.x)`). Después se superponen cuatro círculos con `mix`: uno blanco de radio 0,2 centrado en (0, 0,2), uno negro de radio 0,2 centrado en (0, -0,2) y dos puntos de radio 0,05 con el color contrario. Así la curva en S aparece sin trazarla explícitamente. Las distancias a los centros (`A` y `B`) se calculan una sola vez y se reutilizan.

**Giro.** Se rota el espacio con una matriz `mat2(c,-s,s,c)` con `c=cos(t)`, `s=sin(t)`. Rotar las coordenadas en lugar de la figura permite reutilizar todo el código de dibujo. El giro es continuo y con velocidad lenta y constante (`u_time*.4`), por lo que el movimiento es suave y fluido; el halo usa la distancia sin rotar para que no gire.

**Halo.** Fuera del círculo se muestra una paleta coseno `.5+.5*cos(t+vec3(0,2,4))` que cambia de tono despacio con el tiempo, atenuada con `exp(-distancia*6)` y modulada por `sin(l*20 - t*4)`, que crea un latido suave hacia el exterior.

**Iteración.** Se comprobó el aspecto con una emulación del shader en Python/NumPy y se validó la sintaxis con `glslangValidator`. Las versiones iniciales de ondas (suma de senos y distancia mínima a centro y esquinas) se descartaron por resultar confusas o poco fluidas. Para ajustar el tamaño se calcularon `A` y `B` una sola vez, se unificó el tiempo y la velocidad de giro en una variable y se guardó `u_resolution` en `r`. Se eliminó el uso del ratón al decidir que el resultado debía ser independiente del usuario.

A continuación se mostrará un GIF con la ejecución del shader.

### Fuentes

- Patricio Gonzalez Vivo y Jen Lowe, *The Book of Shaders*, <https://thebookofshaders.com/>: uniforms, "Shaping functions" (`smoothstep`, `mix`, `sin`), "Algorithmic drawing" (formas con distancias) y "Matrices" (rotación 2D).
- Inigo Quilez, "2D distance functions", <https://iquilezles.org/articles/distfunctions2d/>: formas definidas por distancia con signo.
- La versión de las ondas de la pantalla de este repositorio (`script.js`), de la que parte la idea del halo.
- Khronos Group, especificación de GLSL ES, para las funciones integradas.
