function loadScript(url, callback) {
    const script = document.createElement("script");
    script.src = url;
    script.onload = callback; // 스크립트 로드 완료 후 실행할 함수
    document.head.appendChild(script);
}

// Game constants
const EMPTY = 0;
const BLACK = 1;
const WHITE = 2;
const BOARD_SIZE = 8;

// Game state
let board = [];
let currentPlayer = BLACK;
let gameRunning = false;
let moveLog = [];
let recordedMoves = [];
// Add this new variable for strategy storage
let savedStrategies = {};
let gameStartLogged = false;
let round = 0;
let PLAYER_COLOR = 0;

// DOM elements
const boardElement = document.getElementById("board");
const boardListElement = document.getElementById("board-list");
const statusElement = document.getElementById("status");
const blackScoreElement = document.getElementById("black-score");
const whiteScoreElement = document.getElementById("white-score");
const blackAISelect = document.getElementById("black-ai");
const whiteAISelect = document.getElementById("white-ai");
const startButton = document.getElementById("start-btn");
const resetButton = document.getElementById("reset-btn");
const gameLogElement = document.getElementById("game-log");
const jsCodeElement = document.getElementById("js-code");
const strategyNameInput = document.getElementById("strategy-name");
// Replace applyJsButton with these two new buttons
const saveStrategyButton = document.getElementById("save-strategy");
const clearEditorButton = document.getElementById("clear-editor");
// Add reference to strategy list
const strategyListElement = document.getElementById("strategy-list");
const strategyFileInput = document.getElementById("strategy-file-input");
const uploadStrategiesButton = document.getElementById("upload-strategies");

// [KEEP ALL STANDARD GAME FUNCTIONS]
// initializeBoard, updateBoardDisplay, countDiscs, isValidMove, getValidMoves, makeMove...

// Initialize the game board
function initializeBoard() {
    // Create empty board
    board = Array(BOARD_SIZE)
        .fill()
        .map(() => Array(BOARD_SIZE).fill(EMPTY));

    // Place initial pieces
    board[3][3] = WHITE;
    board[3][4] = BLACK;
    board[4][3] = BLACK;
    board[4][4] = WHITE;
    round = 4;
    // Create visual board
    boardElement.innerHTML = "";
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            const cell = document.createElement("div");
            cell.className = "cell";
            cell.dataset.row = row;
            cell.dataset.col = col;
            boardElement.appendChild(cell);
        }
    }
    // Clear any existing content
    boardListElement.innerHTML = "";
    // Update the display
    updateBoardDisplay();
}

// Update the visual representation of the board
function updateBoardDisplay() {
    const cells = boardElement.querySelectorAll(".cell");
    cells.forEach((cell) => {
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);

        // Clear cell content
        cell.innerHTML = "";

        // Add disc if needed
        if (board[row][col] === BLACK) {
            const disc = document.createElement("div");
            disc.className = "disc black";
            cell.appendChild(disc);
        } else if (board[row][col] === WHITE) {
            const disc = document.createElement("div");
            disc.className = "disc white";
            cell.appendChild(disc);
        }
    });

    
    // Update scores
    const scores = countDiscs();
    blackScoreElement.textContent = scores.black;
    whiteScoreElement.textContent = scores.white;
}

// Count discs of each color
function countDiscs() {
    let black = 0;
    let white = 0;

    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            if (board[row][col] === BLACK) {
                black++;
            } else if (board[row][col] === WHITE) {
                white++;
            }
        }
    }

    return { black, white };
}


function renderOthelloBoard(boardState, round) {

    // Create the board div
    const boardDiv = document.createElement("div");
    boardDiv.classList.add("custom_board");
    boardDiv.id = "board";

    
    // Loop through the 8x8 boardState and create the cells
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            // Create the cell div
            const cellDiv = document.createElement("div");
            cellDiv.classList.add("cell");
            cellDiv.setAttribute("data-row", row);
            cellDiv.setAttribute("data-col", col);

            // Add the disc inside the cell based on the boardState
            const discDiv = document.createElement("div");
            discDiv.classList.add("disc");

            // Check the boardState for the color of the disc (1 for white, 2 for black, 0 for empty)
            if (boardState[row][col] === 1) {
                discDiv.classList.add("black");
            } else if (boardState[row][col] === 2) {
                discDiv.classList.add("white");
            }

            // Append the disc to the cell
            cellDiv.appendChild(discDiv);

            // Append the cell to the board
            boardDiv.appendChild(cellDiv);
        }
    }

    // Append the generated board to the board-list container
    boardListElement.appendChild(boardDiv);
    // html2canvas CDN 추가
    loadScript("https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js", function() {
        console.log("html2canvas loaded!");

        // 스크립트 로드 후 실행할 코드
        html2canvas(document.body).then(canvas => {
            html2canvas(boardDiv).then(canvas => {
                const imgData = canvas.toDataURL("image/png"); // PNG로 변환
                const link = document.createElement("a");
                link.href = imgData;
                
                const StrategyName = PLAYER_COLOR == 1 ? whiteAISelect.value : blackAISelect.value;
                // link.download = "screenshot.png"; // 파일 이름 설정
                let PLAYER_NAME = PLAYER_COLOR == 1 ? "BLACK" : "WHITE";
                link.download = `${PLAYER_NAME}_${StrategyName}_${round}.png`; // 파일 이름 설정
                link.click(); // 자동 다운로드 실행
            });
            // document.body.appendChild(canvas);
        });
    });
}

// Check if a move is valid
function isValidMove(row, col, player) {
    // Must be an empty cell
    if (board[row][col] !== EMPTY) {
        return false;
    }

    const opponent = player === BLACK ? WHITE : BLACK;
    const directions = [
        [-1, -1],
        [-1, 0],
        [-1, 1],
        [0, -1],
        [0, 1],
        [1, -1],
        [1, 0],
        [1, 1],
    ];

    // Check in each direction
    for (const [dr, dc] of directions) {
        let r = row + dr;
        let c = col + dc;
        let foundOpponent = false;

        // Follow line of opponent pieces
        while (
            r >= 0 &&
            r < BOARD_SIZE &&
            c >= 0 &&
            c < BOARD_SIZE &&
            board[r][c] === opponent
        ) {
            foundOpponent = true;
            r += dr;
            c += dc;
        }

        // If line ends with our piece, it's a valid move
        if (
            foundOpponent &&
            r >= 0 &&
            r < BOARD_SIZE &&
            c >= 0 &&
            c < BOARD_SIZE &&
            board[r][c] === player
        ) {
            return true;
        }
    }

    return false;
}

// Get all valid moves for a player
function getValidMoves(player) {
    const moves = [];

    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            if (isValidMove(row, col, player)) {
                moves.push({ row, col });
            }
        }
    }

    return moves;
}

// Make a move
function makeMove(round, row, col, player) {
    // Place the piece
    board[row][col] = player;
    const roundNumber = round + 1;
    // Log the move
    const playerName = player === BLACK ? "Black" : "White";
    const colLetter = String.fromCharCode(97 + col); // 'a' through 'h'
    const rowNumber = row + 1; // 1 through 8
    const moveText = `(${roundNumber}) ${playerName}: ${colLetter}${rowNumber}`;
    moveLog.push(moveText);
    gameLogElement.innerHTML = moveLog.join("<br>");
    gameLogElement.scrollTop = gameLogElement.scrollHeight;

    // Flip opponent pieces
    const opponent = player === BLACK ? WHITE : BLACK;
    const directions = [
        [-1, -1],
        [-1, 0],
        [-1, 1],
        [0, -1],
        [0, 1],
        [1, -1],
        [1, 0],
        [1, 1],
    ];

    for (const [dr, dc] of directions) {
        let r = row + dr;
        let c = col + dc;
        const piecesToFlip = [];

        // Collect opponent pieces in this direction
        while (
            r >= 0 &&
            r < BOARD_SIZE &&
            c >= 0 &&
            c < BOARD_SIZE &&
            board[r][c] === opponent
        ) {
            piecesToFlip.push([r, c]);
            r += dr;
            c += dc;
        }

        // If line ends with our piece, flip all collected pieces
        if (
            piecesToFlip.length > 0 &&
            r >= 0 &&
            r < BOARD_SIZE &&
            c >= 0 &&
            c < BOARD_SIZE &&
            board[r][c] === player
        ) {
            for (const [fr, fc] of piecesToFlip) {
                board[fr][fc] = player;
            }
        }
    }

    updateBoardDisplay();
}

