import React, { Component, useState, useEffect } from 'react';

import {
  isDirectionAcross,
  DIRECTION_ACROSS,
  DIRECTION_DOWN,
}  from './constants';

import TextField from '@material-ui/core/TextField';
import { makeStyles } from '@material-ui/core/styles';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';

const useStyles = makeStyles(theme => ({
  textField: {
      //marginLeft: theme.spacing(1),
      //marginRight: theme.spacing(1),
    },
}));

function decode(input)
{
  var doc = new DOMParser().parseFromString(input, "text/html");
  return doc.documentElement.textContent;
}

export default function Clues({grid, onClueFocus, onClueChanged}) {
  const classes = useStyles();

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
      return (
          <TextField
            key={i}
            label={`${clueNum}: ${word}`}
            defaultValue={clueText}
            className={classes.textField}
            type="text"
            margin="dense"
            variant="outlined"
            fullWidth
            onFocus={handleFocus(dir, clueNum)}
            onBlur={handleUpdateWord(dir, word)}
          />
      )
    })
  }

  return (
    <div>
      <Grid container spacing={1}>
        <Grid item xs>
          <Typography>Across</Typography>
            {mapClues(DIRECTION_ACROSS)}
        </Grid>
        <Grid item xs>
          <Typography>Down</Typography>
            {mapClues(DIRECTION_DOWN)}
        </Grid>
      </Grid>
    </div>
  )
}
