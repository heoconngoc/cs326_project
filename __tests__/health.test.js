import { test, expect } from "@jest/globals";
import request from "supertest";

const { default: app } = await import("../app.js");

test("GET /health returns 200", async () => {
  const res = await request(app).get("/health");

  expect(res.status).toBe(200);
  expect(res.body).toEqual({
    status: "ok",
  });
});
