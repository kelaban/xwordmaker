import React, { Component, useState, useEffect } from 'react';
import clsx from 'clsx';
import logo from './logo.svg';
import './App.css';
import XGrid from './XGrid'
import {
  isDirectionAcross,
  isBlockedSquare,
  DIRECTION_ACROSS,
  DIRECTION_DOWN,
  BLOCKED_SQUARE
}  from './constants';

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



const coord2dTo1d = (grid, row, col) => (grid.size.cols*row)+col
const valFrom2d = (grid, row, col) => grid.grid[coord2dTo1d(grid, row, col)]

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
  gridPaper: {
    width: "75vmin",
    height: "75vmin",
    //clear the width
    float: "left"
  },
  scroll: {
    overflow: "scroll",
    maxHeight: "calc(100vh - 100px)",
  }
}));

const GridStats = ({grid}) => {
  // get {A: 0 ... Z:0)
  const letters = [...Array(26).keys()].map(i => String.fromCharCode(i + 65)).reduce((acc, v) => ((acc[v] = 0) || acc), {})
  // add counts of single letters
  const letterCounts = grid.grid.map(v => v).filter(v => v.match(/^[A-Z]$/)).reduce((acc, v) => ((acc[v] = (acc[v] || 0) + 1) && acc), letters)

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


const WordList = ({currentWord}) => {
  const [words, setWords] = useState([])
  const [filtered, setFiltered] = useState([])

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
  }, [currentWord.word])

  const max = 200

  return <div>
    Words: {filtered.length > max ? `showing ${max}/` : ''}{filtered.length}
    <List>
      {filtered.slice(0,200).map(w =>
          <ListItem
            key={w}
            component="a"
            target="_blank"
            href={`https://www.anagrammer.com/crossword-clues/${w}`}>
            {w}
          </ListItem>
       )}
    </List>
  </div>
}


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
    if (this.currentWord.direction === DIRECTION_ACROSS) {
      this.right()
    } else {
      this.down()
    }
  }
  moveBack() {
    if (this.currentWord.direction === DIRECTION_ACROSS) {
      this.left()
    } else {
      this.up()
    }
  }
}

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  let style = {}
  if (value !== index) {
    style['display'] = "none"
  }

  return <div style={style}>
    {children}
  </div>
}


