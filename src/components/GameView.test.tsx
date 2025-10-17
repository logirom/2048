import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { GameView } from "./GameView";
import { Direction } from "../model/board";
import '@testing-library/jest-dom';

// Mock react-swipeable to avoid needing real handlers
jest.mock("react-swipeable", () => ({
    useSwipeable: () => ({})
}));

// Mock ai.fetch_ai_advise so tests can control AI responses
const mock_fetch_ai_advise = jest.fn();
jest.mock("../model/ai", () => ({
    fetch_ai_advise: (...args: any[]) => mock_fetch_ai_advise(...args)
}));

// Provide a mocked Board and Direction so component uses deterministic behavior
jest.mock("../model/board", () => {
    const Direction = { Left: 0, Right: 1, Up: 2, Down: 3 };

    class Board {
        settings: any;
        state: number[][];
        constructor(settings: any) {
            this.settings = settings;
            // initial empty 4x4
            this.state = Array.from({ length: 4 }, () => [0, 0, 0, 0]);
        }
        restart() {
            // place deterministic tiles and notify
            this.state = [
                [2, 0, 0, 0],
                [0, 0, 0, 0],
                [0, 0, 0, 0],
                [0, 0, 0, 0],
            ];
            this.settings.on_state_changed(this.state);
        }
        merge(direction: number): [boolean, number] {
            // For tests, merging produces an 8 in [0,0] and returns 8 points
            this.state = [
                [8, 0, 0, 0],
                [0, 0, 0, 0],
                [0, 0, 0, 0],
                [0, 0, 0, 0],
            ];
            // simulate on_state_changed called after merge and after place_random
            this.settings.on_state_changed(this.state);
            this.settings.on_state_changed(this.state);
            return [true, 8];
        }
        get_state() {
            return this.state;
        }
        set_state(s: number[][]) {
            this.state = s;
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
    return { Board, Direction };
});

describe("GameView component", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("renders board after restart (on_state_changed)", async () => {
        render(<GameView />);
        const two_found = await screen.findByText("2");
        expect(two_found).toBeInTheDocument();
        // Score should start at 0
        expect(screen.getByText(/Score:/)).toHaveTextContent("Score: 0");
    });

    it("shows error message when AI request fails", async () => {
        mock_fetch_ai_advise.mockRejectedValue(new Error("AI failure"));
        render(<GameView />);
        // wait initial restart
        const two_found = await screen.findByText("2");
        expect(two_found).toBeInTheDocument();

        const askButton = screen.getByText("Ask AI");
        fireEvent.click(askButton);

        const failure_text = await screen.findByText("AI failure");
        expect(failure_text).toBeInTheDocument();
    });

    it("score increases when merge produces points via keyboard", async () => {
        const { Board: OriginalBoard } = jest.requireMock("../model/board");
        
        jest.spyOn(OriginalBoard.prototype, "merge").mockImplementation(function(this: any) {
            this.state = [[4, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]];
            this.settings.on_state_changed(this.state);
            this.settings.on_state_changed(this.state);
            return [true, 16];
        });

        render(<GameView />);
        await screen.findByText("2");
        expect(screen.getByText(/Score:/)).toHaveTextContent("Score: 0");

        fireEvent.keyDown(window, { key: "ArrowLeft" });

        await waitFor(() => expect(screen.getByText(/Score:/)).toHaveTextContent("Score: 16"));
    });

    it("score accumulates across multiple merges", async () => {
        const { Board: OriginalBoard } = jest.requireMock("../model/board");
        
        jest.spyOn(OriginalBoard.prototype, "merge")
            .mockImplementationOnce(function(this: any) {
                this.state = [[4, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]];
                this.settings.on_state_changed(this.state);
                this.settings.on_state_changed(this.state);
                return [true, 10];
            })
            .mockImplementationOnce(function(this: any) {
                this.state = [[8, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]];
                this.settings.on_state_changed(this.state);
                this.settings.on_state_changed(this.state);
                return [true, 20];
            });

        render(<GameView />);
        await screen.findByText("2");

        fireEvent.keyDown(window, { key: "ArrowLeft" });
        await waitFor(() => expect(screen.getByText(/Score:/)).toHaveTextContent("Score: 10"));

        fireEvent.keyDown(window, { key: "ArrowUp" });
        await waitFor(() => expect(screen.getByText(/Score:/)).toHaveTextContent("Score: 30"));
    });

    it("score resets to 0 when New Game is clicked", async () => {
        const { Board: OriginalBoard } = jest.requireMock("../model/board");
        
        jest.spyOn(OriginalBoard.prototype, "merge").mockImplementation(function(this: any) {
            this.state = [[4, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]];
            this.settings.on_state_changed(this.state);
            this.settings.on_state_changed(this.state);
            return [true, 50];
        });

        render(<GameView />);
        await screen.findByText("2");

        fireEvent.keyDown(window, { key: "ArrowLeft" });
        await waitFor(() => expect(screen.getByText(/Score:/)).toHaveTextContent("Score: 50"));

        const newGameButton = screen.getByText("New Game");
        fireEvent.click(newGameButton);

        await waitFor(() => expect(screen.getByText(/Score:/)).toHaveTextContent("Score: 0"));
    });

    it("score does not change when merge returns 0 points", async () => {
        const { Board: OriginalBoard } = jest.requireMock("../model/board");
        
        jest.spyOn(OriginalBoard.prototype, "merge").mockImplementation(function(this: any) {
            this.state = [[2, 4, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]];
            this.settings.on_state_changed(this.state);
            this.settings.on_state_changed(this.state);
            return [true, 0];
        });

        render(<GameView />);
        await screen.findByText("2");
        expect(screen.getByText(/Score:/)).toHaveTextContent("Score: 0");

        fireEvent.keyDown(window, { key: "ArrowLeft" });

        await screen.findByText("4");
        expect(screen.getByText(/Score:/)).toHaveTextContent("Score: 0");
    });

    it("shows 'No more moves!' panel when on_lost is called", async () => {
        const { Board: OriginalBoard } = jest.requireMock("../model/board");
        
        jest.spyOn(OriginalBoard.prototype, "merge").mockImplementation(function(this: any) {
            this.settings.on_lost();
            return [false, 0];
        });

        render(<GameView />);
        await await screen.findByText("2");

        fireEvent.keyDown(window, { key: "ArrowLeft" });

        const elem = await screen.findByText("No more moves!");
        expect(elem).toBeInTheDocument();
    });

    it("shows 'You are winner!' panel when on_win is called", async () => {
        const { Board: OriginalBoard } = jest.requireMock("../model/board");
        
        jest.spyOn(OriginalBoard.prototype, "merge").mockImplementation(function(this: any) {
            this.state = [[2048, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]];
            this.settings.on_state_changed(this.state);
            this.settings.on_state_changed(this.state);
            this.settings.on_win();
            return [true, 2048];
        });

        render(<GameView />);
        await screen.findByText("2");

        fireEvent.keyDown(window, { key: "ArrowLeft" });
        const elem = await screen.findByText("You are winner!");
        expect(elem).toBeInTheDocument();
    });

    it("hides 'No more moves!' panel after clicking New Game", async () => {
        const { Board: OriginalBoard } = jest.requireMock("../model/board");
        
        jest.spyOn(OriginalBoard.prototype, "merge").mockImplementation(function(this: any) {
            this.settings.on_lost();
            return [false, 0];
        });

        render(<GameView />);
        await screen.findByText("2");

        fireEvent.keyDown(window, { key: "ArrowLeft" });
        const elem = await screen.findByText("No more moves!");
        expect(elem).toBeInTheDocument();
        const newGameButton = screen.getByText("New Game");
        fireEvent.click(newGameButton);

        await waitFor(() => expect(screen.queryByText("No more moves!")).not.toBeInTheDocument());
    });

    it("hides 'You are winner!' panel after clicking New Game", async () => {
        const { Board: OriginalBoard } = jest.requireMock("../model/board");
        
        jest.spyOn(OriginalBoard.prototype, "merge").mockImplementation(function(this: any) {
            this.state = [[2048, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]];
            this.settings.on_state_changed(this.state);
            this.settings.on_state_changed(this.state);
            this.settings.on_win();
            return [true, 2048];
        });

        render(<GameView />);
        await screen.findByText("2");

        fireEvent.keyDown(window, { key: "ArrowLeft" });
        const elem = await screen.findByText("You are winner!");
        expect(elem).toBeInTheDocument();
        const newGameButton = screen.getByText("New Game");
        fireEvent.click(newGameButton);

        await waitFor(() => expect(screen.queryByText("You are winner!")).not.toBeInTheDocument());
    });
});