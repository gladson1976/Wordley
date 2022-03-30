import { useEffect, useCallback, useMemo, useState } from 'react';
import classNames from 'classnames';
import { Dialog } from '@mui/material';
import _ from 'lodash';
import './App.css';
import './bootstrap.css';
import './keyboard.css';
import ShowWord from './showWord/showWord';
import { wordleyData as wordleyModel } from './wordley.model';
import { wordleOriginals, wordleOriginalsValid } from './wordle-original';

function App() {
  const [allowDuplicates, setAllowDuplicates] = useState(true);
  const [allowHints, setAllowHints] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [currentWordley, setCurrentWordley] = useState(wordleyModel);
  const [wordleyWords, setWordleyWords] = useState([]);
  const [wordleyWordsValid] = useState(wordleOriginalsValid);
  const [isWordleyComplete, setIsWordleyComplete] = useState(false);
  const [revealWordley, setRevealWordley] = useState(false);
  const [hintCount, setHintCount] = useState(0);
  const appTitle = "Wordley";
  const appVersion = "1.2";

  const [dialogSettingsOpen, setDialogSettingsOpen] = useState(false);
  const [dialogStatsOpen, setDialogStatsOpen] = useState(false);
  const [dialogHelpOpen, setDialogHelpOpen] = useState(false);
  const [dialogCompleteOpen, setDialogCompleteOpen] = useState(false);

  const TOTAL_HINTS_ALLOWED = 1;
  const arrKeys = useMemo(() => [
    ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
    ["#Q", "A", "S", "D", "F", "G", "H", "J", "K", "L"],
    ["*BKSPC", "Z", "X", "C", "V", "B", "N", "M", "*ENTER"],
    // ["#H", "#H", "#H", "#H", "*SPACE", "#H", "#H"]
  ], []);

  const arrPraises = useMemo(() => ['Genius', 'Magnificent', 'Impressive', 'Splendid', 'Great', 'Phew', 'Ouch!'], []);

  // const indices = useCallback((c, s) => {
  //   return s
  //   .split('')
  //   .reduce((a, e, i) => e === c ? a.concat(i) : a, []);
  // }, []);

  const getRandom = useCallback((min, max) => {
    return Math.floor(Math.random()*(max-min+1))+min;
  }, []);

  const hasDuplicates = useCallback((word) => {
    const text = word.split('');
    return text.some((v, i, a) => {
      return a.lastIndexOf(v) !== i;
    });
  }, []);

  const filterDuplicates = useCallback(() => {
    return _.compact(wordleOriginals.map((word) => {
      if (!hasDuplicates(word)) {
        return word;
      }
      return undefined;
    }));
  }, [hasDuplicates]);

  // ----------------------------

  const goRevealWordley = useCallback(() => {
    setRevealWordley(true);
  }, []);

  // const validateDataModel = useCallback((persistData) => {
  //   const defaultModel = _.cloneDeep(wordleyModel);
  //   const mergedModel = _.merge(defaultModel, persistData);
  //   mergedModel.wordleyBoard.map((wordleyWord) => {
  //     if (wordleyWord.wordley === '') {
  //       _.set(wordleyWord, 'validations', []);
  //     }
  //     return wordleyWord;
  //   });
  //   return mergedModel;
  // }, []);

  const lightsOff = useCallback((lightsOff) => {
    if (lightsOff) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, []);

  const savePersistData = useCallback(() => {
    let tempWordley = _.cloneDeep(currentWordley);
    _.set(tempWordley, 'gameSettings.allowDuplicates', allowDuplicates);
    _.set(tempWordley, 'gameSettings.allowHints', allowHints);
    _.set(tempWordley, 'gameSettings.darkMode', darkMode);
    _.set(tempWordley, 'hintCount', hintCount);
    if (window.AppInventor) {
      window.AppInventor.setWebViewString(JSON.stringify(tempWordley));
    } else {
      localStorage.setItem('wordleyPersist', JSON.stringify(tempWordley));
    }
  }, [allowDuplicates, allowHints, currentWordley, darkMode, hintCount]);

  const loadPersistData = useCallback(() => {
    let persistData
    if (window.AppInventor) {
      persistData = JSON.parse(window.AppInventor.getWebViewString());
    } else {
      persistData = JSON.parse(window.localStorage.getItem('wordleyPersist'));
    }
    if (_.isNull(persistData)) {
      persistData = _.cloneDeep(wordleyModel);
    }
    // persistData = validateDataModel(persistData);
    const tempAllowDuplicates = _.get(persistData, 'gameSettings.allowDuplicates', true);
    const tempAllowHints = _.get(persistData, 'gameSettings.allowHints', false);
    const tempDarkMode = _.get(persistData, 'gameSettings.darkMode', false);
    const tempHintCount = _.get(persistData, 'hintCount', 0);

    const currentTry = persistData.currentTry - 1 >= 0 ? persistData.currentTry - 1 : 0;
    const wordleyValidation = _.get(persistData, `wordleyBoard[${currentTry}].validations`, []);
    const wordleyComplete = wordleyValidation.length > 0
      ? wordleyValidation.reduce((valid, num) => valid && (num === 1), true) || persistData.currentTry > 5
      : false;
    setIsWordleyComplete(wordleyComplete);
    setCurrentWordley(persistData);
    setAllowDuplicates(tempAllowDuplicates);
    setAllowHints(tempAllowHints);
    setDarkMode(tempDarkMode);
    setHintCount(tempHintCount);
    lightsOff(tempDarkMode);
    if (currentTry === 5 && wordleyComplete) {
      goRevealWordley();
    } else if (wordleyComplete) {
      setDialogCompleteOpen(true);
    }
  }, [goRevealWordley, lightsOff]);

  const collectWordleys = useCallback(() => {
    const tempWordleyWords = allowDuplicates
      ? [...wordleOriginals]
      : [...filterDuplicates(wordleOriginals)];
    setWordleyWords(tempWordleyWords);
  }, [allowDuplicates, filterDuplicates]);

  const goHint = useCallback(() => {
    const currentWord = currentWordley.wordley
    const lastTry = currentWordley.currentTry - 1;
    const currentTry = currentWordley.currentTry;
    let lastGuess = _.get(currentWordley, `wordleyBoard[${lastTry}].wordley`, '');
    let availableLetters = [];
    for (let i = 0; i <= 4; i++) {
      if (currentWord[i] !== lastGuess[i]) {
        availableLetters.push(i);
      }
    }
    if (availableLetters.length > 0) {
      const hintPosition = getRandom(0, availableLetters.length - 1);
      let arrLastGuess = '     '.split('');
      let arrValidations = [0, 0, 0, 0, 0];
      arrLastGuess[availableLetters[hintPosition]] = currentWord[availableLetters[hintPosition]];
      arrValidations[availableLetters[hintPosition]] = 5;
      const tempWordley = _.cloneDeep(currentWordley);
      _.set(tempWordley, `wordleyBoard[${currentTry}].wordley`, arrLastGuess.join(''));
      _.set(tempWordley, `wordleyBoard[${currentTry}].validations`, arrValidations);
      setCurrentWordley(tempWordley);
      setHintCount(hintCount - 1);
      setTimeout(() => {
        setCurrentWordley(currentWordley);
      }, 1000);
    }
  }, [currentWordley, getRandom, hintCount]);

  const newWordley = useCallback(() => {
    const newWordley = wordleyModel;
    const tempWordley = _.cloneDeep(currentWordley);
    const newWordNumber = getRandom(0, wordleyWords.length)
    const newWord = wordleyWords[newWordNumber];
    _.set(tempWordley, 'wordley', newWord);
    _.set(tempWordley, 'currentTry', 0);
    _.set(tempWordley, 'wordleyBoard', newWordley.wordleyBoard);
    _.set(tempWordley, 'usedLetters', newWordley.usedLetters);
    // _.set(tempWordley, 'wordley', 'NERVE'); // DEBUG
    setCurrentWordley(tempWordley);
    setIsWordleyComplete(false);
    setDialogCompleteOpen(false);
    setRevealWordley(false);
    if (allowHints) {
      setHintCount(TOTAL_HINTS_ALLOWED);
    } else {
      setHintCount(0);
    }
  }, [allowHints, currentWordley, getRandom, wordleyWords]);

  const renderWordleyBoard = useCallback(() => {
    return (
      _.map(currentWordley.wordleyBoard, (word, index) => {
        return <ShowWord key={`wordley${index}`} wordley={word.wordley} validations={word.validations} />
      })
    );
  }, [currentWordley.wordleyBoard]);

  const goBackspace = useCallback(() => {
    let tempWordley = _.cloneDeep(currentWordley);
    const currentTry = tempWordley.currentTry;
    let currentWord = _.get(tempWordley, `wordleyBoard[${currentTry}].wordley`, '');
    currentWord = currentWord.slice(0, currentWord.length - 1);
    _.set(tempWordley, `wordleyBoard[${currentTry}].wordley`, currentWord);
    _.set(tempWordley, `wordleyBoard[${currentTry}].validations`, [0, 0, 0, 0, 0]);
    setCurrentWordley(tempWordley);
  }, [currentWordley]);

  const isValidWord = useCallback((word) => {
    return wordleyWords.includes(word) || wordleyWordsValid.includes(word);
  }, [wordleyWords, wordleyWordsValid]);

  const doValidate = useCallback((guess, solution, tempWordley) => {
    let { usedLetters } = tempWordley;
    const guessedLetters = guess
      .split('')
      .map(letter => ({letter, state: 3}));
    const solutionLetters = solution
      .split('')
      .map(letter => ({letter, includedInGuess: false}));
    
    for (let i = 0; i < guessedLetters.length; i+=1) {
      if (guessedLetters[i].letter === solutionLetters[i].letter) {
        guessedLetters[i].state = 1;
        solutionLetters[i].includedInGuess = true;
        usedLetters.correct.push(guessedLetters[i].letter);
        _.pull(usedLetters.maybe, guessedLetters[i].letter);
      }
    }

    for (let i = 0; i < guessedLetters.length; i++) {
      if (guessedLetters[i].state === 1) {
        continue;
      }
  
      const letterFoundElsewhere = solutionLetters
        .find((solutionLetter) => {
          const matchesLetter = solutionLetter.letter === guessedLetters[i].letter;
          return matchesLetter && !solutionLetter.includedInGuess;
        });
  
      if (letterFoundElsewhere) {
        guessedLetters[i].state = 2;
        usedLetters.maybe.push(guessedLetters[i].letter);
        _.pull(usedLetters.correct, guessedLetters[i].letter);
        letterFoundElsewhere.includedInGuess = true;
      } else {
        if (!(usedLetters.correct.includes(guessedLetters[i].letter) || usedLetters.maybe.includes(guessedLetters[i].letter))) {
          usedLetters.no.push(guessedLetters[i].letter);
        }
      }
    }
  
    const currentValidation = guessedLetters.map(guessedLetter => {
      return guessedLetter.state;
    });

    return {
      currentValidation: currentValidation,
      usedLetters: usedLetters
    };
  }, []);

  const validateWordley = useCallback(() => {
    let tempWordley = _.cloneDeep(currentWordley);
    if (tempWordley.wordley === '') {
      const newWordNumber = getRandom(0, wordleyWords.length)
      const newWord = wordleyWords[newWordNumber];
      _.set(tempWordley, 'wordley', newWord);
    }
    const selectedWord = tempWordley.wordley;
    const currentTry = tempWordley.currentTry;
    let wordleyComplete = true;
    let currentWord = _.get(tempWordley, `wordleyBoard[${currentTry}].wordley`, '');
    let currentValidation = [3, 3, 3, 3, 3];
    let usedLetters = {};
    if(!isValidWord(currentWord)) {
      currentValidation = [4, 4, 4, 4, 4];
      _.set(tempWordley, `wordleyBoard[${currentTry}].validations`, currentValidation);
      setCurrentWordley(tempWordley);
      return;
    }
    const tempValidation = doValidate(currentWord, selectedWord, tempWordley);
    currentValidation = tempValidation.currentValidation;
    usedLetters = tempValidation.usedLetters;
    wordleyComplete = _.reduce(currentValidation.map((v, i) => {
      return wordleyComplete && v === 1
    }), (valid, val) => {
        return valid && val;
    }, true);
    setIsWordleyComplete(wordleyComplete);
    _.set(tempWordley, `wordleyBoard[${currentTry}].validations`, currentValidation);
    _.set(tempWordley, 'usedLetters', usedLetters);
    _.set(tempWordley, 'currentTry', currentTry + 1);
    if (wordleyComplete) {
      const guessDistribution = _.get(tempWordley, `gameStats.guessDistribution[${currentTry}]`, 0) + 1;
      const currentStreak = _.get(tempWordley, `gameStats.currentStreak`, 0) + 1;
      const maxStreak = _.get(tempWordley, `gameStats.maxStreak`, 0);
      _.set(tempWordley, `gameStats.guessDistribution[${currentTry}]`, guessDistribution);
      _.set(tempWordley, 'gameStats.currentStreak', currentStreak);
      if (currentStreak > maxStreak) {
        _.set(tempWordley, 'gameStats.maxStreak', currentStreak);
      }
      setDialogCompleteOpen(true);
    } else if (currentTry === 5 && !wordleyComplete) {
      const guessDistribution = _.get(tempWordley, `gameStats.guessDistribution[6]`, 0) + 1;
      _.set(tempWordley, 'gameStats.guessDistribution[6]', guessDistribution);
      _.set(tempWordley, 'gameStats.currentStreak', 0);
      goRevealWordley();
    }

    setCurrentWordley(tempWordley);
  }, [currentWordley, isValidWord, doValidate, getRandom, wordleyWords, goRevealWordley]);

  const goWordley = useCallback((keyLetter) => {
    let tempWordley = _.cloneDeep(currentWordley);
    if (tempWordley.currentTry > 5) {
      return;
    }
    let currentWord = tempWordley.wordleyBoard[tempWordley.currentTry].wordley;
    if (keyLetter === '<') {
      // Backspace
      if (currentWord.length > 0) {
        goBackspace();
      }
    } else if (keyLetter === '^') {
      // Enter
      if (currentWord.length === 5) {
        validateWordley();
      }
    } else if (keyLetter === ' ') {
      // Space -> New Wordley
      newWordley();
    } else if (!_.isNull(keyLetter)) {
      if (currentWord.length === 5) {
        return;
      }
      currentWord = `${currentWord}${keyLetter}`;
      tempWordley.wordleyBoard[tempWordley.currentTry].wordley = currentWord;
      setCurrentWordley(tempWordley);
    }
  }, [currentWordley, goBackspace, newWordley, validateWordley]);

  const getKeyLetter = useCallback((_key) => {
    return _key === '*BKSPC' || _key === '*MENU' || _key === '*ENTER'
      ? ''
      : (_key === '*HINT'
        ? ''
        : (_key[0] === '#'
          ? <>&nbsp;</>
          : (_key === '*SPACE'
            ? 'New Wordley'
            : _key)));
  }, []);

  const getKeyChar = useCallback((row, keyNum) => {
		var keyChar = arrKeys[row][keyNum];
    if (isWordleyComplete && keyChar !== "*SPACE") {
      return;
    }
		if(keyChar === "*BKSPC")
			keyChar = "<";
    else if(keyChar === "*ENTER")
			keyChar = "^";
    else if(keyChar === "*HINT")
			keyChar = "*";
		else if(keyChar === "*SPACE")
			keyChar = " ";
		else if(keyChar === "*MENU")
			keyChar = "=";
		else if(keyChar[0] === "#")
			keyChar = null;
		// console.log(row, keyNum, keyChar); //DEBUG
    // return keyChar;
    goWordley(keyChar);
	}, [arrKeys, goWordley, isWordleyComplete]);

  const handleDialogClose = useCallback(() => {
    setDialogSettingsOpen(false);
    setDialogStatsOpen(false);
    setDialogHelpOpen(false);
    // setDialogCompleteOpen(false);
  }, []);

  const setOptionDuplicates = useCallback((e) => {
    setAllowDuplicates(e.target.checked);
    const tempWordleyWords = !allowDuplicates
      ? [...wordleOriginals]
      : [...filterDuplicates(wordleOriginals)];
    setWordleyWords(tempWordleyWords);
  }, [allowDuplicates, filterDuplicates]);

  const setOptionHints = useCallback((e) => {
    setAllowHints(e.target.checked);
  }, []);

  const setOptionDarkMode = useCallback((e) => {
    setDarkMode(e.target.checked);
    lightsOff(e.target.checked);
  }, [lightsOff]);

  const resetStats = useCallback(() => {
    const newWordley = wordleyModel;
    const tempWordley = _.cloneDeep(currentWordley);
    tempWordley.gameStats = {...newWordley.gameStats};
    setCurrentWordley(tempWordley);
  }, [currentWordley]);

  const showSettings = useCallback(() => {
    setDialogSettingsOpen(true);
  }, []);

  const showStats = useCallback(() => {
    setDialogStatsOpen(true);
  }, []);

  const showHelp = useCallback(() => {
    setDialogHelpOpen(true);
  }, []);

  const renderWordleyHeader = useCallback(() => {
    return (
      <div className="wordley-title title-border">
        <table className="wordley-title">
          <tbody>
            <tr>
              <td className="title">
                <span>{appTitle}</span>
              </td>
              <td className="title text-right">
                <span className={classNames('material-icons', 'icon icon-hint', 'title-button',' cursor-pointer', {'hidden': hintCount === 0})} onClick={() => goHint()} />
                <span className="material-icons icon icon-replay title-button cursor-pointer" onClick={() => newWordley()} />
                <span className="material-icons icon icon-settings title-button cursor-pointer" onClick={() => showSettings()}></span>
                <span className="material-icons icon icon-bar-chart title-button cursor-pointer" onClick={() => showStats()}></span>
                <span className="material-icons icon icon-question title-button cursor-pointer" onClick={() => showHelp()}></span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    )
  }, [goHint, hintCount, newWordley, showHelp, showSettings, showStats]);

  const renderWordleySettings = useCallback(() => {
    return (
      <div className="settings">
        <div className="modal-header">
          <h4 className="modal-title">{appTitle} - Options</h4>
        </div>
        <div className="modal-body">
          <table className="settings-table">
            <tbody>
              <tr>
                <td>Allow duplicate letters</td>
                <td className="text-right va-middle">
                  <input type="checkbox" name="duplicates" id="duplicates" value={allowDuplicates} checked={allowDuplicates} onChange={(e) => setOptionDuplicates(e)} />
                </td>
              </tr>
              <tr>
                <td>Allow hints</td>
                <td className="text-right va-middle">
                  <input type="checkbox" name="hints" id="hints" value={allowHints} checked={allowHints} onChange={(e) => setOptionHints(e)} />
                </td>
              </tr>
              <tr>
                <td>Dark mode</td>
                <td className="text-right va-middle">
                  <input type="checkbox" name="darkmode" id="darkmode" value={darkMode} checked={darkMode} onChange={(e) => setOptionDarkMode(e)} />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }, [allowDuplicates, allowHints, darkMode, setOptionDuplicates, setOptionHints, setOptionDarkMode]);

  const renderBarchart = useCallback(() => {
    const { gameStats: { guessDistribution } } = currentWordley;
    const maxGuesses = _.max(_.take(guessDistribution, guessDistribution.length - 1));

    return guessDistribution.map((value, index) => {
      if (index !== 6) {
        const barHeight = maxGuesses === 0
          ? 0
          : value / maxGuesses * 5;
        return (
          <div key={`barContainer${index}`}>
            <div className="bar-chart" key={`barChart${index}`} style={{height: `${barHeight}rem`}}>{value}</div>
            <div className="bar-text" key={`barText${index}`}>{index + 1}</div>
          </div>
        );
      }
      return null;
    });
  }, [currentWordley]);

  const renderWordleyStats = useCallback(() => {
    const { gameStats } = currentWordley;
    const totalPlayed = gameStats.guessDistribution.reduce((sum, num) => sum + num, 0);
    const totalWon = totalPlayed - gameStats.guessDistribution[6];
    return (
      <div className="settings">
        <div className="modal-header">
          <h4 className="modal-title">{appTitle} - Stats</h4>
        </div>
        <div className="modal-body">
          <table className="settings-table">
            <tbody>
              <tr>
                <td colSpan="4" className="font-bold">Guess Distribution</td>
              </tr>
              <tr>
                <td colSpan="4" className="stats-chart">
                  <div className="chart-container">
                    {renderBarchart()}
                  </div>
                </td>
              </tr>
              <tr className="text-center font-bold">
                <td>{totalPlayed}</td>
                <td>{totalWon}</td>
                <td>{gameStats.currentStreak}</td>
                <td>{gameStats.maxStreak}</td>
              </tr>
              <tr className="text-center font-bold">
                <td>Played</td>
                <td>Won</td>
                <td>Current</td>
                <td>Max</td>
              </tr>
              <tr className="text-center font-bold">
                <td colSpan="2"></td>
                <td colSpan="2">Streak</td>
              </tr>
              <tr>
                <td colSpan="4" className="text-right p-top-10">
                  <button type="button" className="btn btn-outline-danger" onClick={(e) => resetStats(e)}>Reset Stats</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }, [currentWordley, renderBarchart, resetStats]);

  const renderWordleyHelp = useCallback(() => {
    return (
      <div className="settings">
        <div className="modal-header">
          <h4 className="modal-title">{appTitle} - Info</h4>
        </div>
        <div className="modal-body">
          <table className="settings-table">
            <tbody>
              <tr>
                <td>
                  <div className="font-bold">{appTitle} v{appVersion}</div>
                  <div className="font-small">Developed by</div>
                  <div className="font-small">Prabhu Thomas</div>
                </td>
              </tr>
              <tr>
                <td>
                  <ul className="list-unstyled">
                    <li className="font-bold">Objective and Instructions</li>
                    <li>
                      <ul className="list-unstyled">
                        <li>Wordley is a word guessing game where the player tries to identify a selected five letter word in six tries.</li>
                        <li className="font-bold">Gameplay</li>
                        <li>Each guess must be a valid five letter word.</li>
                        <li>After each guess, the color of the tiles will change to show how close your guess was to the word.</li>
                        <li className="wordley-help-gap"><div className="wordley-help-bit wordley-help-correct">P</div> The letter P is in the word and in the correct spot.</li>
                        <li className="wordley-help-gap"><div className="wordley-help-bit wordley-help-maybe">U</div> The letter U is in the word but not in the correct spot.</li>
                        <li className="wordley-help-gap"><div className="wordley-help-bit wordley-help-no">T</div> The letter T is not in the word in any spot.</li>
                      </ul>
                    </li>
                  </ul>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }, []);

  const renderRevealWordley = useCallback(() => {
    const praiseIndex = currentWordley.currentTry - 1;
    return (
      <div className='reveal-container'>
        <div className={classNames('praise-window', {'hidden': !dialogCompleteOpen})}>
          <table className='wordley-praise'>
            <tbody>
              <tr>
                <td className='title text-center praise-border'>{arrPraises[praiseIndex]}</td>
                <td className='text-center'>
                  <button type='button' className='btn btn-outline-success praise-button' onClick={(e) => newWordley(e)}>New Wordley</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className={classNames('reveal-wordley', 'earthquake', {'hidden': !revealWordley})}>
          <ShowWord key='revealWordley' wordley={currentWordley.wordley} validations={[1, 1, 1, 1, 1]} />
        </div>
      </div>
    )
  }, [arrPraises, currentWordley.currentTry, currentWordley.wordley, dialogCompleteOpen, newWordley, revealWordley]);

  const renderKeyboard = useCallback(() => {
    return (
      <div key='keyboard-container' className="keyboard-container">
        <div key='keyboard' className="keyboard">
          {arrKeys.map((_row, _i) => {
            return <div key={`keyboard-row${_i}`} className="keyboard-row">
              {_row.map((_key, _j) => {
                return <div
                  key={`keyboard-keys${_j}`}
                  onClick={() => getKeyChar(_i, _j)}
                  className={classNames('keyboard-keys', {
                    'material-icons delete-key': _key === '*BKSPC',
                    'material-icons enter-key': _key === '*ENTER',
                    'space-key': _key === '*SPACE' && isWordleyComplete,
                    'space-key-hidden': _key === '*SPACE' && !isWordleyComplete,
                    'burger-key': _key === '*MENU',
                    'fa fa-star': _key === '*HINT',
                    'spacer-key-quarter': _key === '#Q',
                    'spacer-key-half': _key === '#H',
                    'wordley-correct': _.indexOf(currentWordley.usedLetters.correct, _key) > -1,
                    'wordley-maybe': _.indexOf(currentWordley.usedLetters.maybe, _key) > -1,
                    'wordley-no': _.indexOf(currentWordley.usedLetters.no, _key) > -1
                  })}
                  >
                  {getKeyLetter(_key)}
                </div>
              })}
            </div>
          })}
        </div>
      </div>
    );
  }, [arrKeys, getKeyChar, getKeyLetter, isWordleyComplete, currentWordley.usedLetters]);

  useEffect(() => {
    collectWordleys();
    loadPersistData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    savePersistData();
  }, [currentWordley, savePersistData]);

  return (
    <>
      {renderWordleyHeader()}
      <div key='wordley-container' className="wordley-container">
        {renderWordleyBoard()}
      </div>
      {renderRevealWordley()}
      {renderKeyboard()}
      <Dialog id="dialogSettings" onClose={handleDialogClose} open={dialogSettingsOpen}>
        {renderWordleySettings()}
      </Dialog>
      <Dialog id="dialogStats" onClose={handleDialogClose} open={dialogStatsOpen}>
        {renderWordleyStats()}
      </Dialog>
      <Dialog id="dialogHelp" onClose={handleDialogClose} open={dialogHelpOpen}>
        {renderWordleyHelp()}
      </Dialog>
    </>
  );
}

export default App;
