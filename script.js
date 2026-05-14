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
let isBotMode = false;

const winningConditions = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
];

function handleCellClick(e) {
    if (currentPlayer === 'O' && isBotMode) return;

    const cell = e.target;
    const index = parseInt(cell.getAttribute('data-index'));

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

    if (isBotMode && gameActive && currentPlayer === 'O') {
        setTimeout(botMove, 500);
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

function botMove() {
    if (!gameActive || currentPlayer !== 'O') return;

    const emptyCells = gameState.map((v, i) => v === '' ? i : -1).filter(i => i !== -1);
    if (emptyCells.length === 0) return;

    let bestMove = -1;
    let bestScore = -Infinity;

    for (const index of emptyCells) {
        const score = minimax(index, 0, true);
        if (score > bestScore) {
            bestScore = score;
            bestMove = index;
        }
    }

    if (bestMove !== -1) {
        const cell = cells[bestMove];
        const moves = oMoves;
        const isRemoveMove = moves.length >= 3;

        if (isRemoveMove) {
            const oldIndex = moves[0];
            cells[oldIndex].classList.remove('flicker');
            cells[oldIndex].classList.remove('x', 'o', 'winner');
            cells[oldIndex].textContent = '';
            gameState[oldIndex] = '';
            moves.shift();
        }

        makeMove(bestMove, cell);
    }
}

function minimax(lastMove, depth, isMaximizing) {
    const winner = checkWinner();
    if (winner === 'O') return 100 - depth;
    if (winner === 'X') return depth - 100;
    if (checkDraw()) return 0;

    const moves = isMaximizing ? oMoves : xMoves;
    const isRemoveMove = moves.length >= 3;

    if (isRemoveMove) {
        const testMoves = [...moves];
        testMoves.shift();
        testMoves.push(lastMove);
    }

    if (isMaximizing) {
        let maxScore = -Infinity;
        for (let i = 0; i < 9; i++) {
            if (gameState[i] === '') {
                gameState[i] = 'O';
                const score = minimax(i, depth + 1, false);
                gameState[i] = '';
                maxScore = Math.max(maxScore, score);
            }
        }
        return maxScore;
    } else {
        let minScore = Infinity;
        for (let i = 0; i < 9; i++) {
            if (gameState[i] === '') {
                gameState[i] = 'X';
                const score = minimax(i, depth + 1, true);
                gameState[i] = '';
                minScore = Math.min(minScore, score);
            }
        }
        return minScore;
    }
}

function checkWinner() {
    for (const condition of winningConditions) {
        const [a, b, c] = condition;
        if (gameState[a] && gameState[a] === gameState[b] && gameState[a] === gameState[c]) {
            return gameState[a];
        }
    }
    return null;
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
    isBotMode = true;
    status.textContent = `Ход: ${currentPlayer}`;
    cells.forEach(cell => {
        cell.textContent = '';
        cell.classList.remove('x', 'o', 'winner', 'flicker');
    });
    tg.HapticFeedback.impactOccurred('medium');
}

cells.forEach(cell => cell.addEventListener('click', handleCellClick));
restartBtn.addEventListener('click', restartGame);

isBotMode = true;
status.textContent = "Игра с ботом! Ваш ход: X";