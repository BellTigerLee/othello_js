// --- Constants and Globals ---
const EMPTY = 0;
const BLACK = 1;
const WHITE = 2;
const BLOCKED = 3;
const MAX_AI_TIME_PER_GAME = 20000; // Maximum time to spend in each game (5 seconds)
let blackTimeUsed = 0; // total time used - black (ms)
let whiteTimeUsed = 0; // total time used - white (ms)
let BOARD_SIZE = 8;
let board = [];
let currentPlayer = BLACK;
let gameRunning = false;
let moveLog = [];
let savedStrategies = {};
let compiledStudentAIs = {};
// Intelligent System globals
let intelligentSystems = {}; // Store uploaded intelligent systems
let compiledIntelligentSystems = {}; // Cached compiled versions
let isIntelligentSystemAnalyzing = false; // Flag for analysis state
let currentAnalysisStage = null; // Current stage being analyzed
let gameStartLogged = false;
let currentStage = null;
let currentTournamentStageConfig = null;
let leaderboardData = { matches: [], results: {} };
let aiThinking = false;
let gameLoopTimeout = null; // Declare timeout handle globally

// --- DOM Elements ---
const boardElement = document.getElementById("board");
const statusElement = document.getElementById("status");
const blackScoreElement = document.getElementById("black-score");
const whiteScoreElement = document.getElementById("white-score");
const blackTimerElement = document.getElementById("black-timer");
const whiteTimerElement = document.getElementById("white-timer");
const stageSelect = document.getElementById("stageSelect");
const blackAISelect = document.getElementById("black-ai");
const whiteAISelect = document.getElementById("white-ai");
const startButton = document.getElementById("start-btn");
const resetButton = document.getElementById("reset-btn");
const gameLogElement = document.getElementById("game-log");
const jsCodeElement = document.getElementById("js-code");
const strategyNameInput = document.getElementById("strategy-name");
const saveStrategyButton = document.getElementById("save-strategy");
const clearEditorButton = document.getElementById("clear-editor");
const strategyListElement =
    document.getElementById("strategy-list");
const strategyFileInput = document.getElementById(
    "strategy-file-input"
);
const uploadStrategiesButton =
    document.getElementById("upload-strategies");
const uploadStatusMsg =
    document.getElementById("upload-status-msg");
const runTournamentButton =
    document.getElementById("run-tournament-btn");
const tournamentStatusElement =
    document.getElementById("tournament-status");
const leaderboardBody = document.getElementById("leaderboard-body");
// New Intelligent System Elements
const intelligentSystemFileInput = document.getElementById(
    "intelligent-system-file-input"
);
const uploadIntelligentSystemButton = document.getElementById(
    "upload-intelligent-system"
);
const intelligentSystemProgress = document.getElementById(
    "intelligent-system-progress"
);
const intelligentSystemProgressBar = document.getElementById(
    "intelligent-system-progress-bar"
);
const intelligentSystemStatus = document.getElementById(
    "intelligent-system-status"
);

// --- Stage Definitions ---
stages = [
    {
        name: "Standard 8x8",
        boardSize: 8,
        initialBlocked: [],
        initialPlayer1: [
            { r: 3, c: 4 },
            { r: 4, c: 3 },
        ],
        initialPlayer2: [
            { r: 3, c: 3 },
            { r: 4, c: 4 },
        ],
    },
    {
        name: "Small Board (6x6)",
        boardSize: 6,
        initialBlocked: [],
        initialPlayer1: [
            { r: 2, c: 3 },
            { r: 3, c: 2 },
        ],
        initialPlayer2: [
            { r: 2, c: 2 },
            { r: 3, c: 3 },
        ],
    },
    {
        name: "8x8 (Partial C-Squares-cw)",
        boardSize: 8,
        initialBlocked: [
            { r: 0, c: 1 },
            { r: 1, c: 7 },
            { r: 7, c: 6 },
            { r: 6, c: 0 },
        ],
        initialPlayer1: [
            { r: 3, c: 4 },
            { r: 4, c: 3 },
        ],
        initialPlayer2: [
            { r: 3, c: 3 },
            { r: 4, c: 4 },
        ],
    },
    // {
    //     name: "Large Board (10x10)",
    //     boardSize: 10,
    //     initialBlocked: [], // No blocked cells
    //     initialPlayer1: [{ r: 4, c: 5 }, { r: 5, c: 4 }], // Black Initial position
    //     initialPlayer2: [{ r: 4, c: 4 }, { r: 5, c: 5 }]  // White Initial position
    // },
    // {
    //     name: "8x8 (No X-Squares)",
    //     boardSize: 8,
    //     initialBlocked: [{ r: 1, c: 1 }, { r: 1, c: 6 }, { r: 6, c: 1 }, { r: 6, c: 6 }],
    //     initialPlayer1: [{ r: 3, c: 4 }, { r: 4, c: 3 }],
    //     initialPlayer2: [{ r: 3, c: 3 }, { r: 4, c: 4 }]
    // },
    // {
    //     name: "8x8 (Partial C-Squares-ccw)",
    //     boardSize: 8,
    //     initialBlocked: [{ r: 1, c: 0 }, { r: 7, c: 1 }, { r: 6, c: 7 }, { r: 0, c: 6 }],
    //     initialPlayer1: [{ r: 3, c: 4 }, { r: 4, c: 3 }],
    //     initialPlayer2: [{ r: 3, c: 3 }, { r: 4, c: 4 }]
    // },
    // {
    //     name: "8x8 (No Sweet)",
    //     boardSize: 8,
    //     initialBlocked: [{ r: 2, c: 2 }, { r: 5, c: 5 }, { r: 5, c: 2 }, { r: 2, c: 5 }],
    //     initialPlayer1: [{ r: 3, c: 4 }, { r: 4, c: 3 }],
    //     initialPlayer2: [{ r: 3, c: 3 }, { r: 4, c: 4 }]
    // },
    // {
    //     name: "8x8 (First Move Restriction)",
    //     boardSize: 8,
    //     initialBlocked: [{ r: 2, c: 3 }, { r: 5, c: 4 }, { r: 4, c: 2 }, { r: 3, c: 5 }],
    //     initialPlayer1: [{ r: 3, c: 4 }, { r: 4, c: 3 }],
    //     initialPlayer2: [{ r: 3, c: 3 }, { r: 4, c: 4 }]
    // },
    // {
    //     name: "10x10 (First Move Restriction)",
    //     boardSize: 10,
    //     initialBlocked: [{ r: 3, c: 4 }, { r: 6, c: 5 }, { r: 5, c: 3 }, { r: 4, c: 6 }],
    //     initialPlayer1: [{ r: 4, c: 5 }, { r: 5, c: 4 }],
    //     initialPlayer2: [{ r: 4, c: 4 }, { r: 5, c: 5 }]
    // },
    // {
    //     name: "10x10 (Corner Missing)",
    //     boardSize: 10,
    //     initialBlocked: [{ r: 0, c: 4 }, { r: 0, c: 5 }, { r: 1, c: 4 }, { r: 1, c: 5 },
    //     { r: 8, c: 4 }, { r: 8, c: 5 }, { r: 9, c: 4 }, { r: 9, c: 5 },
    //     { r: 4, c: 0 }, { r: 5, c: 0 }, { r: 4, c: 1 }, { r: 5, c: 1 },
    //     { r: 4, c: 8 }, { r: 5, c: 8 }, { r: 4, c: 9 }, { r: 5, c: 9 }],
    //     initialPlayer1: [{ r: 4, c: 5 }, { r: 5, c: 4 }],
    //     initialPlayer2: [{ r: 4, c: 4 }, { r: 5, c: 5 }]
    // },
    // {
    //     name: "8x8 (X-Squares Occlusion Agnostic)",
    //     boardSize: 8,
    //     initialBlocked: [{ r: 1, c: 1 }, { r: 1, c: 6 }, { r: 6, c: 1 }, { r: 6, c: 6 }],
    //     initialPlayer1: [{ r: 3, c: 4 }, { r: 4, c: 3 }],
    //     initialPlayer2: [{ r: 3, c: 3 }, { r: 4, c: 4 }],
    //     ignoreOcclusion: true
    // },
    // {
    //     name: "8x8 (C-Squares Occlusion Agnostic)",
    //     boardSize: 8,
    //     initialBlocked: [{ r: 0, c: 1 }, { r: 1, c: 7 }, { r: 7, c: 6 }, { r: 6, c: 0 }],
    //     initialPlayer1: [{ r: 3, c: 4 }, { r: 4, c: 3 }],
    //     initialPlayer2: [{ r: 3, c: 3 }, { r: 4, c: 4 }],
    //     ignoreOcclusion: true
    // },
    // {
    //     name: "8x8 (Fewer Pieces Continue)",
    //     boardSize: 8,
    //     initialBlocked: [],
    //     initialPlayer1: [{ r: 3, c: 4 }, { r: 4, c: 3 }],
    //     initialPlayer2: [{ r: 3, c: 3 }, { r: 4, c: 4 }],
    //     fewerPiecesContinue: true
    // },
    // {
    //     name: "8x8 (C-Squares + fewer pieces)",
    //     boardSize: 8,
    //     initialBlocked: [{ r: 0, c: 1 }, { r: 1, c: 7 }, { r: 7, c: 6 }, { r: 6, c: 0 }],
    //     initialPlayer1: [{ r: 3, c: 4 }, { r: 4, c: 3 }],
    //     initialPlayer2: [{ r: 3, c: 3 }, { r: 4, c: 4 }],
    //     fewerPiecesContinue: true
    // },
    // {
    //     name: "8x8 (C-Squares + occlusion + fewer pieces)",
    //     boardSize: 8,
    //     initialBlocked: [{ r: 0, c: 1 }, { r: 1, c: 7 }, { r: 7, c: 6 }, { r: 6, c: 0 }],
    //     initialPlayer1: [{ r: 3, c: 4 }, { r: 4, c: 3 }],
    //     initialPlayer2: [{ r: 3, c: 3 }, { r: 4, c: 4 }],
    //     ignoreOcclusion: true,
    //     fewerPiecesContinue: true
    // }
];
// --- Built-in Strategies ---
const builtInStrategies = {
    /* ... Same ... */
    random: function (p) {
        const m = getValidMoves(p);
        if (m.length === 0) return null;
        return m[Math.floor(Math.random() * m.length)];
    },
    greedy: function (
        currentBoard,
        player,
        validMoves,
        makeMoveFunc
    ) {
        // Return null if no valid moves
        if (validMoves.length === 0) {
            return null;
        }

        let bestMove = null; // Variable to store the best move
        let maxFlips = -1; // Maximum number of flips (starts at -1 to allow selecting moves that flip 0 pieces)

        // Iterate through all valid moves
        for (const move of validMoves) {
            // --- ★★★ Start calculating currentFlips logic ★★★ ---
            const tempBoard = currentBoard.map((row) => [...row]); // Copy the board for simulation
            const opponent = player === BLACK ? WHITE : BLACK;
            let currentFlips = 0; // Number of pieces flipped by the current move (declared here!)

            // Simulate the current move on the copied board
            tempBoard[move.row][move.col] = player;

            // Search 8 directions and count flipped pieces
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
                const piecesToFlip = []; // Candidates for flipping

                while (
                    isWithinBoard(r, c) &&
                    tempBoard[r][c] === opponent
                ) {
                    piecesToFlip.push([r, c]);
                    r += dr;
                    c += dc;
                }

                if (
                    piecesToFlip.length > 0 &&
                    isWithinBoard(r, c) &&
                    tempBoard[r][c] === player
                ) {
                    currentFlips += piecesToFlip.length; // Accumulate the number of flipped pieces
                }
            }
            // --- ★★★ End of currentFlips calculation logic ★★★ ---

            // Update if current move flips more pieces than the current max
            if (currentFlips > maxFlips) {
                maxFlips = currentFlips;
                bestMove = move;
            }
        }

        // Fallback logic (select random move if bestMove is still null)
        if (bestMove === null && validMoves.length > 0) {
            console.warn(
                "Greedy AI fallback: No move increased flips > -1, selecting random valid move."
            );
            bestMove =
                validMoves[
                    Math.floor(Math.random() * validMoves.length)
                ];
        }

        // Return the final selected move
        return bestMove;
    },
