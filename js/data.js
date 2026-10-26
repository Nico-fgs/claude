// Catálogo ficticio: artistas, álbumes, canciones y playlists.
// Toda la música se genera de forma procedural (ver audio.js).
(function () {
  const artists = [
    { id: 'ar1', name: 'Luna Vértice', genre: 'synthwave', hue: 290, listeners: 2384112 },
    { id: 'ar2', name: 'Los Faroles', genre: 'pop', hue: 18, listeners: 5120334 },
    { id: 'ar3', name: 'Marea Lenta', genre: 'lofi', hue: 200, listeners: 1290021 },
    { id: 'ar4', name: 'Cobalto', genre: 'electronica', hue: 225, listeners: 3410876 },
    { id: 'ar5', name: 'Ámbar Sur', genre: 'ambient', hue: 38, listeners: 640552 },
    { id: 'ar6', name: 'Neón Tropical', genre: 'reggaeton', hue: 330, listeners: 8022410 },
    { id: 'ar7', name: 'Piedra y Viento', genre: 'rock', hue: 0, listeners: 2150098 },
    { id: 'ar8', name: 'Ciudad Satélite', genre: 'synthwave', hue: 265, listeners: 980443 },
  ];

  const albums = [
    { id: 'al1', title: 'Horizonte Magenta', artist: 'ar1', year: 2024, hue: 300,
      tracks: ['Autopista 84', 'Cromo', 'Neblina Rosa', 'Último Tren', 'Píxeles'] },
    { id: 'al2', title: 'Verano Eterno', artist: 'ar2', year: 2025, hue: 25,
      tracks: ['Bailando Sola', 'Sal y Limón', 'Ventanas Abiertas', 'Te Vi Pasar', 'Domingo'] },
    { id: 'al3', title: 'Café a las 3', artist: 'ar3', year: 2023, hue: 195,
      tracks: ['Lluvia en el Vidrio', 'Apuntes', 'Taza Tibia', 'Biblioteca', 'Siesta'] },
    { id: 'al4', title: 'Frecuencia Azul', artist: 'ar4', year: 2025, hue: 230,
      tracks: ['Pulso', 'Circuito', 'Señal Perdida', 'Hertz', 'Sincronía', 'Voltaje'] },
    { id: 'al5', title: 'Desierto Interior', artist: 'ar5', year: 2022, hue: 40,
      tracks: ['Dunas', 'Espejismo', 'Oasis', 'Arena Lenta'] },
    { id: 'al6', title: 'Calor de Noche', artist: 'ar6', year: 2025, hue: 335,
      tracks: ['Perreo Lunar', 'Fuego', 'Hasta Abajo', 'Mirada', 'Esquina'] },
    { id: 'al7', title: 'Montaña Roja', artist: 'ar7', year: 2021, hue: 5,
      tracks: ['Grieta', 'Raíces', 'Volcán', 'Camino de Tierra', 'Eco'] },
    { id: 'al8', title: 'Órbita Baja', artist: 'ar8', year: 2024, hue: 255,
      tracks: ['Despegue', 'Gravedad Cero', 'Estación 9', 'Regreso'] },
    { id: 'al9', title: 'Noches de Neón', artist: 'ar1', year: 2022, hue: 280,
      tracks: ['Vaporwave', 'Retrovisor', 'Luces de Sodio'] },
    { id: 'al10', title: 'Mañanas Lentas', artist: 'ar3', year: 2025, hue: 170,
      tracks: ['Despertar', 'Pan Tostado', 'Ventana Norte', 'Bicicleta'] },
  ];

  // Semilla determinista para que cada canción suene siempre igual.
  function hash(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  const tracks = [];
  albums.forEach((album) => {
    const artist = artists.find((a) => a.id === album.artist);
    album.trackIds = album.tracks.map((title, i) => {
      const id = `${album.id}-t${i + 1}`;
      const seed = hash(id + title);
      tracks.push({
        id,
        title,
        artist: artist.id,
        album: album.id,
        genre: artist.genre,
        seed,
        duration: 50 + (seed % 50), // 50–99 segundos
        plays: 10000 + (seed % 9000000),
      });
      return id;
    });
  });

  const byGenre = (g) => tracks.filter((t) => t.genre === g).map((t) => t.id);
  const pick = (n, offset) => tracks.filter((_, i) => (i + offset) % 3 === 0).slice(0, n).map((t) => t.id);

  const playlists = [
    { id: 'pl1', name: 'Éxitos del Momento', description: 'Lo más escuchado esta semana.', hue: 140,
      trackIds: [...byGenre('reggaeton'), ...byGenre('pop')].slice(0, 9), owner: 'Sonora' },
    { id: 'pl2', name: 'Concentración Lo-Fi', description: 'Beats tranquilos para estudiar y trabajar.', hue: 190,
      trackIds: [...byGenre('lofi'), ...byGenre('ambient')], owner: 'Sonora' },
    { id: 'pl3', name: 'Retro Futuro', description: 'Sintetizadores, neón y autopistas nocturnas.', hue: 285,
      trackIds: byGenre('synthwave'), owner: 'Sonora' },
    { id: 'pl4', name: 'Energía Electrónica', description: 'Pulso alto para entrenar.', hue: 220,
      trackIds: [...byGenre('electronica'), ...byGenre('reggaeton').slice(0, 2)], owner: 'Sonora' },
    { id: 'pl5', name: 'Rock Esencial', description: 'Guitarras y tambores con actitud.', hue: 0,
      trackIds: byGenre('rock'), owner: 'Sonora' },
    { id: 'pl6', name: 'Descubrimiento Semanal', description: 'Tu mezcla semanal de música nueva.', hue: 100,
      trackIds: pick(12, 1), owner: 'Sonora' },
    { id: 'pl7', name: 'Calma Total', description: 'Respira. Paisajes sonoros ambientales.', hue: 45,
      trackIds: [...byGenre('ambient'), ...byGenre('lofi').slice(0, 3)], owner: 'Sonora' },
    { id: 'pl8', name: 'Fiesta en Casa', description: 'Sube el volumen.', hue: 320,
      trackIds: [...byGenre('reggaeton'), ...byGenre('pop'), ...byGenre('electronica').slice(0, 3)], owner: 'Sonora' },
  ];

  const genres = [
    { id: 'pop', name: 'Pop', hue: 18 },
    { id: 'reggaeton', name: 'Reggaetón', hue: 330 },
    { id: 'electronica', name: 'Electrónica', hue: 225 },
    { id: 'synthwave', name: 'Synthwave', hue: 280 },
    { id: 'lofi', name: 'Lo-Fi', hue: 195 },
    { id: 'rock', name: 'Rock', hue: 2 },
    { id: 'ambient', name: 'Ambiental', hue: 40 },
  ];

  window.CATALOG = { artists, albums, tracks, playlists, genres };
})();
