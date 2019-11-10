import {
  isDirectionAcross,
  DIRECTION_ACROSS,
  DIRECTION_DOWN,
  SET_CURRENT_WORD,
  SET_SELECTED_SQUARE,
  SET_CLUE_FOCUS
}  from '../constants';


function setCurrentWord(state, action) {
  return {
    ...state,
    currentWord: {
      ...state.currentWord,
      ...action.payload
    }
  }
}

function setSelectedSquare(state, action) {
  const {currentWord, selected} = state
  const nextSelected = action.payload
  let nextCurrentWord = currentWord

  //swap direction if selected is double clicked
  if(nextSelected && selected && nextSelected.row === selected.row && nextSelected.column === selected.column) {
    nextCurrentWord = {
      ...nextCurrentWord,
      direction: isDirectionAcross(currentWord.direction) ? DIRECTION_DOWN : DIRECTION_ACROSS
    }
  }

  return {
    ...state,
    selected: nextSelected,
    currentWord: nextCurrentWord
  }
}

function setClueFocus(state, action) {
  const {direction, selected} = action.payload
  return {
    ...state,
    currentWord: {
      ...currentWordInitialState(),
      direction,
    },
    selected,
  }
}

export function currentWordInitialState() {
  return {word: "", direction: DIRECTION_ACROSS, coordinates: []}
}

export function reduceMotionState(state, action) {
  switch(action.type) {
    case SET_CURRENT_WORD:
      return setCurrentWord(state, action)
    case SET_SELECTED_SQUARE:
      return setSelectedSquare(state, action)
    case SET_CLUE_FOCUS:
      return setClueFocus(state, action)
    default:
      throw new Error('Unknown Action Type: ' + action.type)
  }
}
