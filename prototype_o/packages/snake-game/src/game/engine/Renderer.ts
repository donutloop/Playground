import { getCanvasSize } from '../../constants/grid';

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private readonly cellSize: number;
  private readonly gridSize: number;
  private readonly width: number;
  private readonly height: number;

  constructor(canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d')!;
    const { width, height } = getCanvasSize();
    this.width = width;
    this.height = height;
    this.cellSize = 20; // TODO: get from constants
    this.gridSize = 20; // TODO: get from constants
    this.setHiDPI();
  }

  private setHiDPI() {
    const scale = window.devicePixelRatio;
    this.ctx.scale(scale, scale);
    this.ctx.canvas.width = this.width * scale;
    this.ctx.canvas.height = this.height * scale;
    this.ctx.canvas.style.width = `${this.width}px`;
    this.ctx.canvas.style.height = `${this.height}px`;
  }

  clear() {
    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
  }

  drawCell(x: number, y: number, color: string) {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(
      x * this.cellSize,
      y * this.cellSize,
      this.cellSize,
      this.cellSize
    );
  }

  // We'll add more methods as needed (drawing snake, food, power-ups, etc.)
}
