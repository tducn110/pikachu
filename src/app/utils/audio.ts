export type Sfx = "tap" | "match" | "wrong" | "win" | "reset";

/** Tiny WebAudio blip generator — no external assets. */
export function playBeep(type: Sfx) {
  try {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    const ctx = new AC();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const cfg: Record<Sfx, { freq: number; dur: number; type: OscillatorType }> =
      {
        tap: { freq: 520, dur: 0.07, type: "sine" },
        match: { freq: 740, dur: 0.16, type: "triangle" },
        wrong: { freq: 180, dur: 0.18, type: "sawtooth" },
        win: { freq: 880, dur: 0.45, type: "triangle" },
        reset: { freq: 360, dur: 0.1, type: "sine" },
      };
    const { freq, dur, type: wave } = cfg[type];
    osc.type = wave;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.4, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    osc.start();
    osc.stop(ctx.currentTime + dur);
    osc.onended = () => ctx.close();
  } catch {
    /* audio not available */
  }
}

let bgmCtx: AudioContext | null = null;
let isBgmPlaying = false;
let bgmTimeout: ReturnType<typeof setTimeout> | null = null;

// Pentatonic scale
const pentatonic = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25];

export function toggleBgm(play: boolean) {
  isBgmPlaying = play;
  if (!play) {
    if (bgmTimeout) clearTimeout(bgmTimeout);
    if (bgmCtx) {
      bgmCtx.close().catch(() => {});
      bgmCtx = null;
    }
    return;
  }
  
  if (bgmCtx) return;
  try {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    bgmCtx = new AC();
    let step = 0;
    
    function scheduleNext() {
      if (!isBgmPlaying || !bgmCtx) return;
      
      const osc = bgmCtx.createOscillator();
      const gain = bgmCtx.createGain();
      osc.connect(gain);
      gain.connect(bgmCtx.destination);
      
      osc.type = "sine";
      
      // Random walk on pentatonic scale for a generative melody
      step = (step + Math.floor(Math.random() * 3) - 1 + pentatonic.length) % pentatonic.length;
      osc.frequency.value = pentatonic[step];
      
      const t = bgmCtx.currentTime;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.05, t + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
      
      osc.start(t);
      osc.stop(t + 0.3);
      
      bgmTimeout = setTimeout(scheduleNext, 350);
    }
    
    scheduleNext();
  } catch {
    /* audio not available */
  }
}
