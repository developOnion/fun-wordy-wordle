const letters = document.querySelectorAll(".wordle-box");
const spiral = document.querySelector(".spiral");
const statusDiv = document.querySelector(".status");
const rowNum = document.querySelector(".row");

const GET_URL = "https://words.dev-apis.com/word-of-the-day?random=1";
const POST_URL = "https://words.dev-apis.com/validate-word";
const WORD_LENGTH = 5;
const ROUND = 6;

async function main() {
  let currentGuess = "";
  let currentRow = 0;
  let isLoading = true;
  let done = false;

  // get word from api
  const res = await fetch(GET_URL);
  const resObj = await res.json();
  const word = resObj.word.toUpperCase();

  setLoading(false);
  isLoading = false;

  function handleLetter(letter) {
    if (currentGuess.length == WORD_LENGTH) {
      currentGuess = currentGuess.substring(0, currentGuess.length - 1);
    }

    letters[currentRow * WORD_LENGTH + currentGuess.length].innerText = letter;
    currentGuess += letter;
  }

  function handleBackspace() {
    if (currentGuess.length === 0) {
      // do nothing
      return;
    } else {
      // delete last char
      currentGuess = currentGuess.substring(0, currentGuess.length - 1);
      letters[currentRow * WORD_LENGTH + currentGuess.length].innerText = "";
    }
  }

  async function handleSubmit() {
    if (currentGuess.length !== WORD_LENGTH) {
      return;
    }

    isLoading = true;
    setLoading(true);

    const res = await fetch(POST_URL, {
      method: "POST",
      body: JSON.stringify({ word: currentGuess }),
    });

    const { validWord } = await res.json();

    setLoading(false);
    isLoading = false;

    if (!validWord) {
      flashRed();
      statusDiv.innerText = "Invalid word";
      return;
    }

    const seqMap = makeMap(word);

    for (let i = 0; i < WORD_LENGTH; ++i) {
      if (currentGuess[i] === word[i]) {
        // paint green on correct letter at correct position
        letters[currentRow * WORD_LENGTH + i].classList.add("right");
        seqMap[word[i]]--;
      }
    }

    for (let i = 0; i < WORD_LENGTH; ++i) {
      if (currentGuess[i] === word[i]) {
        // ignore, we already painted
      } else if (
        word.includes(currentGuess[i]) &&
        seqMap[currentGuess[i]] > 0
      ) {
        // paint orange on correct letter on wrong position
        letters[currentRow * WORD_LENGTH + i].classList.add("close");
        seqMap[currentGuess[i]]--;
      } else {
        // paint gray on wrong letter
        letters[currentRow * WORD_LENGTH + i].classList.add("gray");
      }
    }

    if (currentGuess === word) {
      statusDiv.innerText = "YOU WIN!";
      statusDiv.style.color = "green";
      done = true;
      return;
    }

    currentRow++;
    currentGuess = "";

    if (currentRow === ROUND) {
      statusDiv.innerText = `YOU LOSE.\n The word was ${word}`;
      statusDiv.style.color = "red";
      done = true;
      return;
    }

    rowNum.innerText = `Row: ${currentRow + 1}`;
  }

  function flashRed() {
    for (let i = 0; i < WORD_LENGTH; ++i) {
      letters[currentRow * WORD_LENGTH + i].classList.remove("invalid");

      setTimeout(() => {
        letters[currentRow * WORD_LENGTH + i].classList.add("invalid");
      }, 10);
    }
  }

  document.addEventListener("keydown", function handleKey(e) {
    if (isLoading || done) {
      return;
    }

    statusDiv.innerText = "";

    const key = e.key;

    if (isLetter(key)) {
      handleLetter(key.toUpperCase());
    } else if (key == "Backspace") {
      handleBackspace();
    } else if (key == "Enter") {
      handleSubmit();
    } else {
      // do nothing
    }
  });
}

function isLetter(char) {
  return /^[a-zA-Z]$/.test(char);
}

function setLoading(isLoading) {
  spiral.toggleAttribute("hidden", !isLoading);
}

function makeMap(word) {
  let obj = {};

  for (let i = 0; i < WORD_LENGTH; ++i) {
    const char = word.charAt(i);
    if (obj[char]) obj[char]++;
    else obj[char] = 1;
  }

  return obj;
}

main();
