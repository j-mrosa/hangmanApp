document.addEventListener('deviceready', onDeviceReady, false);

//store the local storage in a variable
const storage = window.localStorage;

//Global Variables
let username = '';
let password = '';
let currentCategory = '';
const { processLetter, newGame, getConstants } = GameController;
let gameStatus = getConstants().GAME_STATES.GAME_NOT_STARTED;
let gameReport = null;
let baseMedia = 'www/media/';
let gamePlayMedia;
let gamePlayFile;
const BASE_IMG = '/img/hangmanGraphics/guesses';

function onDeviceReady() {
  //**** remove storage items for testing:
/*   storage.removeItem('username');
  storage.removeItem('password'); */

  //event listeners:
  qs('#createAccountBtn').addEventListener('click', getUserDataFromInput);
  qs('#rankingsBtn').addEventListener('click', displayRankings);
  qs('#categoryDropdown').addEventListener('change', selectCategory);
  qs('#startGameBtn').addEventListener('click', startNewGame);
  qs('#homeBtn').addEventListener('click', backToHome);

  console.log('username: ' + storage.getItem('username'))

  //check if device is android and sets media file name accordingly
  if (window.cordova.platformId === 'android') {
    baseMedia = 'file:///android_asset/' + baseMedia;
  }

  //instantiate a global media object to store the game play soundtrack
  gamePlayFile = baseMedia + 'loop2.wav';
  gamePlayMedia = new Media(gamePlayFile, null, null, loopMedia);

  //check if local storage has a user
  if (storage.getItem('username') && storage.getItem('password')) {
    //store in the global variables
    username = storage.getItem('username');
    password = storage.getItem('password');

    //display current user
    qs('#currentUser').innerHTML = username;

    //change screes hidden/shown
    qs('.signUpPanel').classList.add('hidden');
    qs('.currentUserPanel').classList.remove('hidden');
    qs('.categoryPanel').classList.remove('hidden');
  }

  //populate dropdown with categories
  populateDropdown();
  buildKeyboard();
}

//pause/resume from background
document.addEventListener("visibilitychange", () => {
  //check if visibility is hidden
  if (document.hidden) {
    //if so, pause music
    gamePlayMedia.pause();
  } else {
    //otherwise, check if a game is in progress
    if (gameReport.gameState === getConstants().GAME_STATES.GAME_IN_PROGRESS) {
      //if game is in progress, display an alert and resume the music 
      navigator.notification.alert(
        'Continuing from where you stopped... ',
        gamePlayMedia.play(),
        `Game in Progress`,
        ['Ok']
      );
    }
  }
});

//reads from input in signup page and creates a user
async function getUserDataFromInput() {
  if (qs('#userNameInput').value !== '' && qs('#passwordInput').value !== '') {
    username = qs('#userNameInput').value;
    password = qs('#passwordInput').value;

    const res = await apiCalls.createUser(username, password);

    //if successful, add user to storage
    if (res === 1) {
      storage.setItem('username', username);
      storage.setItem('password', password);

      //hide signup panel
      qs('.signUpPanel').classList.toggle('hidden');
      qs('#currentUser').innerHTML = username;
      qs('.currentUserPanel').classList.toggle('hidden');
      qs('.categoryPanel').classList.toggle('hidden');
    } else {
      navigator.notification.alert(
        'Try a Different User Name',
        null,
        `Error`,
        ['Ok']
      );
    }
  } else {
    navigator.notification.alert(
      'Fields Cannot be Empty',
      null,
      `Error`,
      ['Ok']
    );
  }
}

//changes current game category
function selectCategory() {
  if (qs('#categoryDropdown').value !== '') {
    //store category as global variable
    currentCategory = qs('#categoryDropdown').value;

    //add category to the headings
    let headingsCategory = qsa('.headingCategory')
    headingsCategory.forEach((item) => { item.innerHTML = currentCategory });

    //enable buttons
    qs('#rankingsBtn').classList.remove('disabled');
    qs('#startGameBtn').classList.remove('disabled');
  }
}

//displays rankings for a category
async function displayRankings() {
  const rankingsArr = await createRankingsArr();
  let filteredArr = rankingsArr.filter(item => item.playerName === username);

  //hide/show display telling there are no rankings for this user
  if (filteredArr.length === 0) {
    qs('#noRankings').classList.remove('hidden');
  } else {
    qs('#noRankings').classList.add('hidden');
  }

  qs('#rankingsBefore').innerHTML = createRankingsTable(rankingsArr);

  //hide category container, show rankings container
  qs('.categoryPanel').classList.add('hidden');
  qs('.rankingsPanel').classList.remove('hidden');

  //enable home button
  qs('#homeBtn').classList.remove('hidden');
}

//returns an array of rankings
async function createRankingsArr() {
  const category = qs('#categoryDropdown').value;
  const rankingsObj = await apiCalls.getRankingsByCategory(category);
  return rankingsArr = rankingsObj.rankings;
}

