import React, { memo, useState, useEffect, useCallback } from 'react';

import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';

import {debounce} from 'lodash';

let WORDLIST = null

const WordList = ({currentWord, onClick}) => {
  const [words, setWordsState] = useState(WORDLIST || [])
  const [filtered, setFiltered] = useState([])

  const setWords = (words) => {
    //cache wordlist incase component unmounts
    WORDLIST = words
    setWordsState(words)
  }

  const debouncedFilter = useCallback(debounce( query => {
    setFiltered(words.filter(w => w.match(query)))
  }, 300), [words])

  useEffect(() => {
    fetch(`${process.env.PUBLIC_URL}/wordlist/wordlist.txt`)
      .then(resp => resp.text())
      .then(text =>
          text.split("\n")
            .filter(l => !l.startsWith("#")))
      .then(w => setWords(w))
  }, [])

  useEffect(() => {
    debouncedFilter(new RegExp("^"+currentWord.word+"$", "i"))
  }, [words, currentWord.word, debouncedFilter])

  const max = 100

  return <div>
    Words: {filtered.length > max ? `showing ${max}/` : ''}{filtered.length}
    <List dense>
      {filtered.slice(0,max).map(w =>
          <ListItem
            button
            onClick={() => onClick(w)}
            key={w}>
            {w}
          </ListItem>
       )}
    </List>
  </div>
}

export default memo(WordList)
