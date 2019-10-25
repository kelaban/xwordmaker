import React from 'react';
import './XGrid.css';

export default function Grid({width, height, grid, selected, currentWord, clueNumbers, onClick}) {
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
          fontSize: `${(1/(val.length))*1.1}em`
        }

        return (
          <div key={i} className={cn} onClick={() => onClick({row, column})}>
            <span className="Grid-number">{clueNumbers[row][column]}</span>
            <span style={style}>{val}</span>
          </div>
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
