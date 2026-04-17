<template>
  <div ref="container" class="game-container">
    <canvas ref="canvasRef" class="game-canvas"></canvas>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { GameEngine } from './game/GameEngine'

const container = ref<HTMLDivElement>()
const canvasRef = ref<HTMLCanvasElement>()
let engine: GameEngine | null = null

onMounted(() => {
  if (!canvasRef.value || !container.value) return
  engine = new GameEngine(canvasRef.value)

  // Handle clicks for menu/pause/gameover
  canvasRef.value.addEventListener('click', (e) => {
    if (!engine) return
    const rect = canvasRef.value!.getBoundingClientRect()
    const x = (e.clientX - rect.left) * (canvasRef.value!.width / rect.width)
    const y = (e.clientY - rect.top) * (canvasRef.value!.height / rect.height)
    engine.handleClick(x, y)
  })

  // Touch tap for menu/pause/gameover (only if not dragging)
  let touchStartY = 0
  canvasRef.value.addEventListener('touchstart', (e) => {
    touchStartY = e.touches[0].clientY
  })
  canvasRef.value.addEventListener('touchend', (e) => {
    if (!engine) return
    const touch = e.changedTouches[0]
    if (Math.abs(touch.clientY - touchStartY) < 10) {
      const rect = canvasRef.value!.getBoundingClientRect()
      const x = (touch.clientX - rect.left) * (canvasRef.value!.width / rect.width)
      const y = (touch.clientY - rect.top) * (canvasRef.value!.height / rect.height)
      engine.handleClick(x, y)
    }
  })

  engine.startLoop()
})

onUnmounted(() => {
  engine?.destroy()
  engine = null
})
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #000;
  touch-action: none;
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  user-select: none;
}

#app {
  width: 100%;
  height: 100%;
}

.game-container {
  width: 100%;
  height: 100%;
  max-width: 500px;
  margin: 0 auto;
  position: relative;
}

.game-canvas {
  width: 100%;
  height: 100%;
  display: block;
}
</style>
