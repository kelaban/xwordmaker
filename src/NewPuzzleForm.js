import React from 'react';

import { makeStyles } from '@material-ui/core/styles';
import TextField from '@material-ui/core/TextField';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import Button from '@material-ui/core/Button';
import AddIcon from '@material-ui/icons/Add';

const useStyles = makeStyles(theme => ({
  textField: {
      marginLeft: theme.spacing(1),
      marginRight: theme.spacing(1),
    },
}));

export default function NewPuzzleForm({onSave}) {
  const classes = useStyles();
  const [open, setOpen] = React.useState(false);
  const [values, setValues] = React.useState({rows: 15, cols: 15})

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = (save) => () => {
    setOpen(false);

    if(save) {
      onSave(values)
    }

  };

  const handleChange = (dir) => (event) => {
    setValues(Object.assign({}, values, {[dir]: +event.target.value || ''}))
  }

  return (
    <div>
        <Button
          aria-label="New puzzle"
          color="inherit"
          startIcon={<AddIcon />}
          onClick={handleClickOpen}
        >
          New Puzzle
        </Button>
      <Dialog open={open} onClose={handleClose(false)}>
        <DialogTitle>Create New Puzzle</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Create a new puzzle. Warning! This will destroy the current puzzle. Make sure to save first!
          </DialogContentText>
          <TextField
            label="Rows"
            value={values.rows}
            onChange={handleChange('rows')}
            className={classes.textField}
            type="number"
            InputLabelProps={{
              shrink: true,
            }}
            margin="normal"
            variant="outlined"
            inputProps={{
              min: 1,
              max: 100
            }}
          />
          <TextField
            label="Columns"
            value={values.cols}
            onChange={handleChange('cols')}
            className={classes.textField}
            type="number"
            InputLabelProps={{
              shrink: true,
            }}
            margin="normal"
            variant="outlined"
            inputProps={{
              min: 1,
              max: 100
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={handleClose(true)} color="primary">
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