// MARK: dadf 
    corners: function (
        currentBoard,
        player,
        validMoves,
        makeMoveFunc
    ) {
        if (validMoves.length === 0) {
            return null;
        }
        // Find corners (using the passed validMoves)
        const corners = validMoves.filter(
            (mv) =>
                (mv.row === 0 || mv.row === BOARD_SIZE - 1) &&
                (mv.col === 0 || mv.col === BOARD_SIZE - 1)
        );
        if (corners.length > 0) {
            return corners[0];
        }
        // Find edges (using the passed validMoves)
        const edges = validMoves.filter(
            (mv) =>
                mv.row === 0 ||
                mv.row === BOARD_SIZE - 1 ||
                mv.col === 0 ||
                mv.col === BOARD_SIZE - 1
        );
        if (edges.length > 0) {
            // Return a random edge (optional, otherwise return the first one)
            return edges[Math.floor(Math.random() * edges.length)];
        }
        // Call greedy if no corners/edges (modified greedy call to use passed validMoves)
        return builtInStrategies.greedy(
            currentBoard,
            player,
            validMoves,
            makeMoveFunc
        );
    },
    positional: function (

        currentBoard,
        player,
        validMoves,
        makeMoveFunc
    ) {
        if (validMoves.length === 0) {
            return null;
        }

        let bestM = null;
        let bestS = -Infinity;

        if (BOARD_SIZE !== 8) {
            console.warn(
                "Positional weights only valid for 8x8! Falling back to greedy."
            );

            return builtInStrategies.greedy(
                currentBoard,
                player,
                validMoves,
                makeMoveFunc
            );
        }

        const w8 = [
            [120, -20, 20, 5, 5, 20, -20, 120],
            [-20, -40, -5, -5, -5, -5, -40, -20],
            [20, -5, 15, 3, 3, 15, -5, 20],
            [5, -5, 3, 3, 3, 3, -5, 5],
            [5, -5, 3, 3, 3, 3, -5, 5],
            [20, -5, 15, 3, 3, 15, -5, 20],
            [-20, -40, -5, -5, -5, -5, -40, -20],
            [120, -20, 20, 5, 5, 20, -20, 120],
        ]; // 8x8 weights
        for (const mv of validMoves) {
            const s = w8[mv.row][mv.col];
            if (s > bestS) {
                bestS = s;
                bestM = mv;
            }
        }
        return bestM;
    },
    myStrategy: function (
        currentBoard,
        player,
        validMoves,
        makeMoveFunc
    ) {
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
            return 0 <= row && row < BOARD_SIZE && 0 <= col && col < BOARD_SIZE;
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

            for (let row = 0; row < BOARD_SIZE; row++) {
                for (let col = 0; col < BOARD_SIZE; col++) {
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
            const emptySpaces = BOARD_SIZE*BOARD_SIZE - totalPieces;
            const gameStage = totalPieces / BOARD_SIZE; // 0~1 사이 값

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
                else if (boardState[r][c] === opponent)
                    cornerScore -= 35;
            }
            score += cornerScore;

            // 2. 안정적인 돌의 수
            const stablePieces =
                countStablePieces(boardState, player) -
                countStablePieces(boardState, opponent);
            score += stablePieces * 20;

            // 3. 기동성 (이동 가능한 수의 차이)
            const playerMobility = getValidMovesForBoard(
                boardState,
                player
            ).length;
            const opponentMobility = getValidMovesForBoard(
                boardState,
                opponent
            ).length;

            // 게임 초반에는 기동성이 중요, 후반에는 덜 중요
            const mobilityWeight = Math.max(0, 12 - gameStage * 12);
            score +=
                (playerMobility - opponentMobility) *
                mobilityWeight;

            // 4. 포지셔널 전략 (위치 가중치 적용)
            let positionScore = 0;
            for (let r = 0; r < BOARD_SIZE; r++) {
                for (let c = 0; c < BOARD_SIZE; c++) {
                    if (boardState[r][c] === player) {
                        positionScore += getPositionValue(
                            r,
                            c,
                            gameStage
                        );
                    } else if (boardState[r][c] === opponent) {
                        positionScore -= getPositionValue(
                            r,
                            c,
                            gameStage
                        );
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
                        [
                            cornerR,
                            cornerC + (cornerC === 0 ? 1 : -1),
                        ],
                        [
                            cornerR + (cornerR === 0 ? 1 : -1),
                            cornerC,
                        ],
                    ];

                    // 해당 코너가 비어있거나 상대방 돌이 있으면 X-스퀘어, C-스퀘어는 위험
                    if (boardState[cornerR][cornerC] !== player) {
                        for (const [r, c] of xSquare) {
                            if (boardState[r][c] === player)
                                score -= 15;
                            else if (boardState[r][c] === opponent)
                                score += 10;
                        }

                        for (const [r, c] of cSquares) {
                            if (boardState[r][c] === player)
                                score -= 10;
                            else if (boardState[r][c] === opponent)
                                score += 7;
                        }
                    }
                }
            }

            // 6. 패리티 전략 (게임 후반에 중요)
            let isOdd = emptySpaces % 2 === 1;
            if (gameStage > 0.6) {
                // 남은 빈 칸 수의 패리티 체크
                if (
                    (player === 1 && isOdd) ||
                    (player === 2 && !isOdd)
                ) {
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
                        [
                            cornerR,
                            cornerC + (cornerC === 0 ? 1 : -1),
                        ],
                        [
                            cornerR + (cornerR === 0 ? 1 : -1),
                            cornerC,
                        ],
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
                    earlyWeights[row][col] *
                        (1 - transitionFactor) +
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
                    while (
                        isOnBoard(nx, ny) &&
                        boardState[nx][ny] === player
                    ) {
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
            const stable = Array(BOARD_SIZE)
                .fill()
                .map(() => Array(BOARD_SIZE).fill(false));
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

                for (let r = 0; r < BOARD_SIZE; r++) {
                    for (let c = 0; c < BOARD_SIZE; c++) {
                        if (
                            boardState[r][c] !== player ||
                            stable[r][c]
                        )
                            continue;

                        // 이 돌이 안정적인지 확인
                        if (
                            isStablePiece(boardState, r, c, stable)
                        ) {
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
            const currentPlayer = isMaximizing
                ? originalPlayer
                : opponent;

            if (depth === 0 || isGameOver(boardState)) {
                return evaluateBoard(boardState, originalPlayer);
            }

            const validMoves = getValidMovesForBoard(
                boardState,
                currentPlayer
            );

            if (validMoves.length === 0) {
                const opponentMoves = getValidMovesForBoard(
                    boardState,
                    currentPlayer === 1 ? 2 : 1
                );
                // 상대도 나도 움직일 수 없어 고착화 된 상태 (= 게임종료)
                if (opponentMoves.length === 0) {
                    return evaluateBoard(
                        boardState,
                        originalPlayer
                    );
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
                    const tmpBoard = JSON.parse(
                        JSON.stringify(boardState)
                    );
                    makeSimulation(
                        tmpBoard,
                        row,
                        col,
                        currentPlayer
                    );

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
                    const tmpBoard = JSON.parse(
                        JSON.stringify(boardState)
                    );
                    makeSimulation(
                        tmpBoard,
                        row,
                        col,
                        currentPlayer
                    );

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
                makeSimulation(
                    tmpBoard,
                    move.row,
                    move.col,
                    currentPlayer
                );

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
    },
};

// --- Game Logic ---
function initializeBoard(stageConfig, isPreview = false) {
    console.log(
        `Init board. Stage:${
            stageConfig ? stageConfig.name : "Default"
        }, Preview:${isPreview}`
    );
    currentStage = stageConfig;
    BOARD_SIZE = stageConfig ? stageConfig.boardSize : 8;
    board = Array(BOARD_SIZE)
        .fill()
        .map(() => Array(BOARD_SIZE).fill(EMPTY));

    // Apply stage configuration (blocked cells, initial pieces)
    if (stageConfig) {
        (stageConfig.initialBlocked || []).forEach((p) => {
            if (isWithinBoard(p.r, p.c)) board[p.r][p.c] = BLOCKED;
        });
        (stageConfig.initialPlayer1 || []).forEach((p) => {
            if (
                isWithinBoard(p.r, p.c) &&
                board[p.r][p.c] === EMPTY
            )
                board[p.r][p.c] = BLACK;
        });
        (stageConfig.initialPlayer2 || []).forEach((p) => {
            if (
                isWithinBoard(p.r, p.c) &&
                board[p.r][p.c] === EMPTY
            )
                board[p.r][p.c] = WHITE;
        });
    } else {
        // Default setup if no stageConfig (e.g., fallback)
        if (BOARD_SIZE === 8) {
            const mid = Math.floor(BOARD_SIZE / 2);
            board[mid - 1][mid - 1] = WHITE;
            board[mid - 1][mid] = BLACK;
            board[mid][mid - 1] = BLACK;
            board[mid][mid] = WHITE;
        } else {
            console.warn(
                "No default setup for non-8x8 board without stage config"
            );
        }
    }

    // --- Prepare board element ---
    boardElement.innerHTML = "";
    const cs = 50; // cell size
    boardElement.style.gridTemplateColumns = `repeat(${BOARD_SIZE}, ${cs}px)`;
    boardElement.style.gridTemplateRows = `repeat(${BOARD_SIZE}, ${cs}px)`;
    // Calculate board dimensions including gaps and padding (adjust calculation if needed)
    const bDim = BOARD_SIZE * cs + (BOARD_SIZE - 1) * 1 + 8; // Assuming 1px gap, 4px padding on each side
    boardElement.style.width = `${bDim}px`;
    boardElement.style.height = `${bDim}px`;

    // Create cells
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            const cell = document.createElement("div");
            cell.className = "cell";
            cell.dataset.row = r;
            cell.dataset.col = c;
            cell.style.width = `${cs}px`;
            cell.style.height = `${cs}px`;
            boardElement.appendChild(cell);
        }
    }

    // --- Update display and score (common for preview and game start) ---
    updateBoardDisplay(); // Render initial pieces/blocked cells
    const scores = countDiscs();
    blackScoreElement.textContent = scores.black;
    whiteScoreElement.textContent = scores.white;

    // --- Specific actions based on mode (Preview vs Actual Game Start) ---
    if (!isPreview) {
        // This block runs when starting the actual game (called from startGame)
        currentPlayer = BLACK;
        // selectedCell = null; // Assuming selectedCell exists globally or resetting it here
        gameOver = false; // *** Set game over to false for game start ***
        console.log(
            `[initializeBoard] gameOver set to false. Current value: ${gameOver}`
        ); // <<< 추가 로그 1
        aiThinking = false;
        gameRunning = false; // Ensure gameRunning starts false, startGame will set it true
        // Additional game start resets if needed
        // moveLog = []; // Resetting move log might happen in startGame instead
        // updatePlayerIDs(); // Should be called after player controllers are set
        updateGameLog(); // Clear or update log display
        // messageElement.textContent = ...; // Status message set in startGame
        statusElement.textContent = `Game ready to start. ${getPlayerName(
            currentPlayer
        )} turn.`;
        statusElement.className = "status"; // Reset status class
        console.log(
            `[initializeBoard] End of !isPreview block. gameOver value: ${gameOver}`
        ); // <<< 추가 로그 2
    } else {
        // This block runs for preview only (called on page load or stage change)
        statusElement.textContent =
            "Stage selected. Click Start Game button.";
        statusElement.style.backgroundColor = "#4CAF50";
        startButton.disabled = false; // Ensure start button is enabled for preview
        gameOver = true; // *** Set game over to true for preview mode ***
    }
    // Note: updateStatus() might be called in startGame or switchTurn, not necessarily needed here.
}

function updateBoardDisplay() {
    /* ... Same (renders board state, including blocked) ... */ const cells =
        boardElement.querySelectorAll(".cell");
    cells.forEach((cell) => {
        const r = parseInt(cell.dataset.row);
        const c = parseInt(cell.dataset.col);
        cell.innerHTML = "";
        cell.classList.remove(
            "blocked",
            "black",
            "white",
            "valid-move-hint",
            "playable"
        );
        cell.onclick = null;
        if (!isWithinBoard(r, c)) return;
        const cellState = board[r][c];
        if (cellState === BLACK) {
            const d = document.createElement("div");
            d.className = "disc black";
            cell.appendChild(d);
            cell.style.cursor = "default";
        } else if (cellState === WHITE) {
            const d = document.createElement("div");
            d.className = "disc white";
            cell.appendChild(d);
            cell.style.cursor = "default";
        } else if (cellState === BLOCKED) {
            cell.classList.add("blocked");
            cell.style.cursor = "not-allowed";
        } else {
            /*EMPTY*/ const isHumanTurn =
                (currentPlayer === BLACK &&
                    blackAISelect.value === "human") ||
                (currentPlayer === WHITE &&
                    whiteAISelect.value === "human");
            if (
                gameRunning &&
                !aiThinking &&
                isHumanTurn &&
                isValidMove(r, c, currentPlayer)
            ) {
                cell.classList.add("valid-move-hint");
                cell.classList.add(
                    "playable"
                ); /* Listener added globally */
            } else {
                cell.style.cursor = "default";
            }
        }
    });
    const s = countDiscs();
    blackScoreElement.textContent = s.black;
    whiteScoreElement.textContent = s.white;
}
function countDiscs() {
    /* ... Same ... */ let b = 0,
        w = 0;
    for (let r = 0; r < BOARD_SIZE; r++)
        for (let c = 0; c < BOARD_SIZE; c++) {
            if (board[r][c] === BLACK) b++;
            else if (board[r][c] === WHITE) w++;
        }
    return { black: b, white: w };
}
function isWithinBoard(r, c) {
    return r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE;
}

function isValidMove(row, col, player, currentBoard = board) {
    // Check if the move is within the board and the cell is empty
    if (
        !isWithinBoard(row, col) ||
        currentBoard[row][col] !== EMPTY
    ) {
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

    // Get current stage configuration for the special rule check
    const stageConfig = currentStage || stages[0];
    const ignoreOcclusion = stageConfig.ignoreOcclusion || false;

    // For each direction from the placed piece
    for (const [dr, dc] of directions) {
        let r = row + dr;
        let c = col + dc;
        let foundOpponent = false;
        let foundBlocked = false;

        // Search for opponent's pieces
        while (isWithinBoard(r, c)) {
            if (currentBoard[r][c] === opponent) {
                foundOpponent = true;
            } else if (currentBoard[r][c] === BLOCKED) {
                foundBlocked = true;
                // In normal rules, a blocked cell ends the search.
                // With ignoreOcclusion=true, we continue through blocked cells
                if (!ignoreOcclusion) {
                    break;
                }
            } else if (currentBoard[r][c] === EMPTY) {
                // An empty cell always ends the search
                break;
            } else if (currentBoard[r][c] === player) {
                // Found current player's piece, which could complete a valid move
                // Valid if we found at least one opponent's piece and:
                // - either no blocked cells
                // - or ignoreOcclusion is true (blocked cells can be jumped over)
                if (
                    foundOpponent &&
                    (!foundBlocked || ignoreOcclusion)
                ) {
                    return true;
                }
                break;
            }

            // Continue in the same direction
            r += dr;
            c += dc;
        }
    }

    // No valid move found in any direction
    return false;
}

function getValidMoves(player, currentBoard = board) {
    const moves = [];
    // Ensure we're using the correct board size from the current board
    const size = currentBoard.length;

    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            if (isValidMove(r, c, player, currentBoard)) {
                moves.push({ row: r, col: c });
            }
        }
    }

    // Add debug log to see all valid moves
    console.log(`Valid moves for player ${player}:`, moves);

    return moves;
}

// function makeMove(row, col, player) { /* ... Same (uses logMove) ... */ if (!isWithinBoard(row, col) || board[row][col] !== EMPTY) return; board[row][col] = player; logMove(row, col, player); const opp = player === BLACK ? WHITE : BLACK; const dirs = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]]; let flipped = false; for (const [dr, dc] of dirs) { let r = row + dr; let c = col + dc; const toFlip = []; while (isWithinBoard(r, c) && board[r][c] === opp) { toFlip.push([r, c]); r += dr; c += dc; } if (toFlip.length > 0 && isWithinBoard(r, c) && board[r][c] === player) { flipped = true; for (const [fr, fc] of toFlip) { board[fr][fc] = player; } } } updateBoardDisplay(); return flipped; }
function makeMove(row, col, player) {
    if (!isWithinBoard(row, col) || board[row][col] !== EMPTY)
        return false;

    board[row][col] = player;
    logMove(row, col, player);

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

    // Get current stage configuration for the special rule check
    const stageConfig = currentStage || stages[0];
    const ignoreOcclusion = stageConfig.ignoreOcclusion || false;

    let flipped = false;

    for (const [dr, dc] of directions) {
        let r = row + dr;
        let c = col + dc;
        const toFlip = [];
        let foundBlocked = false;
        let foundOpponent = false;

        // Collect pieces to flip, considering blocked cells
        while (isWithinBoard(r, c)) {
            if (board[r][c] === opponent) {
                toFlip.push([r, c]);
                foundOpponent = true;
            } else if (board[r][c] === BLOCKED) {
                foundBlocked = true;
                // In normal rules, a blocked cell ends the search
                if (!ignoreOcclusion) {
                    break;
                }
                // We continue past the blocked cell but don't add it to toFlip
            } else if (board[r][c] === EMPTY) {
                // Empty cell always stops the search
                break;
            } else if (board[r][c] === player) {
                // Found the player's piece, check if we can flip
                if (
                    foundOpponent &&
                    toFlip.length > 0 &&
                    (!foundBlocked || ignoreOcclusion)
                ) {
                    flipped = true;
                    // Flip all collected pieces
                    for (const [fr, fc] of toFlip) {
                        board[fr][fc] = player;
                    }
                }
                break;
            }

            r += dr;
            c += dc;
        }
    }

    updateBoardDisplay();
    return flipped;
}

function handleHumanMove(event) {
    // Check if it's a human's turn
    const isHumanTurn =
        (currentPlayer === BLACK &&
            blackAISelect.value === "human") ||
        (currentPlayer === WHITE &&
            whiteAISelect.value === "human");

    // Only proceed if it's a human turn and game is running
    if (isHumanTurn && gameRunning && !aiThinking && !gameOver) {
        // Check if human has any valid moves
        const validMoves = getValidMoves(currentPlayer);

        // If human has no valid moves, handle passing automatically
        if (validMoves.length === 0) {
            console.log(
                `Human player ${currentPlayer} has no valid moves. Passing automatically.`
            );
            logPass(currentPlayer);

            // Determine next player
            const opponent =
                currentPlayer === BLACK ? WHITE : BLACK;

            // Check if game should end (both players have no moves)
            const opponentMoves = getValidMoves(opponent, board);
            if (opponentMoves.length === 0) {
                console.log(
                    "Both players have no moves. Ending game."
                );
                endGame();
                return;
            }

            // Pass to opponent (don't use determineNextPlayer here since we're forcing a pass)
            currentPlayer = opponent;
            updateStatus();

            // Trigger opponent's turn (AI)
            makeAIMove(false);
            return;
        }
    }

    // Original click handling logic - only process if clicked on a cell
    const cell = event.target.closest(".cell");
    if (!cell || !gameRunning || aiThinking || gameOver) return;

    const row = parseInt(cell.dataset.row);
    const col = parseInt(cell.dataset.col);

    // Check if it's currently a human's turn
    if (!isHumanTurn) return;

    if (isValidMove(row, col, currentPlayer)) {
        console.log(
            `Human Move: P${currentPlayer} plays at R${row} C${col}`
        );
        makeMove(row, col, currentPlayer); // Execute the move (logs internally)

        // Store current player before determining next player
        const previousPlayer = currentPlayer;

        // Determine next player based on the "fewer pieces" rule
        currentPlayer = determineNextPlayer();
        updateStatus(); // Update status for the new player

        // Check if it's the same player's turn again (fewer pieces rule)
        if (previousPlayer === currentPlayer) {
            console.log(
                `Player ${currentPlayer} continues (fewer pieces rule)`
            );
            logMessage(
                `${getPlayerName(
                    currentPlayer
                )} continues (fewer pieces rule)`
            );

            // Check if the continuing player has valid moves
            const nextMoves = getValidMoves(currentPlayer);
            if (nextMoves.length === 0) {
                console.log(
                    `Continuing player ${currentPlayer} has no valid moves. Passing.`
                );
                logPass(currentPlayer);

                // Force switch to other player
                const otherPlayer =
                    currentPlayer === BLACK ? WHITE : BLACK;
                currentPlayer = otherPlayer;
                updateStatus();
            }
        }

        // Check for game over
        const blackMoves = getValidMoves(BLACK);
        const whiteMoves = getValidMoves(WHITE);

        if (blackMoves.length === 0 && whiteMoves.length === 0) {
            console.log(
                "Game end detected after human move - no valid moves for either player."
            );
            endGame();
        } else {
            // Continue game if there are still valid moves
            console.log(
                "Human move done, triggering next player check"
            );
            makeAIMove(false);
        }
    } else {
        console.log(
            `Human invalid move attempt at R${row} C${col}`
        );
        displayMessage("Invalid move!", "error"); // Use helper
        setTimeout(() => updateStatus(), 1500); // Clear message after delay
    }
}

/**
 * Handles the logic for an AI player's turn.
 * Determines the AI type, gets a move from the strategy, validates it,
 * executes the move (or a fallback random move), and schedules the next turn.
 * Includes error handling to ensure the game continues even when an AI strategy fails.
 */
async function makeAIMove(isTournament = false) {
    // --- 1. Initial Checks & Human Turn Handling ---
    console.log(
        `[makeAIMove] Enter. Player: ${currentPlayer}, Running: ${gameRunning}, Thinking: ${aiThinking}`
    );
    if (!gameRunning || gameOver) {
        console.log(
            "[makeAIMove] Aborting: Game not running or over."
        );
        aiThinking = false; // Ensure flag is reset
        if (gameLoopTimeout) clearTimeout(gameLoopTimeout);
        gameLoopTimeout = null;
        return;
    }

    const controllerId =
        currentPlayer === BLACK
            ? blackAISelect.value
            : whiteAISelect.value;

    // For human player, we don't track time
    if (controllerId === "human") {
        aiThinking = false; // Not AI's turn to think
        updateStatus(); // Update status to show it's human's turn
        updateBoardDisplay(); // Update visual hints for human
        console.log(
            `[makeAIMove] Human turn P${currentPlayer}. Waiting for input.`
        );
        return; // Exit AI logic, wait for human click
    }

    // --- 2. AI Turn Setup ---
    if (aiThinking) {
        // Prevent duplicate AI thinking processes
        console.warn(
            `[makeAIMove] AI P${currentPlayer} is already thinking. Aborting duplicate call.`
        );
        return;
    }
    aiThinking = true;
    const aiIdentifier = getPlayerName(currentPlayer); // Get AI name (e.g., "Greedy", "myStrategy")
    displayMessage(
        `${aiIdentifier} (AI) is thinking...`,
        "thinking"
    );
    // Optional: updateBoardDisplay() here if you want to remove hints during AI thinking

    const strategyFn = getCompiledStrategy(
        controllerId,
        currentPlayer
    ); // Get the actual AI function
    if (!strategyFn) {
        console.error(
            `[makeAIMove] Strategy function failed for ${controllerId}`
        );
        logMessage(
            `Error: AI ${aiIdentifier} failed. Using random move.`
        );
        // Instead of ending the game, use a random move fallback when strategy compilation fails
        useFallbackMove(currentPlayer, isTournament);
        return;
    }

    // --- 3. Calculate Valid Moves (Once) ---
    // Ensure getValidMoves uses the current global board state here
    const validMoves = getValidMoves(currentPlayer, board);
    console.log(
        `[makeAIMove] P${currentPlayer} has ${validMoves.length} valid moves.`
    );

    // --- 4. Handle No Valid Moves (Pass/End Game) ---
    if (validMoves.length === 0) {
        console.log(
            `[makeAIMove] P${currentPlayer} has no moves. Checking opponent...`
        );
        const opponent = currentPlayer === BLACK ? WHITE : BLACK;
        // Check opponent's moves based on the current board state
        if (getValidMoves(opponent, board).length === 0) {
            console.log(
                "[makeAIMove] Both players have no moves. Ending game."
            );
            aiThinking = false;
            endGame();
            return;
        }
        // Current player passes, switch to opponent
        console.log(`[makeAIMove] P${currentPlayer} passes.`);
        logPass(currentPlayer);
        currentPlayer = opponent;
        updateStatus();
        aiThinking = false; // Reset thinking BEFORE scheduling next turn check
        makeAIMove(isTournament); // Schedule check for the opponent's turn
        return;
    }

    // --- 5. Schedule AI Execution (Allows UI Update) ---
    const moveDelay = isTournament ? 0 : 250; // Delay for AI move
    if (gameLoopTimeout) clearTimeout(gameLoopTimeout); // Clear any previous timeout

    gameLoopTimeout = setTimeout(async () => {
        // Re-check state inside timeout callback for safety
        if (!gameRunning || gameOver || !aiThinking) {
            console.log(
                `[makeAIMove -> setTimeout] Aborting before AI execution. GameRunning: ${gameRunning}, GameOver: ${gameOver}, AIThinking: ${aiThinking}`
            );
            aiThinking = false;
            return;
        }
        console.log(
            `[makeAIMove -> setTimeout] Executing AI logic for ${aiIdentifier} (P${currentPlayer})`
        );

        try {
            // --- 6. Call AI Strategy Function with Time Tracking ---
            console.log(
                `[makeAIMove -> setTimeout] Calling strategy function for ${aiIdentifier}...`
            );
            const startTime = performance.now();

            // Create a deep copy of the board to pass to the AI
            const currentBoardState = board.map((r) => [...r]);

            // Pass the board state, player, the pre-calculated valid moves list, and makeMove simulator
            const move = await strategyFn(
                currentBoardState,
                currentPlayer,
                validMoves,
                makeMove
            );

            // Calculate time used for this move
            const endTime = performance.now();
            const moveTime = endTime - startTime;

            // Accumulate time used based on current player
            if (currentPlayer === BLACK) {
                blackTimeUsed += moveTime;
            } else {
                whiteTimeUsed += moveTime;
            }

            // Update timers in UI
            updateTimers();

            console.log(
                `[makeAIMove -> setTimeout] ${aiIdentifier} returned move:`,
                move,
                `in ${(moveTime / 1000).toFixed(3)}s (total: ${
                    currentPlayer === BLACK
                        ? blackTimeUsed.toFixed(0)
                        : whiteTimeUsed.toFixed(0)
                }ms)`
            );

            // Check if player exceeded time limit
            if (
                checkTimeLimit(
                    currentPlayer,
                    currentPlayer === BLACK
                        ? blackTimeUsed
                        : whiteTimeUsed
                )
            ) {
                return; // Game ended due to time limit violation
            }

            // --- 7. Validate AI's Returned Move & Handle Fallback ---
            let actualMove = move;
            let isFallback = false;

            // Check if move is null or if it's not actually in the list of valid moves calculated earlier
            const isReturnedMoveInList =
                move &&
                validMoves.some(
                    (v) => v.row === move.row && v.col === move.col
                );

            if (!move || !isReturnedMoveInList) {
                // --- Detailed Logging for Debugging ---
                console.log("--- Invalid Move Detected ---");
                console.log("AI Identifier:", aiIdentifier);
                console.log("Returned move:", move);
                console.log("Current player:", currentPlayer);
                console.log("Calculated validMoves:", validMoves); // Log the list AI should have chosen from
                if (move) {
                    // Optionally re-check with isValidMove for more info, but the primary check is inclusion in validMoves
                    console.log(
                        "isValidMove result (for info):",
                        isValidMove(
                            move.row,
                            move.col,
                            currentPlayer,
                            board
                        )
                    );
                }
                console.log("Current board state:");
                console.table(board);
                // --- End Detailed Logging ---

                // Fallback: Select a random move from the validMoves list
                actualMove =
                    validMoves[
                        Math.floor(
                            Math.random() * validMoves.length
                        )
                    ];
                isFallback = true;

                if (!actualMove) {
                    // Should not happen if validMoves.length > 0
                    console.error(
                        "Fallback failed - Could not select random move from non-empty list?"
                    );
                    useFallbackMove(currentPlayer, isTournament);
                    return;
                }
                console.log(
                    `[makeAIMove -> setTimeout] Fallback move selected:`,
                    actualMove
                );
            }

            // --- 8. Execute the Chosen Move ---
            console.log(
                `[makeAIMove -> setTimeout] Executing makeMove for P${currentPlayer}:`,
                actualMove
            );
            makeMove(actualMove.row, actualMove.col, currentPlayer); // makeMove logs the move and updates display

            // --- 9. Determine Next Player based on Rules ---
            const previousPlayer = currentPlayer; // Store current player before switching
            currentPlayer = determineNextPlayer();
            updateStatus(); // Update status for the NEW current player
            console.log(
                `[makeAIMove -> setTimeout] Switched player from P${previousPlayer} to P${currentPlayer}.`
            );

            // Check if same player continues (for fewer pieces rule)
            if (previousPlayer === currentPlayer) {
                console.log(
                    `[makeAIMove -> setTimeout] Same player (${getPlayerName(
                        currentPlayer
                    )}) continues (fewer pieces rule)`
                );
                logMessage(
                    `${getPlayerName(
                        currentPlayer
                    )} continues (fewer pieces rule)`
                );
            }

            aiThinking = false; // Reset thinking flag *** AFTER all synchronous work is done ***

            // Schedule the check for the next turn
            console.log(
                `[makeAIMove -> setTimeout] Scheduling check for next turn (P${currentPlayer}).`
            );
            makeAIMove(isTournament); // Recursively call to check next player's turn type
        } catch (error) {
            console.error(
                `[makeAIMove -> setTimeout] Error during AI logic or move execution (${aiIdentifier}):`,
                error
            );
            logMessage(
                `Error in AI move (${aiIdentifier}): ${error.message}. Using random move.`
            );

            // Add a small penalty time for error cases (100ms)
            if (currentPlayer === BLACK) {
                blackTimeUsed += 100;
            } else {
                whiteTimeUsed += 100;
            }
            updateTimers();

            // Check time limit before using fallback
            if (
                checkTimeLimit(
                    currentPlayer,
                    currentPlayer === BLACK
                        ? blackTimeUsed
                        : whiteTimeUsed
                )
            ) {
                return; // Game ended due to time limit violation
            }

            // Use fallback strategy when an error occurs
            useFallbackMove(currentPlayer, isTournament);
        }
    }, moveDelay); // End of setTimeout callback
}

/**
 * Helper function to handle fallback move selection when an AI strategy fails.
 * This keeps the game running by making a random valid move instead of ending the game.
 */
function useFallbackMove(player, isTournament) {
    // Get valid moves for current player
    const validMoves = getValidMoves(player, board);

    // If no valid moves, handle the pass scenario
    if (validMoves.length === 0) {
        const opponent = player === BLACK ? WHITE : BLACK;

        // Check if game should end (both players have no moves)
        if (getValidMoves(opponent, board).length === 0) {
            aiThinking = false;
            endGame();
            return;
        }

        // Handle pass
        logPass(player);
        currentPlayer = opponent;
        updateStatus();
        aiThinking = false;
        makeAIMove(isTournament);
        return;
    }

    // Add a small time penalty for using the random fallback strategy
    const randomStrategyTime = 100; // 100ms penalty for using fallback

    if (player === BLACK) {
        blackTimeUsed += randomStrategyTime;
    } else {
        whiteTimeUsed += randomStrategyTime;
    }

    // Update timers display
    updateTimers();

    // Check if the player has exceeded time limit even with just the penalty
    if (
        checkTimeLimit(
            player,
            player === BLACK ? blackTimeUsed : whiteTimeUsed
        )
    ) {
        return; // Game ended due to time limit violation
    }

    // Log that we're using random strategy
    logMessage(
        `${getPlayerName(
            player
        )} is using random strategy (fallback)`
    );

    // Select a random valid move
    const randomMove =
        validMoves[Math.floor(Math.random() * validMoves.length)];
    console.log(
        `[useFallbackMove] Selected random move for P${player}:`,
        randomMove
    );

    // Execute the move
    makeMove(randomMove.row, randomMove.col, player);

    // Determine next player
    const previousPlayer = player;
    currentPlayer = determineNextPlayer();

    // Check if same player continues (for fewer pieces rule)
    if (previousPlayer === currentPlayer) {
        console.log(
            `[useFallbackMove] Same player (${getPlayerName(
                currentPlayer
            )}) continues (fewer pieces rule)`
        );
        logMessage(
            `${getPlayerName(
                currentPlayer
            )} continues (fewer pieces rule)`
        );
    }

    updateStatus();

    // Reset thinking flag
    aiThinking = false;

    // Schedule next turn
    makeAIMove(isTournament);
}

// --- Game State Functions ---
// Add this function to determine next player based on piece count
function determineNextPlayer() {
    // Check if the current stage has the fewerPiecesContinue rule
    const stageConfig = currentStage || stages[0];
    const fewerPiecesContinue =
        stageConfig.fewerPiecesContinue || false;

    // If rule isn't active, just alternate turns as usual
    if (!fewerPiecesContinue) {
        return currentPlayer === BLACK ? WHITE : BLACK;
    }

    // Count pieces for each player
    const scores = countDiscs();

    // Determine who has fewer pieces
    if (scores.black < scores.white) {
        return BLACK; // Black has fewer pieces, so Black plays again
    } else if (scores.white < scores.black) {
        return WHITE; // White has fewer pieces, so White plays again
    } else {
        // Equal number of pieces, alternate turns
        return currentPlayer === BLACK ? WHITE : BLACK;
    }
}

// 9. Modify updateStatus function (to accept the winner as an argument)
function updateStatus(winner = null) {
    const s = countDiscs();

    if (gameRunning) {
        const ctrl =
            currentPlayer === BLACK
                ? blackAISelect.value
                : whiteAISelect.value;
        const pDisp = getPlayerName(currentPlayer);

        // Default status message
        statusElement.textContent = `${pDisp}'s turn (${s.black}-${s.white})`;

        // Add time display (optional)
        const blackTime = (blackTimeUsed / 1000).toFixed(1);
        const whiteTime = (whiteTimeUsed / 1000).toFixed(1);
        statusElement.textContent += ` [B:${blackTime}s W:${whiteTime}s]`;

        // Indicate if continuing due to fewer pieces rule
        const stageConfig = currentStage || stages[0];
        if (stageConfig.fewerPiecesContinue) {
            const playerHasFewerPieces =
                (currentPlayer === BLACK && s.black < s.white) ||
                (currentPlayer === WHITE && s.white < s.black);

            if (playerHasFewerPieces) {
                statusElement.textContent +=
                    " (continuing - fewer pieces)";
            }
        }

        // Apply styling
        statusElement.className =
            "status " + (ctrl === "human" ? "" : "thinking");
        statusElement.style.backgroundColor =
            ctrl === "human"
                ? currentPlayer === BLACK
                    ? "#333"
                    : "#999"
                : "#FFC107";
    } else {
        // Game over state
        let msg = `Game over. `;

        // If loss was due to timeout
        if (winner !== null) {
            const winnerName = winner === BLACK ? "Black" : "White";
            msg += `${winnerName} wins! (${s.black}-${s.white})`;

            // Show timeout forfeit (optional)
            if (
                (winner === BLACK &&
                    whiteTimeUsed > MAX_AI_TIME_PER_GAME) ||
                (winner === WHITE &&
                    blackTimeUsed > MAX_AI_TIME_PER_GAME)
            ) {
                msg += " (by time forfeit)";
            }
        } else {
            // Normal game end
            if (s.black > s.white)
                msg += `Black wins! (${s.black}-${s.white})`;
            else if (s.white > s.black)
                msg += `White wins! (${s.black}-${s.white})`;
            else msg += `Tie! (${s.black}-${s.white})`;
        }

        statusElement.textContent = msg;
        statusElement.style.backgroundColor = "#666";
    }

    // Update timers
    updateTimers();
}

function endGame(winner = null) {
    if (!gameRunning) return;
    gameRunning = false;
    startButton.disabled = false;

    const s = countDiscs();

    // Calculate the score normally if the loss was not due to a timeout.
    if (winner === null) {
        if (s.black > s.white) winner = BLACK;
        else if (s.white > s.black) winner = WHITE;
        // same score = winner is null
    }

    updateStatus(winner);

    if (!moveLog.some((l) => l.startsWith("Game over:"))) {
        logMessage(`Game over: Final score ${s.black}-${s.white}`);

        if (winner === BLACK) {
            logMessage(`Black wins!`);
        } else if (winner === WHITE) {
            logMessage(`White wins!`);
        } else {
            logMessage(`Tie!`);
        }
    }
}

async function startGame(isTournament = false, stageConfig = null) {
    console.log("[startGame] Start.");
    const selectedStage =
        stageConfig || stages[stageSelect.value] || stages[0];
    if (!selectedStage) {
        alert("Please select a valid stage.");
        return;
    }

    // initializeBoard는 isPreview=false로 호출되어 gameOver=false로 설정합니다.
    initializeBoard(selectedStage, false);

    gameRunning = true;
    blackTimeUsed = 0;
    whiteTimeUsed = 0;
    currentPlayer = BLACK;
    moveLog = [];
    gameStartLogged = false;

    if (!isTournament) {
        gameLogElement.innerHTML = "";
    }

    startButton.disabled = true;
    updateStatus();
    updateBoardDisplay();
    const blackName =
        blackAISelect.options[blackAISelect.selectedIndex].text;
    const whiteName =
        whiteAISelect.options[whiteAISelect.selectedIndex].text;
    logMessage(
        `Game started: ${blackName}(B) vs ${whiteName}(W) on Stage: ${selectedStage.name}`
    );

    console.log(
        `[startGame] Before setTimeout: gameRunning=<span class="math-inline">\{gameRunning\}, gameOver\=</span>{gameOver}`
    );

    // Check if the first player (Black) is human and has no valid moves at the start
    if (blackAISelect.value === "human") {
        const humanMoves = getValidMoves(BLACK);
        if (humanMoves.length === 0) {
            console.log(
                "Starting human player has no valid moves. Passing automatically."
            );
            logPass(BLACK);
            currentPlayer = WHITE;
            updateStatus();
        }
    }

    setTimeout(() => {
        console.log(
            `[startGame -> setTimeout] Inside callback: gameRunning=<span class="math-inline">\{gameRunning\}, gameOver\=</span>{gameOver}`
        );
        if (!gameRunning || gameOver) {
            console.warn(
                "[startGame -> setTimeout] Game ended before first move check."
            );
            return;
        }
        console.log(
            "[startGame -> setTimeout] Triggering first move check..."
        );
        makeAIMove(isTournament); // Start moves (will check if P1 is AI or Human)
    }, 10);
    console.log(
        "[startGame] Finish initial setup. First move check scheduled."
    );
}
function resetGame() {
    /* ... Uses stageConfig for preview ... */ console.log(
        "[resetGame] Function called!"
    );
    gameRunning = false;
    if (gameLoopTimeout) clearTimeout(gameLoopTimeout);
    gameLoopTimeout = null;
    aiThinking = false;
    const idx = stageSelect.value;
    const selStage =
        idx >= 0 && idx < stages.length ? stages[idx] : stages[0];
    initializeBoard(selStage, true);
    currentPlayer = BLACK;
    moveLog = ["Board reset."];
    updateGameLog();
    startButton.disabled = false;
    statusElement.textContent = "Ready to start.";
    statusElement.style.backgroundColor = "#4CAF50";
}

// --- Strategy Management Functions ---
// saveStrategy, clearEditor, loadStrategy, deleteStrategy, updateStrategyList, uploadStrategyFiles, finishUpload, loadSavedStrategies, updateAISelectors, getCompiledStrategy
// (Largely same as before, adapted for Othello variables)
function saveStrategy() {
    const n = strategyNameInput.value.trim();
    const c = jsCodeElement.value;
    if (!n) return alert("Name?");
    if (!c) return alert("Code?");
    if (!c.includes("studentStrategy") && !c.includes("function("))
        console.warn("Code might not be valid");
    savedStrategies[n] = c;
    localStorage.setItem(
        "othelloStrategies",
        JSON.stringify(savedStrategies)
    );
    compiledStudentAIs[n] = null;
    updateStrategyList();
    updateAISelectors();
    statusElement.textContent = `Saved "${n}".`;
    statusElement.style.backgroundColor = "#4CAF50";
}
function clearEditor() {
    jsCodeElement.value = "";
    strategyNameInput.value = "myOthelloStrategy";
}
function loadStrategy(n) {
    if (savedStrategies[n]) {
        jsCodeElement.value = savedStrategies[n];
        strategyNameInput.value = n;
        statusElement.textContent = `Loaded "${n}".`;
    }
}
function deleteStrategy(n) {
    if (confirm(`Delete "${n}"?`)) {
        delete savedStrategies[n];
        delete compiledStudentAIs[n];
        localStorage.setItem(
            "othelloStrategies",
            JSON.stringify(savedStrategies)
        );
        updateStrategyList();
        updateAISelectors();
        statusElement.textContent = `Deleted "${n}".`;
        statusElement.style.backgroundColor = "#f44336";
    }
}
function updateStrategyList() {
    strategyListElement.innerHTML = "";
    const nms = Object.keys(savedStrategies);
    if (nms.length === 0) {
        strategyListElement.innerHTML =
            '<div class="strategy-item"><span>No saved strategies</span></div>';
        return;
    }
    nms.sort().forEach((n) => {
        const i = document.createElement("div");
        i.className = "strategy-item";
        const s = document.createElement("span");
        s.textContent = n;
        i.appendChild(s);
        const b = document.createElement("div");
        b.className = "buttons";
        const lB = document.createElement("button");
        lB.textContent = "Edit";
        lB.onclick = () => loadStrategy(n);
        b.appendChild(lB);
        const dB = document.createElement("button");
        dB.textContent = "Delete";
        dB.className = "delete-btn";
        dB.onclick = () => deleteStrategy(n);
        b.appendChild(dB);
        i.appendChild(b);
        strategyListElement.appendChild(i);
    });
}
function uploadStrategyFiles() {
    const files = strategyFileInput.files;
    if (files.length === 0) return alert("Select files");
    uploadStatusMsg.textContent = `Processing ${files.length}...`;
    uploadStatusMsg.className = "upload-status";
    uploadStatusMsg.style.display = "block";
    let sC = 0,
        eC = 0;
    Array.from(files).forEach((f, idx) => {
        const r = new FileReader();
        r.onload = (e) => {
            try {
                const c = e.target.result;
                const n = f.name.replace(/\.js$/, "");
                if (!c || !n) throw new Error("Empty");
                if (
                    !c.includes("studentStrategy") &&
                    !c.includes("function(")
                )
                    console.warn(
                        `File ${f.name} might not be valid.`
                    );
                savedStrategies[n] = c;
                compiledStudentAIs[n] = null;
                sC++;
            } catch (err) {
                eC++;
                console.error(`File ${f.name} Err:`, err);
            }
            if (sC + eC === files.length) finishUpload(sC, eC);
        };
        r.onerror = () => {
            eC++;
            if (sC + eC === files.length) finishUpload(sC, eC);
        };
        r.readAsText(f);
    });
}
function finishUpload(sC, eC) {
    localStorage.setItem(
        "othelloStrategies",
        JSON.stringify(savedStrategies)
    );
    updateStrategyList();
    updateAISelectors();
    strategyFileInput.value = "";
    let msg = "",
        cls = "upload-status ";
    if (eC === 0) {
        msg = `Uploaded ${sC} strategies!`;
        cls += "upload-success";
    } else {
        msg = `${sC} OK, ${eC} Fail.`;
        cls += sC > 0 ? "" : "upload-error";
    }
    uploadStatusMsg.textContent = msg;
    uploadStatusMsg.className = cls;
    setTimeout(() => {
        uploadStatusMsg.style.display = "none";
    }, 4800);
    statusElement.textContent = msg;
    statusElement.style.backgroundColor =
        eC === 0 ? "#4CAF50" : "#FF9800";
}
function loadSavedStrategies() {
    const d = localStorage.getItem("othelloStrategies");
    if (d) {
        try {
            savedStrategies = JSON.parse(d);
        } catch (e) {
            console.error("Err load strats", e);
            savedStrategies = {};
        }
    } else {
        savedStrategies = {};
    }
    compiledStudentAIs = {};
    updateStrategyList();
}
// *** updateAISelectors Corrected for Othello ***
function updateAISelectors() {
    console.log(
        "[updateAISelectors] Populating Othello selectors..."
    );
    const bV = blackAISelect.value;
    const wV = whiteAISelect.value;
    blackAISelect.innerHTML = "";
    whiteAISelect.innerHTML = "";

    // Add Human option
    const humanOptB = document.createElement("option");
    humanOptB.value = "human";
    humanOptB.textContent = "Human";
    blackAISelect.appendChild(humanOptB);

    const humanOptW = document.createElement("option");
    humanOptW.value = "human";
    humanOptW.textContent = "Human";
    whiteAISelect.appendChild(humanOptW);

    try {
        // Add built-in strategies
        const builtInOptG = document.createElement("optgroup");
        builtInOptG.label = "Built-in AI";

        const builtInN = Object.keys(builtInStrategies)
            .filter((k) => k !== "custom")
            .sort();
        if (builtInN.length > 0) {
            builtInN.forEach((n) => {
                const opt = document.createElement("option");
                opt.value = n;
                opt.textContent =
                    n.charAt(0).toUpperCase() + n.slice(1);
                builtInOptG.appendChild(opt);
            });

            blackAISelect.appendChild(builtInOptG.cloneNode(true));
            whiteAISelect.appendChild(builtInOptG.cloneNode(true));
        }
    } catch (e) {
        console.error("Error adding built-in AIs:", e);
    }

    try {
        // Add custom strategies
        const customN = Object.keys(savedStrategies).sort();
        if (customN.length > 0) {
            const customOptG = document.createElement("optgroup");
            customOptG.label = "Custom Strategies";

            customN.forEach((n) => {
                const opt = document.createElement("option");
                opt.value = `custom_${n}`;
                opt.textContent = n;
                customOptG.appendChild(opt);
            });

            blackAISelect.appendChild(customOptG.cloneNode(true));
            whiteAISelect.appendChild(customOptG.cloneNode(true));
        }
    } catch (e) {
        console.error("Error adding custom strategies:", e);
    }

    try {
        // Restore previously selected values if available
        blackAISelect.value = Array.from(
            blackAISelect.options
        ).some((o) => o.value === bV)
            ? bV
            : "greedy";
        whiteAISelect.value = Array.from(
            whiteAISelect.options
        ).some((o) => o.value === wV)
            ? wV
            : "corners";
    } catch (e) {
        console.error("Error restoring AI selector values:", e);
        blackAISelect.value = "greedy";
        whiteAISelect.value = "corners";
    }

    console.log("[updateAISelectors] Finished.");
}
// *** getCompiledStrategy for Othello (4 args) ***
/**
 * Retrieves a compiled strategy function based on the controller ID.
 * Handles built-in strategies and custom strategies (both script-style and function-style).
 * Caches compiled custom strategies.
 *
 * Relies on outer scope variables:
 * - savedStrategies: Object mapping custom strategy names to their code strings.
 * - compiledStudentAIs: Object used as a cache for compiled custom functions.
 * - builtInStrategies: Object mapping built-in strategy IDs to their functions.
 *
 * @param {string} controllerId - The ID of the strategy (e.g., 'greedy', 'custom_myStrategy').
 * @param {number} player - The player ID (1 for Black, 2 for White). Although passed,
 * this specific function doesn't currently use it directly,
 * but it's kept for signature consistency with the calling code.
 * @returns {Function|null} The compiled strategy function or null if not found/error.
 */
function getCompiledStrategy(controllerId, player) {
    // 1. Handle Custom Strategies (ID starts with 'custom_')
    if (controllerId.startsWith("custom_")) {
        const strategyName = controllerId.replace("custom_", "");

        // 1a. Check cache first for performance
        if (compiledStudentAIs[strategyName]) {
            // console.log(`Using cached strategy: ${strategyName}`); // Optional debug log
            return compiledStudentAIs[strategyName];
        }

        // 1b. Check if the strategy code exists in storage
        if (savedStrategies[strategyName]) {
            console.log(
                `Compiling Othello strategy: ${strategyName}`
            );
            const code = savedStrategies[strategyName]; // The raw code string

            // 1c. Detect strategy type: Guess it's OLD script style if it LACKS "function studentStrategy"
            const looksLikeOldScript = !code.includes(
                "function studentStrategy"
            );

            let compiledFunc = null; // To hold the result of new Function()

            // 1d. Use the appropriate wrapper based on detection
            if (looksLikeOldScript) {
                // --- Compile OLD SCRIPT-STYLE Strategy ---
                console.log(
                    `-> Using script-style wrapper for ${strategyName}`
                );
                try {
                    // Create a function that simulates the old environment
                    compiledFunc = new Function(
                        "boardArg",
                        "playerArg",
                        "validMovesArg",
                        "makeMoveFunc",
                        `
                // Define variables the script expects ('board', 'player', 'getValidMoves')
                const board = boardArg;
                const player = playerArg;
                // Provide 'getValidMoves' that returns the pre-calculated list
                const getValidMoves = (p_ignored) => validMovesArg;

                // --- Execute the user's script code ---
                ${code}
                // --- End of user's script code ---

                // Assume the script calculated 'bestMove'. Return it.
                // Add safety check in case 'bestMove' isn't defined.
                if (typeof bestMove === 'undefined') {
                console.warn("Script ${strategyName} finished, but 'bestMove' variable is undefined. Returning null.");
                return null;
                }
                return bestMove;
            `
                    );
                } catch (e) {
                    // Handle errors during script compilation or execution
                    console.error(
                        `Compile/Exec Err (Script ${strategyName}):`,
                        e
                    );
                    return null; // Failed
                }
            } else {
                // --- Compile NEW FUNCTION-STYLE Strategy (expects studentStrategy) ---
                console.log(
                    `-> Using function-style wrapper for ${strategyName}`
                );
                try {
                    // Use the original wrapper that expects 'studentStrategy' to be defined
                    compiledFunc = new Function(
                        "boardArg",
                        "playerArg",
                        "validMovesArg",
                        "makeMoveFunc",
                        `${code}\nreturn studentStrategy(boardArg, playerArg, validMovesArg, makeMoveFunc);`
                    );
                } catch (e) {
                    // Handle errors during function compilation
                    console.error(
                        `Compile Err (Function ${strategyName}):`,
                        e
                    );
                    return null; // Failed
                }
            }

            // 1e. Cache the successfully compiled function and return it
            if (compiledFunc) {
                compiledStudentAIs[strategyName] = compiledFunc;
                return compiledFunc;
            }
            // If compilation failed in try/catch, compiledFunc remains null, fall through to error
        } else {
            // Code for the custom strategy name wasn't found
            console.error(
                `Code not found for custom strategy: ${strategyName}`
            );
            return null;
        }
    }
    // 2. Handle Built-In Strategies (Not 'custom_')
    else if (builtInStrategies[controllerId]) {
        // console.log(`Using built-in strategy: ${controllerId}`); // Optional debug log
        return builtInStrategies[controllerId];
    }

    // 3. Strategy ID Not Recognized (Neither custom nor built-in)
    console.error(
        `Strategy function not found or invalid ID: ${controllerId}`
    );
    return null;
}

// --- Intelligent System Functions ---
function uploadIntelligentSystem() {
    const file = intelligentSystemFileInput.files[0];
    if (!file) {
        alert("Please select an intelligent system file to upload");
        return;
    }

    // 버튼 비활성화 및 초기 피드백 제공
    uploadIntelligentSystemButton.disabled = true;
    intelligentSystemStatus.textContent = `Reading file: ${file.name}...`;
    intelligentSystemStatus.style.display = "block";
    intelligentSystemStatus.className = "intelligent-system-status";

    // 프로그레스 바 초기화 및 표시
    intelligentSystemProgress.style.display = "block";
    intelligentSystemProgressBar.style.width = "5%";

    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            // 파일 읽기 완료 피드백
            intelligentSystemStatus.textContent = `Validating file: ${file.name}...`;
            intelligentSystemProgressBar.style.width = "15%";

            const code = e.target.result;
            const systemName = file.name.replace(/\.js$/, "");

            // Validate code contains analyzeStage function
            if (
                !code.includes("function analyzeStage") &&
                !code.includes("analyzeStage =")
            ) {
                throw new Error(
                    "The intelligent system must implement an 'analyzeStage' function"
                );
            }

            // 검증 완료 피드백
            intelligentSystemStatus.textContent = `System validated. Preparing analysis...`;
            intelligentSystemProgressBar.style.width = "25%";

            // Store the system code
            intelligentSystems[systemName] = code;

            // Clear any previously compiled versions
            compiledIntelligentSystems[systemName] = null;

            // 약간의 딜레이를 주어 UI 업데이트가 표시될 수 있도록 함
            await new Promise((resolve) =>
                setTimeout(resolve, 300)
            );

            // Run analysis for current stage
            const selectedStageIndex = parseInt(stageSelect.value);
            const selectedStage = stages[selectedStageIndex];

            intelligentSystemStatus.textContent = `Starting analysis on ${selectedStage.name}... (This will take up to 60 seconds)`;
            intelligentSystemProgressBar.style.width = "30%";

            // Analyze the stage
            await analyzeStageWithSystem(systemName, selectedStage);

            // Save to localStorage
            localStorage.setItem(
                "othelloIntelligentSystems",
                JSON.stringify(intelligentSystems)
            );

            // Update selectors
            updateAISelectors();
        } catch (error) {
            console.error(
                "Error uploading intelligent system:",
                error
            );
            intelligentSystemStatus.textContent = `Error: ${error.message}`;
            intelligentSystemStatus.style.display = "block";
            intelligentSystemStatus.className =
                "intelligent-system-status upload-error";
            intelligentSystemProgressBar.style.width = "0%";
            uploadIntelligentSystemButton.disabled = false;
        }
    };

    reader.onerror = () => {
        intelligentSystemStatus.textContent = "Error reading file";
        intelligentSystemStatus.style.display = "block";
        intelligentSystemStatus.className =
            "intelligent-system-status upload-error";
        intelligentSystemProgressBar.style.width = "0%";
        uploadIntelligentSystemButton.disabled = false;
    };

    reader.readAsText(file);
}

async function analyzeStageWithSystem(systemName, stageConfig) {
    if (isIntelligentSystemAnalyzing) {
        console.warn(
            "Another analysis is already in progress. Please wait."
        );
        intelligentSystemStatus.textContent =
            "Previous analysis is still running...";
        intelligentSystemStatus.className =
            "intelligent-system-status upload-error";
        intelligentSystemStatus.style.display = "block";
        return;
    }

    console.log(
        `[Main] Starting analysis process for system: ${systemName} on stage: ${stageConfig.name}`
    );
    isIntelligentSystemAnalyzing = true;
    currentAnalysisStage = stageConfig;

    // --- UI Setup ---
    intelligentSystemProgress.style.display = "block";
    intelligentSystemProgressBar.style.width = "0%";
    intelligentSystemStatus.style.display = "block";
    intelligentSystemStatus.textContent = `Preparing analysis for ${systemName} on ${stageConfig.name}...`;
    intelligentSystemStatus.className = "intelligent-system-status";
    uploadIntelligentSystemButton.disabled = true;

    // --- Analysis Setup ---
    const startTime = Date.now(); // Record start time
    const analysisTimeout = 60000; // 60 seconds timeout
    let analysisTimedOut = false; // Flag to track timeout status

    // --- Progress Simulation ---
    let progress = 0;
    const progressInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        // Calculate progress based on time (up to 95%)
        progress = Math.min(
            95,
            Math.floor((elapsed / analysisTimeout) * 100)
        );
        intelligentSystemProgressBar.style.width = `${progress}%`;

        // Show remaining time
        const remainingSeconds = Math.max(
            0,
            Math.ceil((analysisTimeout - elapsed) / 1000)
        );
        intelligentSystemStatus.textContent = `Analyzing ${stageConfig.name} with ${systemName}... (${progress}%, ${remainingSeconds}s remaining)`;
    }, 500); // Update every 500ms

    // --- Hard timeout check ---
    // This interval will force timeout even if analysis function blocks CPU
    const hardTimeoutId = setInterval(() => {
        const currentTime = Date.now();
        if (currentTime - startTime >= analysisTimeout) {
            console.warn(
                `[Main] Hard timeout triggered after ${analysisTimeout}ms`
            );

            // Clean up intervals
            clearInterval(hardTimeoutId);
            clearInterval(progressInterval);

            // Mark analysis as no longer running
            isIntelligentSystemAnalyzing = false;
            currentAnalysisStage = null;

            // Set failure message with elapsed time
            const elapsedSeconds = (
                (currentTime - startTime) /
                1000
            ).toFixed(1);
            intelligentSystemStatus.textContent = `Analysis timed out after ${elapsedSeconds}s (limit: ${
                analysisTimeout / 1000
            }s)`;
            intelligentSystemStatus.className =
                "intelligent-system-status upload-error";
            intelligentSystemProgressBar.style.width = "100%";

            // Re-enable button
            uploadIntelligentSystemButton.disabled = false;

            // Set flag to exit function
            analysisTimedOut = true;
        }
    }, 200); // Check every 200 ms

    let generatedStrategy = null;
    let analysisError = null; // Store any analysis errors

    try {
        // --- Compile the Intelligent System ---
        const analyzeFunction =
            compileIntelligentSystem(systemName);
        if (!analyzeFunction) {
            throw new Error("Failed to compile intelligent system");
        }

        // --- Prepare Stage Data ---
        const analysisBoard = Array(stageConfig.boardSize)
            .fill()
            .map(() => Array(stageConfig.boardSize).fill(EMPTY));
        (stageConfig.initialBlocked || []).forEach((p) => {
            if (isWithinBoard(p.r, p.c))
                analysisBoard[p.r][p.c] = BLOCKED;
        });
        (stageConfig.initialPlayer1 || []).forEach((p) => {
            if (
                isWithinBoard(p.r, p.c) &&
                analysisBoard[p.r][p.c] === EMPTY
            )
                analysisBoard[p.r][p.c] = BLACK;
        });
        (stageConfig.initialPlayer2 || []).forEach((p) => {
            if (
                isWithinBoard(p.r, p.c) &&
                analysisBoard[p.r][p.c] === EMPTY
            )
                analysisBoard[p.r][p.c] = WHITE;
        });
        const initialValidMoves = getValidMoves(
            BLACK,
            analysisBoard
        ); // Assuming Black starts

        // --- Setup Promises for Race ---
        const analysisPromise = new Promise((resolve) => {
            try {
                // Execute analysis function
                console.log(
                    `[Main] Executing analyzeFunction for ${systemName}...`
                );
                const result = analyzeFunction(
                    stageConfig.name,
                    stageConfig.boardSize,
                    analysisBoard,
                    initialValidMoves
                );
                resolve(result); // Return result on success
            } catch (execError) {
                console.error(
                    `[Main] Error during analyzeFunction execution:`,
                    execError
                );
                analysisError = execError;
                resolve(null);
            }
        });

        const timeoutPromise = new Promise((_, reject) => {
            // This regular timeout may not work if CPU is blocked
            setTimeout(() => {
                console.log(
                    `[Main] Regular timeout triggered after ${analysisTimeout}ms`
                );
                reject(
                    new Error(
                        `Analysis timed out (${
                            analysisTimeout / 1000
                        }s)`
                    )
                );
            }, analysisTimeout);
        });

        // --- Run the Race ---
        console.log(
            `[Main] Waiting for analysis result or timeout (${analysisTimeout}ms)...`
        );

        // Stop early if hard timeout was triggered
        if (!analysisTimedOut) {
            generatedStrategy = await Promise.race([
                analysisPromise,
                timeoutPromise,
            ]);
            console.log(`[Main] Promise.race completed.`);
        }

        // Clean up the hard timeout
        clearInterval(hardTimeoutId);

        // Exit if hard timeout was triggered
        if (analysisTimedOut) {
            return;
        }
    } catch (error) {
        // Promise.race rejected (typically timeout)
        console.error(`[Main] Promise.race failed:`, error.message);
        analysisError = error;
        generatedStrategy = null;

        // Clean up the hard timeout
        clearInterval(hardTimeoutId);

        // Exit if hard timeout was triggered
        if (analysisTimedOut) {
            return;
        }
    } finally {
        // --- Final time check ---
        const endTime = Date.now();
        const elapsedTime = endTime - startTime;
        console.log(
            `[Main] Final check: Elapsed time = ${elapsedTime}ms`
        );

        // If we exceeded timeout but didn't trigger hard timeout yet
        if (!analysisTimedOut && elapsedTime > analysisTimeout) {
            console.warn(
                `[Main] Analysis took too long (${elapsedTime}ms), exceeding timeout (${analysisTimeout}ms). Discarding result.`
            );
            generatedStrategy = null;
            analysisError = new Error(
                `Analysis exceeded timeout limit (${elapsedTime}ms > ${analysisTimeout}ms)`
            );
        }

        // Clean up any intervals that might still be running
        clearInterval(progressInterval);
    }

    // --- Process Result ---
    if (
        generatedStrategy &&
        typeof generatedStrategy === "function" &&
        !analysisTimedOut
    ) {
        // Success: Valid strategy function and didn't timeout
        try {
            // Calculate elapsed time
            const elapsedSeconds = (
                (Date.now() - startTime) /
                1000
            ).toFixed(1);

            console.log(
                "[Main] Analysis successful. Compiling and saving strategy."
            );
            const strategyCodeString = generatedStrategy.toString();
            const finalStrategyCode = `function studentStrategy(board, player, validMoves, makeMove) {
    // Strategy generated by ${systemName} for ${stageConfig.name}
    const generatedFunc = (${strategyCodeString});
    return generatedFunc(board, player, validMoves, makeMove);
}`;

            // Quick validation check
            new Function(
                "board",
                "player",
                "validMoves",
                "makeMove",
                `return (${finalStrategyCode})(board, player, validMoves, makeMove);`
            );

            const generatedStrategyName = `${systemName}_${stageConfig.name.replace(
                /\s+/g,
                "_"
            )}`;
            savedStrategies[generatedStrategyName] =
                finalStrategyCode;
            compiledStudentAIs[generatedStrategyName] = null;
            localStorage.setItem(
                "othelloStrategies",
                JSON.stringify(savedStrategies)
            );

            // Update UI
            updateStrategyList();
            updateAISelectors();
            intelligentSystemStatus.textContent = `Analysis complete! Generated strategy: ${generatedStrategyName} (took ${elapsedSeconds}s)`;
            intelligentSystemStatus.className =
                "intelligent-system-status upload-success";
        } catch (saveError) {
            console.error(
                "[Main] Error processing or saving the generated strategy:",
                saveError
            );
            intelligentSystemStatus.textContent = `Internal Error: Failed to process generated strategy. ${saveError.message}`;
            intelligentSystemStatus.className =
                "intelligent-system-status upload-error";
        }
    } else if (!analysisTimedOut) {
        // Failure: Timeout, analysis function error, or invalid return value
        const elapsedSeconds = (
            (Date.now() - startTime) /
            1000
        ).toFixed(1);

        let failureMsg = `Analysis failed to generate a valid strategy (took ${elapsedSeconds}s).`;
        if (analysisError) {
            failureMsg = `Analysis failed: ${analysisError.message} (took ${elapsedSeconds}s)`;
        }
        console.warn(`[Main] ${failureMsg}`);
        intelligentSystemStatus.textContent = failureMsg;
        intelligentSystemStatus.className =
            "intelligent-system-status upload-error";
    }

    // --- Final State Reset ---
    isIntelligentSystemAnalyzing = false;
    currentAnalysisStage = null;
    uploadIntelligentSystemButton.disabled = false;

    console.log("[Main] Analysis process finished.");
}

function compileIntelligentSystem(systemName) {
    // Check if already compiled
    if (compiledIntelligentSystems[systemName]) {
        return compiledIntelligentSystems[systemName];
    }

    // Get the system code
    const code = intelligentSystems[systemName];
    if (!code) {
        console.error(
            `Intelligent system not found: ${systemName}`
        );
        return null;
    }

    try {
        // Create a function that will return the analyzeStage function
        const compiledFunc = new Function(`
${code}

// Return the analyzeStage function
return typeof analyzeStage === 'function' ? analyzeStage : null;
`);

        // Execute to get the analyzeStage function
        const analyzeStageFunc = compiledFunc();

        if (!analyzeStageFunc) {
            throw new Error(
                "analyzeStage function not found in the intelligent system"
            );
        }

        // Cache the compiled function
        compiledIntelligentSystems[systemName] = analyzeStageFunc;

        return analyzeStageFunc;
    } catch (error) {
        console.error(
            `Error compiling intelligent system ${systemName}:`,
            error
        );
        return null;
    }
}

function loadSavedIntelligentSystems() {
    const data = localStorage.getItem("othelloIntelligentSystems");
    if (data) {
        try {
            intelligentSystems = JSON.parse(data);
        } catch (error) {
            console.error(
                "Error loading intelligent systems:",
                error
            );
            intelligentSystems = {};
        }
    } else {
        intelligentSystems = {};
    }
    compiledIntelligentSystems = {};
}

// --- Helper Functions ---
function getPlayerName(player) {
    const sel = player === BLACK ? blackAISelect : whiteAISelect;
    const ctrlId = sel.value;

    if (ctrlId === "human") return "Human";

    if (ctrlId.startsWith("custom_")) {
        const fullName = ctrlId.replace("custom_", "");
        // Check if name is too long (adjust the 20 character limit as needed)
        if (fullName.length > 20) {
            return fullName.substring(0, 18) + "..."; // Truncate with ellipsis
        }
        return fullName;
    }

    if (builtInStrategies[ctrlId]) {
        return ctrlId.charAt(0).toUpperCase() + ctrlId.slice(1);
    }

    return "?";
}
function displayMessage(msg, type = "") {
    statusElement.textContent = msg;
    statusElement.className = "status " + type;
}
function logMessage(msg) {
    moveLog.push(msg);
    updateGameLog();
}
function logMove(row, col, player) {
    const pName = getPlayerName(player);
    const cL = String.fromCharCode(97 + col);
    const rN = row + 1;
    logMessage(`${pName}: ${cL}${rN}`);
}
function logPass(player) {
    const pName = getPlayerName(player);
    logMessage(`${pName} passes`);
}
function updateGameLog() {
    gameLogElement.innerHTML = moveLog.join("<br>");
    gameLogElement.scrollTop = gameLogElement.scrollHeight;
}
function updateTimers() {
    const blackSeconds = (blackTimeUsed / 1000).toFixed(2);
    const whiteSeconds = (whiteTimeUsed / 1000).toFixed(2);
    blackTimerElement.textContent = `${blackSeconds}s`;
    whiteTimerElement.textContent = `${whiteSeconds}s`;
    if (blackTimeUsed >= 4000) {
        document
            .querySelector(".timer.black")
            .classList.add("warning");
    } else {
        document
            .querySelector(".timer.black")
            .classList.remove("warning");
    }
    if (whiteTimeUsed >= 4000) {
        document
            .querySelector(".timer.white")
            .classList.add("warning");
    } else {
        document
            .querySelector(".timer.white")
            .classList.remove("warning");
    }
    if (blackTimeUsed >= 4500) {
        document
            .querySelector(".timer.black")
            .classList.add("danger");
    } else {
        document
            .querySelector(".timer.black")
            .classList.remove("danger");
    }
    if (whiteTimeUsed >= 4500) {
        document
            .querySelector(".timer.white")
            .classList.add("danger");
    } else {
        document
            .querySelector(".timer.white")
            .classList.remove("danger");
    }
}

function checkTimeLimit(player, timeUsed) {
    if (timeUsed > MAX_AI_TIME_PER_GAME) {
        const playerName = player === BLACK ? "Black" : "White";
        const aiName = getPlayerName(player);
        logMessage(
            `${playerName} (${aiName}) exceeded the time limit of ${
                MAX_AI_TIME_PER_GAME / 1000
            }s!`
        );
        const opponent = player === BLACK ? WHITE : BLACK;
        const opponentName = opponent === BLACK ? "Black" : "White";
        logMessage(`${opponentName} wins by time forfeit!`);

        // 모든 빈 칸과 패배자의 말까지 승자의 색으로 바꿈
        const winningColor = opponent;
        for (let r = 0; r < BOARD_SIZE; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
                if (
                    board[r][c] !== BLOCKED &&
                    board[r][c] !== winningColor
                ) {
                    board[r][c] = winningColor;
                }
            }
        }
        updateBoardDisplay();
        endGame(opponent);
        return true;
    }
    return false;
}

