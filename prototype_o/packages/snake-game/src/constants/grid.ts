export const GRID_SIZE = 20; // cells
export const CELL_SIZE = 20; // pixels

export const getCanvasSize = () => ({
  width: GRID_SIZE * CELL_SIZE,
  height: GRID_SIZE * CELL_SIZE,
});
