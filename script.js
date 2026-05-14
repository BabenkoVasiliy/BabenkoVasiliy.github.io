const cells = document.querySelectorAll('.cell');
const status = document.getElementById('status');
const restartBtn = document.getElementById('restart');

const tg = window.Telegram.WebApp;

tg.expand();
tg.ready();

const BOT_URL = "https://xobot-n0xe.onrender.com/move";

let currentPlayer = 'X';
let gameState = ['', '', '', '', '', '', '', '', ''];
let gameActive = true;
let xMoves = [];
let oMoves = [];
let chatId = null;

const winningConditions = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
];

if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
    chatId = tg.initDataUnsafe.user.id;
}

function handleCellClick(e) {
    if (currentPlayer === 'O') return;

    const cell = e.target;
    const index = parseInt(cell.getAttribute('data-index'));

    if (gameState[index] !== '' || !gameActive) return;

    const moves = xMoves;
    const isRemoveMove = moves.length >= 3;

    if (isRemoveMove) {
        const oldIndex = moves[0];
        cells[oldIndex].classList.remove('flicker');
        cells[oldIndex].classList.remove('x', 'o', 'winner');
        cells[oldIndex].textContent = '';
        gameState[oldIndex] = '';
        xMoves.shift();

        makeMove(index, cell);
    } else {
        makeMove(index, cell);
    }

    tg.HapticFeedback.impactOccurred('light');

    if (gameActive && currentPlayer === 'O') {
        setTimeout(async () => {
            await sendMoveToBot();
        }, 500);
    }
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

async function sendMoveToBot() {
    try {
        const response = await fetch(BOT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chatId: chatId,
                board: gameState,
                xMoves: xMoves,
                oMoves: oMoves,
                lastMove: xMoves.length > 0 ? xMoves[xMoves.length - 1] : -1
            })
        });

        const data = await response.json();

        if (data.remove !== -1) {
            const oldIndex = data.remove;
            cells[oldIndex].classList.remove('flicker', 'x', 'o', 'winner');
            cells[oldIndex].textContent = '';
            gameState[oldIndex] = '';
            oMoves.shift();
        }

        if (data.index !== -1) {
            const cell = cells[data.index];
            makeMove(data.index, cell);
        }
    } catch (err) {
        console.error('Bot move error:', err);
    }
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
    status.textContent = "Игра с ботом! Ваш ход: X";
    cells.forEach(cell => {
        cell.textContent = '';
        cell.classList.remove('x', 'o', 'winner', 'flicker');
    });
    tg.HapticFeedback.impactOccurred('medium');
}

cells.forEach(cell => cell.addEventListener('click', handleCellClick));
restartBtn.addEventListener('click', restartGame);

status.textContent = "Игра с ботом! Ваш ход: X";