// --- Tournament/Leaderboard Functions ---
// recordGameResult, runTournament, playTournamentGame, updateLeaderboardDisplay, saveLeaderboardData, loadLeaderboardData
// (Mostly same, ensure uses logMessage/updateGameLog correctly)
function recordGameResult(blackName, whiteName, winner) {
    const s = countDiscs();
    const match = {
        black: blackName,
        white: whiteName,
        winner: winner,
        date: new Date().toISOString(),
        score: s,
    };
    leaderboardData.matches.push(match);
    [blackName, whiteName].forEach((n) => {
        if (!leaderboardData.results[n])
            leaderboardData.results[n] = {
                wins: 0,
                losses: 0,
                draws: 0,
                totalGames: 0,
            };
    });
    if (winner === 1) {
        leaderboardData.results[blackName].wins++;
        leaderboardData.results[whiteName].losses++;
    } else if (winner === 2) {
        leaderboardData.results[blackName].losses++;
        leaderboardData.results[whiteName].wins++;
    } else {
        leaderboardData.results[blackName].draws++;
        leaderboardData.results[whiteName].draws++;
    }
    leaderboardData.results[blackName].totalGames++;
    leaderboardData.results[whiteName].totalGames++;
    saveLeaderboardData();
}
function playTournamentGame() {
    return new Promise((resolve) => {
        gameStartLogged = false;
        moveLog = [];
        startGame(true, currentTournamentStageConfig);

        const checkInterval = setInterval(() => {
            if (!gameRunning) {
                clearInterval(checkInterval);
                const scores = countDiscs();
                let winner = 0;

                if (scores.black > scores.white) winner = 1;
                else if (scores.white > scores.black) winner = 2;

                const blackName =
                    blackAISelect.options[
                        blackAISelect.selectedIndex
                    ].text;
                const whiteName =
                    whiteAISelect.options[
                        whiteAISelect.selectedIndex
                    ].text;

                // Record the result in the leaderboard data
                recordGameResult(blackName, whiteName, winner);

                // Update the leaderboard display immediately after each game
                updateLeaderboardDisplay();

                logMessage(
                    `Result: ${blackName} ${scores.black} - ${whiteName} ${scores.white}`
                );
                console.log(
                    `Game result: ${blackName} ${scores.black} - ${whiteName} ${scores.white}`
                );

                setTimeout(resolve, 50);
            }
        }, 100);
    });
}

