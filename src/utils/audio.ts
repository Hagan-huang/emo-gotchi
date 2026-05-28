const getAudioCtx = () => {
  // @ts-ignore
  const Ctx = window.AudioContext || window.webkitAudioContext;
  return new Ctx();
};

let audioCtx: AudioContext | null = null;
let audioEnabled = true;

export const setAudioEnabled = (enabled: boolean) => {
  audioEnabled = enabled;
};

function playTone(
  freq: number,
  type: OscillatorType,
  duration: number,
  vol: number = 0.1,
) {
  if (!audioEnabled) return;
  
  try {
    if (!audioCtx) {
      audioCtx = getAudioCtx();
    }
    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);

    gainNode.gain.setValueAtTime(vol, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      audioCtx.currentTime + duration,
    );

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
  } catch (e) {
    console.error("Audio playback failed", e);
  }
}

export const soundEffects = {
  click: () => playTone(600, "sine", 0.1, 0.05),
  pop: () => playTone(800, "sine", 0.05, 0.05),
  success: () => {
    playTone(523.25, "sine", 0.1, 0.05); // C5
    setTimeout(() => playTone(659.25, "sine", 0.1, 0.05), 100); // E5
    setTimeout(() => playTone(783.99, "sine", 0.2, 0.05), 200); // G5
  },
  levelUp: () => {
    playTone(440, "triangle", 0.1, 0.05);
    setTimeout(() => playTone(554.37, "triangle", 0.1, 0.05), 100);
    setTimeout(() => playTone(659.25, "triangle", 0.3, 0.05), 200);
    setTimeout(() => playTone(880, "triangle", 0.4, 0.05), 300);
  },
  error: () => {
    playTone(300, "sawtooth", 0.15, 0.05);
    setTimeout(() => playTone(250, "sawtooth", 0.2, 0.05), 150);
  },
};
