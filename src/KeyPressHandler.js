import React, { Component, useEffect } from 'react';

import {
  isDirectionAcross,
  isBlockedSquare,
  DIRECTION_ACROSS,
  DIRECTION_DOWN,
  BLOCKED_SQUARE
}  from './constants';

import {
coord2dTo1d,
valFrom2d
} from './helpers';

class Movement {
  constructor({selected, width, height, currentWord, setSelected}) {
    this.selected = selected
    this.width = width
    this.height = height
    this.setSelected = setSelected
    this.currentWord = currentWord
  }

  right() {
    this.setSelected({
      row: this.selected.row,
      column: Math.min(this.width-1, this.selected.column+1)
    })
  }

  left() {
    this.setSelected({
      row: this.selected.row,
      column: Math.max(0, this.selected.column-1)
    })
  }
  up() {
    this.setSelected({
      row: Math.max(0, this.selected.row-1),
      column: this.selected.column
    })
  }

  down() {
    this.setSelected({
      row: Math.min(this.height-1, this.selected.row+1),
      column: this.selected.column
    })
  }

  moveForward() {
    if (isDirectionAcross(this.currentWord.direction)) {
      this.right()
    } else {
      this.down()
    }
  }
  moveBack() {
    if (isDirectionAcross(this.currentWord.direction)) {
      this.left()
    } else {
      this.up()
    }
  }
}

export default function KeyPressHandler(props) {
  const {
    selected,
    setSelected,
    setCurrentWord,
    currentWord,
    grid,
    updateGrid,
    hasFocus
  } = props

  const {rows: height, cols: width} = grid.size

  const handleKeyPressed = (e) => {
    if (!hasFocus) {
      return
    }

    if (selected) {
      const movement = new Movement({width, height, setSelected, currentWord, selected})

      if (e.key === "Backspace") {
        const old = valFrom2d(grid, selected.row, selected.column)
        if (isBlockedSquare(old)) {
          grid.grid[coord2dTo1d(grid, height - selected.row - 1, width - selected.column - 1)] = ""
        }
        grid.grid[coord2dTo1d(grid, selected.row, selected.column)] = ""

        movement.moveBack()
        updateGrid(grid)
      } else if(e.key.match(/^[a-z0-9]$/i)) {
        let k = e.key.toUpperCase()
        if (e.ctrlKey) {
          grid.grid[coord2dTo1d(grid, selected.row, selected.column)] += k
        } else {
          grid.grid[coord2dTo1d(grid, selected.row, selected.column)] = k
          movement.moveForward()
        }
        updateGrid(grid)
      } else if(e.key === BLOCKED_SQUARE) {
        grid.grid[coord2dTo1d(grid, selected.row, selected.column)] = e.key
        grid.grid[coord2dTo1d(grid, height - selected.row - 1, width - selected.column - 1)] = e.key
        movement.moveForward()
        updateGrid(grid)
      } else if (e.key === ' ') {
        setCurrentWord(Object.assign({}, currentWord, {
          direction: currentWord.direction === DIRECTION_ACROSS ? DIRECTION_DOWN : DIRECTION_ACROSS
        }))
      } else if(e.key == 'ArrowRight') {
        movement.right()
      } else if(e.key == 'ArrowLeft') {
        movement.left()
      } else if(e.key == 'ArrowUp') {
        movement.up()
      } else if(e.key == 'ArrowDown') {
        movement.down()
      }
    }
  }

  useEffect(() => {
    document.addEventListener('keydown', handleKeyPressed)
    return () => {
      document.removeEventListener('keydown', handleKeyPressed)
    }
  })

  return <React.Fragment/>
}