async function runTournament() {
    if (gameRunning || !confirm("Run tournament?")) return;

    console.log("=== Othello Tournament Start ===");
    tournamentStatusElement.textContent = "Running...";
    runTournamentButton.disabled = true;
    moveLog = [];
    updateGameLog();

    // Get all available strategies
    const allStrategies = [];

    Object.keys(builtInStrategies)
        .filter((k) => k !== "custom")
        .sort()
        .forEach((n) =>
            allStrategies.push({
                id: n,
                name: n.charAt(0).toUpperCase() + n.slice(1),
            })
        );

    Object.keys(savedStrategies)
        .sort()
        .forEach((n) =>
            allStrategies.push({ id: `custom_${n}`, name: n })
        );

    if (allStrategies.length < 2) {
        tournamentStatusElement.textContent = "Need >= 2 AIs";
        runTournamentButton.disabled = false;
        return;
    }

    const selectedIndex = parseInt(stageSelect.value);
    currentTournamentStageConfig =
        selectedIndex >= 0 && selectedIndex < stages.length
            ? stages[selectedIndex]
            : stages[0];

    console.log(
        `Tournament using stage: ${currentTournamentStageConfig.name}`
    );
    logMessage(
        `=== Tournament Start on Stage: ${currentTournamentStageConfig.name} ===`
    );

    const totalG =
        allStrategies.length * (allStrategies.length - 1);
    let played = 0;

    // Initialize fresh leaderboard data
    leaderboardData = { matches: [], results: {} };

    // Initial display update for empty leaderboard
    updateLeaderboardDisplay();

    tournamentStatusElement.textContent = `Running... (0/${totalG}) on ${currentTournamentStageConfig.name}`;

    for (let i = 0; i < allStrategies.length; i++) {
        for (let j = 0; j < allStrategies.length; j++) {
            if (i === j) continue;

            const p1S = allStrategies[i];
            const p2S = allStrategies[j];

            played++;
            tournamentStatusElement.textContent = `Running... (${played}/${totalG}) on ${currentTournamentStageConfig.name}`;
            logMessage(
                `Game ${played}: ${p1S.name}(B) vs ${p2S.name}(W)`
            );
            console.log(
                `Game ${played}: ${p1S.name} vs ${p2S.name}`
            );

            await new Promise((r) => setTimeout(r, 10));
            blackAISelect.value = p1S.id;
            whiteAISelect.value = p2S.id;

            await playTournamentGame();
            await new Promise((r) => setTimeout(r, 10));
        }
    }

    tournamentStatusElement.textContent = `Tournament Complete! (${totalG} games on ${currentTournamentStageConfig.name})`;
    runTournamentButton.disabled = false;
    currentTournamentStageConfig = null;
    logMessage(`=== Tournament Finished ===`);
    console.log("=== Othello Tournament Finished ===");
}

