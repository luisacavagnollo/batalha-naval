import { useCallback, useEffect, useRef, useState } from 'react';

const STORAGE_KEY = 'batalha-naval-sound';

function loadPreferences() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return { muted: false, volume: 0.5, musicVolume: 0.3 };
}

function savePreferences(prefs) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}

/**
 * Hook para gerenciar efeitos sonoros e música ambiente.
 * Usa arquivos de áudio de /sounds/ com fallback para Web Audio API sintético.
 */
export function useSound() {
  const [muted, setMuted] = useState(() => loadPreferences().muted);
  const [volume, setVolume] = useState(() => loadPreferences().volume);
  const [musicVolume, setMusicVolume] = useState(() => loadPreferences().musicVolume);

  const audioContextRef = useRef(null);
  const musicRef = useRef(null);
  const musicGainRef = useRef(null);
  const cachedBuffers = useRef({});

  // Inicializar AudioContext (lazy, precisa de interação do user)
  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
    return audioContextRef.current;
  }, []);

  // Salvar preferências quando mudam
  useEffect(() => {
    savePreferences({ muted, volume, musicVolume });
  }, [muted, volume, musicVolume]);

  // Atualizar volume da música em tempo real
  useEffect(() => {
    if (musicGainRef.current) {
      musicGainRef.current.gain.value = muted ? 0 : musicVolume;
    }
  }, [muted, musicVolume]);

  // Carregar e cachear buffer de áudio
  const loadAudio = useCallback(async (url) => {
    if (cachedBuffers.current[url]) return cachedBuffers.current[url];
    try {
      const ctx = getAudioContext();
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
      cachedBuffers.current[url] = audioBuffer;
      return audioBuffer;
    } catch (e) {
      console.warn('Failed to load audio:', url, e);
      return null;
    }
  }, [getAudioContext]);

  // Tocar efeito sonoro
  const play = useCallback(async (soundName) => {
    if (muted) return;
    const url = `/sounds/${soundName}.mp3`;
    const buffer = await loadAudio(url);
    if (!buffer) {
      // Fallback: gerar som sintético
      playSynthetic(soundName);
      return;
    }
    const ctx = getAudioContext();
    const source = ctx.createBufferSource();
    const gainNode = ctx.createGain();
    source.buffer = buffer;
    gainNode.gain.value = volume;
    source.connect(gainNode);
    gainNode.connect(ctx.destination);
    source.start(0);
  }, [muted, volume, getAudioContext, loadAudio]);

  // Sons sintéticos (fallback quando não há arquivo mp3)
  const playSynthetic = useCallback((soundName) => {
    if (muted) return;
    const ctx = getAudioContext();
    const gain = ctx.createGain();
    gain.gain.value = volume * 0.4;
    gain.connect(ctx.destination);

    switch (soundName) {
      case 'splash': {
        // Ruído branco curto com filtro passa-baixa (water splash)
        const duration = 0.3;
        const bufferSize = ctx.sampleRate * duration;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
        }
        const noise = ctx.createBufferSource();
        noise.buffer = noiseBuffer;
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 800;
        filter.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + duration);
        noise.connect(filter);
        filter.connect(gain);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
        noise.start();
        noise.stop(ctx.currentTime + duration);
        break;
      }
      case 'explosion': {
        // Explosão: ruído + oscilador grave
        const duration = 0.5;
        const bufferSize = ctx.sampleRate * duration;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
        }
        const noise = ctx.createBufferSource();
        noise.buffer = noiseBuffer;
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 1200;
        noise.connect(filter);
        filter.connect(gain);

        // Sub bass
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = 60;
        osc.frequency.exponentialRampToValueAtTime(20, ctx.currentTime + duration);
        const oscGain = ctx.createGain();
        oscGain.gain.value = volume * 0.6;
        oscGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
        osc.connect(oscGain);
        oscGain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + duration);

        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
        noise.start();
        noise.stop(ctx.currentTime + duration);
        break;
      }
      case 'sunk': {
        // Navio afundando: tom descendente + bubbles
        const duration = 1.2;
        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.value = 200;
        osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + duration);
        const oscGain = ctx.createGain();
        oscGain.gain.value = volume * 0.3;
        oscGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
        osc.connect(oscGain);
        oscGain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + duration);

        // Bolhas
        for (let i = 0; i < 5; i++) {
          const bubble = ctx.createOscillator();
          bubble.type = 'sine';
          bubble.frequency.value = 400 + Math.random() * 600;
          const bGain = ctx.createGain();
          bGain.gain.value = volume * 0.15;
          const startTime = ctx.currentTime + 0.3 + i * 0.15;
          bGain.gain.setValueAtTime(volume * 0.15, startTime);
          bGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.1);
          bubble.connect(bGain);
          bGain.connect(ctx.destination);
          bubble.start(startTime);
          bubble.stop(startTime + 0.1);
        }
        break;
      }
      case 'victory': {
        // Fanfarra simples: acordes ascendentes
        const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
        notes.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          osc.type = 'triangle';
          osc.frequency.value = freq;
          const nGain = ctx.createGain();
          nGain.gain.value = volume * 0.3;
          const start = ctx.currentTime + i * 0.2;
          nGain.gain.setValueAtTime(volume * 0.3, start);
          nGain.gain.exponentialRampToValueAtTime(0.001, start + 0.5);
          osc.connect(nGain);
          nGain.connect(ctx.destination);
          osc.start(start);
          osc.stop(start + 0.5);
        });
        break;
      }
      case 'defeat': {
        // Tambores graves descendentes
        const notes = [150, 120, 90, 60];
        notes.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          osc.type = 'sine';
          osc.frequency.value = freq;
          const nGain = ctx.createGain();
          nGain.gain.value = volume * 0.5;
          const start = ctx.currentTime + i * 0.3;
          nGain.gain.setValueAtTime(volume * 0.5, start);
          nGain.gain.exponentialRampToValueAtTime(0.001, start + 0.4);
          osc.connect(nGain);
          nGain.connect(ctx.destination);
          osc.start(start);
          osc.stop(start + 0.4);
        });
        break;
      }
      case 'click': {
        // Click de madeira: impulso curto
        const duration = 0.05;
        const osc = ctx.createOscillator();
        osc.type = 'square';
        osc.frequency.value = 800;
        const clickGain = ctx.createGain();
        clickGain.gain.value = volume * 0.2;
        clickGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
        osc.connect(clickGain);
        clickGain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + duration);
        break;
      }
      default:
        break;
    }
  }, [muted, volume, getAudioContext]);

  // Música ambiente (loop)
  const startMusic = useCallback(async () => {
    if (musicRef.current) return; // Já tocando

    const ctx = getAudioContext();
    const url = '/sounds/ambient.mp3';

    try {
      const buffer = await loadAudio(url);
      if (buffer) {
        const source = ctx.createBufferSource();
        const gainNode = ctx.createGain();
        source.buffer = buffer;
        source.loop = true;
        gainNode.gain.value = muted ? 0 : musicVolume;
        source.connect(gainNode);
        gainNode.connect(ctx.destination);
        source.start(0);
        musicRef.current = source;
        musicGainRef.current = gainNode;
        return;
      }
    } catch {}

    // Fallback: música sintética simples (ondas do mar + tom ambiente)
    startSyntheticMusic();
  }, [muted, musicVolume, getAudioContext, loadAudio]);

  const startSyntheticMusic = useCallback(() => {
    const ctx = getAudioContext();
    const gainNode = ctx.createGain();
    gainNode.gain.value = muted ? 0 : musicVolume * 0.4;
    gainNode.connect(ctx.destination);
    musicGainRef.current = gainNode;

    // Ondas do mar (ruído filtrado com LFO)
    const bufferSize = ctx.sampleRate * 4;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 300;

    // LFO para modulação de volume (simula ondas)
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.1; // Uma onda a cada 10s
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 150;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start();

    noise.connect(filter);
    filter.connect(gainNode);
    noise.start();

    musicRef.current = { noise, lfo, stop: () => { noise.stop(); lfo.stop(); } };
  }, [muted, musicVolume, getAudioContext]);

  const stopMusic = useCallback(() => {
    if (musicRef.current) {
      if (musicRef.current.stop) {
        musicRef.current.stop();
      } else if (musicRef.current instanceof AudioBufferSourceNode) {
        musicRef.current.stop();
      }
      musicRef.current = null;
      musicGainRef.current = null;
    }
  }, []);

  const toggleMute = useCallback(() => {
    setMuted(m => !m);
  }, []);

  const setVolumeLevel = useCallback((v) => {
    setVolume(Math.max(0, Math.min(1, v)));
  }, []);

  const setMusicVolumeLevel = useCallback((v) => {
    setMusicVolume(Math.max(0, Math.min(1, v)));
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      stopMusic();
    };
  }, [stopMusic]);

  return {
    play,
    startMusic,
    stopMusic,
    toggleMute,
    muted,
    volume,
    musicVolume,
    setVolume: setVolumeLevel,
    setMusicVolume: setMusicVolumeLevel,
  };
}
