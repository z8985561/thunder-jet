export class Particle {
  x = 0
  y = 0
  vx = 0
  vy = 0
  life = 0
  maxLife = 0
  size = 2
  active = false

  reset() {
    this.x = 0
    this.y = 0
    this.vx = 0
    this.vy = 0
    this.life = 0
    this.maxLife = 0
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

    // Outer glow
    ctx.shadowColor = '#ff6600'
    ctx.shadowBlur = 4
    ctx.fillStyle = '#ffaa00'
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
