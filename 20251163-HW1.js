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