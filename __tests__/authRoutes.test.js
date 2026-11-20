import { jest, beforeEach, describe, test, expect, } from "@jest/globals";
import request from "supertest";

const mockSignup = jest.fn();
const mockLogin = jest.fn();
const mockFindUserById = jest.fn();

jest.unstable_mockModule("../services/authService.js", () => ({
  signup: mockSignup,
  login: mockLogin,
}));

jest.unstable_mockModule("../repositories/usersRepository.js", () => ({
  findUserById: mockFindUserById,
}));

const { default: app } = await import("../app.js");

const user = {
  id: "0123456789",
  email: "dat@example.com",
  role: "user",
};

const databaseUser = {
  _id: user.id,
  email: user.email,
  role: user.role,
  passwordHash: "hashed-password",
};

beforeEach(() => {
  jest.resetAllMocks();

  mockSignup.mockResolvedValue({
    ok: true,
    value: user,
  });

  mockLogin.mockResolvedValue({
    ok: true,
    value: user,
  });

  mockFindUserById.mockResolvedValue(databaseUser);
});

describe("POST /auth/signup", () => {
  test("returns 201 and a public user", async () => {
    const res = await request(app)
      .post("/auth/signup")
      .send({
        email: "dat@example.com",
        password: "password123",
        role: "admin",
      });

    expect(res.status).toBe(201);
    expect(res.body).toEqual(user);
    expect(res.body).not.toHaveProperty("passwordHash");

    expect(mockSignup).toHaveBeenCalledWith(
      "dat@example.com",
      "password123"
    );
  });

  test("returns 409 for duplicate email", async () => {
    mockSignup.mockResolvedValue({
      ok: false,
      error: {
        status: 409,
        message: "Email already registered",
      },
    });

    const res = await request(app)
      .post("/auth/signup")
      .send({
        email: "dat@example.com",
        password: "password123",
      });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe("Email already registered");
  });
});

describe("POST /auth/login", () => {
  test("returns 200 and sets a session cookie", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({
        email: "dat@example.com",
        password: "password123",
      });

    expect(res.status).toBe(200);
    expect(res.body).toEqual(user);

    const cookies = res.headers["set-cookie"];

    expect(cookies).toBeDefined();
    expect(cookies[0]).toContain("cs326.sid=");
    expect(cookies[0]).toContain("HttpOnly");
    expect(cookies[0]).toContain("SameSite=Lax");
  });

  test("returns 401 for invalid credentials", async () => {
    mockLogin.mockResolvedValue({
      ok: false,
      error: {
        status: 401,
        message: "Invalid email or password",
      },
    });

    const res = await request(app)
      .post("/auth/login")
      .send({
        email: "dat@example.com",
        password: "wrongpassword",
      });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Invalid email or password");
    expect(res.headers["set-cookie"]).toBeUndefined();
  });
});

describe("GET /auth/me", () => {
  test("returns 401 without a session", async () => {
    const res = await request(app).get("/auth/me");

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Authentication required");
  });

  test("returns current user after login", async () => {
    const agent = request.agent(app);

    await agent
      .post("/auth/login")
      .send({
        email: "dat@example.com",
        password: "password123",
      })
      .expect(200);

    const res = await agent.get("/auth/me");

    expect(res.status).toBe(200);
    expect(res.body).toEqual(user);
    expect(mockFindUserById).toHaveBeenCalledWith(user.id);
  });

  test("returns 401 if the account was deleted", async () => {
    const agent = request.agent(app);

    await agent
      .post("/auth/login")
      .send({
        email: "dat@example.com",
        password: "password123",
      })
      .expect(200);

    mockFindUserById.mockResolvedValue(null);

    const res = await agent.get("/auth/me");

    expect(res.status).toBe(401);
  });
});

describe("POST /auth/logout", () => {
  test("invalidates the existing session", async () => {
    const agent = request.agent(app);

    await agent
      .post("/auth/login")
      .send({
        email: "dat@example.com",
        password: "password123",
      })
      .expect(200);

    await agent.get("/auth/me").expect(200);

    await agent.post("/auth/logout").expect(200);

    await agent.get("/auth/me").expect(401);
  });
});
