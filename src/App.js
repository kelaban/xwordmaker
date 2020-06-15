import React, { useState, useReducer, useEffect, useCallback, useRef } from 'react';
import clsx from 'clsx';
import './App.css';
import XGrid from './XGrid'
import Toolbar from './Toolbar'
import WordList from './WordList'
import KeyPressHandlerComponent, {KeyPressHandler} from './KeyPressHandler'
import Clues from './Clues'
import PrintView from './Print'
import MenuActions from './MenuActions'
import {
  isDirectionAcross,
  isBlockedSquare,
  UNDO_ACTION,
  REDO_ACTION,
  UPDATE_WORD_TO_CLUE,
  UPDATE_GRID,
  SET_CURRENT_WORD,
  SET_SELECTED_SQUARE,
  SET_CLUE_FOCUS,
} from './constants';

import { coord2dTo1d, valFrom2d } from './helpers';
import { reduceGridState } from './reducers/grid'
import { reduceMotionState, currentWordInitialState } from './reducers/motion'


import { saveAs } from 'file-saver';

import { makeStyles, useTheme } from '@material-ui/core/styles';
import useMediaQuery from '@material-ui/core/useMediaQuery';
import Paper from '@material-ui/core/Paper';
import Container from '@material-ui/core/Container';
import Grid from '@material-ui/core/Grid';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';

import {cloneDeep } from 'lodash';


const useStyles = makeStyles(theme => ({
  root: {
    display: "flex",
  },
  title: {
    flexGrow: 1
  },
  container: {
    paddingLeft: 12,
    paddingRight: 12,
    paddingTop: 32,
  },
  paper: {
    padding: 10,
  },
  scroll: {
    overflow: "scroll",
    maxHeight: "calc(100vh - 180px)",
  }
}));



function TabPanel(props) {
  const { children, value, index } = props;

  let hidden = value !== index

  if (hidden) {
    return <div></div>
  }

  return <div>
    {children}
  </div>
}

function calcCurrentWord({direction, grid, selected}) {
    if (!selected) { return null }

    const valFor = (x) => isDirectionAcross(direction) ? valFrom2d(grid, selected.row, x) : valFrom2d(grid, x, selected.column)
    const coordinatesFor = (x) => isDirectionAcross(direction) ? [selected.row, x] : [x, selected.column]
    const isNotEnd = (end) => isDirectionAcross(direction) ? end < grid.size.cols : end < grid.size.rows

    let start = isDirectionAcross(direction) ? selected.column : selected.row;
    let end = start

    // Find beginning
    // Then find end of the word
    // When convert those values into an string and convert blanks to . for word search
    // also compile list of coordinates for grid highlighting
    //  finally set the new state
    while(start>0 && !isBlockedSquare(valFor(start))) start--;
    while(isNotEnd(end) && !isBlockedSquare(valFor(end))) end++;
    if (isBlockedSquare(valFor(start))) start++;

    let word = ""
    let coordinates = []
    const clueNum = grid.gridnums[coord2dTo1d(grid, coordinatesFor(start)[0], coordinatesFor(start)[1])]

    for(let i=start; i<end; ++i) {
      let v = valFor(i)
      if (v === "") v = ".";
      word += v
      coordinates.push(coordinatesFor(i))
    }

    return { word, coordinates, clueNum }
}

// Format specified by https://www.xwordinfo.com/JSON/
const makePuzzle = (size) => {
  let g = {
    title: "TODO: NY Times, Thu, Sep 11, 2008",
    author: "TODO: Caleb Madison",
    editor: "TODO: Will Shortz",
    copyright: "TODO: 2008, The New York Times",
    publisher: "TODO: The New York Times",
    date: "TODO: 9/11/2008",
    size,
    // clues should include number as well e.g. "1. Waxed"
    clues: {
      across: [],
      down: []
    }
  }
  return Object.assign(g, {
    // '.' means black, multiple letters valid for rebus
    grid: [...Array(g.size.rows*g.size.cols).keys()].map(v => ""),
    // 0 means no number
    gridnums: [...Array(g.size.rows*g.size.cols).keys()].map(v => 0),
    // TODO: 0 means circle 1 means circle
    circles: [...Array(g.size.rows*g.size.cols).keys()].map(v => 0),
  })
}

