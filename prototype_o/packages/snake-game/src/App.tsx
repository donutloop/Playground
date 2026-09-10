import { useEffect, useRef } from 'react'
import { Renderer } from './game/engine/Renderer'
import { useGameLoop } from './hooks/useGameLoop'
import { GRID_SIZE, CELL_SIZE } from './constants/grid'

const App: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rendererRef = useRef<Renderer | null>(null)

  // Initialize renderer when canvas is ready
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    rendererRef.current = new Renderer(canvas)
  }, [])

  const { start, stop } = useGameLoop((delta) => {
    // Game update logic will go here
    // For now, just clear and draw a test cell
    rendererRef.current?.clear()
    // Draw a cell at (0,0) in red
    rendererRef.current?.drawCell(0, 0, 'red')
  }, 10) // 10 fps for testing

  // Start the loop when the renderer is ready
  useEffect(() => {
    if (rendererRef.current) {
      start()
    }
    return () => {
      stop()
    }
  }, [start, stop])

  // Calculate canvas size
  const canvasWidth = GRID_SIZE * CELL_SIZE
  const canvasHeight = GRID_SIZE * CELL_SIZE

  return (
    <div>
      <canvas
        ref={canvasRef}
        width={canvasWidth}
        height={canvasHeight}
        style={{ width: canvasWidth, height: canvasHeight }}
      />
    </div>
  )
}

export default App