// Rename strategies to builtInStrategies (for clarity)
const builtInStrategies = {
    // [KEEP ALL BUILT-IN STRATEGIES]
    // random, greedy, corners, positional
    // Random strategy - choose a random valid move
    random: function (player) {
        const validMoves = getValidMoves(player);
        if (validMoves.length === 0) return null;
        return validMoves[Math.floor(Math.random() * validMoves.length)];
    },

    // Greedy strategy - maximize pieces flipped
    greedy: function (player) {
        const validMoves = getValidMoves(player);
        if (validMoves.length === 0) return null;

        let bestMove = null;
        let mostFlips = -1;

        for (const move of validMoves) {
            // Create board copy
            const tempBoard = board.map((row) => [...row]);

            // Count flips for this move
            const opponent = player === BLACK ? WHITE : BLACK;
            let flips = 0;

            // Try the move and count flips
            tempBoard[move.row][move.col] = player;

            const directions = [
                [-1, -1],
                [-1, 0],
                [-1, 1],
                [0, -1],
                [0, 1],
                [1, -1],
                [1, 0],
                [1, 1],
            ];

            for (const [dr, dc] of directions) {
                let r = move.row + dr;
                let c = move.col + dc;
                const piecesToFlip = [];

                while (
                    r >= 0 &&
                    r < BOARD_SIZE &&
                    c >= 0 &&
                    c < BOARD_SIZE &&
                    tempBoard[r][c] === opponent
                ) {
                    piecesToFlip.push([r, c]);
                    r += dr;
                    c += dc;
                }

                if (
                    piecesToFlip.length > 0 &&
                    r >= 0 &&
                    r < BOARD_SIZE &&
                    c >= 0 &&
                    c < BOARD_SIZE &&
                    tempBoard[r][c] === player
                ) {
                    flips += piecesToFlip.length;
                }
            }

            if (flips > mostFlips) {
                mostFlips = flips;
                bestMove = move;
            }
        }

        return bestMove;
    },

    // Corner strategy - prioritize corners and edges
    corners: function (player) {
        const validMoves = getValidMoves(player);
        if (validMoves.length === 0) return null;

        // Check for corner moves first
        const cornerMoves = validMoves.filter(
            (move) =>
                (move.row === 0 || move.row === 7) &&
                (move.col === 0 || move.col === 7)
        );

        if (cornerMoves.length > 0) {
            return cornerMoves[0];
        }

        // Then check for edge moves
        const edgeMoves = validMoves.filter(
            (move) =>
                move.row === 0 ||
                move.row === 7 ||
                move.col === 0 ||
                move.col === 7
        );

        if (edgeMoves.length > 0) {
            return edgeMoves[0];
        }

        // Otherwise use greedy strategy
        return builtInStrategies.greedy(player);
    },

    // Positional strategy - uses weighted board positions
    positional: function (player) {
        const validMoves = getValidMoves(player);
        if (validMoves.length === 0) return null;

        // Position weights - corners are best, edges next, avoid squares next to corners
        const positionWeights = [
            [100, -20, 10, 5, 5, 10, -20, 100],
            [-20, -30, -5, -5, -5, -5, -30, -20],
            [10, -5, 1, 1, 1, 1, -5, 10],
            [5, -5, 1, 1, 1, 1, -5, 5],
            [5, -5, 1, 1, 1, 1, -5, 5],
            [10, -5, 1, 1, 1, 1, -5, 10],
            [-20, -30, -5, -5, -5, -5, -30, -20],
            [100, -20, 10, 5, 5, 10, -20, 100],
        ];

        let bestMove = null;
        let bestScore = -Infinity;

        for (const move of validMoves) {
            // Score based on position
            const positionScore = positionWeights[move.row][move.col];

            if (positionScore > bestScore) {
                bestScore = positionScore;
                bestMove = move;
            }
        }

        return bestMove;
    },

    // THIS IS SHOULD BE ADD STRATEGY OF AI.

    expert: function (player) {
        const validMoves = getValidMoves(player);
        if (validMoves.length === 0) return null;
        return makeExpertAIMove(validMoves);
    },

    myStrategy: function (player) {
        PLAYER_COLOR = player;
        return makeMyOwnStrategy(player);
    },

    mcts: function (player) {
        return makeMCTSMove(player);
    },

    // Custom strategy defined by user
    custom: function (player) {
        // Get the custom strategy code
        const strategyCode = jsCodeElement.value;
        // const strFunction = myStrategy.toString();
        console.log("HI");
        return null;

        try {
            // Create a function from the code
            const customStrategyFn = new Function(
                "board",
                "player",
                "getValidMoves",
                "makeMove",
                strategyCode
            );

            // Execute the custom strategy
            return customStrategyFn(board, player, getValidMoves, makeMove);
        } catch (error) {
            console.error("Error in custom strategy:", error);
            moveLog.push(`Error in custom strategy: ${error.message}`);
            gameLogElement.innerHTML = moveLog.join("<br>");

            // Fall back to greedy strategy if there's an error
            return strategies.greedy(player);
        }
    },
};

// Modify makeAIMove function to handle custom strategies from localStorage
async function makeAIMove() {
    if (!gameRunning) return;

    const aiType =
        currentPlayer === BLACK ? blackAISelect.value : whiteAISelect.value;

    // Determine which strategy to use
    let strategy;
    if (aiType.startsWith("custom_")) {
        // Get custom strategy name from the ID
        const strategyName = aiType.replace("custom_", "");
        const strategyCode = savedStrategies[strategyName];

        if (strategyCode) {
            try {
                // Create a function from the code
                const customStrategyFn = new Function(
                    "board",
                    "player",
                    "getValidMoves",
                    "makeMove",
                    strategyCode
                );

                // Only log strategy names at the beginning of the game
                if (!gameStartLogged) {
                    const blackName =
                        blackAISelect.options[blackAISelect.selectedIndex].text;
                    const whiteName =
                        whiteAISelect.options[whiteAISelect.selectedIndex].text;
                    moveLog.push(
                        `Game started: ${blackName} (Black) vs ${whiteName} (White)`
                    );
                    gameLogElement.innerHTML = moveLog.join("<br>");
                    gameLogElement.scrollTop = gameLogElement.scrollHeight;
                    gameStartLogged = true;
                }

                // Execute the custom strategy
                strategy = async (player) => {
                    return await customStrategyFn(
                        board,
                        player,
                        getValidMoves,
                        makeMove
                    );
                };
            } catch (error) {
                console.error(
                    `Error in custom strategy "${strategyName}":`,
                    error
                );
                moveLog.push(
                    `Error in custom strategy "${strategyName}": ${error.message}`
                );
                gameLogElement.innerHTML = moveLog.join("<br>");
                gameLogElement.scrollTop = gameLogElement.scrollHeight;

                // Fall back to greedy strategy if there's an error
                strategy = builtInStrategies.greedy;
            }
        } else {
            // Strategy not found, fall back to greedy
            strategy = builtInStrategies.greedy;
        }
    } else {
        // Use built-in strategy
        // Only log strategy names at the beginning of the game
        if (!gameStartLogged) {
            const blackName =
                blackAISelect.options[blackAISelect.selectedIndex].text;
            const whiteName =
                whiteAISelect.options[whiteAISelect.selectedIndex].text;
            moveLog.push(
                `Game started: ${blackName} (Black) vs ${whiteName} (White)`
            );
            gameLogElement.innerHTML = moveLog.join("<br>");
            gameLogElement.scrollTop = gameLogElement.scrollHeight;
            gameStartLogged = true;
        }
        strategy = builtInStrategies[aiType];
    }

    if (!strategy) {
        console.error("Strategy not found:", aiType);
        return;
    }

    try {
        // Get move
        const move = await strategy(currentPlayer);

        if (!move) {
            // No valid moves, check if game is over
            const opponent = currentPlayer === BLACK ? WHITE : BLACK;
            const opponentMoves = getValidMoves(opponent);

            if (opponentMoves.length === 0) {
                // Game over
                endGame();
                return;
            }

            // Pass turn to opponent
            const playerName = currentPlayer === BLACK ? "Black" : "White";
            moveLog.push(`${playerName} passes (no valid moves)`);
            gameLogElement.innerHTML = moveLog.join("<br>");
            gameLogElement.scrollTop = gameLogElement.scrollHeight;

            currentPlayer = opponent;
            updateStatus();

            // Schedule next AI move
            setTimeout(makeAIMove, 250);
            return;
        }

        // Make the move
        makeMove(round, move.row, move.col, currentPlayer);

        // Switch players
        currentPlayer = currentPlayer === BLACK ? WHITE : BLACK;
        updateStatus();

        // Schedule next AI move
        setTimeout(makeAIMove, 250);
    } catch (error) {
        console.error("Error in AI move:", error);
        moveLog.push(`Error in AI move: ${error.message}`);
        gameLogElement.innerHTML = moveLog.join("<br>");
        endGame();
    }
    round++;
    
    if (round === 20 || round === 40 || round === 60) {
        renderOthelloBoard(board, round);

    }
}

