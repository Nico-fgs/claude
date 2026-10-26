# Sonora

Reproductor de música web inspirado en Spotify. HTML, CSS y JavaScript puros: sin dependencias ni paso de compilación.

## Cómo usarlo

Abre `index.html` en el navegador, o sírvelo con cualquier servidor estático:

```bash
python3 -m http.server 8000
# http://localhost:8000
```

## Qué incluye (analizado de Spotify)

| Spotify | Sonora |
| --- | --- |
| Barra lateral con Inicio, Buscar y Tu biblioteca | Igual, con filtros Playlists / Álbumes / Artistas |
| Inicio con saludo, accesos rápidos y estanterías | "Buenos días/tardes/noches", recientes, "Hecho para ti", álbumes, artistas, géneros |
| Búsqueda con categorías y resultado principal | Mosaicos de género, resultado principal, canciones, artistas, álbumes y playlists |
| Páginas de playlist, álbum y artista con cabecera degradada | Igual, con oyentes mensuales y discografía en artistas |
| Reproductor inferior | Play/pausa, anterior/siguiente, aleatorio, repetir (todo / una), barra de progreso, volumen, silencio |
| Cola de reproducción | Panel lateral con "Siguiente en la cola" y "Siguiente de: …" |
| Me gusta y biblioteca | Corazón en canciones, guardar playlists/álbumes, seguir artistas |
| Crear playlists | Crear, renombrar, eliminar, añadir y quitar canciones |
| Móvil | Navegación inferior y mini reproductor |

Extras: atajos de teclado (Espacio = play/pausa, Alt+←/→ = anterior/siguiente), controles multimedia del sistema (Media Session) y persistencia en `localStorage`.

## La música

No hay archivos de audio: cada canción se **sintetiza en el navegador** con la Web Audio API (`js/audio.js`) a partir de una semilla y del perfil de su género (tempo, escala, progresión de acordes, patrón de batería — dembow para reggaetón, four-on-the-floor para electrónica, swing para lo-fi, distorsión para rock…). El resultado se convierte a WAV para reproducirlo con un `<audio>` normal, y la siguiente canción se genera por adelantado.

Todos los artistas, álbumes y canciones son ficticios.

## Estructura

```
index.html        Estructura de la app
css/styles.css    Estilos (tema oscuro, responsive)
js/data.js        Catálogo ficticio
js/audio.js       Motor de música procedural
js/app.js         Router, vistas, reproductor, biblioteca
```
