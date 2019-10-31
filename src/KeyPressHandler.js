import React, { Component, useEffect, useState } from 'react';
import {
  isDirectionAcross,
  isBlockedSquare,
  DIRECTION_ACROSS,
  DIRECTION_DOWN,
  BLOCKED_SQUARE,
  UNDO_ACTION,
  REDO_ACTION
}  from './constants';
import {
coord2dTo1d,
valFrom2d
} from './helpers';

import mousetrap from 'mousetrap'

import { makeStyles } from '@material-ui/core/styles';

import {cloneDeep} from 'lodash';


class Movement {
  constructor(props) {
    const {selected, width, height, currentWord, setSelected} = props
    this.width = width
    this.height = height
    this.selected = selected
    this.setSelected = setSelected
    this.currentWord = currentWord
  }

  right = () => {
    this.setSelected({
      row: this.selected.row,
      column: Math.min(this.width-1, this.selected.column+1)
    })
  }

  left = () => {
    this.setSelected({
      row: this.selected.row,
      column: Math.max(0, this.selected.column-1)
    })
  }
  up = () => {
    this.setSelected({
      row: Math.max(0, this.selected.row-1),
      column: this.selected.column
    })
  }

  down = () => {
    this.setSelected({
      row: Math.min(this.height-1, this.selected.row+1),
      column: this.selected.column
    })
  }

  moveForward = () => {
    if (isDirectionAcross(this.currentWord.direction)) {
      this.right()
    } else {
      this.down()
    }
  }
  moveBack = () => {
    if (isDirectionAcross(this.currentWord.direction)) {
      this.left()
    } else {
      this.up()
    }
  }
}

class KeyPressHandler {
  constructor(props) {
    this.selected = props.selected
    this.setSelected = props.setSelected
    this.currentWord = props.currentWord
    this.setCurrentWord = props.setCurrentWord
    this.grid = cloneDeep(props.grid)
    this.updateGrid = props.updateGrid
    this.rows = props.grid.size.rows
    this.cols = props.grid.size.cols
    this.movement = new Movement({
      width: props.grid.size.cols,
      height: props.grid.size.rows,
      setSelected: props.setSelected,
      currentWord: props.currentWord,
      selected: props.selected
    })
  }

  setRotationalSymettry = (v) => {
    this.grid.grid[coord2dTo1d(this.grid, this.rows - this.selected.row - 1, this.cols - this.selected.column - 1)] = v
  }

  handleBackspace = (e) => {
    const {grid, selected, rows, cols, movement, updateGrid} = this

    const old = valFrom2d(grid, selected.row, selected.column)

    if (isBlockedSquare(old)) {
      this.setRotationalSymettry('')
    }

    grid.grid[coord2dTo1d(grid, selected.row, selected.column)] = ''

    movement.moveBack()
    updateGrid(grid)
  }

  handleLetter = (e) => {
    let k = e.key.toUpperCase()
    const {grid, selected, rows, cols, movement, updateGrid} = this

    if(e.key === BLOCKED_SQUARE) {
      grid.grid[coord2dTo1d(grid, selected.row, selected.column)] = k
      this.setRotationalSymettry(k)
      movement.moveForward()
      updateGrid(grid)
    } else if (e.ctrlKey) {
      grid.grid[coord2dTo1d(grid, selected.row, selected.column)] += k
      updateGrid(grid)
    } else {
      const old = valFrom2d(grid, selected.row, selected.column)
      if (old === k) {
        // don't issue grid update if its the same letter
        movement.moveForward()
        return
      }
      if (isBlockedSquare(old)) {
        this.setRotationalSymettry('')
      }
      grid.grid[coord2dTo1d(grid, selected.row, selected.column)] = k
      movement.moveForward()
      updateGrid(grid)
    }
  }

  handleSpace = (e) => {
    const {setCurrentWord, currentWord} = this
    setCurrentWord(Object.assign({}, currentWord, {
      direction: isDirectionAcross(currentWord.direction) ? DIRECTION_DOWN : DIRECTION_ACROSS
    }))
  }

  handleLeft = () => {
    this.movement.left()
  }

  handleRight = () => {
    this.movement.right()
  }

  handleUp = () => {
    this.movement.up()
  }

  handleDown = () => {
    this.movement.down()
  }

  handleUndo = () => {
    this.updateGrid(UNDO_ACTION)
  }

  handleRedo = () => {
    this.updateGrid(REDO_ACTION)
  }

}

const MOVE_UP = 'MOVE_UP'
const MOVE_LEFT = 'MOVE_LEFT'
const MOVE_RIGHT = 'MOVE_RIGHT'
const MOVE_DOWN = 'MOVE_DOWN'
const ENTER_LETTER = 'ENTER_LETTER'
const BACKSPACE = 'BACKSPACE'
const SPACE = 'SPACE'
const UNDO = 'UNDO'
const REDO = 'REDO'

const keyMap = {
  [MOVE_UP]: 'up',
  [MOVE_DOWN]: 'down',
  [MOVE_LEFT]: 'left',
  [MOVE_RIGHT]: 'right',
  [ENTER_LETTER]: "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.".split(''),
  [BACKSPACE]: ['del', 'backspace'],
  [SPACE]: 'space',
  [UNDO]: 'mod+z',
  [REDO]: 'mod+shift+z',
}

const useStyles = makeStyles(theme => ({
 noOutline: {
    "&:focus": {
      outline: 0,
    }
 }
}))


export default function KeyPressHandlerComponent(props) {
  const classes = useStyles()

  const [hasFocus, setGridFocus] = useState(false)

  const kph = new KeyPressHandler(props)

  const handlers = {
    [MOVE_UP]: kph.handleUp,
    [MOVE_DOWN]: kph.handleDown,
    [MOVE_LEFT]: kph.handleLeft,
    [MOVE_RIGHT]: kph.handleRight,
    [ENTER_LETTER]: kph.handleLetter,
    [BACKSPACE]: kph.handleBackspace,
    [SPACE]: kph.handleSpace,
    [UNDO]: kph.handleUndo,
    [REDO]: kph.handleRedo,
  }

  const handleFocus = _hasFocus => e => {
    setGridFocus(_hasFocus)
  }

  const withFocus = cb => (e) => hasFocus && cb(e)

  useEffect(() => {
    Object.keys(keyMap).forEach((k) => {
      mousetrap.bind(keyMap[k], withFocus(handlers[k]))
    })
    return () => {
      Object.keys(keyMap).forEach((k) => {
        mousetrap.unbind(keyMap[k])
      })
    }
  })


  return (
    <div ref={props.forwardRef} className={classes.noOutline} onFocus={handleFocus(true)} onBlur={handleFocus(false)} tabIndex="-1">
      {props.children}
    </div>
  )
}
