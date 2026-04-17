import type { Rect } from '../game/types'

export class PlayerBullet {
  x = 0
  y = 0
  width = 4
  height = 12
  vx = 0
  vy = -10
  active = false

  reset() {
    this.x = 0
    this.y = 0
    this.vx = 0
    this.vy = -10
    this.active = false
  }

  update() {
    this.x += this.vx
    this.y += this.vy
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
    ctx.shadowColor = '#ffdd00'
    ctx.shadowBlur = 6
    ctx.fillStyle = '#ffee44'
    ctx.fillRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height)
    ctx.shadowBlur = 0
    ctx.fillStyle = '#fff'
    ctx.fillRect(this.x - 1, this.y - this.height / 2, 2, this.height)
  }
}
