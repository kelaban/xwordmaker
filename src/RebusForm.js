import React from 'react';

import { makeStyles } from '@material-ui/core/styles';
import TextField from '@material-ui/core/TextField';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import Button from '@material-ui/core/Button';

const useStyles = makeStyles(theme => ({
  textField: {
      marginLeft: theme.spacing(1),
      marginRight: theme.spacing(1),
    },
}));

export default function RebusForm({onSave, open, setOpen}) {
  const classes = useStyles();
  const [values, setValues] = React.useState('')

  const handleClose = (save) => () => {
    setOpen(false);

    if(save) {
      onSave(values)
    }

  };

  const handleChange = (event) => {
    setValues(event.target.value.toUpperCase())
  }

  return (
      <Dialog open={open} onClose={handleClose(false)}>
        <DialogTitle>Insert Rebus</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Add a rebus
          </DialogContentText>
          <TextField
            label="Text"
            value={values}
            onChange={handleChange}
            className={classes.textField}
            type="text"
            InputLabelProps={{
              shrink: true,
            }}
            margin="normal"
            variant="outlined"
            inputProps={{
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={handleClose(true)} color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>
  );
}
