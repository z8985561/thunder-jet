import type { Rect } from '../game/types'

export class Player {
  x = 0
  y = 0
  width = 32
  height = 40
  thrustAnim = 0

  rect(): Rect {
    return {
      x: this.x - this.width / 2,
      y: this.y - this.height / 2,
      width: this.width,
      height: this.height,
    }
  }

  render(ctx: CanvasRenderingContext2D) {
    this.thrustAnim += 0.15
    const x = this.x
    const y = this.y

    // Thrust flame
    const flameLen = 8 + Math.sin(this.thrustAnim * 8) * 4
    const grad = ctx.createLinearGradient(x, y + 14, x, y + 14 + flameLen)
    grad.addColorStop(0, '#ff8800')
    grad.addColorStop(0.5, '#ffcc00')
    grad.addColorStop(1, 'rgba(255,68,0,0)')
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.moveTo(x - 4, y + 14)
    ctx.lineTo(x, y + 14 + flameLen)
    ctx.lineTo(x + 4, y + 14)
    ctx.closePath()
    ctx.fill()

    // Body
    ctx.fillStyle = '#3377ee'
    ctx.beginPath()
    ctx.moveTo(x, y - 20)       // nose
    ctx.lineTo(x - 6, y - 5)
    ctx.lineTo(x - 16, y + 14)  // left wing tip
    ctx.lineTo(x - 5, y + 8)
    ctx.lineTo(x - 5, y + 14)   // left tail
    ctx.lineTo(x, y + 10)
    ctx.lineTo(x + 5, y + 14)   // right tail
    ctx.lineTo(x + 5, y + 8)
    ctx.lineTo(x + 16, y + 14)  // right wing tip
    ctx.lineTo(x + 6, y - 5)
    ctx.closePath()
    ctx.fill()

    // Cockpit
    ctx.fillStyle = '#88ccff'
    ctx.beginPath()
    ctx.ellipse(x, y - 6, 3, 6, 0, 0, Math.PI * 2)
    ctx.fill()

    // Wing highlights
    ctx.strokeStyle = 'rgba(255,255,255,0.3)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(x - 14, y + 12)
    ctx.lineTo(x - 6, y - 2)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(x + 14, y + 12)
    ctx.lineTo(x + 6, y - 2)
    ctx.stroke()
  }
}
