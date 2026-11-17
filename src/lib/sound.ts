let ctx: AudioContext | null = null

/** Short two-note chime via Web Audio — no audio files to download. Fails silently. */
export function playChime(happy: boolean): void {
  try {
    const Ctor = window.AudioContext
    if (!Ctor) return
    ctx ??= new Ctor()
    const notes = happy ? [523.25, 783.99] : [392, 329.63]
    notes.forEach((freq, i) => {
      if (!ctx) return
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      const start = ctx.currentTime + i * 0.14
      osc.type = 'sine'
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0.0001, start)
      gain.gain.exponentialRampToValueAtTime(0.12, start + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.3)
      osc.connect(gain).connect(ctx.destination)
      osc.start(start)
      osc.stop(start + 0.32)
    })
  } catch {
    /* autoplay policy or unsupported — sound is optional */
  }
}
