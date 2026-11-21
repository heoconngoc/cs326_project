import { jest, beforeEach, describe, test, expect } from "@jest/globals";
import request from "supertest";

const mockCreateLostItem = jest.fn();
const mockUpdateLostItem = jest.fn();
const mockDeleteLostItem = jest.fn();
const mockLogin = jest.fn();
const mockFindUserById = jest.fn();

jest.unstable_mockModule("../services/lostItemsService.js", () => ({
  createLostItem: mockCreateLostItem,
  getAllLostItems: jest.fn().mockResolvedValue([]),
  getLostItemById: jest.fn(),
  updateLostItem: mockUpdateLostItem,
  deleteLostItem: mockDeleteLostItem,
}));

jest.unstable_mockModule("../services/authService.js", () => ({
  signup: jest.fn(),
  login: mockLogin,
}));

jest.unstable_mockModule("../repositories/usersRepository.js", () => ({
  findUserById: mockFindUserById,
}));

const { default: app } = await import("../app.js");

const ID = "000000000000000000000001";
const user = { id: "0123456789", email: "jerry@example.com", role: "user" };
const htmx = { "HX-Request": "true" };

beforeEach(() => {
  jest.resetAllMocks();
  mockLogin.mockResolvedValue({ ok: true, value: user });
  mockFindUserById.mockResolvedValue({
    _id: user.id,
    email: user.email,
    role: user.role,
  });
});

describe("a guest opens a page that needs a login", () => {
  test("a browser (Accept: text/html) is redirected to /login", async () => {
    const res = await request(app)
      .get("/lost-items/new")
      .set("Accept", "text/html");

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe("/login");
  });

  test("without an Accept header the answer is still the JSON 401", async () => {
    const res = await request(app).get("/lost-items/new");

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: "Authentication required" });
  });

  test("a logged-in user gets the form", async () => {
    const agent = request.agent(app);
    await agent
      .post("/auth/login")
      .send({ email: user.email, password: "password123" });

    const res = await agent.get("/lost-items/new").set("Accept", "text/html");

    expect(res.status).toBe(200);
    expect(res.text).toContain('hx-post="/lost-items"');
  });
});

describe("a guest uses an HTMX form or button", () => {
  const cases = [
    [
      "POST /lost-items (report form)",
      () =>
        request(app)
          .post("/lost-items")
          .set(htmx)
          .type("form")
          .send({ title: "x" }),
      mockCreateLostItem,
    ],
    [
      "PATCH /lost-items/:id (edit form)",
      () =>
        request(app)
          .patch(`/lost-items/${ID}`)
          .set(htmx)
          .type("form")
          .send({ title: "x" }),
      mockUpdateLostItem,
    ],
    [
      "DELETE /lost-items/:id (delete button)",
      () => request(app).delete(`/lost-items/${ID}`).set(htmx),
      mockDeleteLostItem,
    ],
  ];

  test.each(cases)(
    "%s: 401 error fragment with a Log in link, service not called",
    async (_name, send, service) => {
      const res = await send();

      expect(res.status).toBe(401);
      expect(res.headers["content-type"]).toMatch(/text\/html/);
      expect(res.text).not.toMatch(/<html|<body/i);
      expect(res.text).not.toContain("{");
      expect(res.text).toContain('role="alert"');
      expect(res.text).toContain("Please log in first.");
      expect(res.text).toContain('href="/login"');
      expect(res.headers["hx-redirect"]).toBeUndefined();
      expect(service).not.toHaveBeenCalled();
    },
  );

  test("the JSON API keeps answering with JSON", async () => {
    const res = await request(app).post("/api/lost-items").send({ title: "x" });

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: "Authentication required" });
  });
});
