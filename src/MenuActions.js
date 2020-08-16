import React, {forwardRef, useImperativeHandle} from 'react';
import NewPuzzleForm from './NewPuzzleForm'
import RebusForm from './RebusForm'

import {BLOCKED_SQUARE} from './constants'

// A hack to get a bunch of dom state into the UI
// and manage button clicks for menu Action items and hotkeys
export default forwardRef(function MenuActions(props, ref) {
  const {
    onSavePuzzle,
    onImportPuzzle,
    onCreateNewPuzzle,
    onUndo,
    onRedo,
    onRebus,
    onCircle,
    onDarken,
  } = props

  const [openNewForm, setOpenNewForm] = React.useState(false);
  const [openRebusForm, setOpenRebusForm] = React.useState(false);
  const loadPuzzleRef = React.useRef()

  const handleImportPuzzle = () => {
    loadPuzzleRef.current.click()
  }
  const handleCreateNewPuzzle = () => {
    setOpenNewForm(true)
  }
  const handleInsertRebus = () => {
    setOpenRebusForm(true)
  }

  useImperativeHandle(ref, () => ({
    handleSavePuzzle: {
      key: 'mod+s',
      action: onSavePuzzle,
    },
    handleImportPuzzle: {
      key: 'mod+o',
      action: handleImportPuzzle,
    },
    handleCreateNewPuzzle: {
      key: 'mod+u',
      action: handleCreateNewPuzzle
    },
    handleUndo: {
      key: 'mod+z',
      action: onUndo
    },
    handleRedo: {
      key: 'mod+shift+z',
      action: onRedo
    },
    handleInsertRebus: {
      key: 'mod+i',
      action: handleInsertRebus
    },
    handleInsertBlockedSquare: {
      key: BLOCKED_SQUARE,
      action: () => onRebus(BLOCKED_SQUARE)
    },
    handleInsertCircledLetter: {
      key: 'mod+c',
      action: () => onCircle()
    },
    handleDarkenCell: {
      key: 'mod+b',
      action: () => onDarken()
    },
  }))

  return (
    <React.Fragment>
      <input
        ref={loadPuzzleRef}
        type="file"
        style={{ display: "none" }}
        onChange={onImportPuzzle}
      />
      <NewPuzzleForm
        open={openNewForm}
        setOpen={setOpenNewForm}
        onSave={onCreateNewPuzzle}
      />
      <RebusForm
        open={openRebusForm}
        setOpen={setOpenRebusForm}
        onSave={onRebus}
      />
    </React.Fragment>
  )
})
