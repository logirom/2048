
export enum Direction {
    Left,
    Right,
    Up,
    Down
}


export interface BoardSettings {
    size : number;
    win_number : number;
    initial_tiles : number;
    new_tiles : number;
    on_state_changed : (state : number[][]) => void;
    on_lost : () => void;
    on_win : () => void
}

export const DefaultBoardSettings : BoardSettings = {
    size : 4,
    win_number : 2048,
    initial_tiles : 8,
    new_tiles : 2,
    on_state_changed : (state : number[][]) => {},
    on_lost : () => {},
    on_win : () => {}
} 

export class Board {
    private state : number[][];
    private settings : BoardSettings;
    
    constructor(settings : BoardSettings) {
        this.settings = settings || DefaultBoardSettings;
        this.state = new Array(this.settings.size);
    }

    set_state (state : number[][]){
        this.state = state;     
    }

    restart () {
        this.state = new Array(this.settings.size);
        for (let i = 0; i < this.settings.size; i++) {
            this.state[i] = new Array(this.settings.size);
            this.state[i].fill(0);
        }
        this.place_random(this.settings.initial_tiles);
        this.settings.on_state_changed(this.state);
    }

    place_random(number : number) {
        const empty_cells = Board.get_empty_cells(this.state);
        // If asking to add 2 tiles and just one cell is empty
        let actual_number = Math.min(empty_cells.length, number);
        if (actual_number === 0){
            return;
        }

        for (let i = 0; i < actual_number; i++){
            // Adding 4 in 10%
            const is_four = Math.round((Math.random() * 100)) % 10 === 0;
            let success = false;
            while (!success) {
                let empty_cell_num = 
                    empty_cells.length === 1 
                    ? 0 
                    : Math.round((Math.random() * 100)) % (empty_cells.length); 
                const empty_cell = empty_cells[empty_cell_num];
                // to avoid placing to the same cell twice
                if(this.state[empty_cell[0]][empty_cell[1]] === 0){
                    this.state[empty_cell[0]][empty_cell[1]] = is_four ? 4 : 2;
                    success = true;
                }
            }
        }
    }

    merge (direction : Direction) : [success: boolean, points: number]  {
        if (Board.no_moves(this.state)) {
            this.settings.on_lost();
            return [false, 0];
        }            
        const [success, new_state, points] = Board.merge_matrix(this.state, direction);
        if (success) {
            this.state = new_state;
            this.settings.on_state_changed(this.state);
            this.place_random(this.settings.new_tiles);
            this.settings.on_state_changed(this.state);
            if (Board.no_moves(this.state)) {
                this.settings.on_lost();
            }            
            if (Board.has_win(this.state, this.settings.win_number)) {
                this.settings.on_win();
            }            
        }
        return [success, points];
    } 
    
    get_state () : number[][] {
        // always copy to do not corrupt from outside 
        return Array.from(this.state);
    }
    
    static no_moves (matrix : number[][]) {
        // If any empty we can move
        if (Board.get_empty_cells(matrix).length !== 0) {
            return false;
        }
        // Otherwise check no pairs in rows
        for (let row of matrix) {
            for(let i = 0; i < row.length - 1; i++){
                if (row[i] === row[i+1]) {
                    return false;
                }
            }
        }
        // And no pairs in columns
        for (let row of this.transpose_matrix(matrix)) {
            for(let i = 0; i < row.length - 1; i++){
                if (row[i] === row[i+1]) {
                    return false;
                }
            }
        }
        return true;

    }

    static has_win (matrix : number[][], win_number : number) {
        for (let row of matrix) {
            for(let i = 0; i < row.length; i++){
                if (row[i] === win_number) {
                    return true;
                }
            }
        }
        return false
    }
   
    static get_empty_cells(matrix : number[][]) {
        let res : number[][] = []
        for(let i = 0; i < matrix.length; i++){
            for(let j = 0; j < matrix[i].length; j++){
                if(matrix[i][j] === 0) {
                    res.push([i, j]);
                }
            }
        }
        return res;
    }

    static merge_row (row_original : number[]) : [success: boolean, result_row: number[], points_earned: number] {
        let row = Array.from(row_original);
        let target_index = 0;
        let success = false;
        let points = 0;
        let i = 1;
        while (i < row.length) {
            if (row[i] !== 0) {
                if(row[target_index] === 0){
                    row[target_index] = row[i]
                    if(i > target_index){
                        row[i] = 0;
                        success = true;
                    }
                } else if(row[target_index] === row[i]){
                    row[target_index] = row[target_index] * 2;
                    row[i] = 0;
                    points += row[target_index]
                    target_index = target_index + 1;
                    success = true;
                } else {
                    target_index = target_index + 1;
                    row[target_index] = row[i];
                    if(i > target_index){
                        row[i] = 0;
                        success = true;
                    }
                }
            } 
            i++;
        }
        return [success, row, points];
    }

    static transpose_matrix (matrix: number[][]): number[][] {
        const cols: number = matrix.length > 0 ? matrix[0].length : 0;
        const transponed: number[][] = [];
        for (let i = 0; i < cols; i++) {
            transponed[i] = [];
            for (let j = 0; j < matrix.length; j++) {
                transponed[i][j] = matrix[j][i];
            }
        }
        return transponed;
    }

    static transform_matrix(matrix : number[][], direction : Direction) : number[][] {
        if (direction === Direction.Left) {
            // Just copy
            return matrix.map(r => Array.from(r));
        } else if (direction === Direction.Right) {
            // Reverse each row
            return matrix.map(r => Array.from(r).reverse());
        } else if (direction === Direction.Up) {
            // Transpose matrix
            return Board.transpose_matrix(matrix);
        } else {
            // Transpose and reverse rows
            return Board.transpose_matrix(matrix).map(r => r.reverse());
        }
    }

    static transform_matrix_back(matrix : number[][], direction : Direction) : number[][] {
        if (direction === Direction.Left) {
            return matrix.map(r => Array.from(r));
        } else if (direction === Direction.Right) {
            return matrix.map(r => Array.from(r).reverse());
        } else if (direction === Direction.Up) {
            return Board.transpose_matrix(matrix);
        } else {
            return Board.transpose_matrix(matrix.map(r => r.reverse()));
        }
    }
    
    static merge_matrix(matrix : number[][], direction : Direction) : [success: boolean, matrix: number[][], points_earned: number] {
        // To merge rows need to turn matrix to get merge direction always to left
        // And then merge each row to left
        // And turn matrix back
        const transformed = Board.transform_matrix(matrix, direction);
        let points = 0;
        let success = false;
        let merged_matrix : number[][] = [];
        for(const row of transformed) {
            const [s, merged_row, p] = Board.merge_row(row);
            points += p;
            success = success || s;
            merged_matrix.push(merged_row);
        }
        const transformed_back = Board.transform_matrix_back(merged_matrix, direction);
        return [success, transformed_back, points];
    }
   
    static direction_to_str (direction : Direction) : string {
        switch (direction) {
            case Direction.Left: return "Left";
            case Direction.Right: return "Right";
            case Direction.Up: return "Up";
            case Direction.Down: return "Down";
            default: return "Unknown";
        }
    }
}