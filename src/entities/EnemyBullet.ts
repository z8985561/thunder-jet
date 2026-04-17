import type { Rect } from '../game/types'

export class EnemyBullet {
  x = 0
  y = 0
  vx = 0
  vy = 3
  size = 4
  active = false

  reset() {
    this.x = 0
    this.y = 0
    this.vx = 0
    this.vy = 3
    this.size = 4
    this.active = false
  }

  update() {
    this.x += this.vx
    this.y += this.vy
  }

  rect(): Rect {
    return {
      x: this.x - this.size / 2,
      y: this.y - this.size / 2,
      width: this.size,
      height: this.size,
    }
  }

  render(ctx: CanvasRenderingContext2D) {
    ctx.shadowColor = '#ff2244'
    ctx.shadowBlur = 6
    ctx.fillStyle = '#ff4466'
    ctx.beginPath()
    ctx.arc(this.x, this.y, this.size / 2, 0, Math.PI * 2)
    ctx.fill()
    ctx.shadowBlur = 0

    // Core
    ctx.fillStyle = '#ffaacc'
    ctx.beginPath()
    ctx.arc(this.x, this.y, this.size / 4, 0, Math.PI * 2)
    ctx.fill()
  }
}