// --- Enhanced updateLeaderboardDisplay function (unchanged, included for completeness) ---
function updateLeaderboardDisplay() {
    leaderboardBody.innerHTML = "";

    const lb = Object.keys(leaderboardData.results).map((n) => {
        const s = leaderboardData.results[n];
        return {
            name: n,
            wins: s.wins,
            losses: s.losses,
            draws: s.draws,
            totalGames: s.totalGames,
            winRate:
                s.totalGames > 0
                    ? (
                          ((s.wins + s.draws * 0.5) /
                              s.totalGames) *
                          100
                      ).toFixed(1)
                    : 0,
        };
    });

    lb.sort((a, b) => b.winRate - a.winRate || b.wins - a.wins);

    lb.forEach((entry, idx) => {
        const row = document.createElement("tr");
        row.innerHTML = `<td>${idx + 1}</td><td>${
            entry.name
        }</td><td>${entry.winRate}%</td><td>${entry.wins}</td><td>${
            entry.losses
        }</td><td>${entry.draws}</td><td>${entry.totalGames}</td>`;
        leaderboardBody.appendChild(row);
    });
}

function saveLeaderboardData() {
    localStorage.setItem(
        "othelloLeaderboard",
        JSON.stringify(leaderboardData)
    );
}
function loadLeaderboardData() {
    const d = localStorage.getItem("othelloLeaderboard");
    if (d) {
        try {
            leaderboardData = JSON.parse(d);
        } catch (e) {
            console.error("Err load LB", e);
            leaderboardData = { matches: [], results: {} };
        }
    } else {
        leaderboardData = { matches: [], results: {} };
    }
    updateLeaderboardDisplay();
}

