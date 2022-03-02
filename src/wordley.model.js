const wordleyBoardBit = {
  wordley: '',
  validations: []
};

const wordleyData = {
    currentTry: 0,
    wordley: '',
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
      allowDuplicates: true
    }
};

export default wordleyData;