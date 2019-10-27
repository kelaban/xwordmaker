import React, { memo, useState, useEffect, useCallback } from 'react';
import clsx from 'clsx';
import './App.css';
import XGrid from './XGrid'
import NewPuzzleForm from './NewPuzzleForm'
import KeyPressHandler from './KeyPressHandler'
import Clues from './Clues'
import {
  isDirectionAcross,
  isBlockedSquare,
  DIRECTION_ACROSS,
  DIRECTION_DOWN,
}  from './constants';
import { coord2dTo1d, valFrom2d } from './helpers';

import { saveAs } from 'file-saver';

import { makeStyles } from '@material-ui/core/styles';
import Paper from '@material-ui/core/Paper';
import Container from '@material-ui/core/Container';
import Grid from '@material-ui/core/Grid';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import SaveAlt from '@material-ui/icons/SaveAlt';
import ArrowUpwardIcon from '@material-ui/icons/ArrowUpward';


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
    "&:focus": {
      outline: 0,
    },
    padding: 10,
  },
  gridPaper: {
    width: "75vmin",
    height: "75vmin",
    //clear the width
    float: "left"
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

  useEffect(() => {
    fetch(`${process.env.PUBLIC_URL}/wordlist/wordlist.txt`)
      .then(resp => resp.text())
      .then(text =>
          text.split("\n")
            .filter(l => !l.startsWith("#")))
      .then(w => setWords(w))
  }, [])

  useEffect(() => {
    const query = new RegExp("^"+currentWord.word+"$", "i")
    setFiltered(words.filter(w => w.match(query)))
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

    for(let i=start; i<end; ++i) {
      let v = valFor(i)
      if (v === "") v = ".";
      word += v
      coordinates.push(coordinatesFor(i))
    }

    return { word, coordinates }
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

function parseWordToClue(grid) {
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

    return {grid, wordToClue}
}()

const currentWordInitialState = {word: "", direction: DIRECTION_ACROSS, coordinates: []}


function App() {
  const classes = useStyles()
  const [tabValue, handleTabChanged] = useState(0)
  const [motionState, setMotionState] = useState({selected: null, currentWord: currentWordInitialState})
  const [gridState, updateAllGridState] = useState(initialGridState)
  const {wordToClue, grid} = gridState

  const [gridFocus, setGridFocus] = useState(false)

  const {selected, currentWord} = motionState

  const updateGridState = (nextGrid, extraState) => {
    extraState = extraState || {}
    updateAllGridState((prevState) => {
      let nextState = {
        ...prevState,
        ...extraState,
        grid: nextGrid
      }
      nextState.grid = {...nextState.grid, ...calcNumbersAndAnswers(nextState.grid, nextState.wordToClue)}
      return nextState
    })
  }

  const updateWordToClue = (word, clue) => {
    updateAllGridState((prevState) => {
      let nextState = {
        ...prevState,
        wordToClue: {
          ...prevState.wordToClue,
          [word]: clue
        }
      }
      nextState.grid = {...nextState.grid, ...calcNumbersAndAnswers(nextState.grid, nextState.wordToClue)}
      return nextState
    })
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
  },
    [grid, wordToClue]
  )

  useEffect(() => {
    const nextCw = calcCurrentWord({selected, direction: currentWord.direction, grid})
    nextCw && setCurrentWord(nextCw)
  }, [setCurrentWord, selected, grid, currentWord.direction])


  const setSelected = (nextSelected) => {
    let nextCurrentWord = motionState.currentWord

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

    let reader = new FileReader();
    reader.onload = function(){
      let text = reader.result;
      const newGrid = JSON.parse(text)
      updateGridState(newGrid, {
        wordToClue: parseWordToClue(newGrid)
      })
    };

    reader.readAsText(input.files[0]);
  }

  const handleCreateNewPuzzle = (size) => {
    updateGridState(makePuzzle(size))
    setSelected()
  }

  const handleFocus = hasFocus => e => {
    setGridFocus(hasFocus)
  }

  const handleWordListClicked = useCallback(word => {
    currentWord.coordinates.forEach((coord, i) => {
      grid.grid[coord2dTo1d(grid, coord[0], coord[1])] = word[i]
    })
    updateGridState(grid)
  }, [grid, currentWord])


  const clsGridPaper = clsx(classes.paper, classes.gridPaper)
  const clsScrollPaper = clsx(classes.paper, classes.scroll)

  const kphProps = {
    selected,
    setSelected,
    setCurrentWord,
    currentWord,
    grid,
    updateGrid: updateGridState,
    hasFocus: gridFocus
  }

  return (
    <div className="App">
      <AppBar position="static">
       <Toolbar>
        <Typography variant="h6" className={classes.title}>
          XWordMaker
        </Typography>
        <Button
          aria-label="Save puzzle"
          color="inherit"
          startIcon={<SaveAlt />}
          onClick={handleSavePuzzle}
        >
          Save Puzzle
        </Button>
        <Button
          aria-label="Load puzzle"
          color="inherit"
          component="label"
          startIcon={<ArrowUpwardIcon />}
        >
          Load Puzzle
          <input
            type="file"
            style={{ display: "none" }}
            onChange={handleImportPuzzle}
            />
        </Button>
        <NewPuzzleForm onSave={handleCreateNewPuzzle}/>
       </Toolbar>
      </AppBar>
      <KeyPressHandler {...kphProps} />
      <Container className={classes.container}>
        <Grid container spacing={2}>
          <Grid item xs>
            <Paper className={clsGridPaper} onFocus={handleFocus(true)} onBlur={handleFocus(false)} tabindex="0">
              <XGrid grid={grid} selected={motionState.selected} currentWord={motionState.currentWord} onClick={setSelected} />
            </Paper>
          </Grid>
          <Grid item xs={6}>
            <Tabs value={tabValue} onChange={(e,nv) => handleTabChanged(nv)}>
              <Tab label="Word List"/>
              <Tab label="Clues"/>
            </Tabs>
            <TabPanel value={tabValue} index={0}>
            <Paper className={clsScrollPaper} >
              <WordList onClick={handleWordListClicked} currentWord={currentWord}/>
            </Paper>
            </TabPanel>
            <TabPanel value={tabValue} index={1}>
            <Paper className={clsScrollPaper} >
              <Clues grid={grid} onClueFocus={handleClueFocus} onClueChanged={handleClueChanged}/>
            </Paper>
            </TabPanel>
          </Grid>
        </Grid>
      </Container>
    </div>
  );
}

export default App;
