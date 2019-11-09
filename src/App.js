import React, { memo, useState, useEffect, useCallback } from 'react';
import clsx from 'clsx';
import './App.css';
import XGrid from './XGrid'
import Toolbar from './Toolbar'
import KeyPressHandler from './KeyPressHandler'
import Clues, {decode} from './Clues'
import PrintView from './Print'
import {
  isDirectionAcross,
  isBlockedSquare,
  DIRECTION_ACROSS,
  DIRECTION_DOWN,
  UNDO_ACTION,
  REDO_ACTION
}  from './constants';
import { coord2dTo1d, valFrom2d } from './helpers';

import { saveAs } from 'file-saver';

import { makeStyles, useTheme } from '@material-ui/core/styles';
import useMediaQuery from '@material-ui/core/useMediaQuery';
import Paper from '@material-ui/core/Paper';
import Container from '@material-ui/core/Container';
import Grid from '@material-ui/core/Grid';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';

import {cloneDeep, debounce} from 'lodash';


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

const GridStats = ({grid}) => {
  return null
  // get {A: 0 ... Z:0)
  const letters = [...Array(26).keys()].map(i => String.fromCharCode(i + 65)).reduce((acc, v) => ((acc[v] = 0) || acc), {})
  // add counts of single letters
  const letterCounts = grid.grid.map(v => v).filter(v => v && v.match(/^[A-Z]$/)).reduce((acc, v) => ((acc[v] = (acc[v] || 0) + 1) && acc), letters)

  const calcWordCount = (down) => {
    const count = {}
    for (let i=0; i<=grid.size.rows; ++i) {
      let len = 0
      for (let j=0; j<=grid.size.cols; ++j) {
        let v = down ?  valFrom2d(grid, j, i) : valFrom2d(grid, i, j)
        if(isBlockedSquare(v)) {
          len += 1
        } else {
          if (len > 0) {
            count[len] = (count[len] || 0) + 1
          }
          len = 0
        }
      }
      if (len > 0) {
        count[len] = (count[len] || 0) + 1
      }
    }

    return count
  }

  const wordLengthsAccross = calcWordCount()
  const wordLengthsDown = calcWordCount(true)
  const totalCount = Object.values(wordLengthsAccross).reduce((acc, v) => acc+v, 0) +
                      Object.values(wordLengthsDown).reduce((acc, v) => acc+v, 0)

  return (
    <div>
      {JSON.stringify(letterCounts)}
      <br/>
      Across
      <br/>
      {JSON.stringify(wordLengthsAccross)}
      <br/>
      Down
      <br/>
      {JSON.stringify(wordLengthsDown)}
      <br/>
      Total: {totalCount}
    </div>
  )
}


let WORDLIST = null

const WordList = memo(({currentWord, onClick}) => {
  const [words, setWordsState] = useState(WORDLIST || [])
  const [filtered, setFiltered] = useState([])

  const setWords = (words) => {
    //cache wordlist incase component unmounts
    WORDLIST = words
    setWordsState(words)
  }

  const debouncedFilter = useCallback(debounce( query => {
    setFiltered(words.filter(w => w.match(query)))
  }, 300), [words])

  useEffect(() => {
    fetch(`${process.env.PUBLIC_URL}/wordlist/wordlist.txt`)
      .then(resp => resp.text())
      .then(text =>
          text.split("\n")
            .filter(l => !l.startsWith("#")))
      .then(w => setWords(w))
  }, [])

  useEffect(() => {
    debouncedFilter(new RegExp("^"+currentWord.word+"$", "i"))
  }, [words, currentWord.word])

  const max = 100

  /*
          <ListItem
            key={w}
            component="a"
            target="_blank"
            href={`https://www.anagrammer.com/crossword-clues/${w}`}>
            */

  return <div>
    Words: {filtered.length > max ? `showing ${max}/` : ''}{filtered.length}
    <List dense>
      {filtered.slice(0,max).map(w =>
          <ListItem
            button
            onClick={() => onClick(w)}
            key={w}>
            {w}
          </ListItem>
       )}
    </List>
  </div>
})



function TabPanel(props) {
  const { children, value, index, ...other } = props;

  let style = {}
  let hidden = value !== index

  if (hidden) {
    return <div></div>
  }

  return <div>
    {children}
  </div>
}


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

const initialGridState = function intialGridState() {
    const grid = JSON.parse(localStorage.getItem("grid")) || makePuzzle({rows: 15, cols: 15})
    const wordToClue = parseWordToClue(grid)
    const history = JSON.parse(localStorage.getItem("history")) || {undo: [], redo: []}

    return {grid, wordToClue, history}
}()

const currentWordInitialState = {word: "", direction: DIRECTION_ACROSS, coordinates: []}

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

const MAX_HISTORY = 25

const hotKeyRef = React.createRef()


