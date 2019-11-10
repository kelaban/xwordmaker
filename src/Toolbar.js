import React from 'react';

import NewPuzzleForm from './NewPuzzleForm'

import { makeStyles } from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import MuiToolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import Divider from '@material-ui/core/Divider';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import ListItemText from '@material-ui/core/ListItemText';

const useStyles = makeStyles(theme => ({
  title: {
    backgroundColor: 'rgba(255,255,255,1)'
  },
  list: {
    width: 200, //not sure why this is needed hack for now
  }
}));

const formatKey = (key) => {
  if (!key) { return key }

  key = key.toUpperCase()
  const mod = /Mac|iPod|iPhone|iPad/.test(navigator.platform) ? '⌘' : 'Ctrl'
  key = key.replace('MOD', mod)
  key = key.replace('SHIFT', '⇧')
  if(key.length === 3) {
    key = key.replace('+', '')
  }
  return key
}

function MenuSection({title, items}) {
  const classes = useStyles()
  const [anchorEl, setAnchorEl] = React.useState(null);

  const handleClick = event => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null)
  };

  const handleCloseWithCb = cb => e => {
    cb()
    handleClose(e)
  };


  return (
    <div>
      <Button size="small" onClick={handleClick} >
        {title}
      </Button>
      <Menu
        anchorEl={anchorEl}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={handleClose}
        getContentAnchorEl={null}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left'}}
        transformOrigin={{ vertical: 'top', horizontal: 'left'}}
        MenuListProps={{className: classes.list}}
      >
        {items.map((item, i) => (
          <MenuItem key={i} onClick={handleCloseWithCb(item.action)} dense>
            <ListItemText primary={item.label} />
            <ListItemSecondaryAction>{formatKey(item.key)}</ListItemSecondaryAction>
          </MenuItem>
        ))}
      </Menu>
    </div>
   )
}

function FileMenu({
  actions: {
    handleSavePuzzle,
    handleImportPuzzle,
    handleCreateNewPuzzle
  }
}) {
  const items = [
      {
        label: "Save Puzzle",
        ...handleSavePuzzle,
      },
      {
        label: "Load Puzzle",
        ...handleImportPuzzle,
      },
      {
        label: "New Puzzle",
        ...handleCreateNewPuzzle,
      }
  ]

  return <MenuSection title="File" items={items} />
}

function EditMenu({
  actions: {
    handleUndo,
    handleRedo
  }
}) {
  const items = [
      {
        label: "Undo",
        ...handleUndo,
      },
      {
        label: "Redo",
        ...handleRedo
      },
  ]

  return <MenuSection title="Edit" items={items} />
}

function InsertMenu({
  actions: {
    handleInsertRebus,
    handleInsertBlockedSquare,
  }
}) {
  const items = [
      {
        label: "Rebus",
        ...handleInsertRebus,
      },
      {
        label: "Blocked Square",
        ...handleInsertBlockedSquare,
      },
  ]

  return <MenuSection title="Insert" items={items} />
}


export default function Toolbar(props) {
  const classes = useStyles()

  if(!props.actions) {
    return null
  }

  return (
    <AppBar position="static">
     <MuiToolbar className={classes.title}>
        <FileMenu {...props}/>
        <EditMenu {...props}/>
        <InsertMenu {...props}/>
     </MuiToolbar>
    </AppBar>
  )
}