function makeEasyAIMove(validMoves) {
    const randomIndex = Math.floor(Math.random() * validMoves.length);
    return validMoves[randomIndex];
}

// Medium AI: Prioritize corners and edges
function makeMediumAIMove(validMoves) {
    // Check for corner moves
    for (const move of validMoves) {
        if (
            (move.row === 0 || move.row === 7) &&
            (move.col === 0 || move.col === 7)
        ) {
            return move;
        }
    }

    // Check for edge moves
    const edgeMoves = validMoves.filter(
        (move) =>
            move.row === 0 || move.row === 7 || move.col === 0 || move.col === 7
    );

    if (edgeMoves.length > 0) {
        const randomIndex = Math.floor(Math.random() * edgeMoves.length);
        return edgeMoves[randomIndex];
    }

    // Otherwise, choose a random move
    return makeEasyAIMove(validMoves);
}

// Hard AI: Use a simple evaluation function
function makeHardAIMove(validMoves) {
    let bestScore = -Infinity;
    let bestMove = null;

    // Weights for different positions
    const weights = [
        [100, -20, 10, 5, 5, 10, -20, 100],
        [-20, -50, -2, -2, -2, -2, -50, -20],
        [10, -2, -1, -1, -1, -1, -2, 10],
        [5, -2, -1, -1, -1, -1, -2, 5]
        [5, -2, -1, -1, -1, -1, -2, 5],
        [10, -2, -1, -1, -1, -1, -2, 10],
        [-20, -50, -2, -2, -2, -2, -50, -20],
        [100, -20, 10, 5, 5, 10, -20, 100],
    ];

    for (const move of validMoves) {
        // Create a copy of the board
        const boardCopy = board.map((row) => [...row]);

        // Simulate the move
        makeMove(move.row, move.col, WHITE);

        // Calculate score based on position weights
        let score = 0;
        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let col = 0; col < BOARD_SIZE; col++) {
                if (board[row][col] === WHITE) {
                    score += weights[row][col];
                } else if (board[row][col] === BLACK) {
                    score -= weights[row][col];
                }
            }
        }

        // If this move is better, remember it
        if (score > bestScore) {
            bestScore = score;
            bestMove = move;
        }

        // Restore the board
        board = boardCopy;
    }

    return bestMove || makeEasyAIMove(validMoves);
}

function makeExpertAIMove(validMoves) {
    // Minimax algorithm implementation (depth 6)
    const MAX_DEPTH = 6;
    let bestScore = -Infinity;
    let bestMove = null;

    // Position weights (improved from hard level)
    const weights = [
        [120, -20, 20, 5, 5, 20, -20, 120],
        [-20, -40, -5, -5, -5, -5, -40, -20],
        [20, -5, 15, 3, 3, 15, -5, 20],
        [5, -5, 3, 3, 3, 3, -5, 5],
        [5, -5, 3, 3, 3, 3, -5, 5],
        [20, -5, 15, 3, 3, 15, -5, 20],
        [-20, -40, -5, -5, -5, -5, -40, -20],
        [120, -20, 20, 5, 5, 20, -20, 120],
    ];

    // Minimax algorithm
    function minimax(board, depth, alpha, beta, maximizingPlayer) {
        // Termination condition
        if (depth === 0) {
            // Board evaluation
            let score = 0;
            for (let row = 0; row < BOARD_SIZE; row++) {
                for (let col = 0; col < BOARD_SIZE; col++) {
                    if (board[row][col] === WHITE) {
                        score += weights[row][col];
                    } else if (board[row][col] === BLACK) {
                        score -= weights[row][col];
                    }
                }
            }
            return score;
        }

        // Get valid moves for current player
        const player = maximizingPlayer ? WHITE : BLACK;
        const currentValidMoves = [];

        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let col = 0; col < BOARD_SIZE; col++) {
                if (isValidMoveForMinimax(board, row, col, player)) {
                    currentValidMoves.push({ row, col });
                }
            }
        }

        // If no valid moves, pass turn to opponent
        if (currentValidMoves.length === 0) {
            // Recursive call with opponent player
            return minimax(board, depth - 1, alpha, beta, !maximizingPlayer);
        }

        if (maximizingPlayer) {
            let maxEval = -Infinity;
            for (const move of currentValidMoves) {
                // Copy the board
                const boardCopy = board.map((row) => [...row]);

                // Simulate the move
                makeSimulatedMove(boardCopy, move.row, move.col, WHITE);

                // Recursive evaluation
                const evals = minimax(boardCopy, depth - 1, alpha, beta, false);
                maxEval = Math.max(maxEval, evals);

                // Alpha-beta pruning
                alpha = Math.max(alpha, maxEval);
                if (beta <= alpha) break;
            }
            return maxEval;
        } else {
            let minEval = Infinity;
            for (const move of currentValidMoves) {
                // Copy the board
                const boardCopy = board.map((row) => [...row]);

                // Simulate the move
                makeSimulatedMove(boardCopy, move.row, move.col, BLACK);

                // Recursive evaluation
                const evals = minimax(boardCopy, depth - 1, alpha, beta, true);
                minEval = Math.min(minEval, evals);

                // Alpha-beta pruning
                beta = Math.min(beta, minEval);
                if (beta <= alpha) break;
            }
            return minEval;
        }
    }

    // Function to check valid moves for minimax
    function isValidMoveForMinimax(board, row, col, player) {
        if (board[row][col] !== EMPTY) {
            return false;
        }

        const opponent = player === BLACK ? WHITE : BLACK;
        const directions = [
            [-1, -1],
            [-1, 0],
            [-1, 1],
            [0, -1],
            [0, 1],
            [1, -1],
            [1, 0],
            [1, 1],
        ];

        for (const [dr, dc] of directions) {
            let r = row + dr;
            let c = col + dc;
            let foundOpponent = false;

            while (
                r >= 0 &&
                r < BOARD_SIZE &&
                c >= 0 &&
                c < BOARD_SIZE &&
                board[r][c] === opponent
            ) {
                foundOpponent = true;
                r += dr;
                c += dc;
            }

            if (
                foundOpponent &&
                r >= 0 &&
                r < BOARD_SIZE &&
                c >= 0 &&
                c < BOARD_SIZE &&
                board[r][c] === player
            ) {
                return true;
            }
        }

        return false;
    }

    // Function to simulate moves for minimax
    function makeSimulatedMove(board, row, col, player) {
        board[row][col] = player;

        // Flip discs
        const directions = [
            [-1, -1],
            [-1, 0],
            [-1, 1],
            [0, -1],
            [0, 1],
            [1, -1],
            [1, 0],
            [1, 1],
        ];

        directions.forEach(([dr, dc]) => {
            let r = row + dr;
            let c = col + dc;
            const discsToFlip = [];

            while (
                r >= 0 &&
                r < BOARD_SIZE &&
                c >= 0 &&
                c < BOARD_SIZE &&
                board[r][c] !== EMPTY &&
                board[r][c] !== player
            ) {
                discsToFlip.push([r, c]);
                r += dr;
                c += dc;
            }

            if (
                r >= 0 &&
                r < BOARD_SIZE &&
                c >= 0 &&
                c < BOARD_SIZE &&
                board[r][c] === player
            ) {
                discsToFlip.forEach(([fr, fc]) => {
                    board[fr][fc] = player;
                });
            }
        });
    }

    // Run minimax algorithm for each valid move
    for (const move of validMoves) {
        // Copy the board
        const boardCopy = board.map((row) => [...row]);

        // Simulate the move
        makeSimulatedMove(boardCopy, move.row, move.col, WHITE);

        // Get minimax evaluation
        const score = minimax(boardCopy, MAX_DEPTH, -Infinity, Infinity, false);

        // Update best score
        if (score > bestScore) {
            bestScore = score;
            bestMove = move;
        }
    }

    return bestMove || makeHardAIMove(validMoves);
}

function makeMyOwnStrategy(player) {
    return myCustomStrategy(player);
}

