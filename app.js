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
let moveCount = 0;

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
  selectedCell = null;
  moveCount = 0;

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

  messageElement.textContent = 'Place numbers freely. The board checks after several moves.';
  startTimer();
  loadBestTime();
}

function selectCell(cell) {
  if (cell.disabled) return;

  document.querySelectorAll('.cell').forEach((c) => c.classList.remove('selected'));
  selectedCell = cell;
  selectedCell.classList.add('selected');
}

function getCells() {
  return [...document.querySelectorAll('.cell')];
}

function getCellValue(index) {
  return getCells()[index].textContent.trim();
}

function getConflictIndexes() {
  const conflicts = new Set();

  function checkGroup(indexes) {
    const seen = new Map();

    indexes.forEach((index) => {
      const value = getCellValue(index);
      if (!value) return;

      if (seen.has(value)) {
        conflicts.add(index);
        conflicts.add(seen.get(value));
      } else {
        seen.set(value, index);
      }
    });
  }

  for (let row = 0; row < 9; row += 1) {
    checkGroup(Array.from({ length: 9 }, (_, col) => row * 9 + col));
  }

  for (let col = 0; col < 9; col += 1) {
    checkGroup(Array.from({ length: 9 }, (_, row) => row * 9 + col));
  }

  for (let boxRow = 0; boxRow < 3; boxRow += 1) {
    for (let boxCol = 0; boxCol < 3; boxCol += 1) {
      const indexes = [];
      for (let r = 0; r < 3; r += 1) {
        for (let c = 0; c < 3; c += 1) {
          indexes.push((boxRow * 3 + r) * 9 + boxCol * 3 + c);
        }
      }
      checkGroup(indexes);
    }
  }

  return conflicts;
}

function checkBoard(showCleanMessage = true) {
  const cells = getCells();
  cells.forEach((cell) => cell.classList.remove('invalid'));

  const conflicts = getConflictIndexes();

  if (conflicts.size > 0) {
    conflicts.forEach((index) => cells[index].classList.add('invalid'));
    messageElement.textContent = `${conflicts.size} Sudoku conflict${conflicts.size === 1 ? '' : 's'} found. Fix the highlighted squares.`;
    return false;
  }

  if (showCleanMessage) {
    messageElement.textContent = 'No conflicts so far.';
  }

  return true;
}

function placeNumber(number) {
  if (!selectedCell) return;

  selectedCell.textContent = number;
  selectedCell.classList.remove('invalid');
  moveCount += 1;

  if (moveCount >= 4 && moveCount % 3 === 1) {
    checkBoard();
  } else {
    messageElement.textContent = 'Placed. Keep going.';
  }

  checkWin();
}

function checkWin() {
  const cells = getCells();
  const filled = cells.every((cell) => cell.textContent.trim() !== '');

  if (!filled) return;

  const noConflicts = checkBoard(false);
  const solved = cells.every((cell, index) => cell.textContent.trim() === puzzles[currentDifficulty].solution[index]);

  if (noConflicts && solved) {
    clearInterval(timerInterval);
    saveBestTime();
    messageElement.textContent = 'Puzzle solved. New horror donut record locked in.';
  } else {
    messageElement.textContent = 'Board is full, but something is still off.';
  }
}

function clearSelectedCell() {
  if (!selectedCell) return;

  selectedCell.textContent = '';
  selectedCell.classList.remove('invalid');
  messageElement.textContent = 'Cell cleared.';
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
    button.addEventListener('click', () => placeNumber(button.dataset.number));
  });

  document.querySelectorAll('.difficulty').forEach((button) => {
    button.addEventListener('click', () => changeDifficulty(button.dataset.difficulty));
  });

  document.getElementById('newPuzzle').addEventListener('click', createBoard);
  document.getElementById('clearCell').addEventListener('click', clearSelectedCell);

  installBtn.addEventListener('click', () => {
    installDialog.showModal();
  });

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js');
  }
});
