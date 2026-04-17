import type { Rect } from '../game/types'

export class Player {
  x = 0
  y = 0
  width = 36
  height = 40
  thrustAnim = 0

  // Visual rect (full body)
  rect(): Rect {
    return {
      x: this.x - this.width / 2,
      y: this.y - this.height / 2,
      width: this.width,
      height: this.height,
    }
  }

  // Smaller hit rect (core body only)
  hitRect(): Rect {
    return {
      x: this.x - 8,
      y: this.y - 8,
      width: 16,
      height: 16,
    }
  }

  render(ctx: CanvasRenderingContext2D) {
    this.thrustAnim += 0.15
    const x = this.x
    const y = this.y

    // Shadow on ground
    ctx.fillStyle = 'rgba(0,0,0,0.15)'
    ctx.beginPath()
    ctx.ellipse(x, y + 18, 14, 4, 0, 0, Math.PI * 2)
    ctx.fill()

    // === Shield (left side) ===
    const shieldX = x - 16
    const shieldY = y + 2

    // Shield glow
    ctx.shadowColor = '#4488ff'
    ctx.shadowBlur = 4
    ctx.fillStyle = '#3366cc'
    ctx.beginPath()
    ctx.ellipse(shieldX, shieldY, 8, 9, -0.2, 0, Math.PI * 2)
    ctx.fill()
    ctx.shadowBlur = 0

    // Shield rim
    ctx.strokeStyle = '#88bbff'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.ellipse(shieldX, shieldY, 8, 9, -0.2, 0, Math.PI * 2)
    ctx.stroke()

    // Shield inner
    ctx.fillStyle = '#5588dd'
    ctx.beginPath()
    ctx.ellipse(shieldX, shieldY, 5.5, 6.5, -0.2, 0, Math.PI * 2)
    ctx.fill()

    // Star on shield
    ctx.fillStyle = '#ffffff'
    ctx.font = '8px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('★', shieldX, shieldY)
    ctx.textBaseline = 'alphabetic'
    ctx.textAlign = 'start'

    // === Dog Body ===
    // Main body (round tan/brown shape)
    ctx.fillStyle = '#c49a6c'
    ctx.beginPath()
    ctx.ellipse(x, y + 2, 11, 13, 0, 0, Math.PI * 2)
    ctx.fill()

    // Belly (lighter)
    ctx.fillStyle = '#e8c99b'
    ctx.beginPath()
    ctx.ellipse(x, y + 6, 7, 8, 0, 0, Math.PI * 2)
    ctx.fill()

    // === Helmet ===
    ctx.fillStyle = '#4477cc'
    ctx.beginPath()
    ctx.ellipse(x, y - 10, 10, 8, 0, Math.PI, Math.PI * 2)
    ctx.fill()

    // Helmet visor
    ctx.fillStyle = '#5588dd'
    ctx.beginPath()
    ctx.ellipse(x, y - 10, 9, 5, 0, Math.PI * 1.1, Math.PI * 1.9)
    ctx.fill()

    // Helmet crest
    ctx.fillStyle = '#ff6644'
    ctx.beginPath()
    ctx.moveTo(x, y - 18)
    ctx.lineTo(x - 2, y - 13)
    ctx.lineTo(x + 2, y - 13)
    ctx.closePath()
    ctx.fill()

    // === Ears ===
    // Left ear
    ctx.fillStyle = '#a07850'
    ctx.beginPath()
    ctx.ellipse(x - 9, y - 8, 4, 7, -0.4, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#ddb088'
    ctx.beginPath()
    ctx.ellipse(x - 9, y - 7, 2.5, 4, -0.4, 0, Math.PI * 2)
    ctx.fill()

    // Right ear
    ctx.fillStyle = '#a07850'
    ctx.beginPath()
    ctx.ellipse(x + 9, y - 8, 4, 7, 0.4, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#ddb088'
    ctx.beginPath()
    ctx.ellipse(x + 9, y - 7, 2.5, 4, 0.4, 0, Math.PI * 2)
    ctx.fill()

    // === Face ===
    // Eye whites
    ctx.fillStyle = '#fff'
    ctx.beginPath()
    ctx.ellipse(x - 4, y - 4, 3.5, 4, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.ellipse(x + 4, y - 4, 3.5, 4, 0, 0, Math.PI * 2)
    ctx.fill()

    // Pupils (sparkling big eyes)
    ctx.fillStyle = '#2a1a0a'
    ctx.beginPath()
    ctx.arc(x - 3.5, y - 3.5, 2, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(x + 4.5, y - 3.5, 2, 0, Math.PI * 2)
    ctx.fill()

    // Eye highlights
    ctx.fillStyle = '#fff'
    ctx.beginPath()
    ctx.arc(x - 3, y - 4.5, 1, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(x + 5, y - 4.5, 1, 0, Math.PI * 2)
    ctx.fill()

    // Nose
    ctx.fillStyle = '#3a2a1a'
    ctx.beginPath()
    ctx.ellipse(x, y + 1, 2.5, 2, 0, 0, Math.PI * 2)
    ctx.fill()

    // Nose highlight
    ctx.fillStyle = 'rgba(255,255,255,0.4)'
    ctx.beginPath()
    ctx.ellipse(x - 0.5, y + 0.5, 1, 0.8, 0, 0, Math.PI * 2)
    ctx.fill()

    // Mouth (cute smile)
    ctx.strokeStyle = '#5a3a2a'
    ctx.lineWidth = 0.8
    ctx.beginPath()
    ctx.arc(x - 1.5, y + 3, 2, 0, Math.PI * 0.7)
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(x + 1.5, y + 3, 2, Math.PI * 0.3, Math.PI)
    ctx.stroke()

    // Blush
    ctx.fillStyle = 'rgba(255,150,150,0.3)'
    ctx.beginPath()
    ctx.ellipse(x - 8, y, 2.5, 1.5, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.ellipse(x + 8, y, 2.5, 1.5, 0, 0, Math.PI * 2)
    ctx.fill()

    // === Arm holding knife (right side) ===
    ctx.strokeStyle = '#c49a6c'
    ctx.lineWidth = 4
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(x + 10, y + 4)
    ctx.lineTo(x + 15, y - 2)
    ctx.stroke()
    ctx.lineWidth = 1
    ctx.lineCap = 'butt'

    // === Knife (right paw) ===
    this.renderKnife(ctx, x + 17, y - 5)

    // === Left arm (holding shield strap) ===
    ctx.strokeStyle = '#c49a6c'
    ctx.lineWidth = 3.5
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(x - 10, y + 4)
    ctx.lineTo(x - 14, y + 0)
    ctx.stroke()
    ctx.lineWidth = 1
    ctx.lineCap = 'butt'

    // === Feet ===
    ctx.fillStyle = '#a07850'
    ctx.beginPath()
    ctx.ellipse(x - 5, y + 14, 4, 3, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.ellipse(x + 5, y + 14, 4, 3, 0, 0, Math.PI * 2)
    ctx.fill()

    // Foot pads
    ctx.fillStyle = '#ddb088'
    ctx.beginPath()
    ctx.ellipse(x - 5, y + 14.5, 2.5, 1.5, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.ellipse(x + 5, y + 14.5, 2.5, 1.5, 0, 0, Math.PI * 2)
    ctx.fill()

    // === Tail ===
    const tailWag = Math.sin(this.thrustAnim * 3) * 0.3
    ctx.strokeStyle = '#c49a6c'
    ctx.lineWidth = 3
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(x, y + 12)
    ctx.quadraticCurveTo(x + 12, y + 10, x + 14 + Math.sin(tailWag) * 3, y + 4)
    ctx.stroke()
    ctx.lineWidth = 1
    ctx.lineCap = 'butt'

    // Tail tip
    ctx.fillStyle = '#e8c99b'
    ctx.beginPath()
    ctx.arc(x + 14 + Math.sin(tailWag) * 3, y + 4, 2, 0, Math.PI * 2)
    ctx.fill()
  }

  private renderKnife(ctx: CanvasRenderingContext2D, x: number, y: number) {
    // Blade (silver, pointing up)
    ctx.fillStyle = '#c0c8d0'
    ctx.beginPath()
    ctx.moveTo(x, y - 8)
    ctx.lineTo(x - 2, y + 2)
    ctx.lineTo(x + 2, y + 2)
    ctx.closePath()
    ctx.fill()

    // Blade edge highlight
    ctx.fillStyle = '#e8eef4'
    ctx.beginPath()
    ctx.moveTo(x, y - 8)
    ctx.lineTo(x + 1, y + 1)
    ctx.lineTo(x + 0.5, y + 2)
    ctx.lineTo(x, y + 2)
    ctx.closePath()
    ctx.fill()

    // Blade center line
    ctx.strokeStyle = '#8899aa'
    ctx.lineWidth = 0.5
    ctx.beginPath()
    ctx.moveTo(x, y - 7)
    ctx.lineTo(x, y + 1)
    ctx.stroke()

    // Guard
    ctx.fillStyle = '#8b6914'
    ctx.fillRect(x - 3.5, y + 2, 7, 1.5)

    // Handle
    ctx.fillStyle = '#8b6914'
    ctx.beginPath()
    ctx.roundRect(x - 1.5, y + 3.5, 3, 5, 1)
    ctx.fill()

    // Handle wrapping
    ctx.strokeStyle = '#6b4e10'
    ctx.lineWidth = 0.5
    for (let i = 0; i < 3; i++) {
      ctx.beginPath()
      ctx.moveTo(x - 1.5, y + 4.5 + i * 1.5)
      ctx.lineTo(x + 1.5, y + 5 + i * 1.5)
      ctx.stroke()
    }
    ctx.lineWidth = 1
  }
}
