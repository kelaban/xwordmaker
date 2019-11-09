import React, { memo } from 'react';
import clsx from 'clsx';

import {
  DIRECTION_ACROSS,
  DIRECTION_DOWN,
}  from './constants';

import { makeStyles } from '@material-ui/core/styles';
import TextField from '@material-ui/core/TextField';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';

const useStyles = makeStyles(theme => ({
  // pseudo class to apply when we want to style focus
  // withouth applying real focus
  focused: {}
}));

export function decode(input)
{
  var doc = new DOMParser().parseFromString(input, "text/html");
  return doc.documentElement.textContent;
}

function Clue({word, clue, dir, currentWord, onClick, onBlur}) {
  // how do i make classes generate the right name 'Mui-focused'
  const classes = useStyles()
  const clueNum = +clue.match(/^ *[0-9]+/)[0].trim()
  const clueText = decode(clue.replace(/^ *[0-9]*\. */, ''))
  const disabled = word.match("_")
  const error = !disabled && !clueText.length
  const focus = currentWord.clueNum === clueNum && currentWord.direction === dir
  const className = clsx({'Mui-focused': focus})
  return (
      <TextField
        label={`${clueNum}: ${word}`}
        defaultValue={clueText}
        type="text"
        margin="dense"
        variant="outlined"
        fullWidth
        onClick={onClick(dir, clueNum)}
        onBlur={onBlur(dir, word)}
        disabled={disabled}
        error={error}
        InputLabelProps={{className}}
        InputProps={{className}}
      />
  )
}

export default memo(function Clues({grid, currentWord, onClueFocus, onClueChanged}) {
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
        return <Clue
          key={`${d}-${i}-${word}`}
          word={word}
          clue={clue}
          dir={dir}
          currentWord={currentWord}
            onClick={handleFocus}
            onBlur={handleUpdateWord}
        />
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
