function analyzeStage(stageName, boardSize, initialBoard, validMoves) {
    // Analysis code runs within 60 seconds

    // Must return a strategy function with this signature:
    return function (board, player, validMoves, makeMove) {
        // Your gameplay strategy
        function findBestMoveWithMCTS(player) {
            /**
             *  1. early, late Weights들이 8x8로 고정되어 있음. 이거 고쳐야함.
             *
             *
             * */

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
            // Utils
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
                if (!boardState.flat().includes(0)) {
                    return true;
                }
                // 양쪽 다 둘 수 없으면 게임 종료
                return (
                    getValidMovesForBoard(boardState, 1).length === 0 &&
                    getValidMovesForBoard(boardState, 2).length === 0
                );
            }
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
            function makeMCTSMove(player) {
                // console.log("Player of MCTS: ", player);
                const MAX_ITERATIONS = 1000; // 1500, 1000, 500, 300
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
                                this.board,
                                player
                            );
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
                    console.log("BEST CHILD :", bestChild.score);
                    if (!bestChild || !bestChild.moveFromParent) {
                        // 최선의 자식이 없거나 moveFromParent가 없는 경우 임의의 유효한 수 반환
                        // const validMoves = getValidMovesForBoard(rootState, player);
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
                            board,
                            currentPlayer
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
            return makeMCTSMove(player);
        }
        return findBestMoveWithMCTS(player); // {row, col} or null
    };
}