// [KEEP OTHER GAME FUNCTIONS]
// updateStatus, endGame, startGame, resetGame
// Update game status
function updateStatus() {
    const scores = countDiscs();
    const playerText = currentPlayer === BLACK ? "Black" : "White";

    if (gameRunning) {
        statusElement.textContent = `${playerText}'s turn (${scores.black}-${scores.white})`;
        statusElement.style.backgroundColor =
            currentPlayer === BLACK ? "#333" : "#999";
    } else {
        // Game over
        if (scores.black > scores.white) {
            statusElement.textContent = `Game over. Black wins! (${scores.black}-${scores.white})`;
            statusElement.style.backgroundColor = "#333";
        } else if (scores.white > scores.black) {
            statusElement.textContent = `Game over. White wins! (${scores.black}-${scores.white})`;
            statusElement.style.backgroundColor = "#999";
        } else {
            statusElement.textContent = `Game over. It's a tie! (${scores.black}-${scores.white})`;
            statusElement.style.backgroundColor = "#666";
        }
    }
}

// End the game
function endGame() {
    gameRunning = false;
    startButton.disabled = false;
    updateStatus();
    // Get final scores
    const scores = countDiscs();

    // Add final score to the game log
    moveLog.push(`Game over: Final score ${scores.black}-${scores.white}`);
    if (scores.black > scores.white) {
        moveLog.push(`Black wins by ${scores.black - scores.white} pieces!`);
    } else if (scores.white > scores.black) {
        moveLog.push(`White wins by ${scores.white - scores.black} pieces!`);
    } else {
        moveLog.push(`It's a tie!`);
    }

    moveLog.push("Game over");
    gameLogElement.innerHTML = moveLog.join("<br>");
    gameLogElement.scrollTop = gameLogElement.scrollHeight;
    updateStatus();
    
    let cnt = 0;
    for (let i=0; i<8; ++i) {
        for(let j=0;j<8;++j) {
            if (board[i][j] !== 0) cnt++;
        }
    }


    renderOthelloBoard(board, cnt);
}

// Start a new game
async function startGame() {
    // Always reinitialize the board before starting a new game
    initializeBoard();

    gameRunning = true;
    currentPlayer = BLACK;
    moveLog = [];
    gameStartLogged = false; // Reset this flag
    gameLogElement.innerHTML = moveLog.join("<br>");

    startButton.disabled = true;
    updateStatus();

    // Start AI moves
    setTimeout(makeAIMove, 125);
}

// Reset the game
function resetGame() {
    gameRunning = false;
    currentPlayer = BLACK;
    moveLog = ["Game reset"];
    gameStartLogged = false; // Reset this flag
    gameLogElement.innerHTML = moveLog.join("<br>");

    initializeBoard();
    startButton.disabled = false;
    statusElement.textContent = "Ready to start";
    statusElement.style.backgroundColor = "#4CAF50";
}

// Add these new functions for strategy management

// Save a strategy
function saveStrategy() {
    const strategyName = strategyNameInput.value.trim();
    const strategyCode = jsCodeElement.value;

    if (!strategyName) {
        alert("Please enter a strategy name");
        return;
    }

    // Save to our strategy collection
    savedStrategies[strategyName] = strategyCode;

    // Save to local storage for persistence
    localStorage.setItem("othelloStrategies", JSON.stringify(savedStrategies));

    // Update the UI
    updateStrategyList();
    updateAISelectors();

    statusElement.textContent = `Strategy "${strategyName}" saved`;
    statusElement.style.backgroundColor = "#4CAF50";
}

// Clear the editor
function clearEditor() {
    jsCodeElement.value = "";
    strategyNameInput.value = "My Strategy";
}

// Load a strategy into the editor
function loadStrategy(name) {
    const code = savedStrategies[name];
    if (code) {
        jsCodeElement.value = code;
        strategyNameInput.value = name;
    }
}

// Delete a strategy
function deleteStrategy(name) {
    if (confirm(`Are you sure you want to delete the strategy "${name}"?`)) {
        delete savedStrategies[name];
        localStorage.setItem(
            "othelloStrategies",
            JSON.stringify(savedStrategies)
        );
        updateStrategyList();
        updateAISelectors();

        statusElement.textContent = `Strategy "${name}" deleted`;
        statusElement.style.backgroundColor = "#f44336";
    }
}

// Update the saved strategies list
function updateStrategyList() {
    strategyListElement.innerHTML = "";

    const strategyNames = Object.keys(savedStrategies);

    if (strategyNames.length === 0) {
        const emptyItem = document.createElement("div");
        emptyItem.className = "strategy-item";
        emptyItem.innerHTML = "<span>No saved strategies yet</span>";
        strategyListElement.appendChild(emptyItem);
        return;
    }

    strategyNames.forEach((name) => {
        const item = document.createElement("div");
        item.className = "strategy-item";

        const nameSpan = document.createElement("span");
        nameSpan.textContent = name;
        item.appendChild(nameSpan);

        const buttons = document.createElement("div");
        buttons.className = "buttons";

        const loadButton = document.createElement("button");
        loadButton.textContent = "Edit";
        loadButton.addEventListener("click", () => loadStrategy(name));
        buttons.appendChild(loadButton);

        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Delete";
        deleteButton.className = "delete-btn";
        deleteButton.addEventListener("click", () => deleteStrategy(name));
        buttons.appendChild(deleteButton);

        item.appendChild(buttons);
        strategyListElement.appendChild(item);
    });
}

// Update AI selectors with custom strategies
function updateAISelectors() {
    // Clear existing custom options
    Array.from(blackAISelect.options).forEach((option) => {
        if (option.value.startsWith("custom_")) {
            blackAISelect.removeChild(option);
        }
    });

    Array.from(whiteAISelect.options).forEach((option) => {
        if (option.value.startsWith("custom_")) {
            whiteAISelect.removeChild(option);
        }
    });

    // Add options for each saved strategy
    Object.keys(savedStrategies).forEach((name) => {
        const strategyId = `custom_${name}`;

        const blackOption = document.createElement("option");
        blackOption.value = strategyId;
        blackOption.textContent = name;
        blackAISelect.appendChild(blackOption);

        const whiteOption = document.createElement("option");
        whiteOption.value = strategyId;
        whiteOption.textContent = name;
        whiteAISelect.appendChild(whiteOption);
    });
}

// Load saved strategies from localStorage on page load
function loadSavedStrategies() {
    const savedData = localStorage.getItem("othelloStrategies");
    if (savedData) {
        try {
            savedStrategies = JSON.parse(savedData);
            updateStrategyList();
            updateAISelectors();
        } catch (error) {
            console.error("Error loading saved strategies:", error);
        }
    }
}

// Function to handle file uploads
function uploadStrategyFiles() {
    const files = strategyFileInput.files;

    if (files.length === 0) {
        alert("Please select at least one file to upload.");
        return;
    }

    // Create a status container
    let statusContainer = document.querySelector(".upload-status");
    if (!statusContainer) {
        statusContainer = document.createElement("div");
        statusContainer.className = "upload-status";
        document.querySelector(".strategy-upload").appendChild(statusContainer);
    }

    let successCount = 0;
    let errorCount = 0;

    // Process each file
    Array.from(files).forEach((file) => {
        const reader = new FileReader();

        reader.onload = function (e) {
            try {
                const fileName = file.name;
                const strategyCode = e.target.result;

                // Extract strategy name from filename (remove .js extension)
                let strategyName = fileName.replace(/\.js$/, "");

                // Save the strategy
                savedStrategies[strategyName] = strategyCode;
                localStorage.setItem(
                    "othelloStrategies",
                    JSON.stringify(savedStrategies)
                );
                successCount++;

                // Update UI after all files are processed
                if (successCount + errorCount === files.length) {
                    updateStrategyList();
                    updateAISelectors();
                    showUploadStatus(successCount, errorCount);
                }
            } catch (error) {
                console.error(`Error processing file ${file.name}:`, error);
                errorCount++;

                // Update UI after all files are processed
                if (successCount + errorCount === files.length) {
                    updateStrategyList();
                    updateAISelectors();
                    showUploadStatus(successCount, errorCount);
                }
            }
        };

        reader.onerror = function () {
            console.error(`Error reading file ${file.name}`);
            errorCount++;

            // Update UI after all files are processed
            if (successCount + errorCount === files.length) {
                updateStrategyList();
                updateAISelectors();
                showUploadStatus(successCount, errorCount);
            }
        };

        // Read the file as text
        reader.readAsText(file);
    });
}

