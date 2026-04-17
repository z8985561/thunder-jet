export class InputManager {
  canvas: HTMLCanvasElement
  x = 0
  y = 0
  active = false
  keys: Record<string, boolean> = {}
  _prevSpace = false

  // Touch relative drag mode
  touchActive = false
  touchStartX = 0
  touchStartY = 0
  touchDelta: { dx: number; dy: number } | null = null
  private touchCount = 0

  private boundTouchStart: (e: TouchEvent) => void
  private boundTouchMove: (e: TouchEvent) => void
  private boundTouchEnd: (e: TouchEvent) => void
  private boundMouseDown: (e: MouseEvent) => void
  private boundMouseMove: (e: MouseEvent) => void
  private boundMouseUp: (e: MouseEvent) => void
  private boundKeyDown: (e: KeyboardEvent) => void
  private boundKeyUp: (e: KeyboardEvent) => void

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas

    this.boundTouchStart = this.onTouchStart.bind(this)
    this.boundTouchMove = this.onTouchMove.bind(this)
    this.boundTouchEnd = this.onTouchEnd.bind(this)
    this.boundMouseDown = this.onMouseDown.bind(this)
    this.boundMouseMove = this.onMouseMove.bind(this)
    this.boundMouseUp = this.onMouseUp.bind(this)
    this.boundKeyDown = this.onKeyDown.bind(this)
    this.boundKeyUp = this.onKeyUp.bind(this)

    canvas.addEventListener('touchstart', this.boundTouchStart, { passive: false })
    canvas.addEventListener('touchmove', this.boundTouchMove, { passive: false })
    canvas.addEventListener('touchend', this.boundTouchEnd)
    canvas.addEventListener('mousedown', this.boundMouseDown)
    canvas.addEventListener('mousemove', this.boundMouseMove)
    canvas.addEventListener('mouseup', this.boundMouseUp)
    canvas.addEventListener('mouseleave', this.boundMouseUp)
    window.addEventListener('keydown', this.boundKeyDown)
    window.addEventListener('keyup', this.boundKeyUp)
  }

  private getCanvasPos(clientX: number, clientY: number) {
    const rect = this.canvas.getBoundingClientRect()
    return {
      x: (clientX - rect.left) * (this.canvas.width / rect.width),
      y: (clientY - rect.top) * (this.canvas.height / rect.height),
    }
  }

  private onTouchStart(e: TouchEvent) {
    e.preventDefault()
    this.touchCount = e.touches.length
    if (this.touchCount >= 2) {
      // Two-finger: trigger bomb via flag (GameEngine reads this)
      this.keys['Space'] = true
      return
    }
    const touch = e.touches[0]
    const pos = this.getCanvasPos(touch.clientX, touch.clientY)
    this.touchStartX = pos.x
    this.touchStartY = pos.y
    this.touchDelta = { dx: 0, dy: 0 }
    this.touchActive = true
    this.x = pos.x
    this.y = pos.y
    this.active = true
  }

  private onTouchMove(e: TouchEvent) {
    e.preventDefault()
    this.touchCount = e.touches.length
    if (this.touchCount >= 2) return
    const touch = e.touches[0]
    const pos = this.getCanvasPos(touch.clientX, touch.clientY)
    this.x = pos.x
    this.y = pos.y
    if (this.touchDelta) {
      this.touchDelta.dx = pos.x - this.touchStartX
      this.touchDelta.dy = pos.y - this.touchStartY
    }
  }

  private onTouchEnd(e: TouchEvent) {
    this.touchCount = e.touches.length
    if (this.touchCount < 2) {
      this.keys['Space'] = false
    }
    if (e.touches.length === 0) {
      this.touchActive = false
      this.touchDelta = null
      this.active = false
    } else {
      // Remaining finger becomes new reference
      const touch = e.touches[0]
      const pos = this.getCanvasPos(touch.clientX, touch.clientY)
      this.touchStartX = pos.x
      this.touchStartY = pos.y
      this.touchDelta = { dx: 0, dy: 0 }
    }
  }

  private onMouseDown(e: MouseEvent) {
    const pos = this.getCanvasPos(e.clientX, e.clientY)
    this.x = pos.x
    this.y = pos.y
    this.active = true
  }

  private onMouseMove(e: MouseEvent) {
    if (this.active) {
      const pos = this.getCanvasPos(e.clientX, e.clientY)
      this.x = pos.x
      this.y = pos.y
    }
  }

  private onMouseUp() {
    this.active = false
  }

  private onKeyDown(e: KeyboardEvent) {
    this.keys[e.code] = true
  }

  private onKeyUp(e: KeyboardEvent) {
    this.keys[e.code] = false
  }

  destroy() {
    this.canvas.removeEventListener('touchstart', this.boundTouchStart)
    this.canvas.removeEventListener('touchmove', this.boundTouchMove)
    this.canvas.removeEventListener('touchend', this.boundTouchEnd)
    this.canvas.removeEventListener('mousedown', this.boundMouseDown)
    this.canvas.removeEventListener('mousemove', this.boundMouseMove)
    this.canvas.removeEventListener('mouseup', this.boundMouseUp)
    this.canvas.removeEventListener('mouseleave', this.boundMouseUp)
    window.removeEventListener('keydown', this.boundKeyDown)
    window.removeEventListener('keyup', this.boundKeyUp)
  }
}
