import express, { Request, Response } from "express";

export interface Todo {
  id: number;
  title: string;
  done: boolean;
}

// In-memory storage (resets when the server restarts)
let todos: Todo[] = [];
let nextId = 1;

export function resetTodos(): void {
  todos = [];
  nextId = 1;
}

export const app = express();
app.use(express.json());

// 1. Health check — used later by CI/CD to verify a deployment is alive
app.get("/api/health", (_req: Request, res: Response) => {
  console.log('HEALTHHHH:')
  res.json({ status: "broken", uptime: process.uptime() });
});

// 2. List all todos
app.get("/api/todos", (_req: Request, res: Response) => {
  res.json(todos);
});

// 3. Create a todo
app.post("/api/todos", (req: Request, res: Response) => {
  const { title } = req.body ?? {};
  if (typeof title !== "string" || title.trim() === "") {
    res.status(400).json({ error: "title is required" });
    return;
  }
  const todo: Todo = { id: nextId++, title: title.trim(), done: false };
  todos.push(todo);
  res.status(201).json(todo);
});

// 4. Delete a todo
app.delete("/api/todos/:id", (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const index = todos.findIndex((t) => t.id === id);
  if (index === -1) {
    res.status(404).json({ error: "todo not found" });
    return;
  }
  todos.splice(index, 1);
  res.status(204).send();
});