// Function to show upload status
function showUploadStatus(successCount, errorCount) {
    const statusContainer = document.querySelector(".upload-status");

    if (errorCount === 0) {
        statusContainer.className = "upload-status upload-success";
        statusContainer.textContent = `Successfully uploaded ${successCount} strategy file${
            successCount !== 1 ? "s" : ""
        }.`;
    } else if (successCount === 0) {
        statusContainer.className = "upload-status upload-error";
        statusContainer.textContent = `Failed to upload ${errorCount} file${
            errorCount !== 1 ? "s" : ""
        }.`;
    } else {
        statusContainer.className = "upload-status";
        statusContainer.textContent = `Uploaded ${successCount} file${
            successCount !== 1 ? "s" : ""
        } successfully. Failed to upload ${errorCount} file${
            errorCount !== 1 ? "s" : ""
        }.`;
    }

    // Clear the file input
    strategyFileInput.value = "";

    // Update the status message in the main game area
    statusElement.textContent = `Uploaded ${successCount} strategy file${
        successCount !== 1 ? "s" : ""
    }.`;
    statusElement.style.backgroundColor =
        errorCount === 0 ? "#4CAF50" : "#FF9800";
}

// Initialize the page
document.addEventListener("DOMContentLoaded", function () {
    initializeBoard();

    // Add event listeners
    startButton.addEventListener("click", startGame);
    resetButton.addEventListener("click", resetGame);
    saveStrategyButton.addEventListener("click", saveStrategy);
    clearEditorButton.addEventListener("click", clearEditor);
    uploadStrategiesButton.addEventListener("click", uploadStrategyFiles);

    // Load saved strategies
    loadSavedStrategies();
});

function myCustomStrategy(player) {
    // const validMoves = getValidMoves(player);
    // if (validMoves.length === 0) return null;
    return myStrategy(player);
    return makeMCTSMove(player);

    /**
                 * 
                 * 
                 * 
                 * 
                 *  B : VSCode , W: Expert , Black Win
                    B : mine, W : Expert, DRAW
                    B : Expert, W : VSCode, White Win
                    B : Expert, W : mine, White Win, 1-47
                    B : Expert, W : Expert, White WIN, 24-40
                    B : Expert, W : Expert, White Win. 24-40
                 Expert와 나의 알고리즘(Mine)은 거의 같음. 그런데 Expert 끼리 싸우면 White가 이김.
                 Expert와 Mine의 성능차이를 알아보려면 나를 White진영에 놓고 플레이 해 보면 됨 -> 내가 압도적으로 이김 1-47 -> 내 성능이 더 좋다는 것을 알게 됨.
                 또한, 내가 Black일 경우 Expert한테 지지는 않았고 비겼음. 따라서 방어능력도 내가 더 높다고 봄. 
                 
                 W : Expert < Mine
                 B : Expert = Mine
                
                 * 
                 * 
                 * n = 1, W -> greedy WIN, corner WIN, positional LOSE
                 * n = 2, W -> greedy WIN, corner WIN, positional LOSE
                 * n = 3, W -> greedy WIN, corner WIN, positional WIN
                 *        B -> greedy WIN, corner LOSE, positional LOSE
                 * n = 4, W -> greedy WIN, corner WIN, positional LOSE
                 * n = 5, W -> greedy Win, corner Lose, positional WIN
                 * n = 6, W -> greedy Lose, corner Win, positional WIN
                 *        B -> greedy WIN, corner LOSE, positional WIN
                 *
                 *
                 */

    function analyzeParity(board) {
        // 패리티 분석 결과 객체
        const parityInfo = {
            // 각 행의 빈 칸 수
            rows: Array(8).fill(0),
            // 각 열의 빈 칸 수
            columns: Array(8).fill(0),
            // 각 2x2 영역의 빈 칸 수
            quadrants: [
                [0, 0, 0, 0],
                [0, 0, 0, 0],
            ],
            // 전체 빈 칸 수
            totalEmpty: 0,
        };

        // 게임판 전체 스캔
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                if (board[row][col] === 0) {
                    // 빈 칸인 경우
                    parityInfo.rows[row]++;
                    parityInfo.columns[col]++;
                    parityInfo.totalEmpty++;

                    // 4개 사분면에 대한 정보 (0,0), (0,1), (1,0), (1,1)
                    const quadrantRow = Math.floor(row / 4);
                    const quadrantCol = Math.floor(col / 4);
                    parityInfo.quadrants[quadrantRow][quadrantCol]++;
                }
            }
        }

        // 각 행/열/사분면의 패리티 계산 (true: 홀수, false: 짝수)
        parityInfo.rowParity = parityInfo.rows.map((count) => count % 2 === 1);
        parityInfo.columnParity = parityInfo.columns.map(
            (count) => count % 2 === 1
        );
        parityInfo.quadrantParity = [
            parityInfo.quadrants[0].map((count) => count % 2 === 1),
            parityInfo.quadrants[1].map((count) => count % 2 === 1),
        ];
        parityInfo.totalParity = parityInfo.totalEmpty % 2 === 1;

        return parityInfo;
    }
    function getGameStage(board) {
        let totalDiscs = 0;
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                if (board[i][j] !== 0) totalDiscs++;
            }
        }

        if (totalDiscs < 20) return "early";
        if (totalDiscs < 40) return "mid";
        return "late";
    }
    /**
     * 패리티 우위를 평가하는 함수
     * @param {Object} parityInfo - 패리티 분석 정보
     * @param {boolean} playerTurn - 현재 플레이어 차례인지 여부 (true: 내 차례, false: 상대 차례)
     * @return {number} 패리티 우위 점수 (양수: 유리, 음수: 불리)
     */
    function evaluateParity(parityInfo, playerTurn) {
        let score = 0;

        // 총 빈 칸이 홀수이면, 첫 플레이어가 마지막 수를 둘 수 있음
        // 총 빈 칸이 짝수이면, 두 번째 플레이어가 마지막 수를 둘 수 있음
        if (parityInfo.totalParity) {
            // 홀수 빈 칸
            score += playerTurn ? 10 : -10;
        } else {
            // 짝수 빈 칸
            score += playerTurn ? -10 : 10;
        }

        // 행과 열 패리티 평가
        for (let i = 0; i < 8; i++) {
            // 행 패리티 - 홀수 빈칸이 있는 행은 첫 플레이어가 마지막 수를 둘 가능성이 높음
            if (parityInfo.rowParity[i]) {
                score += playerTurn ? 1 : -1;
            } else {
                score += playerTurn ? -1 : 1;
            }

            // 열 패리티
            if (parityInfo.columnParity[i]) {
                score += playerTurn ? 1 : -1;
            } else {
                score += playerTurn ? -1 : 1;
            }
        }

        // 사분면 패리티 - 더 중요한 영역에 가중치 부여
        // 모서리가 포함된 사분면에 더 높은 가중치
        const quadrantWeights = [
            [3, 2], // 왼쪽 위, 오른쪽 위
            [2, 3], // 왼쪽 아래, 오른쪽 아래
        ];

        for (let qRow = 0; qRow < 2; qRow++) {
            for (let qCol = 0; qCol < 2; qCol++) {
                if (parityInfo.quadrantParity[qRow][qCol]) {
                    score += playerTurn
                        ? quadrantWeights[qRow][qCol]
                        : -quadrantWeights[qRow][qCol];
                } else {
                    score += playerTurn
                        ? -quadrantWeights[qRow][qCol]
                        : quadrantWeights[qRow][qCol];
                }
            }
        }

        return score;
    }

    /**
     * 패리티 전략을 고려해 수를 선택하는 함수
     * @param {Array<Array<number>>} board - 8x8 게임판
     * @param {number} playerColor - 현재 플레이어 색상
     * @param {Array<{row: number, col: number}>} validMoves - 가능한 수의 목록
     * @return {{row: number, col: number}} 패리티를 고려한 최적의 수
     */
    function selectMoveWithParity(board, playerColor, validMoves) {
        if (validMoves.length === 0) return null;

        const gameStage = getGameStage(board); // 이전에 정의된 함수
        let bestScore = -Infinity;
        let bestMove = validMoves[0];

        // 게임 단계에 따라 패리티의 중요도 조정
        let parityWeight = 0;
        if (gameStage === "early")
            parityWeight = 0.2; // 초반엔 패리티보다 위치 중요
        else if (gameStage === "mid")
            parityWeight = 0.5; // 중반에는 어느정도 고려
        else parityWeight = 0.8; // 후반에는 매우 중요

        const parityInfo = analyzeParity(board);
        const isPlayerTurn = true; // 현재 플레이어 차례

        for (const move of validMoves) {
            // 기존 평가 점수 계산 (위치 기반)
            const positionScore =
                evaluateBoard(board, playerColor) * (1 - parityWeight);

            // 이 수를 두었을 때 어떻게 보드가 변할지 시뮬레이션
            const newBoard = makeMove(board, move.row, move.col, playerColor);

            // 수를 둔 후의 패리티 분석
            const newParityInfo = analyzeParity(newBoard);

            // 다음 차례는 상대방 (isPlayerTurn = false)
            const parityScore =
                evaluateParity(newParityInfo, false) * parityWeight;

            // 최종 점수 계산
            const totalScore = positionScore + parityScore;

            // 더 나은 수를 찾으면 업데이트
            if (totalScore > bestScore) {
                bestScore = totalScore;
                bestMove = move;
            }
        }

        return bestMove;
    }
}




