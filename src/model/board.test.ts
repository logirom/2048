import { Board, Direction } from "./board";

it('merge single row', () => {
    const test_data : [from : number[], to : number[], merged: boolean, points: number][] = [
        [[0,0,0,0], [0,0,0,0], false, 0],
        [[2,0,0,0], [2,0,0,0], false, 0],
        [[0,0,0,2], [2,0,0,0], true, 0],
        [[0,2,0,0], [2,0,0,0], true, 0],
        [[4,2,0,0], [4,2,0,0], false, 0],
        [[4,2,0,0], [4,2,0,0], false, 0],
        [[4,0,2,0], [4,2,0,0], true, 0],
        [[2,0,4,0], [2,4,0,0], true, 0],
        [[2,8,0,4], [2,8,4,0], true, 0],
        [[2,0,0,4], [2,4,0,0], true, 0],
        [[2,2,0,0], [4,0,0,0], true, 4],
        [[4,4,0,0], [8,0,0,0], true, 8],
        [[2,4,4,0], [2,8,0,0], true, 8],
        [[2,0,4,4], [2,8,0,0], true, 8],
        [[2,4,0,4], [2,8,0,0], true, 8],
        [[2,2,2,2], [4,4,0,0], true, 8],
        [[4,4,2,2], [8,4,0,0], true, 12],
        [[2,2,4,2], [4,4,2,0], true, 4],
        [[2,2,0,4], [4,4,0,0], true, 4],
        [[0,0,2,2], [4,0,0,0], true, 4],
        [[0,2,2,0], [4,0,0,0], true, 4],
        [[4,4,4,0], [8,4,0,0], true, 8],
        [[8,4,4,4], [8,8,4,0], true, 8],
        [[2,0,2,2], [4,2,0,0], true, 4],
    ]

    for(const test of test_data){
        const [test_data, expected_res, expected_success, expected_points] = test;
        const [success, actual_res, points] = Board.merge_row(test_data);
        expect(success).toEqual(expected_success);
        expect(actual_res).toEqual(expected_res);
        expect(points).toEqual(expected_points);
    }
});

it('transpose matrix', () => {
    const matrix = [[1, 2, 3, 4], [5, 6, 7, 8]];
    const expected_transposed = [[1, 5], [2, 6], [3, 7], [4, 8]];
    const transposed = Board.transpose_matrix(matrix);
    expect(transposed).toEqual(expected_transposed);
});

it('transform matrix', () => {
    const matrix = [[1, 2, 3, 4], [5, 6, 7, 8], [9, 10, 11, 12], [13, 14, 15, 16]];
    expect(Board.transform_matrix(matrix, Direction.Left)).toEqual(matrix);
    expect(Board.transform_matrix(matrix, Direction.Up)).toEqual([[1, 5, 9, 13], [2, 6, 10, 14], [3, 7, 11, 15], [4, 8, 12, 16]]);
    expect(Board.transform_matrix(matrix, Direction.Right)).toEqual([[4, 3, 2, 1], [8, 7, 6, 5], [12, 11, 10, 9], [16, 15, 14, 13]]);
    expect(Board.transform_matrix(matrix, Direction.Down)).toEqual([[13, 9, 5, 1], [14, 10, 6, 2], [15, 11, 7, 3], [16, 12, 8, 4]]);
});

it('transform matrix twice', () => {
    const matrix = [[1, 2, 3, 4], [5, 6, 7, 8], [9, 10, 11, 12], [13, 14, 15, 16]];
    expect(Board.transform_matrix_back(Board.transform_matrix(matrix, Direction.Left), Direction.Left)).toEqual(matrix);
    expect(Board.transform_matrix_back(Board.transform_matrix(matrix, Direction.Up), Direction.Up)).toEqual(matrix);
    expect(Board.transform_matrix_back(Board.transform_matrix(matrix, Direction.Right), Direction.Right)).toEqual(matrix);
    expect(Board.transform_matrix_back(Board.transform_matrix(matrix, Direction.Down), Direction.Down)).toEqual(matrix);
});

