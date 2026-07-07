import { useCallback, useEffect, useState } from 'react';

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

// --- Singleton audio state (shared across all hook instances) ---
let audioContext = null;
let musicSource = null;
let musicGainNode = null;
let cachedBuffers = {};
let currentMuted = loadPreferences().muted;
let currentVolume = loadPreferences().volume;
let currentMusicVolume = loadPreferences().musicVolume;
const listeners = new Set();

function notifyListeners() {
  listeners.forEach(fn => fn());
}

function getAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
  return audioContext;
}

function updateMusicGain() {
  if (musicGainNode) {
    musicGainNode.gain.value = currentMuted ? 0 : currentMusicVolume * 0.4;
  }
}

async function loadAudioBuffer(url) {
  if (cachedBuffers[url]) return cachedBuffers[url];
  try {
    const ctx = getAudioContext();
    const response = await fetch(url);
    if (!response.ok) return null;
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
    cachedBuffers[url] = audioBuffer;
    return audioBuffer;
  } catch (e) {
    return null;
  }
}

function playSynthetic(soundName) {
  if (currentMuted) return;
  const ctx = getAudioContext();
  const vol = currentVolume;

  switch (soundName) {
    case 'splash': {
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
      const gain = ctx.createGain();
      gain.gain.value = vol * 0.4;
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start();
      noise.stop(ctx.currentTime + duration);
      break;
    }
    case 'explosion': {
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
      const gain = ctx.createGain();
      gain.gain.value = vol * 0.4;
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = 60;
      osc.frequency.exponentialRampToValueAtTime(20, ctx.currentTime + duration);
      const oscGain = ctx.createGain();
      oscGain.gain.value = vol * 0.6;
      oscGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(oscGain);
      oscGain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);

      noise.start();
      noise.stop(ctx.currentTime + duration);
      break;
    }
    case 'sunk': {
      const duration = 1.2;
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = 200;
      osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + duration);
      const oscGain = ctx.createGain();
      oscGain.gain.value = vol * 0.3;
      oscGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(oscGain);
      oscGain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);

      for (let i = 0; i < 5; i++) {
        const bubble = ctx.createOscillator();
        bubble.type = 'sine';
        bubble.frequency.value = 400 + Math.random() * 600;
        const bGain = ctx.createGain();
        bGain.gain.value = vol * 0.15;
        const startTime = ctx.currentTime + 0.3 + i * 0.15;
        bGain.gain.setValueAtTime(vol * 0.15, startTime);
        bGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.1);
        bubble.connect(bGain);
        bGain.connect(ctx.destination);
        bubble.start(startTime);
        bubble.stop(startTime + 0.1);
      }
      break;
    }
    case 'victory': {
      const notes = [523, 659, 784, 1047];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.value = freq;
        const nGain = ctx.createGain();
        nGain.gain.value = vol * 0.3;
        const start = ctx.currentTime + i * 0.2;
        nGain.gain.setValueAtTime(vol * 0.3, start);
        nGain.gain.exponentialRampToValueAtTime(0.001, start + 0.5);
        osc.connect(nGain);
        nGain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.5);
      });
      break;
    }
    case 'defeat': {
      const notes = [150, 120, 90, 60];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = freq;
        const nGain = ctx.createGain();
        nGain.gain.value = vol * 0.5;
        const start = ctx.currentTime + i * 0.3;
        nGain.gain.setValueAtTime(vol * 0.5, start);
        nGain.gain.exponentialRampToValueAtTime(0.001, start + 0.4);
        osc.connect(nGain);
        nGain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.4);
      });
      break;
    }
    case 'click': {
      const duration = 0.05;
      const osc = ctx.createOscillator();
      osc.type = 'square';
      osc.frequency.value = 800;
      const clickGain = ctx.createGain();
      clickGain.gain.value = vol * 0.2;
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
}

async function playSound(soundName) {
  if (currentMuted) return;
  const url = `/sounds/${soundName}.mp3`;
  const buffer = await loadAudioBuffer(url);
  if (!buffer) {
    playSynthetic(soundName);
    return;
  }
  const ctx = getAudioContext();
  const source = ctx.createBufferSource();
  const gainNode = ctx.createGain();
  source.buffer = buffer;
  gainNode.gain.value = currentVolume;
  source.connect(gainNode);
  gainNode.connect(ctx.destination);
  source.start(0);
}

function startMusicInternal() {
  if (musicSource) return; // Já tocando

  const ctx = getAudioContext();

  // Tentar carregar MP3
  loadAudioBuffer('/sounds/ambient.mp3').then(buffer => {
    if (musicSource) return; // Outra chamada já iniciou
    if (buffer) {
      const source = ctx.createBufferSource();
      const gainNode = ctx.createGain();
      source.buffer = buffer;
      source.loop = true;
      gainNode.gain.value = currentMuted ? 0 : currentMusicVolume;
      source.connect(gainNode);
      gainNode.connect(ctx.destination);
      source.start(0);
      musicSource = source;
      musicGainNode = gainNode;
    } else {
      // Fallback: música sintética
      startSyntheticMusicInternal();
    }
  }).catch(() => {
    startSyntheticMusicInternal();
  });
}

function startSyntheticMusicInternal() {
  if (musicSource) return;
  const ctx = getAudioContext();
  const gainNode = ctx.createGain();
  gainNode.gain.value = currentMuted ? 0 : currentMusicVolume * 0.4;
  gainNode.connect(ctx.destination);
  musicGainNode = gainNode;

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

  const lfo = ctx.createOscillator();
  lfo.type = 'sine';
  lfo.frequency.value = 0.1;
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 150;
  lfo.connect(lfoGain);
  lfoGain.connect(filter.frequency);
  lfo.start();

  noise.connect(filter);
  filter.connect(gainNode);
  noise.start();

  musicSource = { noise, lfo, stop: () => { noise.stop(); lfo.stop(); } };
}

function stopMusicInternal() {
  if (musicSource) {
    if (typeof musicSource.stop === 'function') {
      musicSource.stop();
    } else if (musicSource.noise) {
      musicSource.noise.stop();
      musicSource.lfo.stop();
    }
    musicSource = null;
    musicGainNode = null;
  }
}

function toggleMuteInternal() {
  currentMuted = !currentMuted;
  savePreferences({ muted: currentMuted, volume: currentVolume, musicVolume: currentMusicVolume });
  updateMusicGain();
  notifyListeners();
}

// --- Hook ---

/**
 * Hook para gerenciar efeitos sonoros e música ambiente.
 * Usa singleton compartilhado — mute funciona em qualquer componente.
 */
export function useSound() {
  const [muted, setMuted] = useState(currentMuted);

  useEffect(() => {
    const handler = () => {
      setMuted(currentMuted);
    };
    listeners.add(handler);
    return () => listeners.delete(handler);
  }, []);

  const play = useCallback((soundName) => {
    playSound(soundName);
  }, []);

  const startMusic = useCallback(() => {
    startMusicInternal();
  }, []);

  const stopMusic = useCallback(() => {
    stopMusicInternal();
  }, []);

  const toggleMute = useCallback(() => {
    toggleMuteInternal();
  }, []);

  return {
    play,
    startMusic,
    stopMusic,
    toggleMute,
    muted,
    volume: currentVolume,
    musicVolume: currentMusicVolume,
  };
}