//starts a new game
async function startNewGame() {
  //get all words from category - api call
  const vocabulariesObj = await apiCalls.getVocabByCategory(currentCategory);
  const wordsArr = vocabulariesObj.vocabularies.words;

  //get random word from the array
  const hiddenWord = wordsArr[Math.floor(Math.random() * wordsArr.length)].toUpperCase();

  //call newGame fro controller
  newGame(hiddenWord);

  //create the hidden cards
  displayHiddenCards(hiddenWord);

  //clear keyboard pressed keys
  clearPressedKeyboard();

  //build switch for controlling sound
  buildSwitchSound();

  //display image
  qs('#hangmanImage').src = `${BASE_IMG}6.png`;

  //display game panel, hide category panel
  qs('.categoryPanel').classList.add('hidden');
  qs('.gamePlayPanel').classList.remove('hidden');

  //disable home btn - cannot stop a game after it starts
  qs('#homeBtn').classList.remove('hiddden');

  //play starting sound
  let startMedia = new Media(baseMedia + 'game-start.wav', null, null, null);
  startMedia.play();

  //start music
  gamePlayMedia.play();

  gameReport = GameController.report();
  updateGuessesDisplay(gameReport.guessesRemaining);
  console.log(gameReport);
}

//creates and displays hidden cards for a word 
function displayHiddenCards(hiddenWord) {
  //split word in array of letters
  const lettersArr = hiddenWord.split('');
  console.log(hiddenWord)

  //create a card for each hidden letter
  let html = '';

  lettersArr.forEach(letter => {
    html += `<div class="card_container mx-1">
            <div class="card_content ${letter} pb-4">
            <div class="card_face card_front">
            <h2>?</h2>
            </div>
            <div class="card_face card_back">
            <h2>${letter}</h2>
            </div> 
            </div>
            </div> `
  });

  qs('#hiddenWord').innerHTML = html;
}

//checks clicked letters for matches in the hidden word
function checkLetter(e) {
  const guess = e.target.id;

  //disable letter button
  qs(`#${guess}`).disabled = true;

  //call Game controller method
  processLetter(guess);

  //get the game report
  gameReport = GameController.report();
  console.log(gameReport);

  //check guess against hidden word
  const gameCards = document.getElementsByClassName('card_content');

  for (let i = 0; i < gameCards.length; i++) {
    if (gameCards[i].classList.contains(guess)) {
      //if letter matches, flip the card
      gameCards[i].classList.add('is-flipped');
    } else {
      //otherwise, change graphics
      qs('#hangmanImage').src = `${BASE_IMG}${gameReport.guessesRemaining}.png`;
    }
  }

  updateGuessesDisplay(gameReport.guessesRemaining);

  //check if game is still in progress
  if (gameReport.gameState !== getConstants().GAME_STATES.GAME_IN_PROGRESS) {
    //if game is over, stop music
    gamePlayMedia.stop();

    //create a message accordingly to a win or loss
    let gameOverMsg = '';
    let winLoseFile = '';

    //check game status - lose/win?
    if (gameReport.gameState === getConstants().GAME_STATES.GAME_OVER_LOSE) {
      gameOverMsg = `Sorry, you lost! \n\nThe hidden word was: ${gameReport.word}.`;
      winLoseFile = baseMedia + 'game-loss.wav';
    } else {
      gameOverMsg = `Congratulations! You won! \n\nThe hidden word was: ${gameReport.word}.`;
      winLoseFile = baseMedia + 'game-win.wav';
    }

    //play game over sound
    gameOverMedia = new Media(winLoseFile);
    gameOverMedia.play();

    // Vibrate device for 1 second
    navigator.vibrate(1000);

    //display a popup with game results
    navigator.notification.alert(
      gameOverMsg,
      handleGameOver,//callback
      `Game Over`,
      ['Check Rankings']
    );
  }
}

