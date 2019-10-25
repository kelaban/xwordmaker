import React, { Component, useState, useEffect } from 'react';
import clsx from 'clsx';
import logo from './logo.svg';
import './App.css';
import XGrid from './XGrid'

import { makeStyles } from '@material-ui/core/styles';
import Paper from '@material-ui/core/Paper';
import Container from '@material-ui/core/Container';
import Grid from '@material-ui/core/Grid';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';


const DIRECTION_ACROSS = "ACROSS"
const DIRECTION_DOWN = "DOWN"

const useStyles = makeStyles(theme => ({
  root: {
    display: "flex",
  },
  container: {
    paddingLeft: 12,
    paddingRight: 12,
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
  const letterCounts = grid.flatMap(r => r.map(v => v)).filter(v => v.match(/^[A-Z]$/)).reduce((acc, v) => ((acc[v] = (acc[v] || 0) + 1) && acc), letters)

  const calcWordCount = (down) => {
    const count = {}
    for (let i=0; i<=grid.length-1; ++i) {
      let len = 0
      for (let j=0; j<=grid[0].length-1; ++j) {
        let v = down ?  grid[j][i] : grid[i][j]
        if(v !== "!") {
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

const w = 15
const h = 15
const gr = JSON.stringify([...Array(w).keys()].map(r => [...Array(h).keys()].map(x => "")))


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
    width,
    height,
    selected,
    setSelected,
    setCurrentWord,
    currentWord,
    grid,
    updateGrid
  } = props

  const handleKeyPressed = (e) => {
    if (selected) {
      const movement = new Movement({width, height, setSelected, currentWord, selected})

      if (e.key === "Backspace") {
        const old = grid[selected.row][selected.column]
        if (old === '!') {
          grid[height - selected.row - 1][width - selected.column - 1] = ''
        }
        grid[selected.row][selected.column] = ""

        movement.moveBack()
        updateGrid([...grid])

      } else if(e.key.match(/^[a-z]$/i)) {
        let k = e.key.toUpperCase()
        if (e.ctrlKey) {
          grid[selected.row][selected.column] += k
        } else {
          grid[selected.row][selected.column] = k
          movement.moveForward()
        }
        updateGrid([...grid])
      } else if(e.key === '!') {
        grid[selected.row][selected.column] = e.key
        grid[height - selected.row - 1][width - selected.column - 1] = e.key
        movement.moveForward()
        updateGrid([...grid])
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

  return <React.Fragment></React.Fragment>
}

function App() {
  const classes = useStyles()
  const [tabValue, handleTabChanged] = useState(0)
  const [selected, setSelected] = useState()
  const [currentWord, setCurrentWord] = useState({word: "", direction: DIRECTION_ACROSS, coordinates: []})
  const [grid, updateGridState] = useState(JSON.parse(localStorage.getItem("grid") || gr))

  const width = grid[0].length
  const height = grid.length

  const updateGrid = (nextGrid) => {
    localStorage.setItem("grid", JSON.stringify(nextGrid))
    updateGridState(nextGrid)
  }

  useEffect(() => {
    if (selected) {
      const valFor = (x) => currentWord.direction === DIRECTION_ACROSS ? grid[selected.row][x] :grid[x][selected.column]
      const coordinatesFor = (x) => currentWord.direction === DIRECTION_ACROSS ? [selected.row, x] : [x, selected.column]
      const isEnd = (end) => currentWord.direction === DIRECTION_ACROSS ? end < width : end < height

      let start = currentWord.direction === DIRECTION_ACROSS ? selected.column : selected.row;
      let end = start

      // Find beginning
      // Then find end of the word
      // When convert those values into an string and convert blanks to . for word search
      // also compile list of coordinates for grid highlighting
      //  finally set the new state
      while(start>0 && valFor(start) !== "!") start--;
      while(isEnd(end) && valFor(end) !== "!") end++;
      if (valFor(start) === "!") start++;

      let word = ""
      let coordinates = []

      for(let i=start; i<end; ++i) {
        let v = valFor(i)
        if (v === "") v = ".";
        word += v
        coordinates.push(coordinatesFor(i))
      }

      setCurrentWord(Object.assign({}, currentWord, {
        word,
        coordinates
      }))

    }
  }, [selected, currentWord.direction])


  const clsGridPaper = clsx(classes.paper, classes.gridPaper)
  const clsScrollPaper = clsx(classes.paper, classes.scroll)

  const kphProps = {
    width,
    height,
    selected,
    setSelected,
    setCurrentWord,
    currentWord,
    grid,
    updateGrid
  }

  return (
    <div className="App">
      <KeyPressHandler {...kphProps} />
      <Container className={classes.container}>
        <Grid container spacing={0}>
          <Grid item xs>
            <Paper className={clsGridPaper} >
              <XGrid width={width} height={height} grid={grid} selected={selected} currentWord={currentWord} onClick={setSelected} />
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
