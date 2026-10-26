(function () {
  const { artists, albums, tracks, playlists, genres } = window.CATALOG;
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const trackById = new Map(tracks.map((t) => [t.id, t]));
  const artistById = new Map(artists.map((a) => [a.id, a]));
  const albumById = new Map(albums.map((a) => [a.id, a]));

  // ---------------------------------------------------------------- Iconos
  const ICONS = {
    home: { d: 'M12 3l9 8h-3v9h-5v-6h-2v6H6v-9H3z' },
    search: { d: 'M10.5 3a7.5 7.5 0 015.96 12.05l4.25 4.24-1.42 1.42-4.24-4.25A7.5 7.5 0 1110.5 3zm0 2a5.5 5.5 0 100 11 5.5 5.5 0 000-11z' },
    library: { d: 'M4 3h2v18H4zM9 3h2v18H9zM14.5 3.6l1.9-.6 5.4 17.2-1.9.6z' },
    plus: { d: 'M11 4h2v7h7v2h-7v7h-2v-7H4v-2h7z' },
    play: { d: 'M7 4.5v15l13-7.5z' },
    pause: { d: 'M6 4h4v16H6zM14 4h4v16h-4z' },
    next: { d: 'M5 5l10 7-10 7zM17 5h2v14h-2z' },
    prev: { d: 'M19 5L9 12l10 7zM5 5h2v14H5z' },
    more: { d: 'M5 10.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3zm7 0a1.5 1.5 0 110 3 1.5 1.5 0 010-3zm7 0a1.5 1.5 0 110 3 1.5 1.5 0 010-3z' },
    shuffle: { s: 'M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5' },
    repeat: { s: 'M17 1l4 4-4 4M3 11V9a4 4 0 014-4h14M7 23l-4-4 4-4M21 13v2a4 4 0 01-4 4H3' },
    heart: { s: 'M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 00-7.8 7.8l1 1.1L12 21.2l7.8-7.8 1-1.1a5.5 5.5 0 000-7.8z' },
    heartFill: { d: 'M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 00-7.8 7.8l1 1.1L12 21.2l7.8-7.8 1-1.1a5.5 5.5 0 000-7.8z' },
    volume: { s: 'M11 5L6 9H2v6h4l5 4zM15.5 8.5a5 5 0 010 7M19 5a10 10 0 010 14' },
    volumeMute: { s: 'M11 5L6 9H2v6h4l5 4zM23 9l-6 6M17 9l6 6' },
    queue: { s: 'M3 6h12M3 12h12M3 18h7M16 18a2.5 2.5 0 105 0V5h2' },
    chevronLeft: { s: 'M15 18l-6-6 6-6' },
    chevronRight: { s: 'M9 18l6-6-6-6' },
    close: { s: 'M18 6L6 18M6 6l12 12' },
    clock: { s: 'M12 7v5l3 2M12 3a9 9 0 110 18 9 9 0 010-18z' },
    music: { s: 'M9 18V5l12-2v13M9 18a3 3 0 11-6 0 3 3 0 016 0zM21 16a3 3 0 11-6 0 3 3 0 016 0z' },
    check: { s: 'M5 12l5 5 9-10' },
    trash: { s: 'M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14' },
    edit: { s: 'M4 20h4L19 9l-4-4L4 16z' },
    user: { s: 'M12 12a4 4 0 100-8 4 4 0 000 8zM4 21a8 8 0 0116 0' },
    logo: { raw: '<rect x="1" y="1" width="22" height="22" rx="7" fill="var(--accent)"/><path d="M7 10v4M10 7v10M13 9v6M16 6v12M19 11v2" stroke="#06140b" stroke-width="2" stroke-linecap="round"/>' },
  };

  function icon(name, cls = '') {
    const ic = ICONS[name];
    if (!ic) return '';
    const body = ic.raw
      ? ic.raw
      : ic.s
        ? `<path d="${ic.s}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`
        : `<path d="${ic.d}" fill="currentColor"/>`;
    return `<svg class="icon ${cls}" viewBox="0 0 24 24" aria-hidden="true">${body}</svg>`;
  }

  function hydrateIcons(root = document) {
    $$('[data-icon]', root).forEach((el) => {
      el.outerHTML = icon(el.dataset.icon);
    });
  }

  // ---------------------------------------------------------------- Utilidades
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const fmtTime = (s) => {
    if (!isFinite(s) || s < 0) s = 0;
    const m = Math.floor(s / 60);
    return `${m}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  };
  const fmtNum = (n) => n.toLocaleString('es');
  const totalDuration = (ids) => {
    const secs = ids.reduce((acc, id) => acc + (trackById.get(id)?.duration || 0), 0);
    const m = Math.floor(secs / 60);
    return m >= 60 ? `${Math.floor(m / 60)} h ${m % 60} min` : `${m} min ${secs % 60} s`;
  };
  const normalize = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const pluralSongs = (n) => `${n} ${n === 1 ? 'canción' : 'canciones'}`;

  // ---------------------------------------------------------------- Estado persistente
  const STORE_KEY = 'sonora:v1';
  const defaults = {
    liked: ['al2-t1', 'al4-t3', 'al3-t1', 'al6-t2', 'al1-t1'],
    userPlaylists: [],
    saved: ['playlist:pl1', 'playlist:pl2', 'playlist:pl3', 'playlist:pl6', 'album:al1', 'album:al3', 'artist:ar6', 'artist:ar3'],
    recent: [],
    volume: 0.8,
    shuffle: false,
    repeat: 'off',
    libraryFilter: 'all',
  };
  let state = { ...defaults };
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) state = { ...defaults, ...JSON.parse(raw) };
  } catch (e) { /* almacenamiento no disponible */ }
  const save = () => {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) { /* ignorar */ }
  };
  const isLiked = (id) => state.liked.includes(id);
  const isSaved = (key) => state.saved.includes(key);
  const userPlaylist = (id) => state.userPlaylists.find((p) => p.id === id);

  // ---------------------------------------------------------------- Contextos (listas reproducibles)
  function searchResults(q) {
    const n = normalize(q.trim());
    if (!n) return { tracks: [], artists: [], albums: [], playlists: [] };
    const match = (s) => normalize(s).includes(n);
    return {
      tracks: tracks.filter((t) => match(t.title) || match(artistById.get(t.artist).name) || match(albumById.get(t.album).title))
        .sort((a, b) => b.plays - a.plays).map((t) => t.id),
      artists: artists.filter((a) => match(a.name) || match(a.genre)),
      albums: albums.filter((a) => match(a.title) || match(artistById.get(a.artist).name)),
      playlists: [...playlists, ...state.userPlaylists].filter((p) => match(p.name) || match(p.description || '')),
    };
  }

  // Devuelve todo lo necesario para mostrar o reproducir una colección a partir de su clave.
  function getContext(key) {
    const [type, id] = key.split(/:(.*)/s);
    switch (type) {
      case 'liked':
        return { key, type: 'Playlist', title: 'Canciones que te gustan', hue: 250, liked: true,
          href: '#/liked', subtitle: `Tú · ${pluralSongs(state.liked.length)}`, trackIds: [...state.liked].reverse() };
      case 'playlist': {
        const pl = playlists.find((p) => p.id === id) || userPlaylist(id);
        if (!pl) return null;
        return { key, type: 'Playlist', title: pl.name, hue: pl.hue, href: `#/playlist/${id}`, description: pl.description,
          subtitle: `Playlist · ${pl.owner}`, trackIds: pl.trackIds, owner: pl.owner, editable: !!userPlaylist(id), id };
      }
      case 'album': {
        const al = albumById.get(id);
        if (!al) return null;
        const ar = artistById.get(al.artist);
        return { key, type: 'Álbum', title: al.title, hue: al.hue, href: `#/album/${id}`,
          subtitle: `${al.year} · ${ar.name}`, trackIds: al.trackIds, artist: ar, year: al.year, id };
      }
      case 'artist': {
        const ar = artistById.get(id);
        if (!ar) return null;
        const ids = tracks.filter((t) => t.artist === id).sort((a, b) => b.plays - a.plays).map((t) => t.id);
        return { key, type: 'Artista', title: ar.name, hue: ar.hue, href: `#/artist/${id}`, round: true,
          subtitle: 'Artista', trackIds: ids, id };
      }
      case 'genre': {
        const g = genres.find((x) => x.id === id);
        if (!g) return null;
        return { key, type: 'Género', title: g.name, hue: g.hue, href: `#/genre/${id}`, subtitle: 'Género',
          trackIds: tracks.filter((t) => t.genre === id).sort((a, b) => b.plays - a.plays).map((t) => t.id), id };
      }
      case 'search':
        return { key, type: 'Búsqueda', title: `Búsqueda: "${id}"`, hue: 0, href: '#/search', subtitle: '',
          trackIds: searchResults(id).tracks };
      default:
        return null;
    }
  }

  function coverArt(ctx, size = '') {
    if (!ctx) return '';
    if (ctx.liked) return `<div class="cover liked ${size}">${icon('heartFill')}</div>`;
    const words = ctx.title.replace(/[^\p{L}\p{N} ]/gu, '').split(' ').filter(Boolean);
    const main = words.filter((w) => w.length > 2); // ignora artículos y preposiciones ("a", "de", "las"...)
    const initials = (main.length ? main : words).slice(0, 2).map((w) => w[0].toUpperCase()).join('');
    return `<div class="cover ${ctx.round ? 'round' : ''} ${size}" style="--h:${ctx.hue}"><span>${esc(initials)}</span></div>`;
  }

  function trackCover(track, size = 'xs') {
    return coverArt(getContext(`album:${track.album}`), size);
  }

  // ---------------------------------------------------------------- Reproductor
  const audio = $('#audio');
  const player = {
    list: [],         // trackIds del contexto
    order: [],        // índices de `list` en orden de reproducción
    pos: -1,          // posición en `order`
    manual: [],       // cola manual ("Añadir a la cola")
    current: null,    // trackId sonando
    contextKey: null,
    loading: false,
  };
  let loadToken = 0;

  function buildOrder(startIndex) {
    const idx = player.list.map((_, i) => i);
    if (!state.shuffle) {
      player.order = idx;
      player.pos = Math.max(0, startIndex);
      return;
    }
    const rest = idx.filter((i) => i !== startIndex);
    for (let i = rest.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [rest[i], rest[j]] = [rest[j], rest[i]];
    }
    player.order = startIndex >= 0 ? [startIndex, ...rest] : rest;
    player.pos = 0;
  }

  function playContext(key, startIndex = -1) {
    const ctx = getContext(key);
    if (!ctx || !ctx.trackIds.length) return toast('No hay canciones para reproducir');
    player.list = [...ctx.trackIds];
    player.contextKey = key;
    const start = startIndex >= 0 ? startIndex : state.shuffle ? Math.floor(Math.random() * player.list.length) : 0;
    buildOrder(start);
    if (!key.startsWith('search:')) {
      state.recent = [key, ...state.recent.filter((k) => k !== key)].slice(0, 12);
      save();
    }
    loadTrack(player.list[player.order[player.pos]]);
  }

  async function loadTrack(trackId, autoplay = true) {
    const track = trackById.get(trackId);
    if (!track) return;
    const token = ++loadToken;
    player.current = trackId;
    player.loading = true;
    audio.pause();
    updatePlayerUI();
    let url;
    try {
      url = await window.SonoraAudio.getTrackUrl(track);
    } catch (e) {
      if (token === loadToken) {
        player.loading = false;
        updatePlayerUI();
        toast('Tu navegador no pudo generar el audio');
      }
      return;
    }
    if (token !== loadToken) return;
    audio.src = url;
    player.loading = false;
    if (autoplay) await audio.play().catch(() => {});
    updatePlayerUI();
    updateMediaSession(track);
    prefetchNext();
  }

  function upcomingId() {
    if (player.manual.length) return player.manual[0];
    if (player.pos + 1 < player.order.length) return player.list[player.order[player.pos + 1]];
    if (state.repeat === 'all' && player.order.length) return player.list[player.order[0]];
    return null;
  }

  function prefetchNext() {
    const id = upcomingId();
    if (id) setTimeout(() => window.SonoraAudio.getTrackUrl(trackById.get(id)).catch(() => {}), 1500);
  }

  function next(auto = false) {
    if (player.manual.length) return loadTrack(player.manual.shift());
    if (!player.order.length) return;
    if (player.pos + 1 < player.order.length) {
      player.pos++;
    } else if (state.repeat === 'all') {
      if (state.shuffle) buildOrder(-1);
      else player.pos = 0;
    } else {
      if (auto) {
        audio.currentTime = 0;
        updatePlayerUI();
        return;
      }
      player.pos = 0;
    }
    loadTrack(player.list[player.order[player.pos]], true);
  }

  function prev() {
    if (audio.currentTime > 3 || !player.order.length) {
      audio.currentTime = 0;
      return;
    }
    if (player.pos > 0) player.pos--;
    else if (state.repeat === 'all') player.pos = player.order.length - 1;
    loadTrack(player.list[player.order[player.pos]]);
  }

  function togglePlay() {
    if (!player.current) return playContext(state.recent.find((k) => getContext(k)) || 'playlist:pl1');
    if (player.loading) return;
    if (audio.paused) audio.play().catch(() => {});
    else audio.pause();
  }

  function toggleShuffle() {
    state.shuffle = !state.shuffle;
    save();
    if (player.order.length) buildOrder(player.order[player.pos]);
    updatePlayerUI();
    toast(state.shuffle ? 'Aleatorio activado' : 'Aleatorio desactivado');
  }

  function cycleRepeat() {
    state.repeat = { off: 'all', all: 'one', one: 'off' }[state.repeat];
    save();
    updatePlayerUI();
    toast({ off: 'Repetir desactivado', all: 'Repetir todo', one: 'Repetir canción' }[state.repeat]);
  }

  function toggleLike(id) {
    if (isLiked(id)) {
      state.liked = state.liked.filter((x) => x !== id);
      toast('Eliminada de Canciones que te gustan');
    } else {
      state.liked.push(id);
      toast('Añadida a Canciones que te gustan');
    }
    save();
    refresh();
  }

  audio.addEventListener('ended', () => {
    if (state.repeat === 'one') {
      audio.currentTime = 0;
      audio.play().catch(() => {});
    } else next(true);
  });
  ['play', 'pause'].forEach((ev) => audio.addEventListener(ev, () => { updatePlayerUI(); refreshPlayingMarks(); }));

  const seek = $('#seek');
  let seeking = false;
  const setRangeFill = (el) => el.style.setProperty('--p', `${((el.value - el.min) / (el.max - el.min)) * 100}%`);
  audio.addEventListener('timeupdate', () => {
    if (seeking) return;
    const d = audio.duration || trackById.get(player.current)?.duration || 0;
    seek.value = d ? (audio.currentTime / d) * 100 : 0;
    setRangeFill(seek);
    $('#time-current').textContent = fmtTime(audio.currentTime);
  });
  seek.addEventListener('input', () => {
    seeking = true;
    setRangeFill(seek);
    const d = audio.duration || 0;
    $('#time-current').textContent = fmtTime((seek.value / 100) * d);
  });
  seek.addEventListener('change', () => {
    if (audio.duration) audio.currentTime = (seek.value / 100) * audio.duration;
    seeking = false;
  });

  const volume = $('#volume');
  let lastVolume = state.volume || 0.8;
  function setVolume(v) {
    audio.volume = v;
    state.volume = v;
    volume.value = v;
    setRangeFill(volume);
    $('#btn-mute').innerHTML = icon(v === 0 ? 'volumeMute' : 'volume');
    save();
  }
  volume.addEventListener('input', () => setVolume(Number(volume.value)));
  setVolume(state.volume);

  function updateMediaSession(track) {
    if (!('mediaSession' in navigator)) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title,
      artist: artistById.get(track.artist).name,
      album: albumById.get(track.album).title,
    });
  }
  if ('mediaSession' in navigator) {
    const ms = navigator.mediaSession;
    ms.setActionHandler('play', () => audio.play());
    ms.setActionHandler('pause', () => audio.pause());
    ms.setActionHandler('nexttrack', () => next());
    ms.setActionHandler('previoustrack', () => prev());
  }

  function updatePlayerUI() {
    const track = trackById.get(player.current);
    const np = $('#now-playing');
    if (track) {
      const ar = artistById.get(track.artist);
      np.innerHTML = `
        <a href="#/album/${track.album}">${trackCover(track, 'sm')}</a>
        <div class="np-text">
          <a class="np-title" href="#/album/${track.album}">${esc(track.title)}</a>
          <a class="np-artist" href="#/artist/${ar.id}">${esc(ar.name)}</a>
        </div>
        <button class="icon-btn like ${isLiked(track.id) ? 'on' : ''}" data-action="like" data-id="${track.id}" aria-label="Me gusta">
          ${icon(isLiked(track.id) ? 'heartFill' : 'heart')}</button>`;
      $('#time-total').textContent = fmtTime(track.duration);
      document.title = `${track.title} · ${ar.name} — Sonora`;
    } else {
      np.innerHTML = '<div class="np-empty">Elige algo para escuchar</div>';
      document.title = 'Sonora';
    }
    const playing = !audio.paused && !player.loading;
    const btn = $('#btn-play');
    btn.innerHTML = player.loading ? '<span class="spinner"></span>' : icon(playing ? 'pause' : 'play');
    btn.setAttribute('aria-label', playing ? 'Pausar' : 'Reproducir');
    $('#btn-shuffle').classList.toggle('on', state.shuffle);
    const rep = $('#btn-repeat');
    rep.classList.toggle('on', state.repeat !== 'off');
    rep.classList.toggle('one', state.repeat === 'one');
    $('#player').classList.toggle('has-track', !!track);
    if (!$('#queue-panel').hidden) renderQueue();
  }

  // Actualiza solo los indicadores de "sonando" sin re-renderizar toda la vista.
  function refreshPlayingMarks() {
    const playing = !audio.paused || player.loading;
    $$('.track-row').forEach((row) => {
      const active = row.dataset.id === player.current;
      row.classList.toggle('active', active);
      row.classList.toggle('playing', active && playing);
    });
    $$('[data-action="play-list"]').forEach((b) => {
      const isCtx = b.dataset.list === player.contextKey && playing;
      b.innerHTML = icon(isCtx ? 'pause' : 'play');
    });
    $$('.library-item').forEach((li) => li.classList.toggle('active-ctx', li.dataset.key === player.contextKey));
  }

  // ---------------------------------------------------------------- Vistas
  const view = $('#view');
  const main = $('#main');
  let currentRoute = { name: 'home', param: '' };
  let searchQuery = '';

  function greeting() {
    const h = new Date().getHours();
    return h < 12 ? 'Buenos días' : h < 20 ? 'Buenas tardes' : 'Buenas noches';
  }

  function card(key) {
    const ctx = getContext(key);
    if (!ctx) return '';
    let sub = ctx.description || ctx.subtitle;
    if (ctx.type === 'Álbum') sub = `${ctx.year} · ${ctx.artist.name}`;
    return `
      <a class="card" href="${ctx.href}">
        <div class="card-cover">${coverArt(ctx, 'md')}
          <button class="card-play" data-action="play-list" data-list="${esc(key)}" aria-label="Reproducir ${esc(ctx.title)}">${icon('play')}</button>
        </div>
        <div class="card-title">${esc(ctx.title)}</div>
        <div class="card-sub">${esc(sub)}</div>
      </a>`;
  }

  const shelf = (title, keys, href) => keys.length ? `
    <section class="shelf">
      <header><h2>${href ? `<a href="${href}">${esc(title)}</a>` : esc(title)}</h2></header>
      <div class="grid">${keys.map(card).join('')}</div>
    </section>` : '';

  function renderHome() {
    const quick = ['liked', ...state.recent, ...state.saved, ...playlists.map((p) => `playlist:${p.id}`)]
      .filter((k, i, arr) => arr.indexOf(k) === i && getContext(k)).slice(0, 8);
    view.innerHTML = `
      <div class="home" style="--h:${getContext(quick[1] || 'playlist:pl1').hue}">
        <h1 class="greeting">${greeting()}</h1>
        <div class="quick-grid">
          ${quick.map((k) => {
            const ctx = getContext(k);
            return `<a class="quick" href="${ctx.href}">${coverArt(ctx, 'quick-cover')}<span>${esc(ctx.title)}</span>
              <button class="card-play small" data-action="play-list" data-list="${esc(k)}" aria-label="Reproducir">${icon('play')}</button></a>`;
          }).join('')}
        </div>
        ${shelf('Escuchado recientemente', state.recent.filter((k) => getContext(k)).slice(0, 6))}
        ${shelf('Hecho para ti', playlists.map((p) => `playlist:${p.id}`))}
        ${shelf('Álbumes populares', albums.map((a) => `album:${a.id}`).slice(0, 8))}
        ${shelf('Artistas populares', [...artists].sort((a, b) => b.listeners - a.listeners).map((a) => `artist:${a.id}`))}
        ${shelf('Explora por género', genres.map((g) => `genre:${g.id}`))}
      </div>`;
  }

  function trackRows(ids, listKey, opts = {}) {
    if (!ids.length) {
      return `<div class="empty">${icon('music')}<h3>${esc(opts.emptyTitle || 'Aún no hay canciones')}</h3>
        <p>${esc(opts.emptyText || 'Busca canciones y añádelas desde el menú ⋯')}</p>
        <a class="pill-btn" href="#/search">Buscar canciones</a></div>`;
    }
    return `
      <div class="tracks ${opts.hideAlbum ? 'no-album' : ''}">
        <div class="track-head">
          <span>#</span><span>Título</span><span class="col-album">Álbum</span><span></span>
          <span class="col-dur">${icon('clock')}</span><span></span>
        </div>
        ${ids.map((id, i) => {
          const t = trackById.get(id);
          if (!t) return '';
          const ar = artistById.get(t.artist);
          const al = albumById.get(t.album);
          return `
            <div class="track-row" data-id="${t.id}" data-list="${esc(listKey)}" data-index="${i}" tabindex="0">
              <span class="col-num"><span class="num">${i + 1}</span>
                <span class="eq"><i></i><i></i><i></i></span>
                <button class="row-play" data-action="play-row" aria-label="Reproducir">${icon('play')}</button></span>
              <span class="col-title">${opts.hideCover ? '' : trackCover(t)}
                <span class="t-text"><span class="t-title">${esc(t.title)}</span>
                <a class="t-artist" href="#/artist/${ar.id}">${esc(ar.name)}</a></span></span>
              <a class="col-album" href="#/album/${al.id}">${esc(al.title)}</a>
              <button class="icon-btn like ${isLiked(t.id) ? 'on' : ''}" data-action="like" data-id="${t.id}" aria-label="Me gusta">
                ${icon(isLiked(t.id) ? 'heartFill' : 'heart')}</button>
              <span class="col-dur">${fmtTime(t.duration)}</span>
              <button class="icon-btn row-more" data-action="track-menu" data-id="${t.id}" aria-label="Más opciones">${icon('more')}</button>
            </div>`;
        }).join('')}
      </div>`;
  }

  function collectionHeader(ctx, extraMeta = '') {
    return `
      <header class="collection-head" style="--h:${ctx.hue}">
        ${coverArt(ctx, 'xl')}
        <div class="head-text">
          <span class="head-type">${esc(ctx.type)}</span>
          <h1 class="${ctx.title.length > 18 ? 'long' : ''}">${esc(ctx.title)}</h1>
          ${ctx.description ? `<p class="head-desc">${esc(ctx.description)}</p>` : ''}
          <p class="head-meta">${extraMeta}</p>
        </div>
      </header>`;
  }

  function actionBar(ctx, { saveable = true } = {}) {
    const saved = isSaved(ctx.key);
    return `
      <div class="action-bar">
        <button class="play-big" data-action="play-list" data-list="${esc(ctx.key)}" aria-label="Reproducir">${icon('play')}</button>
        <button class="icon-btn big ${state.shuffle ? 'on' : ''}" data-action="shuffle" aria-label="Aleatorio">${icon('shuffle')}</button>
        ${saveable ? `<button class="icon-btn big like ${saved ? 'on' : ''}" data-action="save" data-key="${esc(ctx.key)}"
          aria-label="${saved ? 'Quitar de tu biblioteca' : 'Guardar en tu biblioteca'}" title="${saved ? 'Quitar de tu biblioteca' : 'Guardar en tu biblioteca'}">
          ${icon(saved ? 'heartFill' : 'heart')}</button>` : ''}
        ${ctx.editable ? `<button class="icon-btn big" data-action="playlist-menu" data-id="${ctx.id}" aria-label="Opciones">${icon('more')}</button>` : ''}
      </div>`;
  }

  function renderCollection(key) {
    const ctx = getContext(key);
    if (!ctx) return renderNotFound();
    const meta = ctx.type === 'Álbum'
      ? `<a href="#/artist/${ctx.artist.id}"><b>${esc(ctx.artist.name)}</b></a> · ${ctx.year} · ${pluralSongs(ctx.trackIds.length)}, ${totalDuration(ctx.trackIds)}`
      : `<b>${esc(ctx.owner || 'Tú')}</b> · ${pluralSongs(ctx.trackIds.length)}${ctx.trackIds.length ? `, ${totalDuration(ctx.trackIds)}` : ''}`;
    view.innerHTML = `
      <div class="collection" style="--h:${ctx.hue}">
        ${collectionHeader(ctx, meta)}
        <div class="collection-body">
          ${actionBar(ctx, { saveable: !ctx.liked && !ctx.editable && ctx.type !== 'Género' })}
          ${trackRows(ctx.trackIds, key, {
            hideAlbum: ctx.type === 'Álbum', hideCover: ctx.type === 'Álbum',
            emptyTitle: ctx.liked ? 'Las canciones que te gusten aparecerán aquí' : 'Empecemos a llenar tu playlist',
            emptyText: ctx.liked ? 'Toca el corazón de cualquier canción para guardarla.' : undefined,
          })}
          ${ctx.type === 'Álbum' ? `<p class="fine-print">© ${ctx.year} ${esc(ctx.artist.name)} · Música generada por Sonora</p>` : ''}
        </div>
      </div>`;
  }

  function renderArtist(id) {
    const ctx = getContext(`artist:${id}`);
    if (!ctx) return renderNotFound();
    const ar = artistById.get(id);
    const saved = isSaved(ctx.key);
    view.innerHTML = `
      <div class="collection artist" style="--h:${ctx.hue}">
        <header class="artist-hero" style="--h:${ctx.hue}">
          <span class="verified">${icon('check')} Artista verificado</span>
          <h1>${esc(ar.name)}</h1>
          <p>${fmtNum(ar.listeners)} oyentes mensuales</p>
        </header>
        <div class="collection-body">
          <div class="action-bar">
            <button class="play-big" data-action="play-list" data-list="${ctx.key}" aria-label="Reproducir">${icon('play')}</button>
            <button class="outline-btn" data-action="save" data-key="${ctx.key}">${saved ? 'Siguiendo' : 'Seguir'}</button>
          </div>
          <h2>Populares</h2>
          ${trackRows(ctx.trackIds.slice(0, 5), ctx.key, { hideAlbum: false })}
          ${shelf('Discografía', albums.filter((a) => a.artist === id).map((a) => `album:${a.id}`))}
          ${shelf('A los fans también les gusta', artists.filter((a) => a.id !== id && a.genre === ar.genre)
            .concat(artists.filter((a) => a.id !== id && a.genre !== ar.genre)).slice(0, 5).map((a) => `artist:${a.id}`))}
        </div>
      </div>`;
  }

  function renderSearch() {
    view.innerHTML = '<div class="search-view" id="search-results"></div>';
    renderSearchResults();
  }

  function renderSearchResults() {
    const box = $('#search-results');
    if (!box) return;
    const q = searchQuery.trim();
    if (!q) {
      box.innerHTML = `
        <h2>Explorar todo</h2>
        <div class="genre-grid">
          ${genres.map((g) => `<a class="genre-tile" href="#/genre/${g.id}" style="--h:${g.hue}">
            <span>${esc(g.name)}</span>${coverArt(getContext(`genre:${g.id}`), 'tile-cover')}</a>`).join('')}
          ${playlists.map((p) => `<a class="genre-tile" href="#/playlist/${p.id}" style="--h:${p.hue}">
            <span>${esc(p.name)}</span>${coverArt(getContext(`playlist:${p.id}`), 'tile-cover')}</a>`).join('')}
        </div>`;
      return;
    }
    const res = searchResults(q);
    const total = res.tracks.length + res.artists.length + res.albums.length + res.playlists.length;
    if (!total) {
      box.innerHTML = `<div class="empty">${icon('search')}<h3>No se encontraron resultados para "${esc(q)}"</h3>
        <p>Revisa la ortografía o prueba con otras palabras.</p></div>`;
      return;
    }
    const top = res.artists[0] ? getContext(`artist:${res.artists[0].id}`)
      : res.albums[0] ? getContext(`album:${res.albums[0].id}`)
      : res.playlists[0] ? getContext(`playlist:${res.playlists[0].id}`)
      : getContext(`album:${trackById.get(res.tracks[0]).album}`);
    const key = `search:${q}`;
    box.innerHTML = `
      <div class="search-top">
        <section>
          <h2>Resultado principal</h2>
          <a class="top-result" href="${top.href}">
            ${coverArt(top, 'lg')}
            <div class="top-title">${esc(top.title)}</div>
            <div class="card-sub"><span class="tag">${esc(top.type)}</span></div>
            <button class="card-play" data-action="play-list" data-list="${esc(top.key)}" aria-label="Reproducir">${icon('play')}</button>
          </a>
        </section>
        ${res.tracks.length ? `<section class="top-songs"><h2>Canciones</h2>${trackRows(res.tracks.slice(0, 5), key, { hideAlbum: true })}</section>` : ''}
      </div>
      ${shelf('Artistas', res.artists.map((a) => `artist:${a.id}`))}
      ${shelf('Álbumes', res.albums.map((a) => `album:${a.id}`))}
      ${shelf('Playlists', res.playlists.map((p) => `playlist:${p.id}`))}`;
    refreshPlayingMarks();
  }

  function libraryKeys() {
    const f = state.libraryFilter;
    const keys = ['liked', ...state.userPlaylists.map((p) => `playlist:${p.id}`), ...state.saved].filter((k) => getContext(k));
    if (f === 'all') return keys;
    const map = { playlist: ['liked', 'playlist'], album: ['album'], artist: ['artist'] };
    return keys.filter((k) => map[f].includes(k.split(':')[0]));
  }

  function renderLibraryView() {
    view.innerHTML = `
      <div class="library-view">
        <div class="library-view-head">
          <h1>Tu biblioteca</h1>
          <button class="pill-btn" data-action="create-playlist">${icon('plus')} Crear playlist</button>
        </div>
        ${filterChips()}
        <div class="grid">${libraryKeys().map(card).join('')}</div>
      </div>`;
  }

  function renderNotFound() {
    view.innerHTML = `<div class="empty">${icon('music')}<h3>No encontramos esta página</h3>
      <a class="pill-btn" href="#/home">Volver al inicio</a></div>`;
  }

  // ---------------------------------------------------------------- Barra lateral
  function filterChips() {
    const opts = [['all', 'Todo'], ['playlist', 'Playlists'], ['album', 'Álbumes'], ['artist', 'Artistas']];
    return `<div class="chips">${opts.map(([v, l]) =>
      `<button class="chip ${state.libraryFilter === v ? 'on' : ''}" data-action="filter" data-value="${v}">${l}</button>`).join('')}</div>`;
  }

  function renderSidebar() {
    $('#library-filters').outerHTML = `<div id="library-filters">${filterChips()}</div>`;
    $('#library-list').innerHTML = libraryKeys().map((k) => {
      const ctx = getContext(k);
      const sub = ctx.type === 'Artista' ? 'Artista' : ctx.type === 'Álbum' ? `Álbum · ${ctx.artist.name}` : ctx.subtitle;
      const active = location.hash === ctx.href;
      return `<li><a class="library-item ${active ? 'active' : ''} ${k === player.contextKey ? 'active-ctx' : ''}" href="${ctx.href}" data-key="${esc(k)}">
        ${coverArt(ctx, 'sm')}<span class="li-text"><span class="li-title">${esc(ctx.title)}</span>
        <span class="li-sub">${esc(sub)}</span></span>${icon('volume', 'li-playing')}</a></li>`;
    }).join('');
    $$('.nav-link').forEach((a) => a.classList.toggle('active', a.dataset.route === currentRoute.name));
  }

  // ---------------------------------------------------------------- Cola
  function renderQueue() {
    const box = $('#queue-content');
    const cur = trackById.get(player.current);
    const row = (id, label, extra = '') => {
      const t = trackById.get(id);
      const ar = artistById.get(t.artist);
      return `<button class="queue-item ${extra}" data-action="${label}">${trackCover(t)}
        <span class="li-text"><span class="li-title">${esc(t.title)}</span><span class="li-sub">${esc(ar.name)}</span></span></button>`;
    };
    const upcoming = player.order.slice(player.pos + 1, player.pos + 21).map((i) => player.list[i]);
    const ctx = player.contextKey ? getContext(player.contextKey) : null;
    box.innerHTML = cur ? `
      <h3>Sonando ahora</h3>${row(cur.id, 'noop', 'current')}
      ${player.manual.length ? `<h3>Siguiente en la cola</h3>${player.manual.map((id, i) =>
        row(id, 'noop').replace('data-action="noop"', `data-action="queue-manual" data-index="${i}"`)).join('')}` : ''}
      ${upcoming.length ? `<h3>Siguiente de: ${esc(ctx ? ctx.title : '')}</h3>${upcoming.map((id, i) =>
        row(id, 'noop').replace('data-action="noop"', `data-action="queue-jump" data-offset="${i + 1}"`)).join('')}` : ''}
    ` : '<div class="empty small"><p>Tu cola está vacía. Reproduce algo para empezar.</p></div>';
  }

  // ---------------------------------------------------------------- Menús, diálogos y avisos
  const menu = $('#menu');
  function openMenu(anchor, items) {
    menu.innerHTML = items.map((it) => it.sep ? '<hr />'
      : it.label ? `<div class="menu-label">${esc(it.label)}</div>`
      : `<button class="menu-item" data-action="${it.action}" ${Object.entries(it.data || {}).map(([k, v]) => `data-${k}="${esc(v)}"`).join(' ')}>
          ${it.icon ? icon(it.icon) : ''}<span>${esc(it.text)}</span></button>`).join('');
    menu.hidden = false;
    const r = anchor.getBoundingClientRect();
    const mw = menu.offsetWidth, mh = menu.offsetHeight;
    let left = Math.min(r.right - mw, window.innerWidth - mw - 8);
    let top = r.bottom + 4;
    if (top + mh > window.innerHeight - 8) top = Math.max(8, r.top - mh - 4);
    menu.style.left = `${Math.max(8, left)}px`;
    menu.style.top = `${top}px`;
  }
  const closeMenu = () => { menu.hidden = true; };

  function trackMenu(anchor, trackId, listKey) {
    const t = trackById.get(trackId);
    const items = [
      { action: 'add-queue', text: 'Añadir a la cola', icon: 'queue', data: { id: trackId } },
      { action: 'like', text: isLiked(trackId) ? 'Quitar de Me gusta' : 'Guardar en Me gusta', icon: isLiked(trackId) ? 'heartFill' : 'heart', data: { id: trackId } },
      { action: 'go', text: 'Ir al artista', icon: 'user', data: { href: `#/artist/${t.artist}` } },
      { action: 'go', text: 'Ir al álbum', icon: 'music', data: { href: `#/album/${t.album}` } },
    ];
    const [type, plId] = (listKey || '').split(':');
    if (type === 'playlist' && userPlaylist(plId)) {
      items.push({ action: 'remove-from-playlist', text: 'Quitar de esta playlist', icon: 'trash', data: { id: trackId, playlist: plId } });
    }
    items.push({ sep: true }, { label: 'Añadir a playlist' },
      { action: 'new-playlist-with', text: 'Nueva playlist', icon: 'plus', data: { id: trackId } },
      ...state.userPlaylists.map((p) => ({ action: 'add-to-playlist', text: p.name, data: { id: trackId, playlist: p.id } })));
    openMenu(anchor, items);
  }

  function playlistDialog(pl, onSave) {
    const dlg = document.createElement('dialog');
    dlg.className = 'dialog';
    dlg.innerHTML = `
      <form method="dialog">
        <h2>${pl ? 'Editar detalles' : 'Crear playlist'}</h2>
        <label>Nombre<input name="pl-name" maxlength="80" required value="${esc(pl ? pl.name : `Mi playlist n.º ${state.userPlaylists.length + 1}`)}" /></label>
        <label>Descripción<textarea name="pl-desc" maxlength="300" rows="3" placeholder="Añade una descripción opcional">${esc(pl ? pl.description : '')}</textarea></label>
        <div class="dialog-actions">
          <button type="button" class="text-btn" value="cancel">Cancelar</button>
          <button class="pill-btn primary" value="ok">Guardar</button>
        </div>
      </form>`;
    document.body.appendChild(dlg);
    const form = $('form', dlg);
    $('.text-btn', dlg).addEventListener('click', () => dlg.close());
    form.addEventListener('submit', () => {
      const name = form.elements['pl-name'].value.trim();
      if (name) onSave({ name, description: form.elements['pl-desc'].value.trim() });
    });
    dlg.addEventListener('close', () => dlg.remove());
    dlg.showModal();
    form.elements['pl-name'].select();
  }

  function createPlaylist(initialTrack) {
    playlistDialog(null, ({ name, description }) => {
      const pl = { id: `u${Date.now().toString(36)}`, name, description, hue: Math.floor(Math.random() * 360),
        trackIds: initialTrack ? [initialTrack] : [], owner: 'Tú' };
      state.userPlaylists.unshift(pl);
      save();
      toast(`Playlist "${name}" creada`);
      if (initialTrack) refresh();
      else location.hash = `#/playlist/${pl.id}`;
    });
  }

  let toastTimer;
  function toast(msg) {
    const el = $('#toast');
    el.textContent = msg;
    el.hidden = false;
    el.classList.remove('show');
    void el.offsetWidth;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.hidden = true; }, 2600);
  }

  // ---------------------------------------------------------------- Router
  function parseRoute() {
    const [, name = 'home', ...rest] = location.hash.replace(/^#/, '').split('/');
    return { name: name || 'home', param: decodeURIComponent(rest.join('/')) };
  }

  function route() {
    currentRoute = parseRoute();
    const { name, param } = currentRoute;
    const searchBox = $('#search-box');
    searchBox.hidden = name !== 'search';
    switch (name) {
      case 'home': renderHome(); break;
      case 'search': renderSearch(); break;
      case 'library': renderLibraryView(); break;
      case 'liked': renderCollection('liked'); break;
      case 'playlist': renderCollection(`playlist:${param}`); break;
      case 'album': renderCollection(`album:${param}`); break;
      case 'genre': renderCollection(`genre:${param}`); break;
      case 'artist': renderArtist(param); break;
      default: renderNotFound();
    }
    const hue = view.firstElementChild?.style.getPropertyValue('--h');
    $('#topbar').style.setProperty('--h', hue || 140);
    renderSidebar();
    refreshPlayingMarks();
    if (name === 'search' && !matchMedia('(hover: none)').matches) $('#search-input').focus();
  }

  // Re-render conservando la posición de scroll (tras cambios de estado).
  function refresh() {
    const y = main.scrollTop;
    if (currentRoute.name === 'search') {
      renderSearchResults();
      renderSidebar();
    } else route();
    main.scrollTop = y;
    updatePlayerUI();
  }

  function navigate() {
    route();
    main.scrollTop = 0;
  }

  // ---------------------------------------------------------------- Eventos
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-action]');
    if (!menu.hidden && !e.target.closest('#menu')) closeMenu();
    if (!el) return;
    const { action } = el.dataset;
    const d = el.dataset;
    if (el.closest('a') && action !== 'go') e.preventDefault();
    switch (action) {
      case 'toggle-play': togglePlay(); break;
      case 'next': next(); break;
      case 'prev': prev(); break;
      case 'shuffle': toggleShuffle(); refresh(); break;
      case 'repeat': cycleRepeat(); break;
      case 'back': history.back(); break;
      case 'forward': history.forward(); break;
      case 'mute':
        if (audio.volume > 0) { lastVolume = audio.volume; setVolume(0); } else setVolume(lastVolume || 0.8);
        break;
      case 'like': toggleLike(d.id); closeMenu(); break;
      case 'play-list':
        e.stopPropagation();
        if (player.contextKey === d.list && player.current) togglePlay();
        else playContext(d.list);
        break;
      case 'play-row': {
        const row = el.closest('.track-row');
        playRow(row);
        break;
      }
      case 'track-menu': {
        e.stopPropagation();
        const row = el.closest('.track-row');
        trackMenu(el, d.id, row && row.dataset.list);
        break;
      }
      case 'add-queue':
        player.manual.push(d.id);
        toast('Añadida a la cola');
        closeMenu();
        updatePlayerUI();
        break;
      case 'go': closeMenu(); location.hash = d.href; break;
      case 'add-to-playlist': {
        const pl = userPlaylist(d.playlist);
        closeMenu();
        if (pl.trackIds.includes(d.id)) return toast(`Ya está en "${pl.name}"`);
        pl.trackIds.push(d.id);
        save();
        toast(`Añadida a "${pl.name}"`);
        refresh();
        break;
      }
      case 'remove-from-playlist': {
        const pl = userPlaylist(d.playlist);
        pl.trackIds = pl.trackIds.filter((x) => x !== d.id);
        save();
        closeMenu();
        toast(`Quitada de "${pl.name}"`);
        refresh();
        break;
      }
      case 'new-playlist-with': closeMenu(); createPlaylist(d.id); break;
      case 'create-playlist': createPlaylist(); break;
      case 'playlist-menu':
        e.stopPropagation();
        openMenu(el, [
          { action: 'edit-playlist', text: 'Editar detalles', icon: 'edit', data: { id: d.id } },
          { action: 'delete-playlist', text: 'Eliminar playlist', icon: 'trash', data: { id: d.id } },
        ]);
        break;
      case 'edit-playlist': {
        closeMenu();
        const pl = userPlaylist(d.id);
        playlistDialog(pl, ({ name, description }) => {
          Object.assign(pl, { name, description });
          save();
          refresh();
        });
        break;
      }
      case 'delete-playlist': {
        closeMenu();
        const pl = userPlaylist(d.id);
        if (!confirm(`¿Eliminar "${pl.name}" de tu biblioteca?`)) return;
        state.userPlaylists = state.userPlaylists.filter((p) => p.id !== d.id);
        state.recent = state.recent.filter((k) => k !== `playlist:${d.id}`);
        save();
        toast('Playlist eliminada');
        location.hash = '#/library';
        break;
      }
      case 'save': {
        const k = d.key;
        state.saved = isSaved(k) ? state.saved.filter((x) => x !== k) : [...state.saved, k];
        save();
        toast(isSaved(k) ? 'Guardado en tu biblioteca' : 'Eliminado de tu biblioteca');
        refresh();
        break;
      }
      case 'filter':
        state.libraryFilter = d.value;
        save();
        if (currentRoute.name === 'library') renderLibraryView();
        renderSidebar();
        break;
      case 'toggle-queue': {
        const panel = $('#queue-panel');
        panel.hidden = !panel.hidden;
        $('#btn-queue').classList.toggle('on', !panel.hidden);
        document.querySelector('.app').classList.toggle('with-queue', !panel.hidden);
        if (!panel.hidden) renderQueue();
        break;
      }
      case 'queue-jump':
        player.pos += Number(d.offset);
        loadTrack(player.list[player.order[player.pos]]);
        break;
      case 'queue-manual': {
        const [id] = player.manual.splice(Number(d.index), 1);
        loadTrack(id);
        break;
      }
      default: break;
    }
  });

  function playRow(row) {
    const key = row.dataset.list;
    const index = Number(row.dataset.index);
    if (player.current === row.dataset.id && player.contextKey === key) return togglePlay();
    const ctx = getContext(key);
    // La fila puede pertenecer a una vista recortada (p. ej. "Populares"): buscamos su índice real.
    const realIndex = ctx.trackIds[index] === row.dataset.id ? index : ctx.trackIds.indexOf(row.dataset.id);
    playContext(key, Math.max(0, realIndex));
  }

  // Doble clic (escritorio) o toque (móvil) en una fila reproduce la canción.
  view.addEventListener('dblclick', (e) => {
    const row = e.target.closest('.track-row');
    if (row && !e.target.closest('a, button')) playRow(row);
  });
  view.addEventListener('click', (e) => {
    const row = e.target.closest('.track-row');
    if (row && matchMedia('(hover: none)').matches && !e.target.closest('a, button')) playRow(row);
  });
  view.addEventListener('keydown', (e) => {
    const row = e.target.closest('.track-row');
    if (row && e.key === 'Enter') playRow(row);
  });

  $('#search-input').addEventListener('input', (e) => {
    searchQuery = e.target.value;
    renderSearchResults();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenu();
    if (e.target.matches('input, textarea') || e.target.closest('dialog')) return;
    if (e.code === 'Space' && !e.target.matches('button, a, .track-row')) { e.preventDefault(); togglePlay(); }
    if (e.altKey && e.key === 'ArrowRight') next();
    if (e.altKey && e.key === 'ArrowLeft') prev();
  });

  main.addEventListener('scroll', () => $('#topbar').classList.toggle('scrolled', main.scrollTop > 60));
  window.addEventListener('resize', closeMenu);
  main.addEventListener('scroll', closeMenu);
  window.addEventListener('hashchange', navigate);

  // ---------------------------------------------------------------- Inicio
  hydrateIcons();
  if (!location.hash) history.replaceState(null, '', '#/home');
  route();
  updatePlayerUI();
})();
