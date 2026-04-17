export class Particle {
  x = 0
  y = 0
  vx = 0
  vy = 0
  life = 0
  maxLife = 0
  size = 2
  color = '' // empty = default orange
  active = false

  reset() {
    this.x = 0
    this.y = 0
    this.vx = 0
    this.vy = 0
    this.life = 0
    this.maxLife = 0
    this.size = 2
    this.color = ''
    this.active = false
  }

  update() {
    this.x += this.vx
    this.y += this.vy
    this.vx *= 0.97
    this.vy *= 0.97
    this.life--
    if (this.life <= 0) {
      this.active = false
    }
  }

  render(ctx: CanvasRenderingContext2D) {
    const alpha = this.life / this.maxLife
    ctx.globalAlpha = alpha

    const color = this.color || '#ffaa00'
    const glowColor = this.color || '#ff6600'

    // Outer glow
    ctx.shadowColor = glowColor
    ctx.shadowBlur = 4
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
    ctx.fill()
    ctx.shadowBlur = 0

    // Inner core
    ctx.fillStyle = '#fff'
    ctx.beginPath()
    ctx.arc(this.x, this.y, this.size * 0.4, 0, Math.PI * 2)
    ctx.fill()

    ctx.globalAlpha = 1
  }
}
