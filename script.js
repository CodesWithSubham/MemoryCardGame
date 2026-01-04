const symbols = ["⚡", "💎", "🔥", "🚀", "🌟", "🍀", "🎵", "⚓"];
let cards = [...symbols, ...symbols]; // Duplicating for pairs
let firstCard = null;
let secondCard = null;
let lockBoard = false;
let moves = 0;
let matchesFound = 0;
let timerInterval;
let seconds = 0;
let gameStarted = false;

const board = document.getElementById("gameBoard");
const movesDisplay = document.getElementById("moves");
const timeDisplay = document.getElementById("time");
const winModal = document.getElementById("winModal");
const historyModal = document.getElementById("historyModal");
const historyBody = document.getElementById("historyBody");

// Initialize Game
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
  clearInterval(timerInterval);

  // UI Reset
  movesDisplay.innerText = moves;
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

    cardElement.addEventListener("click", flipCard);
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

function flipCard() {
  if (lockBoard) return;
  if (this === firstCard) return;

  startTimer();

  this.classList.add("flipped");

  if (!firstCard) {
    firstCard = this;
    return;
  }

  secondCard = this;
  incrementMoves();
  checkForMatch();
}

function incrementMoves() {
  moves++;
  movesDisplay.innerText = moves;
}

function checkForMatch() {
  let isMatch = firstCard.dataset.symbol === secondCard.dataset.symbol;
  isMatch ? disableCards() : unflipCards();
}

function disableCards() {
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
    firstCard.classList.remove("flipped");
    secondCard.classList.remove("flipped");
    resetBoard();
  }, 1000);
}

function resetBoard() {
  [firstCard, secondCard, lockBoard] = [null, null, false];
}

function endGame() {
  clearInterval(timerInterval);
  document.getElementById("finalTime").innerText = timeDisplay.innerText;
  document.getElementById("finalMoves").innerText = moves;

  saveToHistory(); // Save the score

  winModal.classList.add("visible");
  triggerConfetti();
}

function restartGame() {
  initGame();
}

// --- HISTORY LOGIC --- //

function saveToHistory() {
  let history = JSON.parse(localStorage.getItem("neonMemoryHistory")) || [];

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
  let history = JSON.parse(localStorage.getItem("neonMemoryHistory")) || [];
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
  const canvas = document.getElementById("confetti");
  const ctx = canvas.getContext("2d");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

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
initGame();
