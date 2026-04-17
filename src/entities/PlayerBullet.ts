import type { Rect } from '../game/types'

export class PlayerBullet {
  x = 0
  y = 0
  width = 6
  height = 16
  vx = 0
  vy = -10
  active = false
  spin = Math.random() * Math.PI * 2 // rotation for knife spin

  reset() {
    this.x = 0
    this.y = 0
    this.vx = 0
    this.vy = -10
    this.active = false
    this.spin = Math.random() * Math.PI * 2
  }

  update() {
    this.x += this.vx
    this.y += this.vy
    this.spin += 0.15 // spinning effect
  }

  rect(): Rect {
    return {
      x: this.x - this.width / 2,
      y: this.y - this.height / 2,
      width: this.width,
      height: this.height,
    }
  }

  render(ctx: CanvasRenderingContext2D) {
    const x = this.x
    const y = this.y

    // Slight horizontal wobble for spin effect
    const wobbleX = Math.sin(this.spin) * 1.2

    ctx.save()
    ctx.translate(x + wobbleX, y)
    ctx.rotate(Math.sin(this.spin) * 0.15) // slight tilt

    // Knife glow trail
    ctx.shadowColor = '#88ddff'
    ctx.shadowBlur = 4

    // Blade (silver, pointing up)
    ctx.fillStyle = '#d0d8e0'
    ctx.beginPath()
    ctx.moveTo(0, -8)
    ctx.lineTo(-2.5, 3)
    ctx.lineTo(2.5, 3)
    ctx.closePath()
    ctx.fill()

    // Blade highlight
    ctx.fillStyle = '#eef2f8'
    ctx.beginPath()
    ctx.moveTo(0, -8)
    ctx.lineTo(1, 2)
    ctx.lineTo(0.3, 3)
    ctx.lineTo(0, 3)
    ctx.closePath()
    ctx.fill()

    ctx.shadowBlur = 0

    // Blade center ridge
    ctx.strokeStyle = 'rgba(255,255,255,0.5)'
    ctx.lineWidth = 0.5
    ctx.beginPath()
    ctx.moveTo(0, -7)
    ctx.lineTo(0, 2)
    ctx.stroke()

    // Guard
    ctx.fillStyle = '#aa8822'
    ctx.fillRect(-3.5, 3, 7, 1.5)

    // Handle
    ctx.fillStyle = '#8b6914'
    ctx.fillRect(-2, 4.5, 4, 5)

    // Handle wrapping lines
    ctx.strokeStyle = '#6b4e10'
    ctx.lineWidth = 0.4
    for (let i = 0; i < 3; i++) {
      ctx.beginPath()
      ctx.moveTo(-2, 5.5 + i * 1.5)
      ctx.lineTo(2, 6 + i * 1.5)
      ctx.stroke()
    }
    ctx.lineWidth = 1

    // Pommel
    ctx.fillStyle = '#aa8822'
    ctx.beginPath()
    ctx.arc(0, 9.5, 1.2, 0, Math.PI * 2)
    ctx.fill()

    ctx.restore()
  }
}
