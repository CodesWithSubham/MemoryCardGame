// @ts-check

const symbols = ["⚡", "💎", "🔥", "🚀", "🌟", "🍀", "🎵", "⚓"];
let cards = [...symbols, ...symbols]; // Duplicating for pairs
/** @type {HTMLElement | null} */
let firstCard = null;
/** @type {HTMLElement | null} */
let secondCard = null;
let lockBoard = false;
let moves = 0;
let matchesFound = 0;

/** @type {number | null} */
let timerInterval = null;
let seconds = 0;
let gameStarted = false;

/**
 * Gets element by ID and throws if missing
 * @param {string} id
 * @returns {HTMLElement}
 */
function getElement(id) {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing element: ${id}`);
  return el;
}

const board = getElement("gameBoard");
const movesDisplay = getElement("moves");
const timeDisplay = getElement("time");
const winModal = getElement("winModal");
const historyModal = getElement("historyModal");
const historyBody = getElement("historyBody");

/** Initialize Game */
function initGame() {
  // Reset state
  board.innerHTML = "";
  moves = 0;
  matchesFound = 0;
  seconds = 0;
  gameStarted = false;
  lockBoard = false;
  firstCard = null;
  secondCard = null;
  if (timerInterval !== null) {
    clearInterval(timerInterval);
    timerInterval = null;
  }

  // UI Reset
  movesDisplay.innerText = moves.toString();
  timeDisplay.innerText = "00:00";
  winModal.classList.remove("visible");

  // Shuffle
  cards.sort(() => 0.5 - Math.random());

  // Create Cards
  cards.forEach((symbol) => {
    const cardElement = document.createElement("div");
    cardElement.classList.add("card");
    cardElement.dataset.symbol = symbol;

    cardElement.innerHTML = `
                    <div class="card-face card-front"></div>
                    <div class="card-face card-back">${symbol}</div>
                `;

    cardElement.addEventListener("click", (e) => flipCard(e.currentTarget));
    board.appendChild(cardElement);
  });
}

function startTimer() {
  if (gameStarted) return;
  gameStarted = true;
  timerInterval = setInterval(() => {
    seconds++;
    const mins = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const secs = (seconds % 60).toString().padStart(2, "0");
    timeDisplay.innerText = `${mins}:${secs}`;
  }, 1000);
}

/**
 * Handles card flip logic
 * @param {EventTarget | null} target
 */
function flipCard(target) {
  if (!(target instanceof HTMLDivElement)) return;

  if (lockBoard) return;
  if (target === firstCard) return;

  startTimer();

  target.classList.add("flipped");

  if (!firstCard) {
    firstCard = target;
    return;
  }

  secondCard = target;
  incrementMoves();
  checkForMatch();
}

function incrementMoves() {
  moves++;
  movesDisplay.innerText = moves.toString();
}

function checkForMatch() {
  if (!firstCard || !secondCard) return;
  let isMatch = firstCard.dataset.symbol === secondCard.dataset.symbol;
  isMatch ? disableCards() : unflipCards();
}

function disableCards() {
  if (!firstCard || !secondCard) return;
  firstCard.classList.add("matched");
  secondCard.classList.add("matched");
  resetBoard();
  matchesFound++;

  if (matchesFound === symbols.length) {
    setTimeout(endGame, 500);
  }
}

function unflipCards() {
  lockBoard = true;
  setTimeout(() => {
    if (!firstCard || !secondCard) return;
    firstCard.classList.remove("flipped");
    secondCard.classList.remove("flipped");
    resetBoard();
  }, 1000);
}

function resetBoard() {
  [firstCard, secondCard, lockBoard] = [null, null, false];
}

function endGame() {
  if (timerInterval !== null) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  getElement("finalTime").innerText = timeDisplay.innerText;
  getElement("finalMoves").innerText = moves.toString();

  saveToHistory(); // Save the score

  winModal.classList.add("visible");
  triggerConfetti();
}

function restartGame() {
  initGame();
}

// --- HISTORY LOGIC --- //

/** @returns {{moves:number, timeStr:string, seconds:number, date:string}[]} */
function getHistory() {
  const localHistory = localStorage.getItem("neonMemoryHistory");
  if (!localHistory) return [];
  return JSON.parse(localHistory);
}

function saveToHistory() {
  let history = getHistory();

  const newRecord = {
    moves: moves,
    timeStr: timeDisplay.innerText,
    seconds: seconds,
    date: new Date().toLocaleDateString(undefined, { month: "short", day: "numeric" }),
  };

  history.push(newRecord);

  // Sort by lowest moves, then lowest time
  history.sort((a, b) => a.moves - b.moves || a.seconds - b.seconds);

  // Keep only top 5 scores
  history = history.slice(0, 5);

  localStorage.setItem("neonMemoryHistory", JSON.stringify(history));
}

function showHistory() {
  let history = getHistory();
  historyBody.innerHTML = "";

  if (history.length === 0) {
    historyBody.innerHTML = `<tr><td colspan="4">No games played yet.</td></tr>`;
  } else {
    history.forEach((record, index) => {
      const row = `
                    <tr>
                      <td>#${index + 1}</td>
                      <td>${record.moves}</td>
                      <td>${record.timeStr}</td>
                      <td>${record.date}</td>
                    </tr>
                  `;
      historyBody.innerHTML += row;
    });
  }
  historyModal.classList.add("visible");
}

function closeHistory() {
  historyModal.classList.remove("visible");
}

function clearHistory() {
  if (confirm("Are you sure you want to clear your high scores?")) {
    localStorage.removeItem("neonMemoryHistory");
    showHistory(); // Refresh the modal view
  }
}

// --- CONFETTI LOGIC --- //

function triggerConfetti() {
  const canvas = /** @type {HTMLCanvasElement} */ (getElement("confetti"));

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  /** @type {{x:number, y:number, vx:number, vy:number, color:string}[]} */
  const particles = [];

  for (let i = 0; i < 100; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height,
      vx: Math.random() * 4 - 2,
      vy: Math.random() * 4 + 2,
      color: `hsl(${Math.random() * 360}, 100%, 50%)`,
    });
  }

  function draw() {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let active = false;
    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.y <= canvas.height) active = true;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, 8, 8);
    });
    if (active && winModal.classList.contains("visible")) {
      requestAnimationFrame(draw);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }
  draw();
}

// Initialize on load
document.addEventListener("DOMContentLoaded", initGame);