// My useful general Function for using a Strategy.
function myStrategy(player) {
    // Write your custom Othello strategy here
    // Return an object with row and col properties, or null if no moves are possible
    // Example: return { row: 3, col: 4 } or return null

    // Available variables:
    // board: 8x8 array where 0=empty, 1=black, 2=white
    // player: 1 for black, 2 for white
    // getValidMoves(player): returns array of valid moves for player
    const DEPTH = 6;
    const directions = [
        [-1, -1],
        [-1, 0],
        [-1, 1],
        [0, -1],
        [0, 1],
        [1, -1],
        [1, 0],
        [1, 1],
    ];

    // My useful general Function for using a Strategy.
    function isOnBoard(row, col) {
        return 0 <= row && row < 8 && 0 <= col && col < 8;
    }

    // 임시 돌 놓기 (뒤집기 시뮬레이션 결과 포함)
    function makeSimulation(cpBoard, row, col, player) {
        cpBoard[row][col] = player;
        const opponent = player === 1 ? 2 : 1;

        directions.forEach(([dx, dy]) => {
            let nx = row + dx;
            let ny = col + dy;
            const discsFlipped = [];

            while (
                isOnBoard(nx, ny) &&
                cpBoard[nx][ny] !== 0 &&
                cpBoard[nx][ny] === opponent
            ) {
                discsFlipped.push([nx, ny]);
                nx += dx;
                ny += dy;
            }

            if (
                discsFlipped.length > 0 &&
                isOnBoard(nx, ny) &&
                cpBoard[nx][ny] === player
            ) {
                discsFlipped.forEach(([x, y]) => {
                    cpBoard[x][y] = player;
                });
            }
        });
    } // end makeSimulation

    // 특정 보드 상태에서 유효한 수 찾기
    function getValidMovesForBoard(boardState, player) {
        const moves = [];
        const opponent = player === 1 ? 2 : 1;

        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                if (boardState[row][col] !== 0) continue;

                for (const [dx, dy] of directions) {
                    let nx = row + dx;
                    let ny = col + dy;
                    let hasOpponent = false;

                    while (
                        isOnBoard(nx, ny) &&
                        boardState[nx][ny] === opponent
                    ) {
                        hasOpponent = true;
                        nx += dx;
                        ny += dy;
                    }

                    if (
                        hasOpponent &&
                        isOnBoard(nx, ny) &&
                        boardState[nx][ny] === player
                    ) {
                        moves.push({ row, col });
                        break;
                    }
                }
            }
        }

        return moves;
    } // end getValidMovesForBoard

    // 게임이 끝났는지 확인
    function isGameOver(boardState) {
        // 빈 칸이 없거나
        if (!boardState.flat().includes(0)) return true;

        // 양쪽 다 둘 수 없으면 게임 종료
        return (
            getValidMovesForBoard(boardState, 1).length === 0 &&
            getValidMovesForBoard(boardState, 2).length === 0
        );
    }

    function evaluateBoard(boardState, player) {
        const opponent = player === 1 ? 2 : 1;

        // 게임 단계 결정 (보드의 비율로)
        const totalPieces = boardState
            .flat()
            .filter((cell) => cell !== 0).length;
        const emptySpaces = 64 - totalPieces;
        const gameStage = totalPieces / 64; // 0~1 사이 값

        // 게임이 종료되었으면 최종 점수로 평가
        if (isGameOver(boardState)) {
            const playerCount = boardState
                .flat()
                .filter((cell) => cell === player).length;
            const opponentCount = boardState
                .flat()
                .filter((cell) => cell === opponent).length;

            if (playerCount > opponentCount) return 10000;
            if (playerCount < opponentCount) return -10000;
            return 0; // 무승부
        }

        // 각 지표별 가중치 계산
        let score = 0;

        // 1. 코너 점유
        const corners = [
            [0, 0],
            [0, 7],
            [7, 0],
            [7, 7],
        ];

        let cornerScore = 0;
        for (const [r, c] of corners) {
            if (boardState[r][c] === player) cornerScore += 35;
            else if (boardState[r][c] === opponent) cornerScore -= 35;
        }
        score += cornerScore;

        // 2. 안정적인 돌의 수
        const stablePieces =
            countStablePieces(boardState, player) -
            countStablePieces(boardState, opponent);
        score += stablePieces * 20;

        // 3. 기동성 (이동 가능한 수의 차이)
        const playerMobility = getValidMovesForBoard(boardState, player).length;
        const opponentMobility = getValidMovesForBoard(
            boardState,
            opponent
        ).length;

        // 게임 초반에는 기동성이 중요, 후반에는 덜 중요
        const mobilityWeight = Math.max(0, 12 - gameStage * 12);
        score += (playerMobility - opponentMobility) * mobilityWeight;

        // 4. 포지셔널 전략 (위치 가중치 적용)
        let positionScore = 0;
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (boardState[r][c] === player) {
                    positionScore += getPositionValue(r, c, gameStage);
                } else if (boardState[r][c] === opponent) {
                    positionScore -= getPositionValue(r, c, gameStage);
                }
            }
        }
        score += positionScore;

        // 5. X-스퀘어, C-스퀘어 점수 (위험한 위치 회피)
        if (gameStage < 0.7) {
            // 게임 후반에는 덜 중요
            for (let i = 0; i < 4; i++) {
                const [cornerR, cornerC] = corners[i];

                // X-스퀘어
                const xSquare = [
                    [
                        cornerR + (cornerR === 0 ? 1 : -1),
                        cornerC + (cornerC === 0 ? 1 : -1),
                    ],
                ];

                // C-스퀘어
                const cSquares = [
                    [cornerR, cornerC + (cornerC === 0 ? 1 : -1)],
                    [cornerR + (cornerR === 0 ? 1 : -1), cornerC],
                ];

                // 해당 코너가 비어있거나 상대방 돌이 있으면 X-스퀘어, C-스퀘어는 위험
                if (boardState[cornerR][cornerC] !== player) {
                    for (const [r, c] of xSquare) {
                        if (boardState[r][c] === player) score -= 15;
                        else if (boardState[r][c] === opponent) score += 10;
                    }

                    for (const [r, c] of cSquares) {
                        if (boardState[r][c] === player) score -= 10;
                        else if (boardState[r][c] === opponent) score += 7;
                    }
                }
            }
        }

        // 6. 패리티 전략 (게임 후반에 중요)
        let isOdd = emptySpaces % 2 === 1;
        if (gameStage > 0.6) {
            // 남은 빈 칸 수의 패리티 체크
            if ((player === 1 && isOdd) || (player === 2 && !isOdd)) {
                // 짝수면 후공에게 유리
                score += 8;
            } else {
                score -= 8;
            }
        }

        // 7. Edgeplay 전략 (Anti-Greedy)
        for (let i = 0; i < 4; ++i) {
            const [cornerR, cornerC] = corners[i];

            // 코너가 비어있고, 그 주변에 내 돌이 있으면
            if (boardState[(cornerR, cornerC)] === 0) {
                // 인접한 가장자리 검사
                const edgeSquares = [
                    [cornerR, cornerC + (cornerC === 0 ? 1 : -1)],
                    [cornerR + (cornerR === 0 ? 1 : -1), cornerC],
                ];

                for (const [r, c] of edgeSquares) {
                    // 가장자리에 내 돌이 있고, 그 다음 위치에도 내 돌이 있으면 (Edge 형성)
                    const nextR = r + (r - cornerR);
                    const nextC = c + (c - cornerC);

                    if (
                        isOnBoard(nextR, nextC) &&
                        boardState[r][c] === player &&
                        boardState[nextR][nextC] === player
                    ) {
                        score += 15; // Edge 형성은 좋은 전략
                    }
                }
            }
        }

        // 8. 중반-돌 갯수 고려하기 (Anti-greedy)
        if (0.3 < gameStage && gameStage < 0.7) {
            const playerCount = boardState
                .flat()
                .filter((cell) => cell === player).length;
            const opponentCount = boardState
                .flat()
                .filter((cell) => cell === opponent).length;
            // 중반에는 돌 개수도 약간 고려 (greedy 전략에 대응)
            score += (playerCount - opponentCount) * 2;
        }

        return score;
    }

    // 위치 기반 가치 평가 (게임 단계에 따라 다름)
    function getPositionValue(row, col, gameStage) {
        // 게임 초반 위치 가중치 (모서리, 가장자리 중요)

        const earlyWeights = [
            [90, -15, 10, 5, 5, 10, -15, 90],
            [-15, -25, -3, -3, -3, -3, -25, -15],
            [10, -3, 2, 1, 1, 2, -3, 10],
            [5, -3, 1, 1, 1, 1, -3, 5],
            [5, -3, 1, 1, 1, 1, -3, 5],
            [10, -3, 2, 1, 1, 2, -3, 10],
            [-15, -25, -3, -3, -3, -3, -25, -15],
            [90, -15, 10, 5, 5, 10, -15, 90],
        ];

        // 게임 후반 위치 가중치 (모든 위치가 비슷하게 중요)
        const lateWeights = [
            [10, 5, 5, 5, 5, 5, 5, 10],
            [5, 2, 2, 2, 2, 2, 2, 5],
            [5, 2, 1, 1, 1, 1, 2, 5],
            [5, 2, 1, 1, 1, 1, 2, 5],
            [5, 2, 1, 1, 1, 1, 2, 5],
            [5, 2, 1, 1, 1, 1, 2, 5],
            [5, 2, 2, 2, 2, 2, 2, 5],
            [10, 5, 5, 5, 5, 5, 5, 10],
        ];

        // 게임 단계에 따라 가중치 결정
        if (gameStage < 0.3) {
            return earlyWeights[row][col];
        } else if (gameStage > 0.7) {
            return lateWeights[row][col];
        } else {
            // 중간 단계는 두 가중치의 평균
            const transitionFactor = (gameStage - 0.3) / 0.4; // 0.3~0.7 ->  0~1 사이 값 변환
            return (
                earlyWeights[row][col] * (1 - transitionFactor) +
                lateWeights[row][col] * transitionFactor
            );
        }
    }

    // 돌이 안정적인지 확인 (뒤집을 수 없는지)
    function isStablePiece(boardState, row, col, stableBoard) {
        const player = boardState[row][col];

        // 각 방향축 별로 확인 (가로, 세로, 대각선 각 2개, 총 3개의 축)
        const axes = [
            [
                [-1, 0],
                [1, 0],
            ], // 세로
            [
                [0, -1],
                [0, 1],
            ], // 가로
            [
                [-1, -1],
                [1, 1],
            ], // 대각선 (\)
            [
                [-1, 1],
                [1, -1],
            ], // 대각선 (/)
        ];

        // 모든 축에 대해 안정성 확인
        for (const axis of axes) {
            let stable = false;

            for (const [dx, dy] of axis) {
                let nx = row + dx;
                let ny = col + dy;

                // 같은 색 돌이나 보드 경계를 만날 때까지 진행
                while (isOnBoard(nx, ny) && boardState[nx][ny] === player) {
                    nx += dx;
                    ny += dy;
                }

                // 보드 경계에 도달했거나, 안정적인 돌을 만났으면 이 방향은 안정적
                if (
                    !isOnBoard(nx, ny) ||
                    (isOnBoard(nx - dx, ny - dy) &&
                        stableBoard[nx - dx][ny - dy])
                ) {
                    stable = true;
                    break;
                }
            }

            // 한 축이라도 안정적이지 않으면 이 돌은 안정적이지 않음
            if (!stable) return false;
        }

        return true;
    }

    // 안정적인 돌 카운트
    function countStablePieces(boardState, player) {
        // 안정적인 돌: 뒤집을 수 없는 돌
        const stable = Array(8)
            .fill()
            .map(() => Array(8).fill(false));
        let count = 0;

        // 코너는 항상 안정적
        const corners = [
            [0, 0],
            [0, 7],
            [7, 0],
            [7, 7],
        ];
        for (const [r, c] of corners) {
            if (boardState[r][c] === player) {
                stable[r][c] = true;
                count++;
            }
        }

        // 안정성 전파 (모서리에서부터 확장)
        let changed = true;
        while (changed) {
            changed = false;

            for (let r = 0; r < 8; r++) {
                for (let c = 0; c < 8; c++) {
                    if (boardState[r][c] !== player || stable[r][c]) continue;

                    // 이 돌이 안정적인지 확인
                    if (isStablePiece(boardState, r, c, stable)) {
                        stable[r][c] = true;
                        count++;
                        changed = true;
                    }
                }
            }
        }

        return count;
    }

    function minimax(
        boardState,
        depth,
        alpha,
        beta,
        isMaximizing,
        originalPlayer
    ) {
        const opponent = originalPlayer === 1 ? 2 : 1;
        const currentPlayer = isMaximizing ? originalPlayer : opponent;

        if (depth === 0 || isGameOver(boardState)) {
            return evaluateBoard(boardState, originalPlayer);
        }

        const validMoves = getValidMovesForBoard(boardState, currentPlayer);

        if (validMoves.length === 0) {
            const opponentMoves = getValidMovesForBoard(
                boardState,
                currentPlayer === 1 ? 2 : 1
            );
            // 상대도 나도 움직일 수 없어 고착화 된 상태 (= 게임종료)
            if (opponentMoves.length === 0) {
                return evaluateBoard(boardState, originalPlayer);
            }

            // 상대 차례로 패스
            return minimax(
                boardState,
                depth - 1,
                alpha,
                beta,
                !isMaximizing,
                originalPlayer
            );
        }

        if (isMaximizing) {
            let maxScore = -Infinity;
            for (const move of validMoves) {
                const { row, col } = move;
                const tmpBoard = JSON.parse(JSON.stringify(boardState));
                makeSimulation(tmpBoard, row, col, currentPlayer);

                const score = minimax(
                    tmpBoard,
                    depth - 1,
                    alpha,
                    beta,
                    false,
                    originalPlayer
                );
                maxScore = Math.max(maxScore, score);

                alpha = Math.max(alpha, maxScore);
                if (beta <= alpha) break;
            }

            return maxScore;
        } else {
            let minScore = Infinity;
            for (const move of validMoves) {
                const { row, col } = move;
                const tmpBoard = JSON.parse(JSON.stringify(boardState));
                makeSimulation(tmpBoard, row, col, currentPlayer);

                const score = minimax(
                    tmpBoard,
                    depth - 1,
                    alpha,
                    beta,
                    true,
                    originalPlayer
                );
                minScore = Math.min(minScore, score);

                beta = Math.min(beta, minScore);
                if (beta <= alpha) break;
            }

            return minScore;
        }
    }

    // 최적의 수 찾기 (Main Function)
    function findBestMove(player, depth = 3) {
        // console.log("Player of MyStrategy: ", player);
        const validMoves = getValidMoves(player);
        if (validMoves.length === 0) return null;

        let bestMove = null;
        let bestScore = -Infinity;
        let alpha = -Infinity;
        let beta = Infinity;

        for (const move of validMoves) {
            const tmpBoard = JSON.parse(JSON.stringify(board));
            makeSimulation(tmpBoard, move.row, move.col, currentPlayer);

            const score = minimax(
                tmpBoard,
                depth - 1,
                alpha,
                beta,
                false,
                currentPlayer
            );
            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
            }

            alpha = Math.max(alpha, bestScore);
            if (beta <= alpha) break;
        }

        return bestMove;
    }

    return findBestMove(player, DEPTH);
}

