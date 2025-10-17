import React, { useCallback, useEffect } from "react";
import { Board, Direction } from "../model/board";
import { useSwipeable } from "react-swipeable";
import { fetch_ai_advise } from "../model/ai";

export function GameView() {
    const ai_models = ["gpt-4.1-nano", "o3-mini", "gemini-2.0-flash"];
    
    const [board_state, set_board_state] = React.useState<number[][]>();
    const [is_lost, set_lost] = React.useState<boolean>(false);
    const [is_winner, set_winner] = React.useState<boolean>(false);
    const [is_waiting_ai, set_waiting_ai] = React.useState<boolean>(false);
    const [score, set_score] = React.useState<number>(0);
    const [error, set_error] = React.useState<string|undefined>(undefined);
    const [cursor, set_cursor] = React.useState('crosshair');
    const [ai_model, set_ai_model] = React.useState<string>(ai_models[0]);

    const score_ref = React.useRef<number>(0);
    const waiting_ai_ref = React.useRef<boolean>(false);
        
    useEffect(() => {
        score_ref.current = score;
    }, [score]);

    const move = (direction : Direction) => {
        set_error(undefined);
        const [success, points] = board_ref.current.merge(direction)
        if(success){
            set_board_state(board_ref.current.get_state())
        } else {
            set_error(`Cannot move ${Board.direction_to_str(direction)}`)
        } 
        if(points > 0) {
            set_score(score_ref.current + points)
        }
    };

    const swipe_handlers = useSwipeable({
        onSwiped: (eventData) => {
            if (waiting_ai_ref.current) {
                return;
            }
            switch (eventData.dir) {
                case "Left": {
                    move(Direction.Left);
                    break;
                }
                case "Right": {
                    move(Direction.Right);
                    break;
                }
                case "Up": {
                    move(Direction.Up);
                    break;
                }
                case "Down": {
                    move(Direction.Down);
                    break;
                }
                default: { }
            }
        }
    });

    const on_key_down = (event : KeyboardEvent) => {
        if (waiting_ai_ref.current) {
            return;
        }
        switch(event.key){
            case "ArrowLeft": {
                move(Direction.Left);
                break;
            }
            case "ArrowRight": {
                move(Direction.Right);
                break;
            }
            case "ArrowUp": {
                move(Direction.Up);
                break;
            }
            case "ArrowDown": {
                move(Direction.Down);
                break;
            }
            default: {  }
        }        
    };

    useEffect(() => {
        waiting_ai_ref.current = is_waiting_ai;
        if (is_waiting_ai) {
            set_cursor('progress');
        } else {
            set_cursor('default');
        }
    }, [is_waiting_ai]);

    const ask_ai = React.useCallback(() => {
        set_waiting_ai(true);
        fetch_ai_advise(board_ref.current.get_state(), ai_model)
        .then(res => {
            if (res !== undefined) {
                move(res);
            }
            set_waiting_ai(false);
        })
        .catch(e => {
            set_error(e?.error?.message ?? e.message ?? `{e}`);
            set_waiting_ai(false);
        });
    }, [ai_model]);

    useEffect(() => {
        window.addEventListener('keydown', on_key_down);    
        restart();
        return () => {
          window.removeEventListener('keydown', on_key_down);
        };
    }, []);

    const state_changed = useCallback((state : number[][]) => {
        set_board_state(state);
    }, [set_board_state]);
    
    const on_lost = useCallback(() => {
        set_lost(true);
    }, [set_lost]);

    const on_win = useCallback(() => {
        set_winner(true);
    }, [set_winner]);

    const restart = () => {
        set_lost(false);
        set_winner(false);
        set_score(0);
        board_ref.current.restart();
    } 

    const board_settings = {
        size : 4, 
        win_number : 2048, 
        initial_tiles : 8,
        new_tiles : 1,
        on_state_changed : state_changed, 
        on_lost : on_lost, 
        on_win : on_win
    };

    const board_ref = React.useRef(new Board(board_settings));

    const get_tile_color = (value: number) : string => {
        if (value === 0) {
            return "";
        } 
        const p = Math.log2(value);
        const r = 255 - 5 * p;
        const g = 235 - 10 * p;
        const b = 205 - 5 * p;
        return `rgb(${r}, ${g}, ${b})`;
    }

    const on_model_changed = (model : string) => {
        set_ai_model(model);
    }

    const render_ai_models_select = React.useCallback(() => {
        return (
            <select value={ai_model} onChange={(e) => on_model_changed(e.target.value)}>
                {
                    ai_models.map((m, index) => {
                        return <option key={index} value={m}>{m}</option>    
                    })
                }
            </select>
        )
    }, [ai_model]);

    const draw_row = (row : number[]) => {
        if (row && row.length > 0){
            return <tr>{ row.map((v) => <td className="tile" data-color={get_tile_color(v)} >{v > 0 ? v.toString() : ""}</td>) }</tr>
        } else {
            return <></>
        }
    }

    const render_end_of_game = (lost : boolean) => {
        if (lost) {
            return (<div className="end-of-game-panel">
                <span>No more moves!</span>
            </div>);
        }
        return <></>
    } 

    const render_winner = (winner : boolean) => {
        if (winner) {
            return (<div className="end-of-game-panel">
                <span>You are winner!</span>
            </div>);
        }
        return <></>
    } 

    return (
        <div className="game-view-panel" {...swipe_handlers} style={{ cursor: cursor }}>
            <div className="game-header-panel">
                <button onClick={() => restart()} disabled={is_waiting_ai}>New Game</button>
                <span>Score: {score}</span>
                <div>
                    <button onClick={() => ask_ai()} disabled={is_waiting_ai}>Ask AI</button>
                    {render_ai_models_select()}
                </div>
            </div>
            <div className="game-main-panel">
                <table className="tiles-panel">
                    <tbody>
                        {board_state?.map(draw_row)}
                    </tbody>
                </table>
                {render_end_of_game(is_lost)}
                {render_winner(is_winner)}
                <div className="message-panel">{error}</div>
            </div>

        </div>
    );
}