function App() {
  const classes = useStyles()
  const theme = useTheme()
  const [isPrint, setIsPrint] = useState(false)
  const [tabValue, handleTabChanged] = useState(0)
  const [motionState, setMotionState] = useState({selected: null, currentWord: currentWordInitialState})
  const [gridState, updateAllGridState] = useState(initialGridState)
  const {wordToClue, grid, history} = gridState


  const {selected, currentWord} = motionState

  //cb can be a function which recieves the previous state
  // or a string which is either the UNDO or REDO action
  const updateAllGridStateFromPrevious = (cb) => {
    updateAllGridState((prevState) => {
      let nextState = null
      switch(cb) {
        case UNDO_ACTION:
          nextState = {...prevState}
          const past = prevState.history.undo
          if (!past.length) {
            break
          }
          const previous = past[past.length - 1]
          const newPast = past.slice(0, past.length - 1)
          nextState.grid = previous
          nextState.history = {
            undo: newPast,
            redo: [prevState.grid, ...prevState.history.redo]
          }
          break;
        case REDO_ACTION:
          nextState = {...prevState}
          const future = prevState.history.redo
          if (!future.length) {
            break
          }
          const next = future[0]
          const newFuture = future.slice(1)
          nextState.grid = next
          nextState.history = {
            undo: [...prevState.history.undo, prevState.grid],
            redo: newFuture
          }
          break;
        default:
          nextState = cb(prevState)
          nextState.grid = {...nextState.grid, ...calcNumbersAndAnswers(nextState.grid, nextState.wordToClue)}
          // since history gets pushed on the the stack slice off the start of the history to keep the size small enough
          nextState.history.undo = nextState.history.undo.slice(-MAX_HISTORY)
          nextState.history.undo.push(prevState.grid)
          nextState.history.redo = []
      }

      return nextState
    })
  }


  const updateGridState = (nextGrid, extraState) => {
    if (nextGrid === UNDO_ACTION || nextGrid === REDO_ACTION) {
      updateAllGridStateFromPrevious(nextGrid)
    } else {
      extraState = extraState || {}
      updateAllGridStateFromPrevious((prevState) => ({
        ...prevState,
        ...extraState,
        grid: nextGrid
      }))
    }
  }

  const updateWordToClue = (word, clue) => {
    updateAllGridStateFromPrevious((prevState) => ({
        ...prevState,
        wordToClue: {
          ...prevState.wordToClue,
          [word]: clue
        }
    }))
  }

  const setCurrentWord = useCallback((currentWord) => {
    setMotionState((prevState) => ({
      ...prevState,
      currentWord: {
        ...prevState.currentWord,
        ...currentWord
      }
    }))
  }, [])

  useEffect(() => {
    localStorage.setItem("grid", JSON.stringify(grid))
    localStorage.setItem("history", JSON.stringify(history))
  },
    [grid, history]
  )

  useEffect(() => {
    const nextCw = calcCurrentWord({selected, direction: currentWord.direction, grid})
    nextCw && setCurrentWord(nextCw)
  }, [setCurrentWord, selected, grid, currentWord.direction])


  const setSelected = (nextSelected) => {
    let nextCurrentWord = motionState.currentWord

    //swap direction if selected is double clicked
    if(nextSelected && selected && nextSelected.row === selected.row && nextSelected.column === selected.column) {
      nextCurrentWord = {
        ...nextCurrentWord,
        direction: currentWord.direction === DIRECTION_ACROSS ? DIRECTION_DOWN : DIRECTION_ACROSS
      }
    }

    setMotionState({
      ...motionState,
      selected: nextSelected,
      currentWord: nextCurrentWord
    })
  }

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

    setMotionState((prevState) => ({
      ...prevState,
      currentWord: {
        ...currentWordInitialState,
        direction,
      },
      selected,
    }))
  }, [grid])

  const handleClueChanged = useCallback((direction, word, clue) => {
    updateWordToClue(word, clue)
  }, [])

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
      updateGridState(newGrid, {
        wordToClue: parseWordToClue(newGrid)
      })
    };

    reader.readAsText(input.files[0]);
    input.value = '';
  }

  const handleCreateNewPuzzle = (size) => {
    updateGridState(makePuzzle(size))
    setSelected()
  }

  const handleWordListClicked = useCallback(word => {
    const gridCopy = cloneDeep(grid)
    currentWord.coordinates.forEach((coord, i) => {
      gridCopy.grid[coord2dTo1d(grid, coord[0], coord[1])] = word[i]
    })
    hotKeyRef.current.focus()
    updateGridState(gridCopy)
  }, [grid, currentWord])


  const clsGridPaper = clsx(classes.paper)
  const clsScrollPaper = clsx(classes.paper, classes.scroll)

  const kphProps = {
    selected,
    setSelected,
    setCurrentWord,
    currentWord,
    grid,
    updateGrid: updateGridState,
    forwardRef: hotKeyRef,
  }

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
    <KeyPressHandler {...kphProps}>
      <Paper className={clsGridPaper} >
        <ReactiveGrid>
          <XGrid grid={grid} selected={motionState.selected} currentWord={motionState.currentWord} onClick={setSelected} />
        </ReactiveGrid>
      </Paper>
    </KeyPressHandler>
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
      <Toolbar
        handleSavePuzzle={handleSavePuzzle}
        handleImportPuzzle={handleImportPuzzle}
        handleCreateNewPuzzle={handleCreateNewPuzzle}
      />
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
    </div>
  );
}

export default App;
