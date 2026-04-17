interface Star {
  x: number
  y: number
  size: number
  speed: number
  brightness: number
}

export class Starfield {
  private farStars: Star[] = []
  private nearStars: Star[] = []
  private ready = false

  init(w: number, h: number) {
    if (this.ready) return
    this.ready = true

    for (let i = 0; i < 60; i++) {
      this.farStars.push({
        x: Math.random() * w,
        y: Math.random() * h,
        size: 0.5 + Math.random() * 1,
        speed: 0.3 + Math.random() * 0.5,
        brightness: 0.3 + Math.random() * 0.4,
      })
    }
    for (let i = 0; i < 25; i++) {
      this.nearStars.push({
        x: Math.random() * w,
        y: Math.random() * h,
        size: 1 + Math.random() * 1.5,
        speed: 1 + Math.random() * 1.5,
        brightness: 0.5 + Math.random() * 0.5,
      })
    }
  }

  update() {
    // Moved to render to pass w/h
  }

  render(ctx: CanvasRenderingContext2D, w: number, h: number) {
    this.init(w, h)

    // Gradient sky
    const grad = ctx.createLinearGradient(0, 0, 0, h)
    grad.addColorStop(0, '#050810')
    grad.addColorStop(0.5, '#0a1628')
    grad.addColorStop(1, '#1a2a4a')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, w, h)

    // Far stars
    for (const s of this.farStars) {
      s.y += s.speed
      if (s.y > h) {
        s.y = -2
        s.x = Math.random() * w
      }
      ctx.globalAlpha = s.brightness
      ctx.fillStyle = '#aabbdd'
      ctx.beginPath()
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2)
      ctx.fill()
    }

    // Near stars
    for (const s of this.nearStars) {
      s.y += s.speed
      if (s.y > h) {
        s.y = -2
        s.x = Math.random() * w
      }
      ctx.globalAlpha = s.brightness
      ctx.fillStyle = '#ddeeff'
      ctx.beginPath()
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2)
      ctx.fill()
    }

    ctx.globalAlpha = 1
  }
}
