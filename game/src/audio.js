// Procedural WebAudio sounds for Velvet Vault: no audio files, every beep
// is an oscillator built at run time. Silent until the first user gesture.
export function createAudio() {
  let ctx = null;
  function ensure() {
    if (!ctx) {
      try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { ctx = null; }
    }
    if (ctx && ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  function tone(freq, seconds, type, gain, when = 0) {
    const ac = ensure();
    if (!ac) return;
    const t0 = ac.currentTime + when;
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(gain, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + seconds);
    osc.connect(g).connect(ac.destination);
    osc.start(t0);
    osc.stop(t0 + seconds + 0.05);
  }
  return {
    unlock() { ensure(); },
    loot() { tone(880, 0.12, 'sine', 0.12); tone(1320, 0.18, 'sine', 0.1, 0.08); },
    vault() { tone(523, 0.15, 'triangle', 0.14); tone(659, 0.15, 'triangle', 0.14, 0.1); tone(784, 0.3, 'triangle', 0.14, 0.2); },
    spotted() { tone(220, 0.25, 'sawtooth', 0.12); tone(180, 0.3, 'sawtooth', 0.12, 0.12); },
    caught() { tone(160, 0.4, 'sawtooth', 0.16); tone(110, 0.5, 'sawtooth', 0.16, 0.15); },
    alarm() { tone(980, 0.09, 'square', 0.05); tone(740, 0.09, 'square', 0.05, 0.11); },
    tool() { tone(440, 0.08, 'sine', 0.1); },
    clear() { tone(523, 0.12, 'triangle', 0.12); tone(659, 0.12, 'triangle', 0.12, 0.1); tone(784, 0.12, 'triangle', 0.12, 0.2); tone(1046, 0.3, 'triangle', 0.12, 0.3); },
  };
}
