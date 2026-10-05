import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { app, resetTodos } from "../src/app";

beforeEach(() => resetTodos());

describe("GET /api/health", () => {
  it("returns ok", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });
});

describe("todos API", () => {
  it("starts with an empty list", async () => {
    const res = await request(app).get("/api/todos");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("creates a todo", async () => {
    const res = await request(app).post("/api/todos").send({ title: "Learn CI/CD" });
    expect(res.status).toBe(201);
    expect(res.body).toEqual({ id: 1, title: "Learn CI/CD", done: false });
  });

  it("rejects a todo without a title", async () => {
    const res = await request(app).post("/api/todos").send({});
    expect(res.status).toBe(400);
  });

  it("deletes a todo", async () => {
    await request(app).post("/api/todos").send({ title: "Temp" });
    const del = await request(app).delete("/api/todos/1");
    expect(del.status).toBe(204);
    const list = await request(app).get("/api/todos");
    expect(list.body).toEqual([]);
  });

  it("returns 404 when deleting a missing todo", async () => {
    const res = await request(app).delete("/api/todos/999");
    expect(res.status).toBe(404);
  });
});
