import type { Rect } from '../game/types'
import type { EnemyConfig } from '../game/GameEngine'

export class Enemy {
  x = 0
  y = 0
  width = 24
  height = 24
  speed = 2
  hp = 1
  maxHp = 1
  score = 100
  active = false
  wobble = Math.random() * Math.PI * 2
  shootTimer = 0
  config: EnemyConfig = { type: 'small', hp: 1, speed: 2, width: 24, height: 24, score: 100 }
  hitFlash = 0

  reset() {
    this.x = 0
    this.y = 0
    this.hp = 1
    this.maxHp = 1
    this.active = false
    this.wobble = Math.random() * Math.PI * 2
    this.shootTimer = 0
    this.hitFlash = 0
    this.config = { type: 'small', hp: 1, speed: 2, width: 24, height: 24, score: 100 }
  }

  update() {
    this.y += this.speed
    this.wobble += 0.05

    // Movement patterns
    if (this.config.type === 'small') {
      this.x += Math.sin(this.wobble) * 0.5
    } else if (this.config.type === 'medium') {
      this.x += Math.sin(this.wobble * 1.5) * 1.2
    } else {
      // Large: slow sinusoidal
      this.x += Math.sin(this.wobble * 0.8) * 0.8
    }

    if (this.hitFlash > 0) this.hitFlash--
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

    if (this.config.type === 'small') {
      this.renderSmall(ctx, x, y)
    } else if (this.config.type === 'medium') {
      this.renderMedium(ctx, x, y)
    } else {
      this.renderLarge(ctx, x, y)
    }

    // HP bar for medium/large
    if (this.config.type !== 'small' && this.hp < this.maxHp) {
      const barW = this.width + 4
      const barH = 3
      const barX = x - barW / 2
      const barY = y - this.height / 2 - 8
      ctx.fillStyle = 'rgba(0,0,0,0.5)'
      ctx.fillRect(barX, barY, barW, barH)
      ctx.fillStyle = this.hp > this.maxHp * 0.3 ? '#44ff44' : '#ff4444'
      ctx.fillRect(barX, barY, barW * (this.hp / this.maxHp), barH)
    }
  }

  private renderSmall(ctx: CanvasRenderingContext2D, x: number, y: number) {
    // Small red inverted triangle
    ctx.fillStyle = this.hitFlash > 0 ? '#fff' : '#dd3333'
    ctx.beginPath()
    ctx.moveTo(x, y + 12)
    ctx.lineTo(x - 12, y - 8)
    ctx.lineTo(x - 3, y - 3)
    ctx.lineTo(x, y - 12)
    ctx.lineTo(x + 3, y - 3)
    ctx.lineTo(x + 12, y - 8)
    ctx.closePath()
    ctx.fill()

    ctx.fillStyle = '#ff6666'
    ctx.beginPath()
    ctx.ellipse(x, y, 2.5, 3, 0, 0, Math.PI * 2)
    ctx.fill()

    // Engine
    ctx.fillStyle = '#ff8800'
    const flicker = Math.sin(this.wobble * 5) * 2
    ctx.beginPath()
    ctx.moveTo(x - 2, y - 12)
    ctx.lineTo(x, y - 17 - flicker)
    ctx.lineTo(x + 2, y - 12)
    ctx.closePath()
    ctx.fill()
  }

  private renderMedium(ctx: CanvasRenderingContext2D, x: number, y: number) {
    // Medium: hexagonal shape, purple
    const c = this.hitFlash > 0 ? '#fff' : '#8844cc'
    ctx.fillStyle = c
    ctx.beginPath()
    ctx.moveTo(x - 16, y)
    ctx.lineTo(x - 10, y - 12)
    ctx.lineTo(x + 10, y - 12)
    ctx.lineTo(x + 16, y)
    ctx.lineTo(x + 10, y + 12)
    ctx.lineTo(x - 10, y + 12)
    ctx.closePath()
    ctx.fill()

    // Inner detail
    ctx.fillStyle = this.hitFlash > 0 ? '#fff' : '#aa66ee'
    ctx.beginPath()
    ctx.moveTo(x - 8, y)
    ctx.lineTo(x - 5, y - 6)
    ctx.lineTo(x + 5, y - 6)
    ctx.lineTo(x + 8, y)
    ctx.lineTo(x + 5, y + 6)
    ctx.lineTo(x - 5, y + 6)
    ctx.closePath()
    ctx.fill()

    // Cockpit
    ctx.fillStyle = '#ddaaff'
    ctx.beginPath()
    ctx.arc(x, y - 2, 4, 0, Math.PI * 2)
    ctx.fill()

    // Engine glows (2)
    ctx.fillStyle = '#ff6600'
    const flicker = Math.sin(this.wobble * 6) * 2
    ctx.beginPath()
    ctx.moveTo(x - 6, y + 12)
    ctx.lineTo(x - 4, y + 18 - flicker)
    ctx.lineTo(x - 2, y + 12)
    ctx.closePath()
    ctx.fill()
    ctx.beginPath()
    ctx.moveTo(x + 2, y + 12)
    ctx.lineTo(x + 4, y + 18 - flicker)
    ctx.lineTo(x + 6, y + 12)
    ctx.closePath()
    ctx.fill()
  }

  private renderLarge(ctx: CanvasRenderingContext2D, x: number, y: number) {
    // Large: diamond + wings, dark red
    const c = this.hitFlash > 0 ? '#fff' : '#992222'
    ctx.fillStyle = c
    ctx.beginPath()
    ctx.moveTo(x, y - 22)
    ctx.lineTo(x - 10, y - 8)
    ctx.lineTo(x - 22, y)
    ctx.lineTo(x - 10, y + 8)
    ctx.lineTo(x, y + 22)
    ctx.lineTo(x + 10, y + 8)
    ctx.lineTo(x + 22, y)
    ctx.lineTo(x + 10, y - 8)
    ctx.closePath()
    ctx.fill()

    // Armor plates
    ctx.strokeStyle = 'rgba(255,100,100,0.4)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(x - 20, y)
    ctx.lineTo(x, y - 10)
    ctx.lineTo(x + 20, y)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(x - 20, y)
    ctx.lineTo(x, y + 10)
    ctx.lineTo(x + 20, y)
    ctx.stroke()
    ctx.lineWidth = 1

    // Cockpit
    ctx.fillStyle = '#ff4444'
    ctx.beginPath()
    ctx.arc(x, y - 4, 5, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#ff8888'
    ctx.beginPath()
    ctx.arc(x, y - 4, 3, 0, Math.PI * 2)
    ctx.fill()

    // 3 engines
    ctx.fillStyle = '#ff4400'
    const flicker = Math.sin(this.wobble * 4) * 3
    for (const ox of [-8, 0, 8]) {
      ctx.beginPath()
      ctx.moveTo(x + ox - 3, y + 22)
      ctx.lineTo(x + ox, y + 30 - flicker)
      ctx.lineTo(x + ox + 3, y + 22)
      ctx.closePath()
      ctx.fill()
    }
  }
}