it('merge matrix', () => {
    const matrix = [[0,0,0,0], [0,2,0,0], [0,0,0,0], [0,0,0,0]];
    expect(Board.merge_matrix(matrix, Direction.Left)).toEqual([true, [[0,0,0,0], [2,0,0,0], [0,0,0,0], [0,0,0,0]], 0]);
    expect(Board.merge_matrix(matrix, Direction.Up)).toEqual([true, [[0,2,0,0], [0,0,0,0], [0,0,0,0], [0,0,0,0]], 0]);
    expect(Board.merge_matrix(matrix, Direction.Right)).toEqual([true, [[0,0,0,0], [0,0,0,2], [0,0,0,0], [0,0,0,0]], 0]);
    expect(Board.merge_matrix(matrix, Direction.Down)).toEqual([true, [[0,0,0,0], [0,0,0,0], [0,0,0,0], [0,2,0,0]], 0]);

    const matrix_1 = [[0,2,0,0], [0,2,0,0], [0,0,0,0], [0,0,0,0]];
    expect(Board.merge_matrix(matrix_1, Direction.Up)).toEqual([true, [[0,4,0,0], [0,0,0,0], [0,0,0,0], [0,0,0,0]], 4]);
    expect(Board.merge_matrix(matrix_1, Direction.Right)).toEqual([true, [[0,0,0,2], [0,0,0,2], [0,0,0,0], [0,0,0,0]], 0]);

    const matrix_2 = [[2,2,2,2], [2,2,2,2], [2,2,2,2], [2,2,2,2]];
    expect(Board.merge_matrix(matrix_2, Direction.Up)).toEqual([true, [[4,4,4,4], [4,4,4,4], [0,0,0,0], [0,0,0,0]], 32]);
    expect(Board.merge_matrix(matrix_2, Direction.Right)).toEqual([true, [[0,0,4,4], [0,0,4,4], [0,0,4,4], [0,0,4,4]], 32]);

    const matrix_3 = [[2,0,0,0], [2,0,0,0], [0,0,0,0], [0,0,0,0]];
    expect(Board.merge_matrix(matrix_3, Direction.Left)).toEqual([false, [[2,0,0,0], [2,0,0,0], [0,0,0,0], [0,0,0,0]], 0]);
    expect(Board.merge_matrix(matrix_3, Direction.Up)).toEqual([true, [[4,0,0,0], [0,0,0,0], [0,0,0,0], [0,0,0,0]], 4]);
    expect(Board.merge_matrix(matrix_3, Direction.Right)).toEqual([true, [[0,0,0,2], [0,0,0,2], [0,0,0,0], [0,0,0,0]], 0]);
    expect(Board.merge_matrix(matrix_3, Direction.Down)).toEqual([true, [[0,0,0,0], [0,0,0,0], [0,0,0,0], [4,0,0,0]], 4]);

    const matrix_4 = [[0,0,0,0], [0,4,2,0], [0,2,2,0], [0,0,0,0]];
    expect(Board.merge_matrix(matrix_4, Direction.Left)).toEqual([true, [[0,0,0,0], [4,2,0,0], [4,0,0,0], [0,0,0,0]], 4]);
    expect(Board.merge_matrix(matrix_4, Direction.Up)).toEqual([true, [[0,4,4,0], [0,2,0,0], [0,0,0,0], [0,0,0,0]], 4]);
    expect(Board.merge_matrix(matrix_4, Direction.Right)).toEqual([true, [[0,0,0,0], [0,0,4,2], [0,0,0,4], [0,0,0,0]], 4]);
    expect(Board.merge_matrix(matrix_4, Direction.Down)).toEqual([true, [[0,0,0,0], [0,0,0,0], [0,4,0,0], [0,2,4,0]], 4]);
});

it("empty cells", () => {
    const matrix = [[0,0,0,0], [0,4,2,0]];
    const empty_cells = Board.get_empty_cells(matrix);
    expect(empty_cells).toEqual([[0,0], [0,1], [0,2], [0,3], [1, 0], [1, 3]]);

    const matrix_1 = [[1,1,1,1], [1,4,2,1]];
    const empty_cells_1 = Board.get_empty_cells(matrix_1);
    expect(empty_cells_1.length).toEqual(0);
});

it("no merges", () => {
    expect(Board.no_moves([[0, 1, 2, 3], [1, 2, 3, 4], [3, 4, 5, 6], [4, 5, 6, 7]])).toEqual(false);
    expect(Board.no_moves([[2, 1, 2, 3], [1, 2, 3, 4], [3, 0, 5, 6], [4, 5, 6, 7]])).toEqual(false);
    expect(Board.no_moves([[2, 1, 2, 3], [1, 2, 3, 4], [3, 4, 5, 6], [4, 5, 6, 7]])).toEqual(true);
    expect(Board.no_moves([[2, 1, 2, 3], [1, 2, 2, 4], [3, 4, 5, 6], [4, 5, 6, 7]])).toEqual(false);
    expect(Board.no_moves([[2, 1, 2, 3], [1, 2, 3, 4], [3, 4, 3, 6], [4, 5, 6, 7]])).toEqual(false);
});


