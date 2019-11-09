import React from 'react';

import NewPuzzleForm from './NewPuzzleForm'

import { makeStyles } from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import MuiToolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import SaveAlt from '@material-ui/icons/SaveAlt';
import ArrowUpwardIcon from '@material-ui/icons/ArrowUpward';

const useStyles = makeStyles(theme => ({
  title: {
    flexGrow: 1
  },
}));

export default function Toolbar({
  handleSavePuzzle,
  handleImportPuzzle,
  handleCreateNewPuzzle
}) {
  const classes = useStyles()
  return (
    <AppBar position="static">
     <MuiToolbar>
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
     </MuiToolbar>
    </AppBar>
  )
}