function parseWordToClue(grid) {;
  const newWordToClue = {}
  if (grid.answers) {
    const parse = dir => {
      grid.answers[dir]
      .filter(w => !w.match('_'))
      .reduce((acc, w, i) => {
        let ww = (grid.clues[dir][i] || '').replace(/^ *[0-9]*\. */, '')
        acc[w] = ww
        return acc
      }, newWordToClue)
    }

    parse('down')
    parse('across')
  }

  return newWordToClue
}

function resetGridState(g) {
    const grid = g || JSON.parse(localStorage.getItem("grid")) || makePuzzle({rows: 15, cols: 15})
    const wordToClue = parseWordToClue(grid)
    const history = JSON.parse(localStorage.getItem("history")) || {undo: [], redo: []}

    return {grid, wordToClue, history}
}

const initialGridState = resetGridState()


const gridRef = React.createRef();
function ReactiveGrid({children}) {
  let [width, setWidth] = useState("100%")

  const handleResize = () => {
    gridRef.current && setWidth(gridRef.current.clientWidth)
  }

  useEffect(() => {
    // add event listener then call function on first render to ensure size is correct
    window.addEventListener('resize', handleResize)
    handleResize()
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return (
    <div ref={gridRef} style={{width: width, height: width}}>
      {children}
    </div>
  )
}

const hotKeyRef = React.createRef()


function App() {
  const classes = useStyles()
  const theme = useTheme()
  const [isPrint, setIsPrint] = useState(false)
  const [tabValue, handleTabChanged] = useState(0)
  const [motionState, dispatchMotionStateUpdate] = useReducer(reduceMotionState, {selected: null, currentWord: currentWordInitialState()})
  const [gridState, dispatchGridStateUpdate] = useReducer(reduceGridState, initialGridState)
  const menuActionsRef = useRef()
  const {grid, history} = gridState

  const {selected, currentWord} = motionState


  const updateGridState = (nextState) => {
    if (nextState === UNDO_ACTION || nextState === REDO_ACTION) {
      dispatchGridStateUpdate({type: nextState})
    } else {
      dispatchGridStateUpdate({
        type: UPDATE_GRID,
        payload: {grid: nextState}
      })
    }
  }

  const updateWordToClue = useCallback((word, clue) => {
    dispatchGridStateUpdate({
      type: UPDATE_WORD_TO_CLUE,
      payload: {
        [word]: clue
      }
    })
  }, [])

  const setCurrentWord = useCallback((currentWord) => {
    dispatchMotionStateUpdate({
      type: SET_CURRENT_WORD,
      payload: currentWord
    })
  }, [])

  const setSelected = useCallback((nextSelected) => {
    dispatchMotionStateUpdate({
      type: SET_SELECTED_SQUARE,
      payload: nextSelected
    })
  }, [])

  useEffect(() => {
    localStorage.setItem("grid", JSON.stringify(grid))
    localStorage.setItem("history", JSON.stringify(history))
  }, [grid, history])

  useEffect(() => {
    const nextCw = calcCurrentWord({selected, direction: currentWord.direction, grid})
    nextCw && setCurrentWord(nextCw)
  }, [setCurrentWord, selected, grid, currentWord.direction])



  const handleClueFocus = useCallback((direction, clueNum) => {
    let selected = {}
    for(let i=0; i<grid.gridnums.length; ++i) {
      if(grid.gridnums[i] == clueNum) {
        const row = Math.floor(i / grid.size.cols)
        const column = Math.floor(i % grid.size.cols)
        selected = {
          row, column
        }
        break;
      }
    }
    dispatchMotionStateUpdate({
      type: SET_CLUE_FOCUS,
      payload: {
        direction,
        selected
      }
    })
  }, [grid])

  const handleClueChanged = useCallback((direction, word, clue) => {
    updateWordToClue(word, clue)
  }, [updateWordToClue])

  const handleSavePuzzle = () => {
    var blob = new Blob([JSON.stringify(grid)], {type: "text/plain;charset=utf-8"});
    saveAs(blob, "puzzle.json")
  }

  // TODO handle failure and validate puzzle format
  const handleImportPuzzle = (e) => {
    let input = e.target;
    if (!input.value) {
      return;
    }

    let reader = new FileReader();
    reader.onload = function(){
      let text = reader.result;
      const newGrid = JSON.parse(text)
      dispatchGridStateUpdate({
        type: UPDATE_GRID,
        payload: {
          grid: newGrid,
          wordToClue: parseWordToClue(newGrid)
        }
      })
    };

    reader.readAsText(input.files[0]);
    input.value = '';
  }

  const handleCreateNewPuzzle = (size) => {
    dispatchGridStateUpdate({
      type: UPDATE_GRID,
      payload: resetGridState(makePuzzle(size))
    })
    setSelected()
  }

  const handleWordListClicked = useCallback(word => {
    const gridCopy = cloneDeep(grid)

    currentWord.coordinates.forEach((coord, i) => {
      gridCopy.grid[coord2dTo1d(grid, coord[0], coord[1])] = word[i]
    })

    hotKeyRef.current.focus()

    dispatchGridStateUpdate({
      type: UPDATE_GRID,
      payload: {grid: gridCopy}
    })
  }, [grid, currentWord])

  const handleCircleLogic = () => {
    let selectedCell = valFrom2d(grid, selected.row, selected.column);
    if (selectedCell === "") {
    } else {
      let circled = grid.circles[coord2dTo1d(grid, selected.row, selected.column)];
      circled = 1 - circled
      keyPressHandler.handleCircle(circled)
    }
  }

  const clsGridPaper = clsx(classes.paper)
  const clsScrollPaper = clsx(classes.paper, classes.scroll)

  const keyPressHandler = new KeyPressHandler({
    selected,
    setSelected,
    setCurrentWord,
    currentWord,
    grid,
    updateGrid: updateGridState,
  })

  const menuActionsComponent = (
    <MenuActions
      ref={menuActionsRef}
      onSavePuzzle={handleSavePuzzle}
      onImportPuzzle={handleImportPuzzle}
      onCreateNewPuzzle={handleCreateNewPuzzle}
      onUndo={() => dispatchGridStateUpdate({type: UNDO_ACTION})}
      onRedo={() => dispatchGridStateUpdate({type: REDO_ACTION})}
      onRebus={(letter) => keyPressHandler.handleLetter(letter)}
      onCircle={handleCircleLogic}
    />
  )


  useEffect(() => {
    const listener = (e) => setIsPrint(e.matches)
    window.matchMedia("print").addListener(listener)
    window.onbeforeprint = () => setIsPrint(true)
    window.onafterprint = () => setIsPrint(false)
  }, [])

  const separateGrid = useMediaQuery(theme.breakpoints.up('lg'))

  if (isPrint) {
    return <PrintView grid={grid} />
  }

  let tabs = [
    {label: "Word List", children: (
      <Paper className={clsScrollPaper} >
        <WordList onClick={handleWordListClicked} currentWord={currentWord}/>
      </Paper>
    )},
    {label: "Clues", children: (
      <Paper className={clsScrollPaper} >
        <Clues currentWord={currentWord} grid={grid} onClueFocus={handleClueFocus} onClueChanged={handleClueChanged}/>
      </Paper>
    )},
  ]

  let gridComponent = null

  const _gridComponent = (
    <KeyPressHandlerComponent keyPressHandler={keyPressHandler} forwardRef={hotKeyRef} extraActions={menuActionsRef.current}>
      <Paper className={clsGridPaper} >
        <ReactiveGrid>
          <XGrid grid={grid} selected={motionState.selected} currentWord={motionState.currentWord} onClick={setSelected} />
        </ReactiveGrid>
      </Paper>
    </KeyPressHandlerComponent>
  )

  if (separateGrid) {
    gridComponent = _gridComponent
  } else {
    tabs = [{label: "Grid", children: _gridComponent}, ...tabs]
  }

  const renderedTabs = (
    <React.Fragment>
      <Tabs value={tabValue} onChange={(e,nv) => handleTabChanged(nv)}>
        {tabs.map(t => <Tab key={t.label} label={t.label}/>)}
      </Tabs>
      {tabs.map((t,i) => <TabPanel key={t.label} value={tabValue} index={i}>{t.children}</TabPanel>)}
    </React.Fragment>
  )

  return (
    <div className="App">
      <Toolbar actions={menuActionsRef.current}/>
      <Container className={classes.container}>
        <Grid container spacing={2}>
        { separateGrid && (
          <Grid item lg={6} >
            {gridComponent}
          </Grid>
        )}
          <Grid item lg={6}>
            {renderedTabs}
          </Grid>
        </Grid>
      </Container>
      {menuActionsComponent}
    </div>
  );
}

export default App;