it('merge_matrix returns false for full board with no moves', () => {
    // Full board with no identical adjacent tiles and no empty cells => no move possible
    const full_no_move = [
        [2, 4, 8, 16],
        [32, 64, 128, 256],
        [512, 1024, 2048, 4096],
        [8192, 16384, 32768, 65536]
    ];
    // Expect no change (false), same matrix and zero points
    expect(Board.merge_matrix(full_no_move, Direction.Left)).toEqual([false, full_no_move, 0]);
    expect(Board.merge_matrix(full_no_move, Direction.Up)).toEqual([false, full_no_move, 0]);
    expect(Board.merge_matrix(full_no_move, Direction.Right)).toEqual([false, full_no_move, 0]);
    expect(Board.merge_matrix(full_no_move, Direction.Down)).toEqual([false, full_no_move, 0]);
});

it('merge function updates state and returns points', () => {
    const onStateChanged = jest.fn();
    const onLost = jest.fn();
    const onWin = jest.fn();
    const settings = {
        size: 4,
        win_number: 2048,
        initial_tiles: 8,
        new_tiles : 2,
        on_state_changed: onStateChanged,
        on_lost: onLost,
        on_win: onWin
    };
    const board = new Board(settings);
    const state = [
        [2, 2, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
    ];
    board.set_state(state);
    
    const [success, points] = board.merge(Direction.Left);
    
    expect(success).toEqual(true);
    expect(points).toEqual(4);
    // on_state_changed should be called twice: after merge and after place_random
    expect(onStateChanged).toHaveBeenCalledTimes(2);
    expect(onLost).not.toHaveBeenCalled();
    expect(onWin).not.toHaveBeenCalled();
});

it('merge function returns false when no valid moves', () => {
    const onStateChanged = jest.fn();
    const onLost = jest.fn();
    const onWin = jest.fn();
    const settings = {
        size: 4,
        win_number: 2048,
        initial_tiles: 8,
        new_tiles : 2,
        on_state_changed: onStateChanged,
        on_lost: onLost,
        on_win: onWin
    };
    const board = new Board(settings);
    const full_no_move = [
        [2, 4, 8, 16],
        [32, 64, 128, 256],
        [512, 1024, 2048, 4096],
        [8192, 16384, 32768, 65536]
    ];
    board.set_state(full_no_move);
    
    const [success, points] = board.merge(Direction.Left);
    
    expect(success).toEqual(false);
    expect(points).toEqual(0);
    expect(onLost).toHaveBeenCalledTimes(1);
    expect(onStateChanged).not.toHaveBeenCalled();
});

it('merge function calls on_win when win_number is reached', () => {
    const onStateChanged = jest.fn();
    const onLost = jest.fn();
    const onWin = jest.fn();
    const settings = {
        size: 4,
        win_number: 8,
        initial_tiles: 8,
        new_tiles : 2,
        on_state_changed: onStateChanged,
        on_lost: onLost,
        on_win: onWin
    };
    const board = new Board(settings);
    const state = [
        [4, 4, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
    ];
    board.set_state(state);
    
    const [success, points] = board.merge(Direction.Left);
    
    expect(success).toEqual(true);
    expect(points).toEqual(8);
    expect(onWin).toHaveBeenCalledTimes(1);
    expect(onStateChanged).toHaveBeenCalledTimes(2);
});

it('merge function in all directions produces correct points', () => {
    const onStateChanged = jest.fn();
    const settings = {
        size: 4,
        win_number: 2048,
        initial_tiles: 8,
         new_tiles : 2,
       on_state_changed: onStateChanged,
        on_lost: () => {},
        on_win: () => {}
    };
    
    // Test Left
    const board1 = new Board(settings);
    board1.set_state([[2, 2, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]);
    expect(board1.merge(Direction.Left)[1]).toEqual(4);
    
    // Test Right
    const board2 = new Board(settings);
    board2.set_state([[0, 0, 2, 2], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]);
    expect(board2.merge(Direction.Right)[1]).toEqual(4);
    
    // Test Up
    const board3 = new Board(settings);
    board3.set_state([[2, 0, 0, 0], [2, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]);
    expect(board3.merge(Direction.Up)[1]).toEqual(4);
    
    // Test Down
    const board4 = new Board(settings);
    board4.set_state([[0, 0, 0, 0], [0, 0, 0, 0], [2, 0, 0, 0], [2, 0, 0, 0]]);
    expect(board4.merge(Direction.Down)[1]).toEqual(4);
});