import React from 'react';
import './Grid.css';

export default function Grid({width, height, grid, selected, currentWord, onClick}) {
  // go from 0 -> width*height and map to a block in the view
  const gridItems = [...Array(width*height).keys()]
      .map(i => {
        const row = Math.floor(i/width)
        const column = Math.floor(i%width)
        const val = grid[row][column]
        const isSelected = selected && selected.row === row && selected.column === column
        let classNames = ["Grid-item"]
        if (val === "!") {
          classNames.push("Grid-item-blocked")
        }
        if (isSelected) {
          classNames.push("Grid-item-selected")
        } else if (currentWord.coordinates.some(i => i[0] === row && i[1] === column)) {
          classNames.push("Grid-item-highlight")
        }
        const cn = classNames.join(" ")
        const style = {
          fontSize: `${(1/val.length)*2}em`
        }

        return (
          <div key={i} style={style} className={cn} onClick={() => onClick({row, column})}>{val}</div>
        )
      })

  return (
    <div
      style={{
        gridTemplateColumns: `repeat(${width}, 1fr)`,
        gridTemplateRows: `repeat(${width}, 1fr)`
      }}
      className="Grid-container"
    >
      {gridItems}
    </div>
  )
}
