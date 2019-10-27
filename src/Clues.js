import React, { memo } from 'react';

import {
  DIRECTION_ACROSS,
  DIRECTION_DOWN,
}  from './constants';

import TextField from '@material-ui/core/TextField';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';

function decode(input)
{
  var doc = new DOMParser().parseFromString(input, "text/html");
  return doc.documentElement.textContent;
}

export default memo(function Clues({grid, onClueFocus, onClueChanged}) {
    const handleFocus = (dir, clueNum) => (e) => {
      onClueFocus(dir, clueNum)
    }

    const handleUpdateWord = (dir, word) => e => {
      onClueChanged(dir, word, e.target.value)
    }

    const mapClues = (dir) => {
      const d = dir.toLowerCase()
      return grid.clues[d].map((clue, i) => {
        const word = grid.answers[d][i]
        const clueNum = +clue.match(/^ *[0-9]+/)[0].trim()
        const clueText = decode(clue.replace(/^ *[0-9]*\. */, ''))
        const disabled = word.match("_")
        const error = !disabled && !clueText.length
        return (
            <TextField
              key={`${clueNum}-${word}`}
              label={`${clueNum}: ${word}`}
              defaultValue={clueText}
              type="text"
              margin="dense"
              variant="outlined"
              fullWidth
              onFocus={handleFocus(dir, clueNum)}
              onBlur={handleUpdateWord(dir, word)}
              disabled={disabled}
              error={error}
            />
        )
      })
    }

    const across = mapClues(DIRECTION_ACROSS)
    const down = mapClues(DIRECTION_DOWN)
    return (
      <div>
        <Grid container spacing={1}>
          <Grid item xs>
            <Typography>Across</Typography>
              {across}
          </Grid>
          <Grid item xs>
            <Typography>Down</Typography>
              {down}
          </Grid>
        </Grid>
      </div>
    )
  })
