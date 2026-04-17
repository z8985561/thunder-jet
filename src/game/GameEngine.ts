import { GameState, type GameStats } from './types'
import { InputManager } from '../input/InputManager'
import { Starfield } from '../background/Starfield'
import { Player } from '../entities/Player'
import { PlayerBullet } from '../entities/PlayerBullet'
import { Enemy } from '../entities/Enemy'
import { Particle } from '../entities/Particle'
import { ObjectPool } from './objectPool'
import { aabbCollision } from './collision'
import { SFX } from '../audio/SFX'

export class GameEngine {
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  width = 0
  height = 0

  state: GameState = GameState.MENU
  input: InputManager
  starfield: Starfield
  sfx: SFX

  // Entities
  player!: Player
  playerBullets: PlayerBullet[] = []
  enemies: Enemy[] = []
  particles: Particle[] = []

  // Pools
  bulletPool: ObjectPool<PlayerBullet>
  enemyPool: ObjectPool<Enemy>
  particlePool: ObjectPool<Particle>

  // Stats
  stats: GameStats = { score: 0, killCount: 0, playTime: 0 }

  // Timing
  private lastTime = 0
  private animFrameId = 0
  private enemySpawnTimer = 0
  private enemySpawnInterval = 90 // frames (~1.5s at 60fps)
  private shootTimer = 0
  private shootInterval = 9 // frames (~150ms)
  private gameTime = 0 // total play frames

  // Difficulty scaling
  private difficulty = 1

  // Callbacks for UI overlay
  onStateChange?: (state: GameState) => void

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')!
    this.input = new InputManager(canvas)
    this.starfield = new Starfield()
    this.sfx = new SFX()

    this.bulletPool = new ObjectPool<PlayerBullet>(
      () => new PlayerBullet(),
      (b) => b.reset(),
      50
    )
    this.enemyPool = new ObjectPool<Enemy>(
      () => new Enemy(),
      (e) => e.reset(),
      30
    )
    this.particlePool = new ObjectPool<Particle>(
      () => new Particle(),
      (p) => p.reset(),
      100
    )

