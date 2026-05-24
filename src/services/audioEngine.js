let audioCtx = null;
let ambientOsc = null;
let ambientGain = null;
let globalVolume = 0.15; // Set low default to be comfortable
let isMuted = true; // Start muted by default to respect browser policies and user comfort, let them enable it!

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export const audioEngine = {
  toggleMute: () => {
    isMuted = !isMuted;
    if (isMuted) {
      audioEngine.stopAmbientHum();
    } else {
      audioEngine.startAmbientHum();
      // Play a quick test sound to show audio is active
      audioEngine.playClick();
    }
    return isMuted;
  },

  getMuteState: () => isMuted,

  setVolume: (vol) => {
    globalVolume = Math.max(0, Math.min(1, vol));
    if (ambientGain) {
      ambientGain.gain.setValueAtTime(globalVolume * 0.1, getAudioContext().currentTime);
    }
  },

  getVolume: () => globalVolume,

  startAmbientHum: () => {
    if (isMuted) return;
    try {
      const ctx = getAudioContext();
      if (ambientOsc) return;

      ambientOsc = ctx.createOscillator();
      ambientGain = ctx.createGain();

      ambientOsc.type = 'sawtooth';
      ambientOsc.frequency.setValueAtTime(55, ctx.currentTime); // Low A hum

      // Low pass filter to make it a deep sci-fi rumble instead of harsh buzz
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(80, ctx.currentTime);

      ambientGain.gain.setValueAtTime(globalVolume * 0.1, ctx.currentTime);

      ambientOsc.connect(filter);
      filter.connect(ambientGain);
      ambientGain.connect(ctx.destination);

      ambientOsc.start();
    } catch (e) {
      console.warn('AudioEngine: Failed to start ambient hum', e);
    }
  },

  stopAmbientHum: () => {
    try {
      if (ambientOsc) {
        ambientOsc.stop();
        ambientOsc.disconnect();
        ambientOsc = null;
      }
      if (ambientGain) {
        ambientGain.disconnect();
        ambientGain = null;
      }
    } catch (e) {
      console.warn('AudioEngine: Failed to stop ambient hum', e);
    }
  },

  playClick: () => {
    if (isMuted) return;
    try {
      const ctx = getAudioContext();
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1000, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.08);

      gainNode.gain.setValueAtTime(globalVolume * 0.25, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.09);
    } catch (e) {}
  },

  playWarning: () => {
    if (isMuted) return;
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;

      // Play double warning beep
      [0, 0.15].forEach((delay) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(880, now + delay); // A5 note

        gainNode.gain.setValueAtTime(0, now + delay);
        gainNode.gain.linearRampToValueAtTime(globalVolume * 0.35, now + delay + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + delay + 0.12);

        // Low pass filter to warm it up
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2000, now + delay);

        osc.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc.start(now + delay);
        osc.stop(now + delay + 0.13);
      });
    } catch (e) {}
  },

  playCritical: () => {
    if (isMuted) return;
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;

      // Synth sweeping alarm
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc1.type = 'sawtooth';
      osc2.type = 'triangle';

      osc1.frequency.setValueAtTime(440, now);
      osc1.frequency.linearRampToValueAtTime(880, now + 0.2);
      osc1.frequency.linearRampToValueAtTime(440, now + 0.4);

      osc2.frequency.setValueAtTime(444, now); // Detuned for fat chorus effect
      osc2.frequency.linearRampToValueAtTime(884, now + 0.2);
      osc2.frequency.linearRampToValueAtTime(444, now + 0.4);

      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(globalVolume * 0.45, now + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.48);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1500, now);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.5);
      osc2.stop(now + 0.5);
    } catch (e) {}
  },

  speakAlert: (text) => {
    if (isMuted) return;
    try {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.volume = Math.min(1, globalVolume * 2);
        utterance.rate = 1.05;
        utterance.pitch = 0.85;
        
        const voices = window.speechSynthesis.getVoices();
        const idealVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('David') || v.name.includes('Zira')));
        if (idealVoice) {
          utterance.voice = idealVoice;
        }
        
        window.speechSynthesis.speak(utterance);
      }
    } catch (e) {
      console.warn('AudioEngine: Speech synthesis failed', e);
    }
  }
};
