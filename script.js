const boardElement = document.getElementById("board");
const currentWordElement = document.getElementById("currentWord");
const wordsElement = document.getElementById("words");
const scoreElement = document.getElementById("score");
const timerElement = document.getElementById("timer");

const startScreen = document.getElementById("startScreen");
const endScreen = document.getElementById("endScreen");
const finalScoreElement = document.getElementById("finalScore");
const highScoreElement = document.getElementById("highScore");

let currentWord = "";
let score = 0;
let time = 60;
let foundWords = [];
let isDragging = false;
let dictionary = new Set();
let selectedTiles = [];
let timerInterval;
let gameRunning = false;

// Better letter groups
const vowels = "AAAAAAAEEEEEEEIIIIIOOOOUU";
const consonants = "BBCCDDDFFGGHHJKLLLMMMNNNPPQRRRSSSTTTTVVWWXYYZ";

// Prevent scrolling while swiping
document.body.addEventListener("touchmove", function(e) {
    if (isDragging) e.preventDefault();
}, { passive: false });

// Load dictionary
fetch("words.json")
    .then(res => res.json())
    .then(data => {
        dictionary = new Set(data.map(w => w.toUpperCase()));
    });

// === LINE DRAWING REMOVED ===
// SVG is kept for potential future use, but nothing is drawn
const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
svg.style.position = "absolute";
svg.style.top = 0;
svg.style.left = 0;
svg.style.width = "100%";
svg.style.height = "100%";
svg.style.pointerEvents = "none";

function startGame() {
    startScreen.style.display = "none";
    endScreen.style.display = "none";

    resetGame();
    generateBoard();
    startTimer();

    gameRunning = true;
}

function endGame() {
    clearInterval(timerInterval);
    gameRunning = false;

    finalScoreElement.innerText = score;
    const high = localStorage.getItem("highScore") || 0;
    highScoreElement.innerText = high;

    endScreen.style.display = "flex";
}

function resetGame() {
    score = 0;
    time = 60;
    foundWords = [];
    wordsElement.innerHTML = "";
    scoreElement.innerText = score;
    timerElement.innerText = time;
}

function generateBoard() {
    boardElement.innerHTML = "";
    boardElement.appendChild(svg);
    svg.innerHTML = "";

    let letters = [];

    // Ensure vowel/consonant balance
    for (let i = 0; i < 6; i++) {
        letters.push(vowels[Math.floor(Math.random() * vowels.length)]);
    }
    for (let i = 0; i < 10; i++) {
        letters.push(consonants[Math.floor(Math.random() * consonants.length)]);
    }

    // Shuffle letters
    letters.sort(() => Math.random() - 0.5);

    for (let i = 0; i < 16; i++) {
        const tile = document.createElement("div");
        tile.classList.add("tile");
        tile.innerText = letters[i];
        tile.dataset.index = i;

        // Desktop events
        tile.addEventListener("mousedown", () => startDrag(tile));
        tile.addEventListener("mouseenter", () => dragOver(tile));

        // Mobile events with preventDefault
        tile.addEventListener("touchstart", (e) => {
            e.preventDefault();
            startDrag(tile);
        });
        tile.addEventListener("touchmove", (e) => {
            e.preventDefault();
            touchMove(e);
        });

        boardElement.appendChild(tile);
    }
}

function getCoords(tile) {
    const rect = tile.getBoundingClientRect();
    return {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
    };
}

// Line drawing removed
function drawLine(tile1, tile2) {
    // intentionally empty
}

function isAdjacent(tile1, tile2) {
    const i1 = parseInt(tile1.dataset.index);
    const i2 = parseInt(tile2.dataset.index);

    const row1 = Math.floor(i1 / 4);
    const col1 = i1 % 4;
    const row2 = Math.floor(i2 / 4);
    const col2 = i2 % 4;

    return Math.abs(row1 - row2) <= 1 && Math.abs(col1 - col2) <= 1;
}

function startDrag(tile) {
    if (!gameRunning) return;
    resetSelection();
    isDragging = true;
    selectTile(tile);
}

function dragOver(tile) {
    if (!isDragging) return;

    const lastTile = selectedTiles[selectedTiles.length - 1];

    if (
        tile !== lastTile &&
        !selectedTiles.includes(tile) &&
        isAdjacent(lastTile, tile)
    ) {
        selectTile(tile);
        drawLine(lastTile, tile);
    }
}

function touchMove(e) {
    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);

    if (element && element.classList.contains("tile")) {
        dragOver(element);
    }
}

function selectTile(tile) {
    tile.classList.add("selected");
    selectedTiles.push(tile);
    currentWord += tile.innerText;
    currentWordElement.innerText = currentWord;
}

document.addEventListener("mouseup", endDrag);
document.addEventListener("touchend", endDrag);

function endDrag() {
    if (isDragging) {
        submitWord();
    }
    isDragging = false;
}

function isValidWord(word) {
    return dictionary.has(word);
}

function submitWord() {
    if (currentWord.length < 3) {
        resetSelection();
        return;
    }

    if (!foundWords.includes(currentWord) && isValidWord(currentWord)) {
        foundWords.push(currentWord);

        let points = 0;
        if (currentWord.length === 3) points = 100;
        else if (currentWord.length === 4) points = 400;
        else if (currentWord.length === 5) points = 800;
        else if (currentWord.length === 6) points = 1400;
        else if (currentWord.length >= 7) points = 1800;

        score += points;
        scoreElement.innerText = score;

        const li = document.createElement("li");
        li.innerText = currentWord;
        wordsElement.appendChild(li);

        saveHighScore();

        boardElement.classList.add("correct");
        setTimeout(() => boardElement.classList.remove("correct"), 200);
    } else {
        boardElement.classList.add("shake");
        setTimeout(() => boardElement.classList.remove("shake"), 300);
    }

    resetSelection();
}

function resetSelection() {
    currentWord = "";
    selectedTiles = [];
    currentWordElement.innerText = "";
    svg.innerHTML = "";

    document.querySelectorAll(".tile").forEach(tile => {
        tile.classList.remove("selected");
    });
}

function startTimer() {
    timerInterval = setInterval(() => {
        time--;
        timerElement.innerText = time;

        if (time <= 0) {
            endGame();
        }
    }, 1000);
}

function saveHighScore() {
    const high = localStorage.getItem("highScore") || 0;
    if (score > high) {
        localStorage.setItem("highScore", score);
    }
}

function restartGame() {
    endScreen.style.display = "none";
    startGame();
}