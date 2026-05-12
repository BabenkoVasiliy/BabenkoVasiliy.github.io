const cells = document.querySelectorAll('.cell');
const status = document.getElementById('status');
const restartBtn = document.getElementById('restart');

const tg = window.Telegram.WebApp;

tg.expand();
tg.ready();

let currentPlayer = 'X';
let gameState = ['', '', '', '', '', '', '', '', ''];
let gameActive = true;
let xMoves = [];
let oMoves = [];

const winningConditions = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
];

function handleCellClick(e) {
    const cell = e.target;
    const index = cell.getAttribute('data-index');

    if (gameState[index] !== '' || !gameActive) return;

    const moves = currentPlayer === 'X' ? xMoves : oMoves;
    const isRemoveMove = moves.length >= 3;

    if (isRemoveMove) {
        const oldIndex = moves[0];
        cells[oldIndex].classList.remove('flicker');
        cells[oldIndex].classList.remove('x', 'o', 'winner');
        cells[oldIndex].textContent = '';
        gameState[oldIndex] = '';
        moves.shift();

        makeMove(index, cell);
    } else {
        makeMove(index, cell);
    }

    tg.HapticFeedback.impactOccurred('light');
}

function makeMove(index, cell) {
    const moves = currentPlayer === 'X' ? xMoves : oMoves;

    gameState[index] = currentPlayer;
    moves.push(index);
    cell.textContent = currentPlayer;
    cell.classList.add(currentPlayer.toLowerCase());

    if (moves.length >= 3) {
        const toRemoveIndex = moves[0];
        cells[toRemoveIndex].classList.add('flicker');
    }

    if (checkWin()) {
        status.textContent = `Победил: ${currentPlayer}!`;
        gameActive = false;
        highlightWinner();
        tg.HapticFeedback.notificationOccurred('success');
        return;
    }

    if (checkDraw()) {
        status.textContent = 'Ничья!';
        gameActive = false;
        return;
    }

    currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
    status.textContent = `Ход: ${currentPlayer}`;
}

function checkWin() {
    return winningConditions.some(condition => {
        return condition.every(index => gameState[index] === currentPlayer);
    });
}

function checkDraw() {
    return gameState.every(cell => cell !== '');
}

function highlightWinner() {
    winningConditions.forEach(condition => {
        if (condition.every(index => gameState[index] === currentPlayer)) {
            condition.forEach(index => {
                cells[index].classList.add('winner');
            });
        }
    });
}

function restartGame() {
    currentPlayer = 'X';
    gameState = ['', '', '', '', '', '', '', '', ''];
    gameActive = true;
    xMoves = [];
    oMoves = [];
    status.textContent = `Ход: ${currentPlayer}`;
    cells.forEach(cell => {
        cell.textContent = '';
        cell.classList.remove('x', 'o', 'winner', 'flicker');
    });
    tg.HapticFeedback.impactOccurred('medium');
}

cells.forEach(cell => cell.addEventListener('click', handleCellClick));
restartBtn.addEventListener('click', restartGame);