function KeyPressHandler(props) {
  const {
    selected,
    setSelected,
    setCurrentWord,
    currentWord,
    grid,
    updateGrid
  } = props

  const {rows: width, cols: height} = grid.size

  const handleKeyPressed = (e) => {
    if (selected) {
      const movement = new Movement({width, height, setSelected, currentWord, selected})

      if (e.key === "Backspace") {
        const old = valFrom2d(grid, selected.row, selected.column)
        if (isBlockedSquare(old)) {
          grid.grid[coord2dTo1d(grid, height - selected.row - 1, width - selected.column - 1)] = ""
        }
        grid.grid[coord2dTo1d(grid, selected.row, selected.column)] = ""

        movement.moveBack()
        updateGrid(grid.grid)
      } else if(e.key.match(/^[a-z0-9]$/i)) {
        let k = e.key.toUpperCase()
        if (e.ctrlKey) {
          grid.grid[coord2dTo1d(grid, selected.row, selected.column)] += k
        } else {
          grid.grid[coord2dTo1d(grid, selected.row, selected.column)] = k
          movement.moveForward()
        }
        updateGrid(grid.grid)
      } else if(e.key === BLOCKED_SQUARE) {
        grid.grid[coord2dTo1d(grid, selected.row, selected.column)] = e.key
        grid.grid[coord2dTo1d(grid, height - selected.row - 1, width - selected.column - 1)] = e.key
        movement.moveForward()
        updateGrid(grid.grid)
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


function calcNumbers(grid) {
  const {rows, cols} = grid.size
  let out = grid.grid.map(r => 0); // clone grid
  let num = 1;
  for (let i=0; i<rows; ++i){
    for (let j=0; j<cols; ++j) {
      if (isBlockedSquare(valFrom2d(grid, i, j))) continue;

      if(
        ((i === 0 || isBlockedSquare(valFrom2d(grid,i-1,j)) && (i !== rows || isBlockedSquare(valFrom2d(grid,i+1,j))))) ||
        ((j === 0 || isBlockedSquare(valFrom2d(grid,i,j-1)) && (j !== cols || isBlockedSquare(valFrom2d(grid,i,j+1)))))) {
        out[coord2dTo1d(grid, i, j)] = num++;
      }
    }
  }

  return out;
}

function calcCurrentWord({currentWord, grid, selected}) {
    if (!selected) { return currentWord }

    const valFor = (x) => isDirectionAcross(currentWord.direction) ? valFrom2d(grid,selected.row, x) : valFrom2d(grid, x, selected.column)
    const coordinatesFor = (x) => isDirectionAcross(currentWord.direction) ? [selected.row, x] : [x, selected.column]
    const isEnd = (end) => isDirectionAcross(currentWord.direction) ? end < grid.size.cols : end < grid.size.rows

    let start = isDirectionAcross(currentWord.direction) ? selected.column : selected.row;
    let end = start

    // Find beginning
    // Then find end of the word
    // When convert those values into an string and convert blanks to . for word search
    // also compile list of coordinates for grid highlighting
    //  finally set the new state
    while(start>0 && !isBlockedSquare(valFor(start))) start--;
    while(isEnd(end) && !isBlockedSquare(valFor(end))) end++;
    if (isBlockedSquare(valFor(start))) start++;

    let word = ""
    let coordinates = []

    console.log(start, end)
    for(let i=start; i<end; ++i) {
      let v = valFor(i)
      if (v === "") v = ".";
      word += v
      coordinates.push(coordinatesFor(i))
    }


    return Object.assign({}, currentWord, {
      word,
      coordinates
    })
}

// Format specified by https://www.xwordinfo.com/JSON/
const DEFAULT_GRID = function(){
  let g = {
    title: "TODO: NY Times, Thu, Sep 11, 2008",
    author: "TODO: Caleb Madison",
    editor: "TODO: Will Shortz",
    copyright: "TODO: 2008, The New York Times",
    publisher: "TODO: The New York Times",
    date: "TODO: 9/11/2008",
    size: {
      rows: 15,
      cols: 15
    },
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
}()

function App() {
  const classes = useStyles()
  const [tabValue, handleTabChanged] = useState(0)
  const [selected, setSelected] = useState()
  const [currentWord, setCurrentWord] = useState({word: "", direction: DIRECTION_ACROSS, coordinates: []})
  const [grid, updateGridState] = useState(JSON.parse(localStorage.getItem("grid")))

  const [gridModel, setGridModel] = useState({})


  // updateGrid only updates the grid section of grid
  const updateGrid = (nextGrid) => {
    const g = Object.assign({}, grid, {grid: nextGrid})
    localStorage.setItem("grid", JSON.stringify(g))
    updateGridState(g)
  }

  useEffect(() =>
    updateGridState(Object.assign(grid, {gridnums: calcNumbers(grid)})),
    [grid.grid]
  )

  useEffect(() =>
    setCurrentWord(calcCurrentWord({selected, currentWord, grid})),
    [selected, currentWord.direction]
  )

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
      updateGridState(JSON.parse(text))
    };

    reader.readAsText(input.files[0]);
  }

  const clsGridPaper = clsx(classes.paper, classes.gridPaper)
  const clsScrollPaper = clsx(classes.paper, classes.scroll)

  const kphProps = {
    selected,
    setSelected,
    setCurrentWord,
    currentWord,
    grid,
    updateGrid
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
          aria-label="Import puzzle"
          color="inherit"
          component="label"
          startIcon={<ArrowUpwardIcon />}
        >
          Import Puzzle
          <input
            type="file"
            style={{ display: "none" }}
            onChange={handleImportPuzzle}
            />
        </Button>
       </Toolbar>
      </AppBar>
      <KeyPressHandler {...kphProps} />
      <Container className={classes.container}>
        <Grid container spacing={0}>
          <Grid item xs>
            <Paper className={clsGridPaper} >
              <XGrid grid={grid} selected={selected} currentWord={currentWord} onClick={setSelected} />
            </Paper>
          </Grid>
          <Grid item xs={6}>
            <Tabs value={tabValue} onChange={(e,nv) => handleTabChanged(nv)}>
              <Tab label="Word List"/>
              <Tab label="Grid Stats"/>
            </Tabs>
            <TabPanel value={tabValue} index={0}>
            <Paper className={clsScrollPaper} >
              <WordList currentWord={currentWord}/>
            </Paper>
            </TabPanel>
            <TabPanel value={tabValue} index={1}>
              <Paper className={clsScrollPaper} >
                <GridStats grid={grid} />
              </Paper>
            </TabPanel>
          </Grid>
        </Grid>
      </Container>
    </div>
  );
}

export default App;
