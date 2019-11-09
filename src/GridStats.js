
// THIS DOESN'T ACTUALLY WORK
// Keeping it around for momento sake
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
