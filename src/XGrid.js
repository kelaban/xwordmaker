import React from 'react';
import './XGrid.css';
import { isBlockedSquare }  from './constants';

export default function Grid({grid, selected, currentWord, hideAnswers, onClick}) {
  const {rows, cols} = grid.size
  // go from 0 -> width*height and map to a block in the view
  const gridItems = [...Array(rows*cols).keys()]
      .map(i => {
        const row = Math.floor(i / cols)
        const column = Math.floor(i % cols)
        const val =  grid.grid[i]
        const isSelected = selected && selected.row === row && selected.column === column
        let classNames = ["Grid-item"]
        let spanClassNames = []
        if(isSelected) {
          classNames.push("Grid-item-selected")
        } else if (isBlockedSquare(val)) {
          classNames.push("Grid-item-blocked")
        } else if (currentWord && currentWord.coordinates.some(i => i[0] === row && i[1] === column)) {
          classNames.push("Grid-item-highlight")
        }
        if (!!grid.circles[i]) {
          spanClassNames.push("Circled")
        }
        const cn = classNames.join(" ")
        const scn = spanClassNames.join(" ")
        const style = {
          fontSize: `${(1/(val.length))*1.1}em`
        }

        return (
          <div key={i} className={cn} onClick={() => onClick({row, column})}>
            <span className="Grid-number">{grid.gridnums[i] > 0 ? grid.gridnums[i] : ''}</span>
            <span className={scn} style={style}>{hideAnswers ? ' ' : val}</span>
          </div>
        )
      })

  return (
    <div
      style={{
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gridTemplateRows: `repeat(${rows}, 1fr)`,
      }}
      className="Grid-container"
    >
      {gridItems}
    </div>
  )
}
