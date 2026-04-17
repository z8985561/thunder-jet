import type { Rect } from '../game/types'

type PowerUpType = 'fireup' | 'shield' | 'bomb' | 'life'

const POWERUP_EMOJI: Record<PowerUpType, string> = {
  fireup: '🔥',
  shield: '🛡️',
  bomb: '💣',
  life: '❤️',
}

const POWERUP_COLOR: Record<PowerUpType, string> = {
  fireup: '#ff8800',
  shield: '#44aaff',
  bomb: '#ff4444',
  life: '#ff66aa',
}

export class PowerUp {
  x = 0
  y = 0
  type: PowerUpType = 'fireup'
  width = 20
  height = 20
  speed = 1.5
  active = false
  anim = 0

  get emoji(): string {
    return POWERUP_EMOJI[this.type]
  }

  get color(): string {
    return POWERUP_COLOR[this.type]
  }

  reset() {
    this.x = 0
    this.y = 0
    this.type = 'fireup'
    this.active = false
    this.anim = 0
  }

  update() {
    this.y += this.speed
    this.anim += 0.08
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
    const pulse = Math.sin(this.anim * 3) * 2

    // Glow circle
    ctx.beginPath()
    ctx.arc(x, y, 14 + pulse, 0, Math.PI * 2)
    ctx.fillStyle = this.color + '33'
    ctx.fill()

    // Border
    ctx.strokeStyle = this.color
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.arc(x, y, 12 + pulse, 0, Math.PI * 2)
    ctx.stroke()
    ctx.lineWidth = 1

    // Emoji
    ctx.font = '14px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(this.emoji, x, y)
    ctx.textBaseline = 'alphabetic'
    ctx.textAlign = 'start'
  }
}
