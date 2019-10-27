import React from 'react';

import XGrid from './XGrid'
import {decode} from './Clues'


export default function PrintView({grid}) {
  const ulStyle = {
    width: 'calc(50vw - 40px)',
    columnCount: 2,
    margin: 0,
    padding: 0,
  }
  const liStyle = {
    margin: 0,
    listStyleType: 'none',
  }

  const containerStyle = {
    overflow: 'hidden',
    marginTop: 40,
    marginRight: 20,
    marginLeft: 20,
    height: "calc(100vh - 40px)",
  }

  const gridStyle = {
    float: 'right',
    width: '50vmin',
    height: '50vmin'
  }

  const mapClue = (v)  => {
    const clueNum = +v.match(/^ *[0-9]+/)[0].trim()
    const clueText = decode(v.replace(/^ *[0-9]*\. */, ''))
    return (
      <li style={liStyle} key={v}>
        <b style={{marginRight: 2}}>{clueNum}</b>
        {clueText}
      </li>
    )
  }

  /*
      */
  return (
    <div style={containerStyle}>
      <div style={gridStyle}>
        <XGrid grid={grid} hideAnswers={true}/>
      </div>
      <ul style={ulStyle}>
        <li style={liStyle}><b>ACROSS</b></li>
        {grid.clues.across.map(mapClue)}
        <li style={liStyle}><b>DOWN</b></li>
        {grid.clues.down.map(mapClue)}
      </ul>
    </div>
  )
}
