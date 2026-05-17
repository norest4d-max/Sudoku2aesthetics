const puzzles = {
  easy: {
    board: '530070000600195000098000060800060003400803001700020006060000280000419005000080079',
    solution: '534678912672195348198342567859761423426853791713924856961537284287419635345286179'
  },
  medium: {
    board: '000260701680070090190004500820100040004602900050003028009300074040050036703018000',
    solution: '435269781682571493197834562826195347374682915951743628519326874248957136763418259'
  },
  hard: {
    board: '005300000800000020070010500400005300010070006003200080060500009004000030000009700',
    solution: '145327698839654127672918543486195372219873456753246981367582914594761832821439765'
  }
};

let currentDifficulty = 'easy';
let selectedCell = null;
let timerInterval;
let seconds = 0;

const boardElement = document.getElementById('board');
const timerElement = document.getElementById('timer');
const bestTimeElement = document.getElementById('bestTime');
const difficultyLabel = document.getElementById('difficultyLabel');
const messageElement = document.getElementById('message');
const installBtn = document.getElementById('installBtn');
const installDialog = document.getElementById('installDialog');

function formatTime(total) {
  const mins = String(Math.floor(total / 60)).padStart(2, '0');
  const secs = String(total % 60).padStart(2, '0');
  return `${mins}:${secs}`;
}

function startTimer() {
  clearInterval(timerInterval);
  seconds = 0;
  timerElement.textContent = '00:00';

  timerInterval = setInterval(() => {
    seconds += 1;
    timerElement.textContent = formatTime(seconds);
  }, 1000);
}

function saveBestTime() {
  const key = `best-${currentDifficulty}`;
  const previous = Number(localStorage.getItem(key));

  if (!previous || seconds < previous) {
    localStorage.setItem(key, seconds);
    bestTimeElement.textContent = formatTime(seconds);
  }
}

function loadBestTime() {
  const best = localStorage.getItem(`best-${currentDifficulty}`);
  bestTimeElement.textContent = best ? formatTime(Number(best)) : '--:--';
}

function createBoard() {
  boardElement.innerHTML = '';

  const data = puzzles[currentDifficulty];

  data.board.split('').forEach((value, index) => {
    const button = document.createElement('button');
    button.className = 'cell';
    button.dataset.index = index;

    if (value !== '0') {
      button.textContent = value;
      button.disabled = true;
      button.classList.add('prefilled');
    }

    if ((Math.floor(index / 9) + 1) % 3 === 0 && Math.floor(index / 9) !== 8) {
      button.style.borderBottom = '3px solid #000';
    }

    if ((index + 1) % 3 === 0 && (index + 1) % 9 !== 0) {
      button.style.borderRight = '3px solid #000';
    }

    button.addEventListener('click', () => selectCell(button));

    boardElement.appendChild(button);
  });

  startTimer();
  loadBestTime();
}

function selectCell(cell) {
  if (cell.disabled) return;

  document.querySelectorAll('.cell').forEach((c) => c.classList.remove('selected'));
  selectedCell = cell;
  selectedCell.classList.add('selected');
}

function validatePlacement(number) {
  if (!selectedCell) return;

  const index = Number(selectedCell.dataset.index);
  const correct = puzzles[currentDifficulty].solution[index];

  if (String(number) === correct) {
    selectedCell.textContent = number;
    selectedCell.dataset.locked = 'true';
    selectedCell.disabled = true;
    selectedCell.classList.remove('selected');
    selectedCell = null;
    messageElement.textContent = 'Correct placement.';

    checkWin();
  } else {
    selectedCell.classList.add('invalid');
    messageElement.textContent = 'Wrong number rejected instantly.';

    setTimeout(() => {
      selectedCell?.classList.remove('invalid');
    }, 500);
  }
}

function checkWin() {
  const remaining = [...document.querySelectorAll('.cell:not(.prefilled)')]
    .some((cell) => !cell.disabled);

  if (!remaining) {
    clearInterval(timerInterval);
    saveBestTime();
    messageElement.textContent = 'Puzzle solved. New horror donut record locked in.';
  }
}

function clearSelectedCell() {
  if (!selectedCell) return;

  selectedCell.textContent = '';
}

function changeDifficulty(level) {
  currentDifficulty = level;
  difficultyLabel.textContent = level.charAt(0).toUpperCase() + level.slice(1);

  document.querySelectorAll('.difficulty').forEach((button) => {
    button.classList.toggle('active', button.dataset.difficulty === level);
  });

  createBoard();
}

window.addEventListener('DOMContentLoaded', () => {
  createBoard();

  document.querySelectorAll('.number-pad button').forEach((button) => {
    button.addEventListener('click', () => validatePlacement(button.dataset.number));
  });

  document.querySelectorAll('.difficulty').forEach((button) => {
    button.addEventListener('click', () => changeDifficulty(button.dataset.difficulty));
  });

  document.getElementById('newPuzzle').addEventListener('click', createBoard);
  document.getElementById('clearCell').addEventListener('click', clearSelectedCell);
  document.getElementById('startEasy').addEventListener('click', () => {
    changeDifficulty('easy');
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  });

  document.getElementById('howToInstall').addEventListener('click', () => {
    installDialog.showModal();
  });

  installBtn.addEventListener('click', () => {
    installDialog.showModal();
  });

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js');
  }
});
