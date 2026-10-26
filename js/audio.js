// Motor de música procedural: cada canción se sintetiza con Web Audio
// (OfflineAudioContext) a partir de su semilla y su género, y se convierte
// en un WAV que reproduce un <audio> normal (seek, pausa, volumen gratis).
(function () {
  const SAMPLE_RATE = 22050;
  const MAX_CACHE = 8;

  const PROFILES = {
    synthwave: { bpm: [88, 108], minor: true, pad: 'sawtooth', lead: 'square', bass: 'sawtooth',
      drums: 'basic', arp: true, padCutoff: 1800, sevenths: false, barsPerChord: 1 },
    pop: { bpm: [100, 124], minor: false, pad: 'triangle', lead: 'square', bass: 'triangle',
      drums: 'basic', arp: false, padCutoff: 2600, sevenths: false, barsPerChord: 1 },
    lofi: { bpm: [70, 86], minor: false, pad: 'triangle', lead: 'sine', bass: 'sine',
      drums: 'lofi', arp: false, padCutoff: 1100, sevenths: true, barsPerChord: 1, crackle: true, swing: 0.18 },
    electronica: { bpm: [120, 130], minor: true, pad: 'sawtooth', lead: 'sawtooth', bass: 'sawtooth',
      drums: 'house', arp: true, padCutoff: 1400, sevenths: false, barsPerChord: 1 },
    ambient: { bpm: [60, 72], minor: false, pad: 'sine', lead: 'sine', bass: 'sine',
      drums: 'none', arp: false, padCutoff: 900, sevenths: true, barsPerChord: 2, sparse: true },
    reggaeton: { bpm: [88, 96], minor: true, pad: 'triangle', lead: 'square', bass: 'sine',
      drums: 'dembow', arp: false, padCutoff: 1600, sevenths: false, barsPerChord: 1 },
    rock: { bpm: [112, 140], minor: false, pad: 'sawtooth', lead: 'sawtooth', bass: 'sawtooth',
      drums: 'rock', arp: false, padCutoff: 2400, sevenths: false, barsPerChord: 1, distortion: true },
  };

  // Progresiones en grados de la escala (0 = tónica).
  const PROGRESSIONS = [
    [0, 4, 5, 3], [0, 5, 3, 4], [5, 3, 0, 4], [0, 3, 4, 3],
    [0, 5, 1, 4], [3, 4, 0, 0], [0, 2, 5, 4], [5, 4, 3, 4],
  ];
  const MAJOR = [0, 2, 4, 5, 7, 9, 11];
  const MINOR = [0, 2, 3, 5, 7, 8, 10];

  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

  function degreeToMidi(root, scale, degree) {
    const oct = Math.floor(degree / 7);
    const idx = ((degree % 7) + 7) % 7;
    return root + scale[idx] + 12 * oct;
  }

  function makeNoise(ctx) {
    const buf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  }

  function distortionCurve(amount) {
    const n = 1024, curve = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const x = (i * 2) / n - 1;
      curve[i] = ((3 + amount) * x * 20 * (Math.PI / 180)) / (Math.PI + amount * Math.abs(x));
    }
    return curve;
  }

  function tone(ctx, dest, { type, freq, t, len, vol, attack = 0.01, release = 0.1, detune = 0 }) {
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.value = freq;
    osc.detune.value = detune;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + attack);
    g.gain.setValueAtTime(vol, t + Math.max(attack, len - release));
    g.gain.linearRampToValueAtTime(0, t + len);
    osc.connect(g).connect(dest);
    osc.onended = () => g.disconnect();
    osc.start(t);
    osc.stop(t + len + 0.02);
  }

  function kick(ctx, dest, t, vol = 0.9) {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(42, t + 0.12);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
    osc.connect(g).connect(dest);
    osc.onended = () => g.disconnect();
    osc.start(t);
    osc.stop(t + 0.36);
  }

  // `dest` es un bus con el filtro ya aplicado (ver drumBuses).
  function noiseHit(ctx, dest, noise, t, { len, vol }) {
    const src = ctx.createBufferSource();
    src.buffer = noise;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + len);
    src.connect(g).connect(dest);
    src.onended = () => g.disconnect();
    src.start(t, Math.random() * 0.5);
    src.stop(t + len + 0.01);
  }

  function drumBuses(ctx, dest) {
    const make = (type, freq, q) => {
      const f = ctx.createBiquadFilter();
      f.type = type;
      f.frequency.value = freq;
      f.Q.value = q;
      f.connect(dest);
      return f;
    };
    return { snare: make('bandpass', 1800, 0.8), hat: make('highpass', 7000, 1), body: dest };
  }

  const snare = (ctx, buses, noise, t, vol = 0.5) => {
    noiseHit(ctx, buses.snare, noise, t, { len: 0.18, vol });
    tone(ctx, buses.body, { type: 'triangle', freq: 190, t, len: 0.08, vol: vol * 0.5, attack: 0.002, release: 0.06 });
  };
  const hat = (ctx, buses, noise, t, vol = 0.18, open = false) =>
    noiseHit(ctx, buses.hat, noise, t, { len: open ? 0.22 : 0.05, vol });

  // Patrones de batería en semicorcheas (16 pasos por compás).
  const DRUMS = {
    basic: { kick: [0, 8, 10], snare: [4, 12], hat: [0, 2, 4, 6, 8, 10, 12, 14] },
    house: { kick: [0, 4, 8, 12], snare: [4, 12], hat: [2, 6, 10, 14], openHat: true },
    dembow: { kick: [0, 4, 8, 12], snare: [3, 6, 11, 14], hat: [0, 2, 4, 6, 8, 10, 12, 14] },
    rock: { kick: [0, 6, 8, 10], snare: [4, 12], hat: [0, 2, 4, 6, 8, 10, 12, 14] },
    lofi: { kick: [0, 7, 10], snare: [4, 12], hat: [0, 2, 4, 6, 8, 10, 12, 14] },
  };

  function makeMotif(r, sparse) {
    const steps = [];
    const density = sparse ? 0.12 : 0.42;
    for (let s = 0; s < 16; s++) {
      if (s % 2 === 0 ? r() < density + 0.15 : r() < density * 0.5) {
        steps.push({ s, deg: Math.floor(r() * 8) - 1, len: 1 + Math.floor(r() * 3) });
      }
    }
    return steps;
  }

  async function renderBuffer(track) {
    const p = PROFILES[track.genre] || PROFILES.pop;
    const r = mulberry32(track.seed);
    const dur = track.duration;
    const ctx = new OfflineAudioContext(1, Math.ceil(SAMPLE_RATE * dur), SAMPLE_RATE);
    const noise = makeNoise(ctx);

    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.ratio.value = 4;
    const master = ctx.createGain();
    master.gain.setValueAtTime(0, 0);
    master.gain.linearRampToValueAtTime(0.7, 1.5);
    master.gain.setValueAtTime(0.7, dur - 3);
    master.gain.linearRampToValueAtTime(0, dur);
    master.connect(comp).connect(ctx.destination);

    // Eco simple para dar espacio.
    const delay = ctx.createDelay(2);
    const fb = ctx.createGain();
    const wet = ctx.createGain();
    fb.gain.value = 0.35;
    wet.gain.value = p.drums === 'none' ? 0.5 : 0.22;
    delay.connect(fb).connect(delay);
    delay.connect(wet).connect(master);

    let harmonyBus = master;
    if (p.distortion) {
      const ws = ctx.createWaveShaper();
      ws.curve = distortionCurve(60);
      ws.oversample = '2x';
      const post = ctx.createGain();
      post.gain.value = 0.5;
      ws.connect(post).connect(master);
      harmonyBus = ws;
    }

    // Buses compartidos: un filtro por instrumento en lugar de uno por nota.
    const bus = (cutoff, outs) => {
      const f = ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = cutoff;
      outs.forEach(([node, gain]) => {
        const g = ctx.createGain();
        g.gain.value = gain;
        f.connect(g).connect(node);
      });
      return f;
    };
    const drums = drumBuses(ctx, master);
    const padBus = bus(p.padCutoff, [[harmonyBus, 1]]);
    const bassBus = bus(500, [[harmonyBus, 1]]);
    const arpBus = bus(2500, [[master, 1], [delay, 0.8]]);
    const leadBus = bus(3000, [[master, 1], [delay, 0.6]]);

    const bpm = p.bpm[0] + r() * (p.bpm[1] - p.bpm[0]);
    const step = 60 / bpm / 4;
    delay.delayTime.value = step * 3;
    const root = 45 + Math.floor(r() * 10);
    const scale = p.minor ? MINOR : MAJOR;
    const prog = PROGRESSIONS[Math.floor(r() * PROGRESSIONS.length)];
    const motifs = [makeMotif(r, p.sparse), makeMotif(r, p.sparse)];
    const form = [0, 0, 1, 0];
    const totalBars = Math.floor(dur / (step * 16));
    const pattern = DRUMS[p.drums];
    const swing = p.swing || 0;

    if (p.crackle) {
      const src = ctx.createBufferSource();
      src.buffer = noise;
      src.loop = true;
      const f = ctx.createBiquadFilter();
      f.type = 'bandpass';
      f.frequency.value = 3000;
      const g = ctx.createGain();
      g.gain.value = 0.015;
      src.connect(f).connect(g).connect(master);
      src.start(0);
    }

    function scheduleBar(bar) {
      const barT = bar * 16 * step;
      const chordDeg = prog[Math.floor(bar / p.barsPerChord) % prog.length];
      const intro = bar < 2;
      const outro = bar >= totalBars - 2;
      const section = Math.floor(bar / 4) % form.length;

      // Acorde (pad)
      if (bar % p.barsPerChord === 0) {
        const chordLen = 16 * step * p.barsPerChord;
        const voices = p.sevenths ? [0, 2, 4, 6] : [0, 2, 4];
        voices.forEach((v) => {
          const f = mtof(degreeToMidi(root + 12, scale, chordDeg + v));
          [-7, 7].forEach((det) =>
            tone(ctx, padBus, { type: p.pad, freq: f, t: barT, len: chordLen, vol: 0.045,
              attack: p.sparse ? 1.2 : 0.08, release: p.sparse ? 1.2 : 0.2, detune: det }));
        });
      }

      // Bajo
      const bassF = mtof(degreeToMidi(root - 12, scale, chordDeg));
      const bassSteps = p.drums === 'house' ? [2, 6, 10, 14] : p.sparse ? [0] : [0, 6, 8, 14];
      bassSteps.forEach((s) =>
        tone(ctx, bassBus, { type: p.bass, freq: bassF, t: barT + s * step,
          len: p.sparse ? 16 * step * p.barsPerChord : step * 2, vol: 0.2, release: 0.05 }));

      // Arpegio
      if (p.arp && !intro) {
        for (let s = 0; s < 16; s++) {
          const deg = chordDeg + [0, 2, 4, 7][s % 4];
          tone(ctx, arpBus, { type: 'square', freq: mtof(degreeToMidi(root + 24, scale, deg)),
            t: barT + s * step, len: step * 0.9, vol: 0.03, release: 0.03 });
        }
      }

      // Melodía
      if (!intro && !outro) {
        motifs[form[section]].forEach(({ s, deg, len }) => {
          const swingOff = s % 2 === 1 ? swing * step : 0;
          const f = mtof(degreeToMidi(root + 24, scale, chordDeg + deg));
          const opts = { type: p.lead, freq: f, t: barT + s * step + swingOff, len: step * len * (p.sparse ? 3 : 1),
            vol: p.lead === 'sine' ? 0.12 : 0.05, attack: p.sparse ? 0.3 : 0.01, release: 0.08 };
          tone(ctx, leadBus, opts);
        });
      }

      // Batería
      if (pattern && !intro && !outro) {
        const kv = p.drums === 'lofi' ? 0.6 : 0.9;
        pattern.kick.forEach((s) => kick(ctx, master, barT + s * step, kv));
        pattern.snare.forEach((s) => snare(ctx, drums, noise, barT + s * step, p.drums === 'lofi' ? 0.25 : 0.45));
        pattern.hat.forEach((s) => {
          const swingOff = (s / 2) % 2 === 1 ? swing * step * 2 : 0;
          hat(ctx, drums, noise, barT + s * step + swingOff, 0.12 + (s % 4 === 0 ? 0.05 : 0));
        });
        if (pattern.openHat && bar % 2 === 1) hat(ctx, drums, noise, barT + 14 * step, 0.12, true);
        if (bar % 4 === 3) [12, 13, 14, 15].forEach((s) => snare(ctx, drums, noise, barT + s * step, 0.25));
      }
    }

    // Programar todos los nodos de golpe obliga a procesarlos durante toda la
    // canción; en su lugar se suspende el render al inicio de cada compás y se
    // programa el siguiente, así solo existen las notas activas.
    const quantum = (t) => (Math.floor((t * SAMPLE_RATE) / 128) * 128) / SAMPLE_RATE;
    scheduleBar(0);
    if (totalBars > 1) scheduleBar(1);
    for (let bar = 1; bar + 1 < totalBars; bar++) {
      const at = quantum(bar * 16 * step);
      ctx.suspend(at).then(() => {
        scheduleBar(bar + 1);
        ctx.resume();
      });
    }

    return ctx.startRendering();
  }

  function encodeWav(buffer) {
    const data = buffer.getChannelData(0);
    const out = new DataView(new ArrayBuffer(44 + data.length * 2));
    const writeStr = (o, s) => { for (let i = 0; i < s.length; i++) out.setUint8(o + i, s.charCodeAt(i)); };
    writeStr(0, 'RIFF');
    out.setUint32(4, 36 + data.length * 2, true);
    writeStr(8, 'WAVE');
    writeStr(12, 'fmt ');
    out.setUint32(16, 16, true);
    out.setUint16(20, 1, true);
    out.setUint16(22, 1, true);
    out.setUint32(24, buffer.sampleRate, true);
    out.setUint32(28, buffer.sampleRate * 2, true);
    out.setUint16(32, 2, true);
    out.setUint16(34, 16, true);
    writeStr(36, 'data');
    out.setUint32(40, data.length * 2, true);
    for (let i = 0; i < data.length; i++) {
      const v = Math.max(-1, Math.min(1, data[i]));
      out.setInt16(44 + i * 2, v < 0 ? v * 0x8000 : v * 0x7fff, true);
    }
    return new Blob([out.buffer], { type: 'audio/wav' });
  }

  const cache = new Map();

  function getTrackUrl(track) {
    if (cache.has(track.id)) {
      const p = cache.get(track.id);
      cache.delete(track.id);
      cache.set(track.id, p); // LRU: mover al final
      return p;
    }
    const promise = renderBuffer(track).then((buf) => URL.createObjectURL(encodeWav(buf)));
    cache.set(track.id, promise);
    while (cache.size > MAX_CACHE) {
      const [oldId, oldPromise] = cache.entries().next().value;
      cache.delete(oldId);
      oldPromise.then((url) => URL.revokeObjectURL(url)).catch(() => {});
    }
    promise.catch(() => cache.delete(track.id));
    return promise;
  }

  window.SonoraAudio = { getTrackUrl };
})();
