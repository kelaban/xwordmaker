import {
  isBlockedSquare,
  UNDO_ACTION,
  REDO_ACTION,
  UPDATE_WORD_TO_CLUE,
  UPDATE_GRID,
}  from './constants';

import { coord2dTo1d, valFrom2d } from './helpers';

const MAX_HISTORY = 25

function calcNumbersAndAnswers(grid, wordToClue) {
  const {rows, cols} = grid.size
  let out = {
    gridnums: grid.grid.map(r => 0), // clone grid
    answers: {down: [], across: []},
    clues: {down: [], across: []}
  }

  let num = 1;
  for (let i=0; i<rows; ++i){
    for (let j=0; j<cols; ++j) {
      if (isBlockedSquare(valFrom2d(grid, i, j))) continue;

      const isNewDown = (i === 0 || isBlockedSquare(valFrom2d(grid,i-1,j))) && !(i === rows || isBlockedSquare(valFrom2d(grid,i+1,j)))
      const isNewAcross = (j === 0 || isBlockedSquare(valFrom2d(grid,i,j-1))) && !(j === cols || isBlockedSquare(valFrom2d(grid,i,j+1)))
      if(isNewAcross || isNewDown) {
        out.gridnums[coord2dTo1d(grid, i, j)] = num++;
      }

      if(isNewAcross) {
        let currentWord = ""
        let start = j;
        while(!isBlockedSquare(valFrom2d(grid,i,start)) && start < cols) {
          let w = valFrom2d(grid, i, start)
          currentWord += w ? w : '_'
          start++
        }
        out.answers.across.push(currentWord)
        let clue = wordToClue[currentWord] || ''
        out.clues.across.push(`${num-1}. ${clue}`)
      }

      if(isNewDown) {
        let currentWord = ""
        let start = i;
        while(!isBlockedSquare(valFrom2d(grid,start,j)) && start < rows) {
          let w = valFrom2d(grid, start, j)
          currentWord += w ? w : '_'
          start++
        }
        out.answers.down.push(currentWord)
        let clue = wordToClue[currentWord] || ''
        out.clues.down.push(`${num-1}. ${clue}`)
      }

    }
  }

  return out;
}

function reduceUndo(state, action) {
  const past = state.history.undo

  if (!past.length) {
    return state
  }

  const nextState = {...state}
  const previous = past[past.length - 1]
  const newPast = past.slice(0, past.length - 1)
  nextState.grid = previous
  nextState.history = {
    undo: newPast,
    redo: [state.grid, ...state.history.redo]
  }

  return nextState
}

function reduceRedo(state, action) {
  const future = state.history.redo

  if (!future.length) {
    return state
  }

  const nextState = {...state}
  const next = future[0]
  const newFuture = future.slice(1)
  nextState.grid = next
  nextState.history = {
    undo: [...state.history.undo, state.grid],
    redo: newFuture
  }

  return nextState
}

function reduceUpdateWordToClue(state, action) {
  return {
    ...state,
    wordToClue:{
      ...state.wordToClue,
      ...action.payload,
    }
  }
}

function reduceUpdateGrid(state, action) {
  const nextState = {...state, ...action.payload}
  nextState.grid = {...nextState.grid, ...calcNumbersAndAnswers(nextState.grid, nextState.wordToClue)}
  // since history gets pushed on the the stack slice off the start of the history to keep the size small enough
  nextState.history.undo = state.history.undo.slice(-MAX_HISTORY)
  nextState.history.undo.push(state.grid)
  nextState.history.redo = []

  return nextState
}

export function reduceGridState(state, action) {
  switch(action.type) {
    case UNDO_ACTION:
      return reduceUndo(state, action)
    case REDO_ACTION:
      return reduceRedo(state, action)
    case UPDATE_WORD_TO_CLUE:
      return reduceUpdateWordToClue(state, action)
    case UPDATE_GRID:
      return reduceUpdateGrid(state, action)
    default:
      throw new Error('Unknown Action Type: ' + action.type)
  }
}
