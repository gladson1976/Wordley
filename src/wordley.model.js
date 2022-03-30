const wordleyBoardBit = {
  wordley: '',
  validations: []
};

const wordleyData = {
    currentTry: 0,
    wordley: '',
    hintCount: 0,
    wordleyBoard: [
      Object.assign({}, wordleyBoardBit),
      Object.assign({}, wordleyBoardBit),
      Object.assign({}, wordleyBoardBit),
      Object.assign({}, wordleyBoardBit),
      Object.assign({}, wordleyBoardBit),
      Object.assign({}, wordleyBoardBit)
    ],
    usedLetters: {
      no: [],
      maybe: [],
      correct: []
    },
    gameStats: {
      guessDistribution: [0, 0, 0, 0, 0, 0, 0],
      currentStreak: 0,
      maxStreak: 0
    },
    gameSettings: {
      allowDuplicates: true,
      allowHints: false,
      darkMode: true
    }
};

export { wordleyData };