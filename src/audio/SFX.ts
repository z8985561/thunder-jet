export class SFX {
  private ctx: AudioContext | null = null

  private getCtx(): AudioContext {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
    return this.ctx
  }

  playShoot() {
    try {
      const ctx = this.getCtx()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'square'
      osc.frequency.setValueAtTime(880 + Math.random() * 80, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.05)
      gain.gain.setValueAtTime(0.06, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.05)
    } catch { /* ignore */ }
  }

  playExplosion() {
    try {
      const ctx = this.getCtx()
      const bufferSize = ctx.sampleRate * 0.15
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
      const data = buffer.getChannelData(0)
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize)
      }
      const source = ctx.createBufferSource()
      source.buffer = buffer
      const gain = ctx.createGain()
      source.connect(gain)
      gain.connect(ctx.destination)
      gain.gain.setValueAtTime(0.12, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15)
      source.start(ctx.currentTime)
    } catch { /* ignore */ }
  }

  playBigExplosion() {
    try {
      const ctx = this.getCtx()
      const bufferSize = ctx.sampleRate * 0.4
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
      const data = buffer.getChannelData(0)
      for (let i = 0; i < bufferSize; i++) {
        const t = i / bufferSize
        data[i] = (Math.random() * 2 - 1) * Math.exp(-t * 3) * (1 + Math.sin(t * 30) * 0.3)
      }
      const source = ctx.createBufferSource()
      source.buffer = buffer
      const gain = ctx.createGain()
      source.connect(gain)
      gain.connect(ctx.destination)
      gain.gain.setValueAtTime(0.2, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
      source.start(ctx.currentTime)
    } catch { /* ignore */ }
  }

  playBomb() {
    try {
      const ctx = this.getCtx()
      const bufferSize = ctx.sampleRate * 0.6
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
      const data = buffer.getChannelData(0)
      for (let i = 0; i < bufferSize; i++) {
        const t = i / bufferSize
        data[i] = (Math.random() * 2 - 1) * Math.exp(-t * 2) * 0.8
          + Math.sin(t * 50) * Math.exp(-t * 4) * 0.3
      }
      const source = ctx.createBufferSource()
      source.buffer = buffer
      const gain = ctx.createGain()
      source.connect(gain)
      gain.connect(ctx.destination)
      gain.gain.setValueAtTime(0.25, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6)
      source.start(ctx.currentTime)
    } catch { /* ignore */ }
  }

  playPickup() {
    try {
      const ctx = this.getCtx()
      const notes = [660, 880, 1100]
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.type = 'sine'
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.06)
        gain.gain.setValueAtTime(0.08, ctx.currentTime + i * 0.06)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.06 + 0.1)
        osc.start(ctx.currentTime + i * 0.06)
        osc.stop(ctx.currentTime + i * 0.06 + 0.1)
      })
    } catch { /* ignore */ }
  }

  playHit() {
    try {
      const ctx = this.getCtx()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(200, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.2)
      gain.gain.setValueAtTime(0.15, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.2)
    } catch { /* ignore */ }
  }

  playShieldBreak() {
    try {
      const ctx = this.getCtx()
      const bufferSize = ctx.sampleRate * 0.2
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
      const data = buffer.getChannelData(0)
      for (let i = 0; i < bufferSize; i++) {
        const t = i / bufferSize
        data[i] = Math.sin(t * 800 * (1 - t)) * (1 - t) * 0.3
      }
      const source = ctx.createBufferSource()
      source.buffer = buffer
      const gain = ctx.createGain()
      source.connect(gain)
      gain.connect(ctx.destination)
      gain.gain.setValueAtTime(0.15, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2)
      source.start(ctx.currentTime)
    } catch { /* ignore */ }
  }

  playGameOver() {
    try {
      const ctx = this.getCtx()
      const notes = [440, 370, 311, 261]
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.type = 'sine'
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.2)
        gain.gain.setValueAtTime(0.12, ctx.currentTime + i * 0.2)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.2 + 0.2)
        osc.start(ctx.currentTime + i * 0.2)
        osc.stop(ctx.currentTime + i * 0.2 + 0.2)
      })
    } catch { /* ignore */ }
  }
}
