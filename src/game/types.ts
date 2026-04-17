export interface Vec2 {
  x: number
  y: number
}

export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

export enum GameState {
  MENU = 'menu',
  PLAYING = 'playing',
  PAUSED = 'paused',
  GAME_OVER = 'gameOver',
}

export interface GameStats {
  score: number
  killCount: number
  playTime: number
}
