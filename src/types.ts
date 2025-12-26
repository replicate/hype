import type { Context } from "hono";

export type AppContext = Context<{ Bindings: Env }>;
export type HandleArgs = [AppContext];

export interface Post {
	id: string;
	source: string;
	username: string;
	name: string;
	stars: number;
	description: string;
	url: string;
	created_at: string;
}