function resetTournament() {
    if (gameRunning) {
        alert(
            "Cannot reset tournament data while a game is running."
        );
        return;
    }

    if (
        confirm(
            "Are you sure you want to reset all tournament records?"
        )
    ) {
        // Reset the leaderboard data
        leaderboardData = { matches: [], results: {} };

        // Save the empty data to localStorage
        saveLeaderboardData();

        // Update the UI
        updateLeaderboardDisplay();

        // Show confirmation message
        tournamentStatusElement.textContent =
            "Tournament records have been reset.";

        console.log("Tournament records reset.");
    }
}

// --- Initial Setup ---
function populateStageSelect() {
    stages.forEach((stage, idx) => {
        const opt = document.createElement("option");
        opt.value = idx;
        opt.textContent = `${idx + 1}: ${stage.name}`;
        stageSelect.appendChild(opt);
    });
}
function initializeApp() {
    console.log("Initializing Othello Arena w/ Stages...");
    populateStageSelect();
    loadSavedStrategies();
    loadSavedIntelligentSystems(); // Add this line
    updateAISelectors();
    loadLeaderboardData();
    if (stages.length > 0) {
        initializeBoard(stages[0], true);
    } else {
        initializeBoard(null, true);
    }

    // Add event listeners
    boardElement.addEventListener("click", handleHumanMove);
    startButton.addEventListener("click", () => {
        const idx = stageSelect.value;
        if (idx >= 0 && idx < stages.length)
            startGame(false, stages[idx]);
        else alert("Select Stage");
    });
    resetButton.addEventListener("click", resetGame);
    saveStrategyButton.addEventListener("click", saveStrategy);
    clearEditorButton.addEventListener("click", clearEditor);
    uploadStrategiesButton.addEventListener(
        "click",
        uploadStrategyFiles
    );
    runTournamentButton.addEventListener("click", runTournament);
    document
        .getElementById("reset-tournament-btn")
        .addEventListener("click", resetTournament);

    // Add this event listener for intelligent system upload
    uploadIntelligentSystemButton.addEventListener(
        "click",
        uploadIntelligentSystem
    );

    // Add stage change handling for intelligent system analysis
    stageSelect.addEventListener("change", () => {
        const idx = stageSelect.value;
        if (idx < 0 || idx >= stages.length) return;
        gameRunning = false;
        if (gameLoopTimeout) clearTimeout(gameLoopTimeout);
        gameLoopTimeout = null;
        aiThinking = false;
        initializeBoard(stages[idx], true);
    });

    console.log("Othello Arena Initialized.");
}

// --- Start the App ---
document.addEventListener("DOMContentLoaded", initializeApp);