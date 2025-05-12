function analyzeStage(stageName, boardSize, board, validMoves) {
    console.log("=== analyzeStage called ===", stageName, boardSize, board, validMoves);
    const EMPTY = 0, BLACK = 1, WHITE = 2; BLOCKED = 3;

    function simulateCapturedPieces(board, player, row, col, ignoreOcclusion=false) {
        if (board[row][col] !== EMPTY) return [];

        const boardSize = board.length;
        const opponent = player === BLACK ? WHITE : BLACK;
        const directions = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
        const capturedPieces = [];

        // Search in each direction
        for (const [dr, dc] of directions) {
            let r = row + dr;
            let c = col + dc;
            const toFlip = [];
            let blockedSeen = false;

            // Find opponent pieces
            while (
                r >= 0 && r < boardSize &&
                c >= 0 && c < boardSize
            ) {
                if (board[r][c] === opponent) {
                    toFlip.push([r, c]);
                }
                else if (board[r][c] === BLOCKED) {
                    if (!ignoreOcclusion) break;
                    blockedSeen = true;
                }
                else break;
                r += dr; c += dc;
            }

            // Flipping condition: opponent pieces surrounded by player's pieces
            if (
                toFlip.length > 0 &&
                r >= 0 && r < boardSize &&
                c >= 0 && c < boardSize &&
                board[r][c] === player &&
                (!blockedSeen || ignoreOcclusion)
            ) {
                capturedPieces.push(...toFlip);
            }
        }

        return capturedPieces;
    }

    function calculateValidMoves(board, player) {
        const boardSize = board.length;
        const validMoves = [];

        for (let r = 0; r < boardSize; r++) {
            for (let c = 0; c < boardSize; c++) {
                if (board[r][c] !== EMPTY) continue;

                const capturedPieces = simulateCapturedPieces(board, player, r, c);
                if (capturedPieces.length > 0) {
                    validMoves.push({ row: r, col: c, capturedCount: capturedPieces.length });
                }
            }
        }

        return validMoves;
    }
    
    function evaluateBoardPosition(board, player) {
        const boardSize = board.length;
        const opponent = player === BLACK ? WHITE : BLACK;

        let playerCount = 0;
        let opponentCount = 0;
        let mobilityScore = 0;
        let cornerScore = 0;
        let edgeScore = 0;

        // Calculate piece count and position scores
        for (let r = 0; r < boardSize; r++) {
            for (let c = 0; c < boardSize; c++) {
                if (board[r][c] === player) {
                    playerCount++;

                    // Corner score
                    if ((r === 0 || r === boardSize - 1) && (c === 0 || c === boardSize - 1)) {
                        cornerScore += 100;
                    }
                    // Edge score
                    else if (r === 0 || r === boardSize - 1 || c === 0 || c === boardSize - 1) {
                        edgeScore += 20;
                    }
                }
                else if (board[r][c] === opponent) {
                    opponentCount++;
                }
            }
        }

        // Calculate mobility score (number of valid moves)
        const playerMoves = calculateValidMoves(board, player).length;
        const opponentMoves = calculateValidMoves(board, opponent).length;
        mobilityScore = playerMoves - opponentMoves;

        // Overall evaluation
        return {
            pieceScore: playerCount - opponentCount,
            mobilityScore: mobilityScore,
            cornerScore: cornerScore,
            edgeScore: edgeScore,
            totalScore: (playerCount - opponentCount) + mobilityScore * 2 + cornerScore + edgeScore * 0.5
        };
    }

    function simulateMoveOnBoard(board, player, row, col) {
        const _board = board.map(r=>r.slice());
        _board[row][col] = player;
        const flipped = simulateCapturedPieces(_board, player, row, col);
        flipped.forEach(([r,c])=> _board[r][c] = player);
        return _board;
    }
    let bestInitial = null, bestScore = -Infinity;
    for (const mv of validMoves) {
        const simBd = simulateMoveOnBoard(board, BLACK, mv.row, mv.col);
        const { totalScore } = evaluateBoardPosition(simBd, BLACK);
        if (totalScore > bestScore) {
            bestScore = totalScore;
            bestInitial = mv;
        }
    }
    console.log("Best initial move by totalScore:", bestInitial, "score:", bestScore);

    return function strategy(board, player, validMoves, makeMove) {
        if (!validMoves || validMoves.length === 0) return null;

        const choice = validMoves[Math.floor(Math.random() * validMoves.length)];
        console.log("Chosen move:", choice);
        return choice;
    };
}

window.analyzeStage = analyzeStage;
