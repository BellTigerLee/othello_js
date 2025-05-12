function analyzeStage(stageName, boardSize, initialBoard, validMoves) {
    // Analysis code runs within 60 seconds

    // Must return a strategy function with this signature:

    
    return function (board, player, validMoves, makeMove) {
        function findBestMoveWithMCTS(player) {
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
    
            const earlyBoardWeights = getRevisedBoardWeights(true);
            const lateBoardWeights = getRevisedBoardWeights(false);
    
            //MARK: 가중치 동적 조절 함수
            function getRevisedBoardWeights(isEarly, method = "bilinear") {
                let sampleWeights = [];
    
                if (isEarly === true) {
                    sampleWeights = [
                        [120, 15, 40, 35, 35, 40, 15, 120],
                        [15, 5, 27, 27, 27, 27, 5, 15],
                        [40, 27, 32, 31, 31, 32, 27, 40],
                        [35, 27, 31, 31, 31, 31, 27, 35],
                        [35, 27, 31, 31, 31, 31, 27, 35],
                        [40, 27, 32, 31, 31, 32, 27, 40],
                        [15, 5, 27, 27, 27, 27, 5, 15],
                        [120, 15, 40, 35, 35, 40, 15, 120],
                    ];
                } else {
                    sampleWeights = [
                        [10, 5, 5, 5, 5, 5, 5, 10],
                        [5, 2, 2, 2, 2, 2, 2, 5],
                        [5, 2, 1, 1, 1, 1, 2, 5],
                        [5, 2, 1, 1, 1, 1, 2, 5],
                        [5, 2, 1, 1, 1, 1, 2, 5],
                        [5, 2, 1, 1, 1, 1, 2, 5],
                        [5, 2, 2, 2, 2, 2, 2, 5],
                        [10, 5, 5, 5, 5, 5, 5, 10],
                    ];
                }
    
                const M = 8;
                const result = Array.from({ length: BOARD_SIZE }, () =>
                    Array(BOARD_SIZE).fill(0)
                );
    
                for (let i = 0; i < BOARD_SIZE; i++) {
                    // 샘플 좌표계의 실수 인덱스
                    const x = (i * (M - 1)) / (BOARD_SIZE - 1);
                    const x0 = Math.floor(x),
                        x1 = Math.min(M - 1, x0 + 1);
                    const tx = x - x0;
    
                    for (let j = 0; j < BOARD_SIZE; j++) {
                        const y = (j * (M - 1)) / (BOARD_SIZE - 1);
                        const y0 = Math.floor(y),
                            y1 = Math.min(M - 1, y0 + 1);
                        const ty = y - y0;
    
                        if (method === "nearest") {
                            // 가장 가까운 이웃
                            const xi = Math.round(x),
                                yj = Math.round(y);
                            result[i][j] = sampleWeights[xi][yj];
                        } else {
                            // 양선형 보간
                            const w00 = sampleWeights[x0][y0];
                            const w01 = sampleWeights[x0][y1];
                            const w10 = sampleWeights[x1][y0];
                            const w11 = sampleWeights[x1][y1];
    
                            // 가로 보간
                            const w0 = w00 * (1 - ty) + w01 * ty;
                            const w1 = w10 * (1 - ty) + w11 * ty;
                            // 세로 보간
                            result[i][j] = w0 * (1 - tx) + w1 * tx;
                        }
                    }
                }
                // if (isEarly===true)
                //     console.log("THIS IS EARLY BOARD WEIGHTS")
                // else
                //     console.log("THIS IS LATE BOARD WEIGHTS")
    
                // console.table(result);
                return result;
            }
    
            //MARK: Utils
            function isOnBoard(row, col) {
                return 0 <= row && row < BOARD_SIZE && 0 <= col && col < BOARD_SIZE;
            }
    
            // 임시 돌 놓기 (뒤집기 시뮬레이션 결과 포함)
    
            // 주어진 보드에서 유효한 수 목록 얻기
            // MARK: Custom getValidMove
            function getValidMovesForBoard(player, currentBoard = board) {
                const moves = [];
                // Ensure we're using the correct board size from the current board
                const size = currentBoard.length;
    
                for (let row = 0; row < size; row++) {
                    for (let col = 0; col < size; col++) {
                        if (isValidMoveForBoard(currentBoard, row, col, player)) {
                            moves.push({ row, col });
                        }
                    }
                }
    
                // Add debug log to see all valid moves
                // console.log(`Valid moves for player ${player}:`, moves);
    
                return moves;
            }
    
            // 주어진 보드에서 수가 유효한지 확인
            function isValidMoveForBoard(currentBoard, row, col, player) {
                // Check if the move is within the board and the cell is empty
                if (!isOnBoard(row, col) || currentBoard[row][col] !== EMPTY) {
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
                    while (isOnBoard(r, c)) {
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
    
            // 게임이 끝났는지 확인
            function isGameOver(boardState) {
                // 빈 칸이 없거나
                if (!boardState.flat().includes(0)) {
                    return true;
                }
                // 양쪽 다 둘 수 없으면 게임 종료
                return (
                    getValidMovesForBoard(1, boardState).length === 0 &&
                    getValidMovesForBoard(2, boardState).length === 0
                );
            }
    
            function getPositionValue(row, col, gameStage = 0.8) {
                // 게임 단계에 따라 가중치 결정
                if (gameStage < 0.3) {
                    return earlyBoardWeights[row][col];
                } else if (gameStage > 0.7) {
                    return lateBoardWeights[row][col];
                } else {
                    // 중간 단계는 두 가중치의 평균
                    const transitionFactor = (gameStage - 0.3) / 0.4; // 0.3~0.7 ->  0~1 사이 값 변환
                    return (
                        earlyBoardWeights[row][col] * (1 - transitionFactor) +
                        lateBoardWeights[row][col] * transitionFactor
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
                const stable = Array(BOARD_SIZE)
                    .fill()
                    .map(() => Array(BOARD_SIZE).fill(false));
                let count = 0;
                const limSize = BOARD_SIZE - 1;
                // 코너는 항상 안정적
                const corners = [
                    [0, 0],
                    [0, limSize],
                    [limSize, 0],
                    [limSize, limSize],
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
                            if (boardState[r][c] !== player || stable[r][c])
                                continue;
    
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
    
            // TODO: MCTS Line
            //
            function makeMCTSMove(player) {
                const UNDER_BOUND = 300;
                const MAX_ITERATIONS =
                    // 1000
                    calcDynamicIterations(player);
                function calcDynamicIterations(player, MAX_ITERATIONS = 1500) {
                    let remaining = 0;
                    if (player === BLACK) remaining = blackTimeUsed;
                    else if (player === WHITE) remaining = whiteTimeUsed;
                    dynamic_iter = Math.max(
                        MAX_ITERATIONS * (1 - remaining / MAX_AI_TIME_PER_GAME),
                        UNDER_BOUND
                    );
    
                    console.log("dinamic iterator: ", Math.floor(dynamic_iter));
    
                    return Math.floor(dynamic_iter);
                }
    
                const EXPLORATION_PARAM = 1.41; // UCB1 공식의 탐색 매개변수
    
                // MCTS 노드 클래스
                class MCTSNode {
                    constructor(
                        board,
                        player,
                        parentNode = null,
                        moveFromParent = null
                    ) {
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
                            this.untriedMoves = getValidMovesForBoard(
                                player,
                                this.board
                            );
                            // getValidMoves(player, this.board);
                        }
                    }
    
                    // UCB1 값을 계산 (자식 노드 선택 시 사용)
                    getUCB() {
                        if (this.visits === 0) return Infinity;
    
                        const exploitation = this.score / this.visits;
                        const exploration =
                            EXPLORATION_PARAM *
                            Math.sqrt(
                                Math.log(this.parentNode.visits) / this.visits
                            );
    
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
                        makeSimulatedMove(
                            nextBoard,
                            move.row,
                            move.col,
                            this.player
                        );
    
                        // 새 자식 노드 생성
                        const childNode = new MCTSNode(
                            nextBoard,
                            nextPlayer,
                            this,
                            move
                        );
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
    
                // TODO: MCTS SEARCHs
                // MCTS 알고리즘의 주요 4단계를 구현
                function mctsSearch(rootState, iterations) {
                    // 루트 노드 생성
                    const rootNode = new MCTSNode(rootState, player);
    
                    for (let i = 0; i < iterations; i++) {
                        // 1. 선택(Selection): 리프 노드까지 트리 탐색
                        let node = rootNode;
    
                        // 모든 자식이 확장되었고 리프 노드가 아닌 동안 최선의 자식을 선택
                        while (
                            node.untriedMoves.length === 0 &&
                            node.children.length > 0
                        ) {
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
                    // console.log("BEST CHILD :", bestChild.score)
                    if (!bestChild || !bestChild.moveFromParent) {
                        // 최선의 자식이 없거나 moveFromParent가 없는 경우 임의의 유효한 수 반환
                        const validMoves = getValidMovesForBoard(player, rootState);
                        // const validMoves = getValidMoves(
                        //     player,
                        //     rootState
                        // );
                        return validMoves[
                            Math.floor(Math.random() * validMoves.length)
                        ];
                        // return myStrategy(player);
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
                        const validMoves = getValidMovesForBoard(
                            currentPlayer,
                            board
                        );
    
                        if (validMoves.length === 0) {
                            consecutivePasses++;
                            currentPlayer = currentPlayer === BLACK ? WHITE : BLACK;
                            continue;
                        }
    
                        consecutivePasses = 0;
    
                        // 랜덤하게 수 선택
                        const randomMove =
                            validMoves[
                                Math.floor(Math.random() * validMoves.length)
                            ];
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
                function evaluateBoard(boardState, player) {
                    const opponent = player === 1 ? 2 : 1;
                    // 게임 단계 결정 (보드의 비율로)
                    // const totalPieces = boardState
                    //     .flat()
                    //     .filter((cell) => cell !== 0).length;
                    // const emptySpaces =
                    //     BOARD_SIZE * BOARD_SIZE - totalPieces;
                    // const gameStage = 1 - emptySpaces / totalPieces; // 0~1 사이 값
    
                    // 게임이 종료되었으면 최종 점수로 평가
                    // if (isGameOver(boardState)) {
                    //     const playerCount = boardState
                    //         .flat()
                    //         .filter((cell) => cell === player).length;
                    //     const opponentCount = boardState
                    //         .flat()
                    //         .filter((cell) => cell === opponent).length;
    
                    //     if (playerCount > opponentCount) return 10000;
                    //     if (playerCount < opponentCount) return -10000;
                    //     return 0; // 무승부
                    // }
    
                    // 각 지표별 가중치 계산
                    let score = 0;
    
                    // 1. 코너 점유
                    const corners = [
                        [0, 0],
                        [0, BOARD_SIZE - 1],
                        [BOARD_SIZE - 1, 0],
                        [BOARD_SIZE - 1, BOARD_SIZE - 1],
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
                    const playerMobility = getValidMovesForBoard(
                        player,
                        boardState
                    ).length;
                    const opponentMobility = getValidMovesForBoard(
                        opponent,
                        boardState
                    ).length;
    
                    // // 게임 초반에는 기동성이 중요, 후반에는 덜 중요
                    // const mobilityWeight = Math.max(
                    //     0,
                    //     12 - gameStage * 12
                    // );
                    // score +=
                    //     (playerMobility - opponentMobility) *
                    //     mobilityWeight;
    
                    // 4. 포지셔널 전략 (위치 가중치 적용)
                    let positionScore = 0;
                    for (let r = 0; r < BOARD_SIZE; r++) {
                        for (let c = 0; c < BOARD_SIZE; c++) {
                            if (boardState[r][c] === player) {
                                positionScore += getPositionValue(r, c);
                            } else if (boardState[r][c] === opponent) {
                                positionScore -= getPositionValue(r, c);
                            }
                        }
                    }
                    score += positionScore;
    
                    // // 5. X-스퀘어, C-스퀘어 점수 (위험한 위치 회피)
                    // if (gameStage < 0.7) {
                    //     // 게임 후반에는 덜 중요
                    //     for (let i = 0; i < 4; i++) {
                    //         const [cornerR, cornerC] = corners[i];
    
                    //         // X-스퀘어
                    //         const xSquare = [
                    //             [
                    //                 cornerR +
                    //                     (cornerR === 0 ? 1 : -1),
                    //                 cornerC +
                    //                     (cornerC === 0 ? 1 : -1),
                    //             ],
                    //         ];
    
                    //         // C-스퀘어
                    //         const cSquares = [
                    //             [
                    //                 cornerR,
                    //                 cornerC +
                    //                     (cornerC === 0 ? 1 : -1),
                    //             ],
                    //             [
                    //                 cornerR +
                    //                     (cornerR === 0 ? 1 : -1),
                    //                 cornerC,
                    //             ],
                    //         ];
    
                    //         // 해당 코너가 비어있거나 상대방 돌이 있으면 X-스퀘어, C-스퀘어는 위험
                    //         if (
                    //             boardState[cornerR][cornerC] !==
                    //             player
                    //         ) {
                    //             for (const [r, c] of xSquare) {
                    //                 if (boardState[r][c] === player)
                    //                     score -= 15;
                    //                 else if (
                    //                     boardState[r][c] ===
                    //                     opponent
                    //                 )
                    //                     score += 10;
                    //             }
    
                    //             for (const [r, c] of cSquares) {
                    //                 if (boardState[r][c] === player)
                    //                     score -= 10;
                    //                 else if (
                    //                     boardState[r][c] ===
                    //                     opponent
                    //                 )
                    //                     score += 7;
                    //             }
                    //         }
                    //     }
                    // }
    
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
    
                    // // 8. 중반-돌 갯수 고려하기 (Anti-greedy)
                    // if (0.3 < gameStage && gameStage < 0.7) {
                    //     const playerCount = boardState
                    //         .flat()
                    //         .filter(
                    //             (cell) => cell === player
                    //         ).length;
                    //     const opponentCount = boardState
                    //         .flat()
                    //         .filter(
                    //             (cell) => cell === opponent
                    //         ).length;
                    //     // 중반에는 돌 개수도 약간 고려 (greedy 전략에 대응)
                    //     score += (playerCount - opponentCount) * 2;
                    // }
    
                    return score;
                }
    
                // 결과를 트리 위로 역전파
                function backpropagate(node, result) {
                    while (node) {
                        node.visits++;
    
                        // 현재 노드의 플레이어가 AI와 같으면 점수 반전
                        // (노드의 플레이어는 이 노드에서 수를 둘 차례인 사람이므로)
                        const nodeResult =
                            node.player === player ? 1 - result : result;
                        node.score += nodeResult;
    
                        node = node.parentNode;
                    }
                }
    
                // 주어진 보드에서 시뮬레이션된 수 실행
                function makeSimulatedMove(board, row, col, player) {
                    board[row][col] = player;
                    let capturedPieces = [];
                    directions.forEach(([dr, dc]) => {
                        let r = row + dr;
                        let c = col + dc;
                        const discsToFlip = [];
    
                        while (
                            isOnBoard(r, c) &&
                            board[r][c] !== EMPTY &&
                            board[r][c] !== BLOCKED &&
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
            return makeMCTSMove(player);
        } // TODO: findBestMoveMCTS end
        // Your gameplay strategy
        return findBestMoveWithMCTS(player);
        /*
        function findBestMoveWithMCTS(player) {
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

            const earlyBoardWeights = getRevisedBoardWeights(true);
            const lateBoardWeights = getRevisedBoardWeights(false);

            //MARK: 가중치 동적 조절 함수
            function getRevisedBoardWeights(isEarly, method = "bilinear") {
                let sampleWeights = [];

                if (isEarly === true) {
                    sampleWeights = [
                        [120, 15, 40, 35, 35, 40, 15, 120],
                        [15, 5, 27, 27, 27, 27, 5, 15],
                        [40, 27, 32, 31, 31, 32, 27, 40],
                        [35, 27, 31, 31, 31, 31, 27, 35],
                        [35, 27, 31, 31, 31, 31, 27, 35],
                        [40, 27, 32, 31, 31, 32, 27, 40],
                        [15, 5, 27, 27, 27, 27, 5, 15],
                        [120, 15, 40, 35, 35, 40, 15, 120],
                    ];
                } else {
                    sampleWeights = [
                        [10, 5, 5, 5, 5, 5, 5, 10],
                        [5, 2, 2, 2, 2, 2, 2, 5],
                        [5, 2, 1, 1, 1, 1, 2, 5],
                        [5, 2, 1, 1, 1, 1, 2, 5],
                        [5, 2, 1, 1, 1, 1, 2, 5],
                        [5, 2, 1, 1, 1, 1, 2, 5],
                        [5, 2, 2, 2, 2, 2, 2, 5],
                        [10, 5, 5, 5, 5, 5, 5, 10],
                    ];
                }

                const M = 8;
                const result = Array.from({ length: BOARD_SIZE }, () =>
                    Array(BOARD_SIZE).fill(0)
                );

                for (let i = 0; i < BOARD_SIZE; i++) {
                    // 샘플 좌표계의 실수 인덱스
                    const x = (i * (M - 1)) / (BOARD_SIZE - 1);
                    const x0 = Math.floor(x),
                        x1 = Math.min(M - 1, x0 + 1);
                    const tx = x - x0;

                    for (let j = 0; j < BOARD_SIZE; j++) {
                        const y = (j * (M - 1)) / (BOARD_SIZE - 1);
                        const y0 = Math.floor(y),
                            y1 = Math.min(M - 1, y0 + 1);
                        const ty = y - y0;

                        if (method === "nearest") {
                            // 가장 가까운 이웃
                            const xi = Math.round(x),
                                yj = Math.round(y);
                            result[i][j] = sampleWeights[xi][yj];
                        } else {
                            // 양선형 보간
                            const w00 = sampleWeights[x0][y0];
                            const w01 = sampleWeights[x0][y1];
                            const w10 = sampleWeights[x1][y0];
                            const w11 = sampleWeights[x1][y1];

                            // 가로 보간
                            const w0 = w00 * (1 - ty) + w01 * ty;
                            const w1 = w10 * (1 - ty) + w11 * ty;
                            // 세로 보간
                            result[i][j] = w0 * (1 - tx) + w1 * tx;
                        }
                    }
                }
                // if (isEarly===true)
                //     console.log("THIS IS EARLY BOARD WEIGHTS")
                // else
                //     console.log("THIS IS LATE BOARD WEIGHTS")

                // console.table(result);
                return result;
            }

            //MARK: Utils
            function isOnBoard(row, col) {
                return (
                    0 <= row && row < BOARD_SIZE && 0 <= col && col < BOARD_SIZE
                );
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
                        // cpBoard[nx][ny] !== 0 &&
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

            // 주어진 보드에서 유효한 수 목록 얻기
            // MARK: Custom getValidMove
            function getValidMovesForBoard(player, currentBoard = board) {
                const moves = [];
                // Ensure we're using the correct board size from the current board
                const size = currentBoard.length;

                for (let row = 0; row < size; row++) {
                    for (let col = 0; col < size; col++) {
                        if (
                            isValidMoveForBoard(currentBoard, row, col, player)
                        ) {
                            moves.push({ row, col });
                        }
                    }
                }

                // Add debug log to see all valid moves
                // console.log(`Valid moves for player ${player}:`, moves);

                return moves;
            }

            // 주어진 보드에서 수가 유효한지 확인
            function isValidMoveForBoard(currentBoard, row, col, player) {
                // Check if the move is within the board and the cell is empty
                if (!isOnBoard(row, col) || currentBoard[row][col] !== EMPTY) {
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
                    while (isOnBoard(r, c)) {
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

            // 게임이 끝났는지 확인
            function isGameOver(boardState) {
                // 빈 칸이 없거나
                if (!boardState.flat().includes(0)) {
                    return true;
                }
                // 양쪽 다 둘 수 없으면 게임 종료
                return (
                    getValidMovesForBoard(1, boardState).length === 0 &&
                    getValidMovesForBoard(2, boardState).length === 0
                    // getValidMoves(1, boardState).length === 0 &&
                    // getValidMoves(2, boardState).length === 0
                );
            }

            function getPositionValue(row, col, gameStage) {
                // 게임 단계에 따라 가중치 결정
                if (gameStage < 0.3) {
                    return earlyBoardWeights[row][col];
                } else if (gameStage > 0.7) {
                    return lateBoardWeights[row][col];
                } else {
                    // 중간 단계는 두 가중치의 평균
                    const transitionFactor = (gameStage - 0.3) / 0.4; // 0.3~0.7 ->  0~1 사이 값 변환
                    return (
                        earlyBoardWeights[row][col] * (1 - transitionFactor) +
                        lateBoardWeights[row][col] * transitionFactor
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
                const limSize = BOARD_SIZE-1
                // 코너는 항상 안정적
                const corners = [
                    [0, 0],
                    [0, limSize],
                    [limSize, 0],
                    [limSize, limSize],
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
                            if (boardState[r][c] !== player || stable[r][c])
                                continue;

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

            // TODO: MCTS Line
            //
            function makeMCTSMove(player) {
                const UNDER_BOUND = 300;
                const MAX_ITERATIONS =
                    // 1000
                    calcDynamicIterations(player);
                function calcDynamicIterations(player, MAX_ITERATIONS = 1000) {
                    let remaining = 0;
                    if (player === BLACK) remaining = blackTimeUsed;
                    else if (player === WHITE) remaining = whiteTimeUsed;
                    dynamic_iter = Math.max(
                        MAX_ITERATIONS * (1 - remaining / MAX_AI_TIME_PER_GAME),
                        UNDER_BOUND
                    );

                    console.log("dinamic iterator: ", Math.floor(dynamic_iter));

                    return Math.floor(dynamic_iter);
                }

                const EXPLORATION_PARAM = 1.41; // UCB1 공식의 탐색 매개변수

                // MCTS 노드 클래스
                class MCTSNode {
                    constructor(
                        board,
                        player,
                        parentNode = null,
                        moveFromParent = null
                    ) {
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
                            this.untriedMoves = getValidMovesForBoard(
                                player,
                                this.board
                            );
                            // getValidMoves(player, this.board);
                        }
                    }

                    // UCB1 값을 계산 (자식 노드 선택 시 사용)
                    getUCB() {
                        if (this.visits === 0) return Infinity;

                        const exploitation = this.score / this.visits;
                        const exploration =
                            EXPLORATION_PARAM *
                            Math.sqrt(
                                Math.log(this.parentNode.visits) / this.visits
                            );

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
                        const nextPlayer =
                            this.player === BLACK ? WHITE : BLACK;

                        // 수 적용
                        makeSimulatedMove(
                            nextBoard,
                            move.row,
                            move.col,
                            this.player
                        );

                        // 새 자식 노드 생성
                        const childNode = new MCTSNode(
                            nextBoard,
                            nextPlayer,
                            this,
                            move
                        );
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

                // TODO: MCTS SEARCHs
                // MCTS 알고리즘의 주요 4단계를 구현
                function mctsSearch(rootState, iterations) {
                    // 루트 노드 생성
                    const rootNode = new MCTSNode(rootState, player);

                    for (let i = 0; i < iterations; i++) {
                        // 1. 선택(Selection): 리프 노드까지 트리 탐색
                        let node = rootNode;

                        // 모든 자식이 확장되었고 리프 노드가 아닌 동안 최선의 자식을 선택
                        while (
                            node.untriedMoves.length === 0 &&
                            node.children.length > 0
                        ) {
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
                        backpropagate(
                            node,
                            evaluateBoard(terminalBoard, player)
                        );
                    }

                    // 최종 결정: 루트의 가장 많이 방문된 자식을 선택
                    const bestChild = rootNode.getFinalBestChild();
                    // console.log("BEST CHILD :", bestChild.score)
                    if (!bestChild || !bestChild.moveFromParent) {
                        // 최선의 자식이 없거나 moveFromParent가 없는 경우 임의의 유효한 수 반환
                        const validMoves = getValidMovesForBoard(
                            player,
                            rootState
                        );
                        // const validMoves = getValidMoves(
                        //     player,
                        //     rootState
                        // );
                        return validMoves[
                            Math.floor(Math.random() * validMoves.length)
                        ];
                        // return myStrategy(player);
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
                        const validMoves = getValidMovesForBoard(
                            currentPlayer,
                            board
                        );


                        if (validMoves.length === 0) {
                            consecutivePasses++;
                            currentPlayer =
                                currentPlayer === BLACK ? WHITE : BLACK;
                            continue;
                        }

                        consecutivePasses = 0;

                        // 랜덤하게 수 선택
                        const randomMove =
                            validMoves[
                                Math.floor(Math.random() * validMoves.length)
                            ];
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
                function evaluateBoard(boardState, player) {
                    const opponent = player === 1 ? 2 : 1;
                    // 게임 단계 결정 (보드의 비율로)
                    const totalPieces = boardState
                        .flat()
                        .filter((cell) => cell !== 0).length;
                    const emptySpaces = BOARD_SIZE * BOARD_SIZE - totalPieces;
                    const gameStage = 1- emptySpaces / totalPieces; // 0~1 사이 값

                    // 게임이 종료되었으면 최종 점수로 평가
                    // if (isGameOver(boardState)) {
                    //     const playerCount = boardState
                    //         .flat()
                    //         .filter((cell) => cell === player).length;
                    //     const opponentCount = boardState
                    //         .flat()
                    //         .filter((cell) => cell === opponent).length;

                    //     if (playerCount > opponentCount) return 10000;
                    //     if (playerCount < opponentCount) return -10000;
                    //     return 0; // 무승부
                    // }

                    // 각 지표별 가중치 계산
                    let score = 0;

                    // 1. 코너 점유
                    const corners = [
                        [0, 0],
                        [0, BOARD_SIZE - 1],
                        [BOARD_SIZE - 1, 0],
                        [BOARD_SIZE - 1, BOARD_SIZE - 1],
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
                        player,
                        boardState
                    ).length;
                    const opponentMobility = getValidMovesForBoard(
                        opponent,
                        boardState
                    ).length;

                    // 게임 초반에는 기동성이 중요, 후반에는 덜 중요
                    const mobilityWeight = Math.max(0, 12 - gameStage * 12);
                    score +=
                        (playerMobility - opponentMobility) * mobilityWeight;

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
                                [cornerR, cornerC + (cornerC === 0 ? 1 : -1)],
                                [cornerR + (cornerR === 0 ? 1 : -1), cornerC],
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

                // 결과를 트리 위로 역전파
                function backpropagate(node, result) {
                    while (node) {
                        node.visits++;

                        // 현재 노드의 플레이어가 AI와 같으면 점수 반전
                        // (노드의 플레이어는 이 노드에서 수를 둘 차례인 사람이므로)
                        const nodeResult =
                            node.player === player ? 1 - result : result;
                        node.score += nodeResult;

                        node = node.parentNode;
                    }
                }

                // 주어진 보드에서 시뮬레이션된 수 실행
                function makeSimulatedMove(board, row, col, player) {
                    board[row][col] = player;
                    let capturedPieces = [];
                    directions.forEach(([dr, dc]) => {
                        let r = row + dr;
                        let c = col + dc;
                        const discsToFlip = [];

                        while (
                            isOnBoard(r, c) &&
                            board[r][c] !== EMPTY &&
                            board[r][c] !== BLOCKED &&
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
            return makeMCTSMove(player);
        } // TODO: findBestMoveMCTS end

        */
    };
}
