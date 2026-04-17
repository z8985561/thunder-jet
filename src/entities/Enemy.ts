import type { Rect } from '../game/types'

export class Enemy {
  x = 0
  y = 0
  width = 28
  height = 28
  speed = 2
  hp = 1
  active = false
  wobble = Math.random() * Math.PI * 2

  reset() {
    this.x = 0
    this.y = 0
    this.hp = 1
    this.active = false
    this.wobble = Math.random() * Math.PI * 2
  }

  update() {
    this.y += this.speed
    this.wobble += 0.05
    this.x += Math.sin(this.wobble) * 0.5
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

    // Body - inverted triangle enemy
    ctx.fillStyle = '#dd3333'
    ctx.beginPath()
    ctx.moveTo(x, y + 14)       // bottom tip
    ctx.lineTo(x - 14, y - 10)  // left wing
    ctx.lineTo(x - 4, y - 4)
    ctx.lineTo(x, y - 14)       // top
    ctx.lineTo(x + 4, y - 4)
    ctx.lineTo(x + 14, y - 10)  // right wing
    ctx.closePath()
    ctx.fill()

    // Cockpit
    ctx.fillStyle = '#ff6666'
    ctx.beginPath()
    ctx.ellipse(x, y, 3, 4, 0, 0, Math.PI * 2)
    ctx.fill()

    // Engine glow
    ctx.fillStyle = '#ff8800'
    const flicker = Math.sin(this.wobble * 5) * 2
    ctx.beginPath()
    ctx.moveTo(x - 3, y - 14)
    ctx.lineTo(x, y - 20 - flicker)
    ctx.lineTo(x + 3, y - 14)
    ctx.closePath()
    ctx.fill()
  }
}
