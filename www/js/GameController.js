(function () {
    // constants
    const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const MAX_GUESSES = 6;
    const MIN_WORD_LENGTH = 5;
    const BLANK = "-";
    const GAME_STATES = {
        GAME_NOT_STARTED: "GAME_NOT_STARTED",
        GAME_IN_PROGRESS: "GAME_IN_PROGRESS",
        GAME_OVER_WIN: "GAME_OVER_WIN",
        GAME_OVER_LOSE: "GAME_OVER_LOSE"
    };
    const MESSAGES = {
        NEW_GAME_STARTED: "New game started.",
        GAME_ALREADY_IN_PROGRESS: "Cannot start new game until current game is complete.",
        WORD_UNDEFINED: "Word is undefined.",
        WORD_NULL: "Word is NULL.",
        WORD_TOO_SHORT: "Word is too short.",
        WORD_HAS_INVALID_CHARACTERS: "Word contains invalid characters.",
        LETTER_UNDEFINED: "Letter is undefined; not processed.",
        LETTER_NULL: "Letter is NULL; not processed.",
        ONE_LETTER_ONLY: "Single letter required, not processed.",
        NO_GAME: "No game in progress, not processed."
    };
    // variables
    let gameState = GAME_STATES.GAME_NOT_STARTED;
    let word = null;
    let guess = null;
    let guessesRemaining = null;
    let message = null;

    let resetController = function () {
        gameState = GAME_STATES.GAME_NOT_STARTED;
        word = null;
        guess = null;
        guessesRemaining = null;
        message = null;
    };

    let newGame = function (w) {
        if (gameState !== GAME_STATES.GAME_IN_PROGRESS) {
            if (checkWord(w)) {
                word = w.toUpperCase();
                guess = [];
                for (let i = 0; i < word.length; i++) {
                    guess.push(BLANK);
                }
                guessesRemaining = MAX_GUESSES;
                gameState = GAME_STATES.GAME_IN_PROGRESS;
                message = MESSAGES.NEW_GAME_STARTED;
            } else {
                gameState = GAME_STATES.GAME_NOT_STARTED;
            }

        } else {
            message = MESSAGES.GAME_ALREADY_IN_PROGRESS;
        }
    };

    let checkWord = function (w) {
        if (w === undefined) {
            message = MESSAGES.WORD_UNDEFINED;
            return false;
        }
        if (w === null) {
            message = MESSAGES.WORD_NULL;
            return false;
        }
        let temp = w.toUpperCase();
        if (temp.length < MIN_WORD_LENGTH) {
            message = MESSAGES.WORD_TOO_SHORT;
            return false;
        }
        for (let i = 0; i < temp.length; i++) {
            if (ALPHABET.indexOf(temp[i]) < 0) {
                message = MESSAGES.WORD_HAS_INVALID_CHARACTERS;
                return false;
            }
        }
        return true;
    };

    let processLetter = function (letter) {
        if (letter === undefined) {
            message = MESSAGES.LETTER_UNDEFINED;
            return;
        }

        if (letter === null) {
            message = MESSAGES.LETTER_NULL;
            return;
        }

        if (letter.length !== 1) {
            message = MESSAGES.ONE_LETTER_ONLY;
            return;
        }

        if (gameState !== GAME_STATES.GAME_IN_PROGRESS) {
            message = MESSAGES.NO_GAME;
            return;
        }

        message = "Processed letter '" + letter + "'.";
        if (word.indexOf(letter) >= 0) {
            for (let i = 0; i < word.length; i++) {
                if (word.charAt(i) === letter) {
                    guess[i] = letter;
                }
            }
        } else {
            guessesRemaining--;
        }
        updateGameState();

    };

    let report = function () {
        let guessCopy = guess !== null ? guess.slice() : guess;
        return {
            gameState: gameState,
            word: word,
            guess: guessCopy,
            guessesRemaining: guessesRemaining,
            message: message
        };
    };

    let updateGameState = function () {
        if (guessesRemaining === 0) {
            gameState = GAME_STATES.GAME_OVER_LOSE;
        } else {
            let match = true;
            for (let i = 0; i < word.length; i++) {
                if (word.charAt(i) !== guess[i]) {
                    match = false;
                    break;
                }
            }
            if (match) {
                gameState = GAME_STATES.GAME_OVER_WIN;
            } else {
                gameState = GAME_STATES.GAME_IN_PROGRESS;
            }
        }
    };

    // public methods
    window.GameController = {
        newGame: newGame,
        processLetter: processLetter,
        report: report,
        resetController: resetController, // new
        getConstants: function () { // new
            return {
                MAX_GUESSES: MAX_GUESSES,
                MIN_WORD_LENGTH: MIN_WORD_LENGTH,
                BLANK: BLANK,
                GAME_STATES: GAME_STATES,
                MESSAGES: MESSAGES,
                ALPHABET: ALPHABET,
            };
        }
    };

})(); // end module
