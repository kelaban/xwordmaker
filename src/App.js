import React, { Component, useState, useEffect } from 'react';
import logo from './logo.svg';
import './App.css';

const gg = [
  ["","","","","","","","","","","","","","","",""],
  ["","","","","","","","","","","","","","","",""],
  ["","","","","","","","","","","","","","","",""],
  ["","","","","","","","","","","","","","","",""],
  ["","","","","","","","","","","","","","","",""],
  ["","","","","","","","","","","","","","","",""],
  ["","","","","","","","","","","","","","","",""],
  ["","","","","","","","","","","","","","","",""],
  ["","","","","","","","","","","","","","","",""],
  ["","","","","","","","","","","","","","","",""],
  ["","","","","","","","","","","","","","","",""],
  ["","","","","","","","","","","","","","","",""],
  ["","","","","","","","","","","","","","","",""],
  ["","","","","","","","","","","","","","","",""],
  ["","","","","","","","","","","","","","","",""],
  ["","","","","","","","","","","","","","","",""],
]

const DIRECTION_ACROSS = "ACROSS"
const DIRECTION_DOWN = "DOWN"

const Grid = ({width, height, grid, selected, currentWord, onClick}) => {

  // go from 0 -> width*height and map to a block in the view
  const gridItems = [...Array(width*height).keys()]
      .map(i => {
        const row = Math.floor(i/width)
        const column = Math.floor(i%width)
        const val = grid[row][column]
        const isSelected = selected && selected.row === row && selected.column === column
        let classNames = ["Grid-item"]
        if (val === "!") {
          classNames.push("Grid-item-blocked")
        }
        if (isSelected) {
          classNames.push("Grid-item-selected")
        } else if (currentWord.coordinates.some(i => i[0] === row && i[1] === column)) {
          classNames.push("Grid-item-highlight")
        }
        const cn = classNames.join(" ")
        const style = {
          fontSize: `${(1/val.length)*2}em`
        }

        return (
          <div key={i} style={style} className={cn} onClick={() => onClick({row, column})}>{val}</div>
        )
      })

  return (
    <div
      style={{
        gridTemplateColumns: `repeat(${width}, 1fr)`,
        gridTemplateRows: `repeat(${width}, 1fr)`
      }}
      className="Grid-container"
    >
      {gridItems}
    </div>
  )
}


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
    fetch("/wordlist/wordlist.txt")
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

  return <div>
    <br/>
    Words: {filtered.length}
    <br/>
    Filtered:
    {JSON.stringify(filtered, null, 2)}
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

function App() {
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
    if (selected && currentWord.direction === DIRECTION_ACROSS) {
      let start = selected.column;
      let end = selected.column;
      while(start>0 && grid[selected.row][start] !== "!") start--;
      while(end<width && grid[selected.row][end] !== "!") end++;
      if (grid[selected.row][start] === "!") start++;
      let word = ""
      let coordinates = []
      for(let i=start; i<end; ++i) {
        let v = grid[selected.row][i]
        if (v === "") v = ".";
        word += v
        coordinates.push([selected.row, i])
      }

      setCurrentWord(Object.assign({}, currentWord, {
        word,
        coordinates
      }))
    } else if (selected && currentWord.direction === DIRECTION_DOWN) {
      let start = selected.row;
      let end = selected.row;
      while(start>0 && grid[start][selected.column] !== "!") start--;
      while(end<height && grid[end][selected.column] !== "!") end++;
      if (grid[start][selected.column] === "!") start++;
      let word = ""
      let coordinates = []
      for(let i=start; i<end; ++i) {
        let v = grid[i][selected.column]
        if (v === "") v = ".";
        word += v
        coordinates.push([i, selected.column])
      }

      setCurrentWord(Object.assign({}, currentWord, {
        word,
        coordinates
      }))
    }
  }, [selected, currentWord.direction])

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

  return (
    <div className="App">
      <Grid width={width} height={height} grid={grid} selected={selected} currentWord={currentWord} onClick={setSelected} />
      <GridStats grid={grid} />
      <WordList currentWord={currentWord}/>
    </div>
  );
}

export default App;