    this.resize()
    window.addEventListener('resize', () => this.resize())
  }

  resize() {
    const container = this.canvas.parentElement!
    this.width = container.clientWidth
    this.height = container.clientHeight
    this.canvas.width = this.width
    this.canvas.height = this.height
  }

  initPlayer() {
    this.player = new Player()
    this.player.x = this.width / 2
    this.player.y = this.height - 80
  }

  start() {
    this.state = GameState.PLAYING
    this.stats = { score: 0, killCount: 0, playTime: 0 }
    this.playerBullets.forEach((b) => this.bulletPool.release(b))
    this.enemies.forEach((e) => this.enemyPool.release(e))
    this.particles.forEach((p) => this.particlePool.release(p))
    this.playerBullets = []
    this.enemies = []
    this.particles = []
    this.gameTime = 0
    this.difficulty = 1
    this.enemySpawnTimer = 0
    this.shootTimer = 0
    this.initPlayer()
    this.onStateChange?.(this.state)
  }

  pause() {
    if (this.state === GameState.PLAYING) {
      this.state = GameState.PAUSED
      this.onStateChange?.(this.state)
    }
  }

  resume() {
    if (this.state === GameState.PAUSED) {
      this.state = GameState.PLAYING
      this.onStateChange?.(this.state)
    }
  }

  gameOver() {
    this.state = GameState.GAME_OVER
    this.stats.playTime = Math.floor(this.gameTime / 60)
    this.sfx.playGameOver()
    this.onStateChange?.(this.state)
  }

  private spawnEnemy() {
    const enemy = this.enemyPool.get()
    enemy.x = Math.random() * (this.width - 40) + 20
    enemy.y = -30
    enemy.speed = 1.5 + Math.random() * 1.5 * this.difficulty
    enemy.active = true
    this.enemies.push(enemy)
  }

  private spawnExplosion(x: number, y: number) {
    const count = 8
    for (let i = 0; i < count; i++) {
      const p = this.particlePool.get()
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5
      const speed = 2 + Math.random() * 3
      p.x = x
      p.y = y
      p.vx = Math.cos(angle) * speed
      p.vy = Math.sin(angle) * speed
      p.life = 30 + Math.random() * 15
      p.maxLife = p.life
      p.size = 2 + Math.random() * 3
      p.active = true
      this.particles.push(p)
    }
  }

  private update(dt: number) {
    if (this.state !== GameState.PLAYING) return

    this.gameTime++
    this.difficulty = 1 + Math.floor(this.gameTime / 600) * 0.3 // ramp every 10s

    // --- Player movement ---
    const input = this.input
    if (input.active) {
      const targetX = input.x
      const targetY = input.y - 60 // offset above finger
      this.player.x += (targetX - this.player.x) * 0.15
      this.player.y += (targetY - this.player.y) * 0.15
    } else {
      // Keyboard
      const spd = 5
      if (input.keys['ArrowLeft'] || input.keys['KeyA']) this.player.x -= spd
      if (input.keys['ArrowRight'] || input.keys['KeyD']) this.player.x += spd
      if (input.keys['ArrowUp'] || input.keys['KeyW']) this.player.y -= spd
      if (input.keys['ArrowDown'] || input.keys['KeyS']) this.player.y += spd
    }

    // Clamp player position
    this.player.x = Math.max(16, Math.min(this.width - 16, this.player.x))
    this.player.y = Math.max(16, Math.min(this.height - 16, this.player.y))

    // --- Auto shoot ---
    this.shootTimer++
    if (this.shootTimer >= this.shootInterval) {
      this.shootTimer = 0
      const bullet = this.bulletPool.get()
      bullet.x = this.player.x
      bullet.y = this.player.y - 20
      bullet.active = true
      this.playerBullets.push(bullet)
      this.sfx.playShoot()
    }

    // --- Spawn enemies ---
    this.enemySpawnTimer++
    const interval = Math.max(30, this.enemySpawnInterval - this.difficulty * 5)
    if (this.enemySpawnTimer >= interval) {
      this.enemySpawnTimer = 0
      this.spawnEnemy()
    }

    // --- Update bullets ---
    for (let i = this.playerBullets.length - 1; i >= 0; i--) {
      const b = this.playerBullets[i]
      b.update()
      if (b.y < -10) {
        b.active = false
        this.playerBullets.splice(i, 1)
        this.bulletPool.release(b)
      }
    }

    // --- Update enemies ---
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i]
      e.update()
      if (e.y > this.height + 30) {
        e.active = false
        this.enemies.splice(i, 1)
        this.enemyPool.release(e)
      }
    }

    // --- Update particles ---
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i]
      p.update()
      if (!p.active) {
        this.particles.splice(i, 1)
        this.particlePool.release(p)
      }
    }

    // --- Collision: bullets vs enemies ---
    for (let bi = this.playerBullets.length - 1; bi >= 0; bi--) {
      const b = this.playerBullets[bi]
      for (let ei = this.enemies.length - 1; ei >= 0; ei--) {
        const e = this.enemies[ei]
        if (b.active && e.active && aabbCollision(b.rect(), e.rect())) {
          b.active = false
          e.active = false
          this.stats.score += 100
          this.stats.killCount++
          this.spawnExplosion(e.x, e.y)
          this.sfx.playExplosion()
          this.playerBullets.splice(bi, 1)
          this.enemies.splice(ei, 1)
          this.bulletPool.release(b)
          this.enemyPool.release(e)
          break
        }
      }
    }

    // --- Collision: enemies vs player ---
    const playerRect = this.player.rect()
    for (let ei = this.enemies.length - 1; ei >= 0; ei--) {
      const e = this.enemies[ei]
      if (e.active && aabbCollision(playerRect, e.rect())) {
        this.spawnExplosion(this.player.x, this.player.y)
        this.spawnExplosion(e.x, e.y)
        this.enemies.splice(ei, 1)
        this.enemyPool.release(e)
        this.gameOver()
        return
      }
    }
  }

  render() {
    const ctx = this.ctx
    const w = this.width
    const h = this.height

    // Clear
    ctx.fillStyle = '#0a0e1a'
    ctx.fillRect(0, 0, w, h)

    // Starfield
    this.starfield.update()
    this.starfield.render(ctx, w, h)

    if (this.state === GameState.MENU) {
      this.renderMenu(ctx, w, h)
      return
    }

    if (this.state === GameState.PLAYING || this.state === GameState.PAUSED || this.state === GameState.GAME_OVER) {
      // Bullets
      for (const b of this.playerBullets) {
        b.render(ctx)
      }

      // Enemies
      for (const e of this.enemies) {
        e.render(ctx)
      }

      // Particles
      for (const p of this.particles) {
        p.render(ctx)
      }

      // Player (only if playing or paused)
      if (this.state !== GameState.GAME_OVER) {
        this.player.render(ctx)
      }

      // HUD
      this.renderHUD(ctx)

      // Pause overlay
      if (this.state === GameState.PAUSED) {
        ctx.fillStyle = 'rgba(0,0,0,0.5)'
        ctx.fillRect(0, 0, w, h)
        ctx.fillStyle = '#fff'
        ctx.font = 'bold 28px Arial'
        ctx.textAlign = 'center'
        ctx.fillText('暂停', w / 2, h / 2 - 20)
        ctx.font = '16px Arial'
        ctx.fillText('点击任意位置继续', w / 2, h / 2 + 20)
        ctx.textAlign = 'start'
      }

      // Game Over
      if (this.state === GameState.GAME_OVER) {
        ctx.fillStyle = 'rgba(0,0,0,0.6)'
        ctx.fillRect(0, 0, w, h)
        ctx.fillStyle = '#ff4444'
        ctx.font = 'bold 32px Arial'
        ctx.textAlign = 'center'
        ctx.fillText('游戏结束', w / 2, h / 2 - 60)

        ctx.fillStyle = '#fff'
        ctx.font = '18px Arial'
        ctx.fillText(`得分: ${this.stats.score}`, w / 2, h / 2 - 10)
        ctx.fillText(`击毁: ${this.stats.killCount}`, w / 2, h / 2 + 20)
        ctx.fillText(`时间: ${this.stats.playTime}s`, w / 2, h / 2 + 50)

        ctx.fillStyle = '#ffd700'
        ctx.font = 'bold 20px Arial'
        ctx.fillText('点击重新开始', w / 2, h / 2 + 100)
        ctx.textAlign = 'start'
      }
    }
  }

  private renderMenu(ctx: CanvasRenderingContext2D, w: number, h: number) {
    // Title glow
    ctx.shadowColor = '#4488ff'
    ctx.shadowBlur = 30
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 36px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('雷霆战机', w / 2, h / 2 - 80)
    ctx.shadowBlur = 0

    ctx.fillStyle = 'rgba(255,255,255,0.6)'
    ctx.font = '14px Arial'
    ctx.fillText('THUNDER JET', w / 2, h / 2 - 50)

    // Demo plane
    const demoY = h / 2
    ctx.fillStyle = '#4488ff'
    ctx.beginPath()
    ctx.moveTo(w / 2, demoY - 20)
    ctx.lineTo(w / 2 - 15, demoY + 15)
    ctx.lineTo(w / 2 - 5, demoY + 10)
    ctx.lineTo(w / 2, demoY + 18)
    ctx.lineTo(w / 2 + 5, demoY + 10)
    ctx.lineTo(w / 2 + 15, demoY + 15)
    ctx.closePath()
    ctx.fill()

    // Start button
    ctx.fillStyle = '#ffd700'
    ctx.font = 'bold 20px Arial'
    const pulse = Math.sin(Date.now() / 400) * 0.3 + 0.7
    ctx.globalAlpha = pulse
    ctx.fillText('点击开始游戏', w / 2, h / 2 + 70)
    ctx.globalAlpha = 1

    ctx.fillStyle = 'rgba(255,255,255,0.4)'
    ctx.font = '12px Arial'
    ctx.fillText('触摸拖动 / WASD / 鼠标控制移动', w / 2, h / 2 + 110)
    ctx.fillText('空格键释放炸弹', w / 2, h / 2 + 130)
    ctx.textAlign = 'start'
  }

  private renderHUD(ctx: CanvasRenderingContext2D) {
    // Score
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 18px Arial'
    ctx.textAlign = 'left'
    ctx.strokeStyle = 'rgba(0,0,0,0.5)'
    ctx.lineWidth = 3
    ctx.strokeText(`${this.stats.score}`, 12, 30)
    ctx.fillText(`${this.stats.score}`, 12, 30)
    ctx.lineWidth = 1

    // Bombs
    ctx.font = '16px Arial'
    ctx.fillText('💣 ×2', 12, 55)

    ctx.textAlign = 'start'
  }

  handleClick(x: number, y: number) {
    if (this.state === GameState.MENU) {
      this.start()
    } else if (this.state === GameState.PAUSED) {
      this.resume()
    } else if (this.state === GameState.GAME_OVER) {
      // Check if click is on "restart" area
      const restartY = this.height / 2 + 100
      if (y > restartY - 20 && y < restartY + 20) {
        this.start()
      }
    }
  }

  // Main loop
  loop = (timestamp: number) => {
    const dt = timestamp - this.lastTime
    this.lastTime = timestamp

    this.update(dt)
    this.render()

    this.animFrameId = requestAnimationFrame(this.loop)
  }

  startLoop() {
    this.lastTime = performance.now()
    this.animFrameId = requestAnimationFrame(this.loop)
  }

  stopLoop() {
    cancelAnimationFrame(this.animFrameId)
  }

  destroy() {
    this.stopLoop()
    this.input.destroy()
    window.removeEventListener('resize', this.resize)
  }
}