//handles score updates after game over
async function handleGameOver() {
  //get player's ranking
  let res = await apiCalls.getRankingByCategoryAndPlayer(username, currentCategory);
  let rankingObj = null;

  //if user stil doesn't have rankings for this category:
  if (res.rankings.length === 0) {
    rankingObj = {
      playerName: username,
      categoryName: currentCategory,
      score: 0
    };
  } else {
    rankingObj = res.rankings[0];
  }

  //update player's ranking in the report
  report = GameController.report();

  //if win, ranking++; if loss, ranking--
  if (report.gameState === getConstants().GAME_STATES.GAME_OVER_LOSE) {
    rankingObj.score--;
  } else {
    rankingObj.score++;
  }

  //POST request -> send ranking and password
  const success = await apiCalls.updateRanking(rankingObj, password);

  if (success) {
    //indicate rankings were updated
    //get new ranking for user
    const newRes = await apiCalls.getRankingByCategoryAndPlayer(username, currentCategory);
    const newRanking = newRes.rankings[0];

    qs('#winLoss').innerHTML = report.gameState === getConstants().GAME_STATES.GAME_OVER_LOSE ? 'Lost! &#128542;' : 'Won! &#128516;';
    qs('#rankingUpdate').innerHTML = `Category: ${qs('.headingCategory').innerHTML} | Your Score: ${newRanking.score} <br><br> Check out the rankings:`;

    //get all rankings
    const rankingsArr = await createRankingsArr();

    //display rankings table
    qs('#rankingsAfter').innerHTML = createRankingsTable(rankingsArr);

  } else {
    console.log('request unsuccesful');
    alert('There was an error with your request');
  }

  //hide game play panel, show game over panel
  qs('.gamePlayPanel').classList.add('hidden');
  qs('.gameOverPanel').classList.remove('hidden');

  //enable home btn
  qs('#homeBtn').classList.remove('hidden');

  //reset controller
  GameController.resetController();
}

//creates table from array
function createRankingsTable(arr) {
  //sort array - score high -> low
  arr.sort((a, b) => b.score - a.score);

  let html = '<table class="table table-hover" id="rankingsTable">' +
    '<thead><th scope="col">Player Name</th><th scope="col">Score</th></tr></thead>' +
    '<tbody>';

  for (let i = 0; i < arr.length; i++) {
    html += '<tr';
    html += arr[i].playerName === username ? ' class="table-primary"' : '';
    html += `><td>`
    html += i === 0 ? '&#127941; ':'';
    html += `${arr[i].playerName}</td><td>${arr[i].score} </td></tr>`;
  }

  html += '</tbody></table>';
  return html;
}

//builds new switch when game starts
function buildSwitchSound(){
  let html = '';

  html += `<input class="form-check-input bg-warning border-warning" checked type="checkbox" id="soundSwitch">` +
  `<label class="form-check-label" id="switchLabel"><i class="text-warning fa-solid fa-volume-high" id="soundIcon"></i></label>`;

  qs('#switchContainer').innerHTML = html;
  qs('#soundSwitch').addEventListener('change', toggleGameSound);
}

//turns on/off game music
function toggleGameSound() {
  if (qs('#soundSwitch').checked) {
    gamePlayMedia.play();
    qs('#soundIcon').classList.add('fa-volume-high');
    qs('#soundSwitch').classList.add('bg-warning');
    qs('#soundIcon').classList.remove('fa-volume-xmark');
  } else {
    gamePlayMedia.pause();
    qs('#soundIcon').classList.remove('fa-volume-high');
    qs('#soundSwitch').classList.remove('bg-warning');
    qs('#soundIcon').classList.add('fa-volume-xmark');
  }
}

//updates the number os guesses displayed
function updateGuessesDisplay(number) {
  qs('#numberOfGuesses').innerHTML = number;
}

//clears all pressed keys on alphabet keyboard
function clearPressedKeyboard() {
  let keys = qsa('.keyLetter');

  for (let i = 0; i < keys.length; i++) {
    keys[i].disabled = false;
  }
}

//handles clicks to home btn
function backToHome() {
  qs('.categoryPanel').classList.remove('hidden');
  qsa('.dynamic').forEach(item => item.classList.add('hidden'));
  qs('#homeBtn').classList.add('hidden');
}

//loops through the game play media --> won't let music stop during game play
function loopMedia(statusMedia) {
  if (statusMedia === Media.MEDIA_STOPPED && gameReport.gameState === getConstants().GAME_STATES.GAME_IN_PROGRESS) {
    gamePlayMedia.play();
  }
};

//***********************************
//Utils

//simplifies queryselectorall function
function qsa(selector, parent = document) {
  return [...parent.querySelectorAll(selector)]
}

//simplifies queryselector function
function qs(selector, parent = document) {
  return parent.querySelector(selector);
}

//****************************************
//functions that run every time app starts:

//get categories and populates dropdown with them
async function populateDropdown() {
  //get categories
  const res = await apiCalls.getAllCategories();
  const categoriesArr = res.categories;

  let html = '';

  for (let i = 0; i < categoriesArr.length; i++) {
    html += `<option class='choices' value='${categoriesArr[i].categoryName}'>${categoriesArr[i].categoryName}</option>`
  }

  qs('#categoryDropdown').innerHTML += html;
}

//builds alphabet keyboard
function buildKeyboard() {
  const alphabet = getConstants().ALPHABET;
  const letters = alphabet.split('');

  let html = '';

  letters.forEach(letter => {
    html += `<button class="btn px-3 mb-1 mx-1 keyLetter" id="${letter}">${letter}</button>`;
  });

  qs('#alphabetLetters').innerHTML = html;

  //add event listeners to each letter after creating keyboard
  qs('#alphabetLetters').addEventListener('click', checkLetter);
}
