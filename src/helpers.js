
export const coord2dTo1d = (grid, row, col) => (grid.size.cols*row)+col
export const valFrom2d = (grid, row, col) => grid.grid[coord2dTo1d(grid, row, col)]