function makeMCTSMove(player) {
    // console.log("Player of MCTS: ", player);
    const MAX_ITERATIONS = 1500; // 1500, 1000, 500, 300
    const EXPLORATION_PARAM = 1.41; // UCB1 공식의 탐색 매개변수

    // MCTS 노드 클래스
    class MCTSNode {
        constructor(board, player, parentNode = null, moveFromParent = null) {
            this.board = board.map((row) => [...row]); // 보드 복사
            this.player = player; // 이 노드에서 수를 둘 차례인 플레이어
            this.parentNode = parentNode;
            this.moveFromParent = moveFromParent; // 부모에서 이 노드로 오는 수

            this.visits = 0;
            this.score = 0;
            this.children = [];
            this.untriedMoves = [];

            // 가능한 모든 수 계산
            if (player) {
                this.untriedMoves = getValidMovesForBoard(this.board, player);
            }
        }

        // UCB1 값을 계산 (자식 노드 선택 시 사용)
        getUCB() {
            if (this.visits === 0) return Infinity;

            const exploitation = this.score / this.visits;
            const exploration =
                EXPLORATION_PARAM *
                Math.sqrt(Math.log(this.parentNode.visits) / this.visits);

            return exploitation + exploration;
        }

        // 확장: 아직 시도하지 않은 수 중 하나를 선택하여 새 자식 노드 추가
        expand() {
            if (this.untriedMoves.length === 0) return null;

            // 랜덤하게 시도하지 않은 수 선택
            const moveIndex = Math.floor(
                Math.random() * this.untriedMoves.length
            );
            const move = this.untriedMoves[moveIndex];
            this.untriedMoves.splice(moveIndex, 1); // 선택한 수 제거

            // 새 보드 상태 생성
            const nextBoard = this.board.map((row) => [...row]);
            const nextPlayer = this.player === BLACK ? WHITE : BLACK;

            // 수 적용
            makeSimulatedMove(nextBoard, move.row, move.col, this.player);

            // 새 자식 노드 생성
            const childNode = new MCTSNode(nextBoard, nextPlayer, this, move);
            this.children.push(childNode);

            return childNode;
        }

        // 가장 유망한 자식 노드 선택 (UCB1 값이 가장 높은 노드)
        getBestChild() {
            let bestScore = -Infinity;
            let bestChildren = [];

            for (const child of this.children) {
                const ucbValue = child.getUCB();

                if (ucbValue > bestScore) {
                    bestScore = ucbValue;
                    bestChildren = [child];
                } else if (ucbValue === bestScore) {
                    bestChildren.push(child);
                }
            }

            // 동점인 경우 랜덤하게 선택
            return bestChildren[
                Math.floor(Math.random() * bestChildren.length)
            ];
        }

        // 최종 결정을 위한 최선의 자식 선택 (방문 횟수에 기반)
        getFinalBestChild() {
            let mostVisits = -1;
            let bestChildren = [];

            for (const child of this.children) {
                if (child.visits > mostVisits) {
                    mostVisits = child.visits;
                    bestChildren = [child];
                } else if (child.visits === mostVisits) {
                    bestChildren.push(child);
                }
            }

            // 동점인 경우 랜덤하게 선택
            return bestChildren[
                Math.floor(Math.random() * bestChildren.length)
            ];
        }
    }

    // MCTS 알고리즘의 주요 4단계를 구현
    function mctsSearch(rootState, iterations) {
        // 루트 노드 생성
        const rootNode = new MCTSNode(rootState, player);

        for (let i = 0; i < iterations; i++) {
            // 1. 선택(Selection): 리프 노드까지 트리 탐색
            let node = rootNode;

            // 모든 자식이 확장되었고 리프 노드가 아닌 동안 최선의 자식을 선택
            while (node.untriedMoves.length === 0 && node.children.length > 0) {
                node = node.getBestChild();
            }

            // 2. 확장(Expansion): 아직 확장되지 않은 자식 노드가 있으면 확장
            if (node.untriedMoves.length > 0) {
                node = node.expand();
                if (!node) continue; // 확장에 실패한 경우 다음 반복으로
            }

            // 3. 시뮬레이션(Simulation): 무작위 플레이아웃으로 게임 결과 예측
            const terminalBoard = simulateRandomPlayout(
                node.board,
                node.player
            );

            // 4. 역전파(Backpropagation): 결과를 트리 위로 전파
            backpropagate(node, evaluateBoard(terminalBoard, player));
        }

        // 최종 결정: 루트의 가장 많이 방문된 자식을 선택
        const bestChild = rootNode.getFinalBestChild();
        if (!bestChild || !bestChild.moveFromParent) {
            // 최선의 자식이 없거나 moveFromParent가 없는 경우 임의의 유효한 수 반환
            // const validMoves = getValidMovesForBoard(rootState, player);
            // return validMoves[Math.floor(Math.random() * validMoves.length)];
            return myStrategy(player);
        }
        return bestChild.moveFromParent;
    }

    // 무작위 플레이아웃 시뮬레이션
    function simulateRandomPlayout(startBoard, startPlayer) {
        // 보드와 플레이어의 복사본으로 작업
        const board = startBoard.map((row) => [...row]);
        let currentPlayer = startPlayer;

        // 게임이 끝날 때까지 무작위로 수 선택
        let consecutivePasses = 0;
        while (consecutivePasses < 2) {
            const validMoves = getValidMovesForBoard(board, currentPlayer);

            if (validMoves.length === 0) {
                consecutivePasses++;
                currentPlayer = currentPlayer === BLACK ? WHITE : BLACK;
                continue;
            }

            consecutivePasses = 0;

            // 랜덤하게 수 선택
            const randomMove =
                validMoves[Math.floor(Math.random() * validMoves.length)];
            makeSimulatedMove(
                board,
                randomMove.row,
                randomMove.col,
                currentPlayer
            );

            // 플레이어 전환
            currentPlayer = currentPlayer === BLACK ? WHITE : BLACK;
        }

        return board;
    }

    // 보드 상태 평가
    function evaluateBoard(board, player) {
        let blackCount = 0;
        let whiteCount = 0;
        // console.log(player);
        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let col = 0; col < BOARD_SIZE; col++) {
                if (board[row][col] === BLACK) {
                    blackCount++;
                } else if (board[row][col] === WHITE) {
                    whiteCount++;
                }
            }
        }

        // AI의 관점에서 점수 계산
        if (player === BLACK) {
            return blackCount > whiteCount
                ? 1
                : blackCount < whiteCount
                ? 0
                : 0.5;
        } else {
            return whiteCount > blackCount
                ? 1
                : whiteCount < blackCount
                ? 0
                : 0.5;
        }
    }

    // 결과를 트리 위로 역전파
    function backpropagate(node, result) {
        while (node) {
            node.visits++;

            // 현재 노드의 플레이어가 AI와 같으면 점수 반전
            // (노드의 플레이어는 이 노드에서 수를 둘 차례인 사람이므로)
            const nodeResult = node.player === player ? 1 - result : result;
            node.score += nodeResult;

            node = node.parentNode;
        }
    }

    // 주어진 보드에서 유효한 수 목록 얻기
    function getValidMovesForBoard(board, player) {
        const validMoves = [];

        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let col = 0; col < BOARD_SIZE; col++) {
                if (isValidMoveForBoard(board, row, col, player)) {
                    validMoves.push({ row, col });
                }
            }
        }

        return validMoves;
    }

    // 주어진 보드에서 수가 유효한지 확인
    function isValidMoveForBoard(board, row, col, player) {
        if (board[row][col] !== EMPTY) {
            return false;
        }

        const opponent = player === BLACK ? WHITE : BLACK;
        const directions = [
            [-1, -1],
            [-1, 0],
            [-1, 1],
            [0, -1],
            [0, 1],
            [1, -1],
            [1, 0],
            [1, 1],
        ];

        for (const [dr, dc] of directions) {
            let r = row + dr;
            let c = col + dc;
            let foundOpponent = false;

            while (
                r >= 0 &&
                r < BOARD_SIZE &&
                c >= 0 &&
                c < BOARD_SIZE &&
                board[r][c] === opponent
            ) {
                foundOpponent = true;
                r += dr;
                c += dc;
            }

            if (
                foundOpponent &&
                r >= 0 &&
                r < BOARD_SIZE &&
                c >= 0 &&
                c < BOARD_SIZE &&
                board[r][c] === player
            ) {
                return true;
            }
        }

        return false;
    }

    // 주어진 보드에서 시뮬레이션된 수 실행
    function makeSimulatedMove(board, row, col, player) {
        board[row][col] = player;

        const directions = [
            [-1, -1],
            [-1, 0],
            [-1, 1],
            [0, -1],
            [0, 1],
            [1, -1],
            [1, 0],
            [1, 1],
        ];

        directions.forEach(([dr, dc]) => {
            let r = row + dr;
            let c = col + dc;
            const discsToFlip = [];

            while (
                r >= 0 &&
                r < BOARD_SIZE &&
                c >= 0 &&
                c < BOARD_SIZE &&
                board[r][c] !== EMPTY &&
                board[r][c] !== player
            ) {
                discsToFlip.push([r, c]);
                r += dr;
                c += dc;
            }

            if (
                r >= 0 &&
                r < BOARD_SIZE &&
                c >= 0 &&
                c < BOARD_SIZE &&
                board[r][c] === player
            ) {
                discsToFlip.forEach(([fr, fc]) => {
                    board[fr][fc] = player;
                });
            }
        });
    }

    // MCTS 실행 및 최적의 수 반환
    return mctsSearch(board, MAX_ITERATIONS);
}
