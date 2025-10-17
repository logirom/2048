import { Direction } from "./board";

export interface PuterChatOptions {
    stream?: boolean;
    model?: string;
    signal?: AbortSignal;
}

declare global {
    interface Window {
    puter?: {
        ai: {
        chat: (messages: Array<{role: string; content: string}>, options?: PuterChatOptions) => Promise<any>;
        };
    };
    }
}

export async function fetch_ai_advise (matrix : number[][], model : string) : Promise<Direction | undefined> {
    const chat_resp = await window.puter?.ai.chat(
        [
            {
                role : 'user', 
                content : `What is the best move in 2048 game if current state is ${matrix}. Please just answer Right, Left, Up or Down.`
            }
        ], 

        {model: model, stream: true }
    );

    for await ( const part of chat_resp ) {
        const str = part?.text?.replaceAll('\n', '');
        console.info(str);
        switch(str){
            case "Left": {
                return Direction.Left;
            }
            case "Right": {
                return Direction.Right;
            }
            case "Up": {
                return Direction.Up;
            }
            case "Down": {
                return Direction.Down;
            }
            default: { 
                throw new Error(`Cannot parse AI response: ${str}`); 
            }
        } 
    }
    return undefined;
};