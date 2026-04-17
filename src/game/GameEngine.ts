import { GameState, type GameStats } from './types'
import { InputManager } from '../input/InputManager'
import { Starfield } from '../background/Starfield'
import { Player } from '../entities/Player'
import { PlayerBullet } from '../entities/PlayerBullet'
import { Enemy } from '../entities/Enemy'
import { Particle } from '../entities/Particle'
import { PowerUp } from '../entities/PowerUp'
import { EnemyBullet } from '../entities/EnemyBullet'
import { ObjectPool } from './objectPool'
import { aabbCollision } from './collision'
import { SFX } from '../audio/SFX'

// Enemy type definitions
export interface EnemyConfig {
  type: 'small' | 'medium' | 'large'
  hp: number
  speed: number
  width: number
  height: number
  score: number
}

const ENEMY_CONFIGS: EnemyConfig[] = [
  { type: 'small', hp: 1, speed: 2, width: 24, height: 24, score: 100 },
  { type: 'medium', hp: 3, speed: 1.5, width: 32, height: 32, score: 300 },
  { type: 'large', hp: 8, speed: 0.8, width: 44, height: 44, score: 1000 },
]

// Power-up types
const POWERUP_TYPES = ['fireup', 'shield', 'bomb', 'life'] as const

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
  powerUps: PowerUp[] = []
  enemyBullets: EnemyBullet[] = []

  // Pools
  bulletPool: ObjectPool<PlayerBullet>
  enemyPool: ObjectPool<Enemy>
  particlePool: ObjectPool<Particle>
  powerUpPool: ObjectPool<PowerUp>
  enemyBulletPool: ObjectPool<EnemyBullet>

  // Stats
  stats: GameStats = { score: 0, killCount: 0, playTime: 0 }
  highScore = 0

  // Player state
  lives = 3
  bombs = 2
  fireLevel = 1 // 1-4
  shieldActive = false
  shieldTimer = 0
  invincible = false
  invincibleTimer = 0

  // Bomb effect
  bombFlash = 0

  // Timing
  private lastTime = 0
  private animFrameId = 0
  private enemySpawnTimer = 0
  private enemySpawnInterval = 90
  private shootTimer = 0
  private shootInterval = 9
  private gameTime = 0

  // Difficulty
  private difficulty = 1
  private comboCount = 0
  private comboTimer = 0

  // Combo text floating
  comboTexts: { text: string; x: number; y: number; life: number; maxLife: number }[] = []

  // Callbacks
  onStateChange?: (state: GameState) => void

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')!
    this.input = new InputManager(canvas)
    this.starfield = new Starfield()
    this.sfx = new SFX()

    // Load high score
    try {
      this.highScore = parseInt(localStorage.getItem('thunderjet_highscore') || '0', 10)
    } catch { this.highScore = 0 }

    this.bulletPool = new ObjectPool<PlayerBullet>(
      () => new PlayerBullet(),
      (b) => b.reset(),
      80
    )
    this.enemyPool = new ObjectPool<Enemy>(
      () => new Enemy(),
      (e) => e.reset(),
      40
    )
    this.particlePool = new ObjectPool<Particle>(
      () => new Particle(),
      (p) => p.reset(),
      150
    )
    this.powerUpPool = new ObjectPool<PowerUp>(
      () => new PowerUp(),
      (p) => p.reset(),
      10
    )
    this.enemyBulletPool = new ObjectPool<EnemyBullet>(
      () => new EnemyBullet(),
      (b) => b.reset(),
      60
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
    this.lives = 3
    this.bombs = 2
    this.fireLevel = 1
    this.shieldActive = false
    this.shieldTimer = 0
    this.invincible = false
    this.invincibleTimer = 0
    this.bombFlash = 0
    this.comboCount = 0
    this.comboTimer = 0
    this.comboTexts = []

    this.playerBullets.forEach((b) => this.bulletPool.release(b))
    this.enemies.forEach((e) => this.enemyPool.release(e))
    this.particles.forEach((p) => this.particlePool.release(p))
    this.powerUps.forEach((p) => this.powerUpPool.release(p))
    this.enemyBullets.forEach((b) => this.enemyBulletPool.release(b))
    this.playerBullets = []
    this.enemies = []
    this.particles = []
    this.powerUps = []
    this.enemyBullets = []

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

  useBomb() {
    if (this.bombs <= 0) return
    this.bombs--
    this.bombFlash = 30 // flash frames
    this.sfx.playBomb()

    // Kill all enemies
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i]
      this.stats.score += e.score
      this.stats.killCount++
      this.spawnExplosion(e.x, e.y, e.config.type === 'large' ? 16 : 8)
      this.enemies.splice(i, 1)
      this.enemyPool.release(e)
    }

    // Clear enemy bullets
    for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
      this.enemyBullets.splice(i, 1)
      this.enemyBulletPool.release(this.enemyBullets[i])
    }

    // Big screen flash particles
    for (let i = 0; i < 20; i++) {
      const p = this.particlePool.get()
      p.x = Math.random() * this.width
      p.y = Math.random() * this.height
      p.vx = (Math.random() - 0.5) * 4
      p.vy = (Math.random() - 0.5) * 4
      p.life = 20 + Math.random() * 15
      p.maxLife = p.life
      p.size = 3 + Math.random() * 4
      p.color = '#fff'
      p.active = true
      this.particles.push(p)
    }
  }

  private playerHit() {
    if (this.invincible) return
    if (this.shieldActive) {
      this.shieldActive = false
      this.shieldTimer = 0
      this.sfx.playShieldBreak()
      this.invincible = true
      this.invincibleTimer = 120 // 2s invincibility
      return
    }
    this.lives--
    this.fireLevel = Math.max(1, this.fireLevel - 1)
    this.sfx.playHit()
    if (this.lives <= 0) {
      this.spawnExplosion(this.player.x, this.player.y, 16)
      this.gameOver()
    } else {
      this.invincible = true
      this.invincibleTimer = 120
      this.spawnExplosion(this.player.x, this.player.y, 6)
    }
  }

  gameOver() {
    this.state = GameState.GAME_OVER
    this.stats.playTime = Math.floor(this.gameTime / 60)
    // Save high score
    if (this.stats.score > this.highScore) {
      this.highScore = this.stats.score
      try { localStorage.setItem('thunderjet_highscore', String(this.highScore)) } catch { /* ignore */ }
    }
    this.sfx.playGameOver()
    this.onStateChange?.(this.state)
  }

  private getGrade(score: number): { letter: string; color: string } {
    if (score >= 10000) return { letter: 'S', color: '#ffd700' }
    if (score >= 5000) return { letter: 'A', color: '#ff4444' }
    if (score >= 2000) return { letter: 'B', color: '#44aaff' }
    return { letter: 'C', color: '#aaaaaa' }
  }

  private spawnEnemy() {
    // Weight by difficulty: more medium/large at higher difficulty
    let config: EnemyConfig
    const roll = Math.random()
    const d = this.difficulty
    if (d < 1.5) {
      // Early: 90% small, 10% medium
      config = roll < 0.9 ? ENEMY_CONFIGS[0] : ENEMY_CONFIGS[1]
    } else if (d < 3) {
      // Mid: 60% small, 30% medium, 10% large
      if (roll < 0.6) config = ENEMY_CONFIGS[0]
      else if (roll < 0.9) config = ENEMY_CONFIGS[1]
      else config = ENEMY_CONFIGS[2]
    } else {
      // Late: 30% small, 40% medium, 30% large
      if (roll < 0.3) config = ENEMY_CONFIGS[0]
      else if (roll < 0.7) config = ENEMY_CONFIGS[1]
      else config = ENEMY_CONFIGS[2]
    }

    const enemy = this.enemyPool.get()
    enemy.x = Math.random() * (this.width - 60) + 30
    enemy.y = -config.height
    enemy.speed = config.speed + Math.random() * 0.8 * this.difficulty
    enemy.hp = config.hp
    enemy.maxHp = config.hp
    enemy.width = config.width
    enemy.height = config.height
    enemy.score = config.score
    enemy.config = config
    enemy.wobble = Math.random() * Math.PI * 2
    enemy.shootTimer = Math.random() * 120
    enemy.active = true
    this.enemies.push(enemy)
  }

  private maybeDropPowerUp(x: number, y: number) {
    if (Math.random() > 0.2) return // 20% chance
    const type = POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)]
    const pu = this.powerUpPool.get()
    pu.x = x
    pu.y = y
    pu.type = type
    pu.active = true
    this.powerUps.push(pu)
  }

  private collectPowerUp(pu: PowerUp) {
    this.sfx.playPickup()
    this.addComboText(pu.x, pu.y, pu.emoji, '#ffd700')
    switch (pu.type) {
      case 'fireup':
        this.fireLevel = Math.min(4, this.fireLevel + 1)
        break
      case 'shield':
        this.shieldActive = true
        this.shieldTimer = 600 // 10s
        break
      case 'bomb':
        this.bombs = Math.min(5, this.bombs + 1)
        break
      case 'life':
        this.lives = Math.min(5, this.lives + 1)
        break
    }
  }

  private addComboText(x: number, y: number, text: string, _color: string) {
    this.comboTexts.push({ text, x, y, life: 45, maxLife: 45 })
  }

  private spawnExplosion(x: number, y: number, count = 8) {
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
      p.color = ''
      p.active = true
      this.particles.push(p)
    }
  }

  private firePlayerBullets() {
    const px = this.player.x
    const py = this.player.y - 20
    const level = this.fireLevel

    if (level >= 1) {
      const b = this.bulletPool.get()
      b.x = px; b.y = py; b.vx = 0; b.vy = -10; b.active = true
      this.playerBullets.push(b)
    }
    if (level >= 2) {
      // Dual
      const bl = this.bulletPool.get()
      bl.x = px - 8; bl.y = py + 4; bl.vx = 0; bl.vy = -10; bl.active = true
      this.playerBullets.push(bl)
      const br = this.bulletPool.get()
      br.x = px + 8; br.y = py + 4; br.vx = 0; br.vy = -10; br.active = true
      this.playerBullets.push(br)
    }
    if (level >= 3) {
      // Spread
      const bl2 = this.bulletPool.get()
      bl2.x = px - 6; bl2.y = py; bl2.vx = -2; bl2.vy = -9.5; bl2.active = true
      this.playerBullets.push(bl2)
      const br2 = this.bulletPool.get()
      br2.x = px + 6; br2.y = py; br2.vx = 2; br2.vy = -9.5; br2.active = true
      this.playerBullets.push(br2)
    }
    if (level >= 4) {
      // Wide spread
      const bl3 = this.bulletPool.get()
      bl3.x = px - 12; bl3.y = py + 6; bl3.vx = -3; bl3.vy = -9; bl3.active = true
      this.playerBullets.push(bl3)
      const br3 = this.bulletPool.get()
      br3.x = px + 12; br3.y = py + 6; br3.vx = 3; br3.vy = -9; br3.active = true
      this.playerBullets.push(br3)
    }

    this.sfx.playShoot()
  }

  private enemyShoot(e: Enemy) {
    if (e.config.type === 'small') return // small enemies don't shoot
    const dx = this.player.x - e.x
    const dy = this.player.y - e.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist < 1) return
    const nx = dx / dist
    const ny = dy / dist
    const bulletSpeed = 3.5

    if (e.config.type === 'medium') {
      // Single aimed bullet
      const b = this.enemyBulletPool.get()
      b.x = e.x; b.y = e.y + e.height / 2
      b.vx = nx * bulletSpeed; b.vy = ny * bulletSpeed
      b.active = true; b.size = 4
      this.enemyBullets.push(b)
    } else if (e.config.type === 'large') {
      // 3-bullet spread
      for (let i = -1; i <= 1; i++) {
        const angle = Math.atan2(ny, nx) + i * 0.25
        const b = this.enemyBulletPool.get()
        b.x = e.x; b.y = e.y + e.height / 2
        b.vx = Math.cos(angle) * bulletSpeed
        b.vy = Math.sin(angle) * bulletSpeed
        b.active = true; b.size = 5
        this.enemyBullets.push(b)
      }
    }
  }

  private update(_dt: number) {
    if (this.state !== GameState.PLAYING) return

    this.gameTime++
    this.difficulty = 1 + Math.floor(this.gameTime / 600) * 0.3

    // Combo timer
    if (this.comboTimer > 0) {
      this.comboTimer--
      if (this.comboTimer <= 0) this.comboCount = 0
    }

    // Bomb flash
    if (this.bombFlash > 0) this.bombFlash--

    // Invincibility timer
    if (this.invincible) {
      this.invincibleTimer--
      if (this.invincibleTimer <= 0) this.invincible = false
    }

    // Shield timer
    if (this.shieldActive) {
      this.shieldTimer--
      if (this.shieldTimer <= 0) {
        this.shieldActive = false
      }
    }

    // Combo texts
    for (let i = this.comboTexts.length - 1; i >= 0; i--) {
      this.comboTexts[i].life--
      this.comboTexts[i].y -= 1
      if (this.comboTexts[i].life <= 0) {
        this.comboTexts.splice(i, 1)
      }
    }

    // --- Player movement (relative drag) ---
    const input = this.input
    if (input.touchActive && input.touchDelta) {
      this.player.x += input.touchDelta.dx
      this.player.y += input.touchDelta.dy
    } else if (input.active) {
      // Mouse direct mode
      const targetX = input.x
      const targetY = input.y - 90
      this.player.x += (targetX - this.player.x) * 0.18
      this.player.y += (targetY - this.player.y) * 0.18
    } else {
      const spd = 5
      if (input.keys['ArrowLeft'] || input.keys['KeyA']) this.player.x -= spd
      if (input.keys['ArrowRight'] || input.keys['KeyD']) this.player.x += spd
      if (input.keys['ArrowUp'] || input.keys['KeyW']) this.player.y -= spd
      if (input.keys['ArrowDown'] || input.keys['KeyS']) this.player.y += spd
    }

    // Clamp
    this.player.x = Math.max(20, Math.min(this.width - 20, this.player.x))
    this.player.y = Math.max(20, Math.min(this.height - 20, this.player.y))

    // --- Bomb key ---
    if (input.keys['Space'] && !input._prevSpace) {
      this.useBomb()
    }
    input._prevSpace = !!input.keys['Space']

    // --- Auto shoot ---
    this.shootTimer++
    if (this.shootTimer >= this.shootInterval) {
      this.shootTimer = 0
      this.firePlayerBullets()
    }

    // --- Spawn enemies ---
    this.enemySpawnTimer++
    const interval = Math.max(25, this.enemySpawnInterval - this.difficulty * 5)
    if (this.enemySpawnTimer >= interval) {
      this.enemySpawnTimer = 0
      this.spawnEnemy()
    }

    // --- Update bullets ---
    for (let i = this.playerBullets.length - 1; i >= 0; i--) {
      const b = this.playerBullets[i]
      b.update()
      if (b.y < -10 || b.x < -10 || b.x > this.width + 10) {
        b.active = false
        this.playerBullets.splice(i, 1)
        this.bulletPool.release(b)
      }
    }

    // --- Update enemy bullets ---
    for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
      const b = this.enemyBullets[i]
      b.update()
      if (b.y > this.height + 10 || b.y < -10 || b.x < -10 || b.x > this.width + 10) {
        b.active = false
        this.enemyBullets.splice(i, 1)
        this.enemyBulletPool.release(b)
      }
    }

    // --- Update enemies ---
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i]
      e.update()

      // Enemy shooting
      if (e.config.type !== 'small' && this.gameTime > 300) { // after 5s
        e.shootTimer--
        if (e.shootTimer <= 0) {
          const cooldown = e.config.type === 'large' ? 180 : 250
          e.shootTimer = cooldown + Math.random() * 60
          this.enemyShoot(e)
        }
      }

      if (e.y > this.height + 40) {
        e.active = false
        this.enemies.splice(i, 1)
        this.enemyPool.release(e)
      }
    }

    // --- Update power-ups ---
    for (let i = this.powerUps.length - 1; i >= 0; i--) {
      const p = this.powerUps[i]
      p.update()
      if (p.y > this.height + 20) {
        p.active = false
        this.powerUps.splice(i, 1)
        this.powerUpPool.release(p)
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
      if (!b.active) continue
      for (let ei = this.enemies.length - 1; ei >= 0; ei--) {
        const e = this.enemies[ei]
        if (!e.active) continue
        if (aabbCollision(b.rect(), e.rect())) {
          b.active = false
          this.playerBullets.splice(bi, 1)
          this.bulletPool.release(b)

          e.hp--
          if (e.hp <= 0) {
            e.active = false
            // Combo
            this.comboCount++
            this.comboTimer = 60 // 1s window
            const comboBonus = this.comboCount > 1 ? Math.floor(e.score * 0.2 * (this.comboCount - 1)) : 0
            const totalScore = e.score + comboBonus
            this.stats.score += totalScore
            this.stats.killCount++
            this.spawnExplosion(e.x, e.y, e.config.type === 'large' ? 16 : e.config.type === 'medium' ? 10 : 8)
            this.sfx.playExplosion()
            this.maybeDropPowerUp(e.x, e.y)

            if (this.comboCount >= 3) {
              this.addComboText(e.x, e.y - 20, `${this.comboCount} COMBO!`, '#ffdd00')
            }

            this.enemies.splice(ei, 1)
            this.enemyPool.release(e)
          } else {
            // Hit flash - spawn small particles
            for (let pi = 0; pi < 3; pi++) {
              const p = this.particlePool.get()
              p.x = b.x
              p.y = b.y
              p.vx = (Math.random() - 0.5) * 3
              p.vy = (Math.random() - 0.5) * 3
              p.life = 8 + Math.random() * 5
              p.maxLife = p.life
              p.size = 1.5
              p.color = '#fff'
              p.active = true
              this.particles.push(p)
            }
          }
          break
        }
      }
    }

    // --- Collision: enemy bullets vs player ---
    if (!this.invincible) {
      const pRect = this.player.hitRect()
      for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
        const b = this.enemyBullets[i]
        if (b.active && aabbCollision(pRect, b.rect())) {
          b.active = false
          this.enemyBullets.splice(i, 1)
          this.enemyBulletPool.release(b)
          this.playerHit()
          if (this.state !== GameState.PLAYING) return
        }
      }
    }

    // --- Collision: enemies vs player ---
    if (!this.invincible) {
      const pRect = this.player.hitRect()
      for (let ei = this.enemies.length - 1; ei >= 0; ei--) {
        const e = this.enemies[ei]
        if (e.active && aabbCollision(pRect, e.rect())) {
          this.spawnExplosion(e.x, e.y, 8)
          this.enemies.splice(ei, 1)
          this.enemyPool.release(e)
          this.playerHit()
          if (this.state !== GameState.PLAYING) return
          break
        }
      }
    }

    // --- Collision: player vs power-ups ---
    const puRect = this.player.rect()
    for (let i = this.powerUps.length - 1; i >= 0; i--) {
      const pu = this.powerUps[i]
      if (pu.active && aabbCollision(puRect, pu.rect())) {
        this.collectPowerUp(pu)
        pu.active = false
        this.powerUps.splice(i, 1)
        this.powerUpPool.release(pu)
      }
    }
  }

  render() {
    const ctx = this.ctx
    const w = this.width
    const h = this.height

    ctx.fillStyle = '#0a0e1a'
    ctx.fillRect(0, 0, w, h)

    this.starfield.render(ctx, w, h)

    if (this.state === GameState.MENU) {
      this.renderMenu(ctx, w, h)
      return
    }

    if (this.state === GameState.PLAYING || this.state === GameState.PAUSED || this.state === GameState.GAME_OVER) {
      // Power-ups
      for (const pu of this.powerUps) pu.render(ctx)

      // Bullets
      for (const b of this.playerBullets) b.render(ctx)

      // Enemy bullets
      for (const b of this.enemyBullets) b.render(ctx)

      // Enemies
      for (const e of this.enemies) e.render(ctx)

      // Particles
      for (const p of this.particles) p.render(ctx)

      // Player
      if (this.state !== GameState.GAME_OVER) {
        // Invincibility blink
        if (this.invincible && Math.floor(this.invincibleTimer / 4) % 2 === 0) {
          // skip render (blink effect)
        } else {
          this.player.render(ctx)
        }

        // Shield effect
        if (this.shieldActive) {
          ctx.strokeStyle = this.shieldTimer < 120 && Math.floor(this.shieldTimer / 8) % 2 === 0
            ? 'rgba(100,200,255,0.3)' : 'rgba(100,200,255,0.6)'
          ctx.lineWidth = 2
          ctx.beginPath()
          ctx.arc(this.player.x, this.player.y, 24, 0, Math.PI * 2)
          ctx.stroke()
          ctx.lineWidth = 1
        }
      }

      // Combo texts
      for (const ct of this.comboTexts) {
        const alpha = ct.life / ct.maxLife
        ctx.globalAlpha = alpha
        ctx.fillStyle = '#ffd700'
        ctx.font = 'bold 16px Arial'
        ctx.textAlign = 'center'
        ctx.fillText(ct.text, ct.x, ct.y)
        ctx.globalAlpha = 1
      }

      // HUD
      this.renderHUD(ctx)

      // Bomb flash
      if (this.bombFlash > 0) {
        ctx.fillStyle = `rgba(255,255,255,${this.bombFlash / 30 * 0.6})`
        ctx.fillRect(0, 0, w, h)
      }

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
        ctx.textAlign = 'center'

        // Grade
        const grade = this.getGrade(this.stats.score)
        ctx.shadowColor = grade.color
        ctx.shadowBlur = 20
        ctx.fillStyle = grade.color
        ctx.font = 'bold 48px Arial'
        ctx.fillText(grade.letter, w / 2, h / 2 - 100)
        ctx.shadowBlur = 0

        ctx.fillStyle = '#ff4444'
        ctx.font = 'bold 28px Arial'
        ctx.fillText('游戏结束', w / 2, h / 2 - 50)

        ctx.fillStyle = '#fff'
        ctx.font = '18px Arial'
        ctx.fillText(`得分: ${this.stats.score}`, w / 2, h / 2)
        ctx.fillText(`最高分: ${this.highScore}`, w / 2, h / 2 + 30)
        ctx.fillText(`击毁: ${this.stats.killCount}`, w / 2, h / 2 + 60)
        ctx.fillText(`时间: ${this.stats.playTime}s`, w / 2, h / 2 + 90)

        ctx.fillStyle = '#ffd700'
        ctx.font = 'bold 20px Arial'
        ctx.fillText('点击重新开始', w / 2, h / 2 + 140)
        ctx.textAlign = 'start'
      }
    }
  }

  private renderMenu(ctx: CanvasRenderingContext2D, w: number, h: number) {
    ctx.shadowColor = '#4488ff'
    ctx.shadowBlur = 30
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 36px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('雷霆战机', w / 2, h / 2 - 100)
    ctx.shadowBlur = 0

    ctx.fillStyle = 'rgba(255,255,255,0.6)'
    ctx.font = '14px Arial'
    ctx.fillText('THUNDER JET', w / 2, h / 2 - 70)

    // High score
    if (this.highScore > 0) {
      ctx.fillStyle = '#ffd700'
      ctx.font = '14px Arial'
      ctx.fillText(`最高分: ${this.highScore}`, w / 2, h / 2 - 45)
    }

    // Demo plane
    const demoY = h / 2 - 10
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

    ctx.fillStyle = '#ffd700'
    ctx.font = 'bold 20px Arial'
    const pulse = Math.sin(Date.now() / 400) * 0.3 + 0.7
    ctx.globalAlpha = pulse
    ctx.fillText('点击开始游戏', w / 2, h / 2 + 60)
    ctx.globalAlpha = 1

    ctx.fillStyle = 'rgba(255,255,255,0.4)'
    ctx.font = '12px Arial'
    ctx.fillText('触摸拖动 / WASD / 鼠标控制移动', w / 2, h / 2 + 100)
    ctx.fillText('空格键 / 双指点击 释放炸弹', w / 2, h / 2 + 120)
    ctx.textAlign = 'start'
  }

  private renderHUD(ctx: CanvasRenderingContext2D) {
    ctx.textAlign = 'left'

    // Score
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 18px Arial'
    ctx.strokeStyle = 'rgba(0,0,0,0.5)'
    ctx.lineWidth = 3
    ctx.strokeText(`${this.stats.score}`, 12, 30)
    ctx.fillText(`${this.stats.score}`, 12, 30)
    ctx.lineWidth = 1

    // Lives (hearts)
    ctx.font = '14px Arial'
    ctx.fillText('❤️'.repeat(this.lives), 12, 52)

    // Bombs
    ctx.fillText('💣 ×' + this.bombs, 12, 72)

    // Fire level
    ctx.fillStyle = '#ff8800'
    ctx.font = '12px Arial'
    ctx.fillText('🔥 ' + '▏▎▍▌▋'[this.fireLevel], 12, 90)

    // Shield indicator
    if (this.shieldActive) {
      ctx.fillStyle = '#64c8ff'
      ctx.font = '12px Arial'
      ctx.fillText(`🛡️ ${Math.ceil(this.shieldTimer / 60)}s`, 12, 108)
    }

    // Combo
    if (this.comboCount >= 2) {
      ctx.textAlign = 'center'
      ctx.fillStyle = '#ffd700'
      ctx.font = 'bold 20px Arial'
      ctx.fillText(`${this.comboCount} COMBO`, this.width / 2, 30)
    }

    ctx.textAlign = 'start'
  }

  handleClick(_x: number, y: number) {
    if (this.state === GameState.MENU) {
      this.start()
    } else if (this.state === GameState.PAUSED) {
      this.resume()
    } else if (this.state === GameState.GAME_OVER) {
      const restartY = this.height / 2 + 140
      if (y > restartY - 25 && y < restartY + 25) {
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
