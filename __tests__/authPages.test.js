import { jest, beforeEach, describe, test, expect } from "@jest/globals";
import request from "supertest";

// The login and signup pages, the navigation for guests and logged-in users,
// and the HTML fragments the auth endpoints send back to HTMX forms.
// The services are mocked, so no database is needed.

const mockSignup = jest.fn();
const mockLogin = jest.fn();
const mockFindUserById = jest.fn();
const mockGetAllLostItems = jest.fn();

jest.unstable_mockModule("../services/authService.js", () => ({
  signup: mockSignup,
  login: mockLogin,
}));

jest.unstable_mockModule("../repositories/usersRepository.js", () => ({
  findUserById: mockFindUserById,
}));

jest.unstable_mockModule("../services/lostItemsService.js", () => ({
  createLostItem: jest.fn(),
  getAllLostItems: mockGetAllLostItems,
  getLostItemById: jest.fn(),
  updateLostItem: jest.fn(),
  deleteLostItem: jest.fn(),
}));

const { default: app } = await import("../app.js");

const user = { id: "0123456789", email: "jerry@example.com", role: "user" };
const databaseUser = { _id: user.id, email: user.email, role: user.role };

const htmx = { "HX-Request": "true" };

const isFragment = (html) => !/<html|<body|<head/i.test(html);

beforeEach(() => {
  jest.resetAllMocks();
  mockLogin.mockResolvedValue({ ok: true, value: user });
  mockSignup.mockResolvedValue({ ok: true, value: user });
  mockFindUserById.mockResolvedValue(databaseUser);
  mockGetAllLostItems.mockResolvedValue([]);
});

// An agent keeps the session cookie between requests.
const loggedInAgent = async () => {
  const agent = request.agent(app);
  await agent.post("/auth/login").send({ email: user.email, password: "password123" });
  return agent;
};

describe("GET /login", () => {
  test("200: renders the login form wired to POST /auth/login with HTMX", async () => {
    const res = await request(app).get("/login");

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/text\/html/);
    expect(res.text).toContain("<h1");
    expect(res.text).toContain('hx-post="/auth/login"');
    expect(res.text).toContain('action="/auth/login"');
    expect(res.text).toContain('method="post"');
    expect(res.text).toContain("/vendor/htmx/htmx.min.js");
  });

  test("the fields have labels, the right types and autocomplete hints", async () => {
    const html = (await request(app).get("/login")).text;

    expect(html).toMatch(/<label[^>]*for="email"/);
    expect(html).toMatch(/<label[^>]*for="password"/);
    expect(html).toMatch(/id="email"[^>]*type="email"[^>]*required/);
    expect(html).toMatch(/id="password"[^>]*type="password"[^>]*required/);
    expect(html).toContain('autocomplete="username"');
    expect(html).toContain('autocomplete="current-password"');
  });

  test("links to the signup page and has a live region for the answer", async () => {
    const html = (await request(app).get("/login")).text;

    expect(html).toContain('href="/signup"');
    expect(html).toContain('id="form-feedback"');
    expect(html).toContain('aria-live="polite"');
  });

  test("a logged-in user is redirected to the list", async () => {
    const agent = await loggedInAgent();

    const res = await agent.get("/login");

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe("/lost-items");
  });
});

describe("GET /signup", () => {
  test("200: renders the signup form wired to POST /auth/signup with HTMX", async () => {
    const res = await request(app).get("/signup");

    expect(res.status).toBe(200);
    expect(res.text).toContain('hx-post="/auth/signup"');
    expect(res.text).toContain('action="/auth/signup"');
  });

  test("the password field states the backend's 8-72 character rule", async () => {
    const html = (await request(app).get("/signup")).text;

    expect(html).toMatch(/id="password"[^>]*minlength="8"[^>]*maxlength="72"/);
    expect(html).toContain('autocomplete="new-password"');
    expect(html).toContain('autocomplete="email"');
    expect(html).toContain('aria-describedby="password-hint"');
    expect(html).toContain('id="password-hint"');
    expect(html).toContain("8–72 characters");
  });

  test("a logged-in user is redirected to the list", async () => {
    const agent = await loggedInAgent();

    const res = await agent.get("/signup");

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe("/lost-items");
  });
});

describe("navigation", () => {
  test("guests see Log in and Sign up, not Log out", async () => {
    const html = (await request(app).get("/lost-items")).text;

    expect(html).toContain('href="/login"');
    expect(html).toContain('href="/signup"');
    expect(html).not.toContain("Log out");
    expect(html).not.toContain("Signed in as");
  });

  test("a logged-in user sees their email and a Log out button, not Log in", async () => {
    const agent = await loggedInAgent();

    const html = (await agent.get("/lost-items")).text;

    expect(html).toContain("Signed in as");
    expect(html).toContain("jerry@example.com");
    expect(html).toContain('hx-post="/auth/logout"');
    expect(html).toContain("Log out");
    expect(html).not.toContain('href="/login"');
    expect(html).not.toContain('href="/signup"');
  });

  test("the nav marks the current page with aria-current", async () => {
    const login = (await request(app).get("/login")).text;
    const list = (await request(app).get("/lost-items")).text;

    expect(login).toMatch(/href="\/login"[^>]*aria-current="page"/);
    expect(list).toMatch(/href="\/lost-items"[^>]*aria-current="page"/);
    expect(login.match(/aria-current="page"/g)).toHaveLength(1);
  });

  test("the user's email is escaped", async () => {
    mockFindUserById.mockResolvedValue({
      ...databaseUser,
      email: '"><script>alert(1)</script>@example.com',
    });
    const agent = await loggedInAgent();

    const html = (await agent.get("/lost-items")).text;

    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("&lt;script&gt;");
  });
});

describe("POST /auth/signup from the signup form (HTMX)", () => {
  const signup = (body) =>
    request(app).post("/auth/signup").set(htmx).type("form").send(body);

  test("201: a success fragment that links to the login page", async () => {
    const res = await signup({ email: "jerry@example.com", password: "password123" });

    expect(res.status).toBe(201);
    expect(isFragment(res.text)).toBe(true);
    expect(res.text).toContain('role="status"');
    expect(res.text).toContain("Your account was created");
    expect(res.text).toContain("jerry@example.com");
    expect(res.text).toContain('href="/login"');
    expect(mockSignup).toHaveBeenCalledWith("jerry@example.com", "password123");
  });

  test("400: a validation message comes back as an error fragment", async () => {
    mockSignup.mockResolvedValue({
      ok: false,
      error: { status: 400, message: "Password must be between 8 and 72 characters" },
    });

    const res = await signup({ email: "jerry@example.com", password: "short" });

    expect(res.status).toBe(400);
    expect(isFragment(res.text)).toBe(true);
    expect(res.text).toContain('role="alert"');
    expect(res.text).toContain("We couldn&#39;t create your account.");
    expect(res.text).toContain("Password must be between 8 and 72 characters");
  });

  test("409: an email that is already registered", async () => {
    mockSignup.mockResolvedValue({
      ok: false,
      error: { status: 409, message: "Email already registered" },
    });

    const res = await signup({ email: "jerry@example.com", password: "password123" });

    expect(res.status).toBe(409);
    expect(res.text).toContain("Email already registered");
  });

  test("without HX-Request the answer is still the JSON from the contract", async () => {
    const res = await request(app)
      .post("/auth/signup")
      .send({ email: "jerry@example.com", password: "password123" });

    expect(res.status).toBe(201);
    expect(res.body).toEqual(user);
  });
});

describe("POST /auth/login from the login form (HTMX)", () => {
  const login = (body) =>
    request(app).post("/auth/login").set(htmx).type("form").send(body);

  test("200: sends HX-Redirect to the list and starts a session", async () => {
    const res = await login({ email: "jerry@example.com", password: "password123" });

    expect(res.status).toBe(200);
    expect(res.headers["hx-redirect"]).toBe("/lost-items");
    expect(isFragment(res.text)).toBe(true);
    expect(res.headers["set-cookie"].join(";")).toContain("cs326.sid");
  });

  test("401: wrong credentials give an error fragment and no redirect or cookie", async () => {
    mockLogin.mockResolvedValue({
      ok: false,
      error: { status: 401, message: "Invalid email or password" },
    });

    const res = await login({ email: "jerry@example.com", password: "wrong-password" });

    expect(res.status).toBe(401);
    expect(res.headers["hx-redirect"]).toBeUndefined();
    expect(res.headers["set-cookie"]).toBeUndefined();
    expect(isFragment(res.text)).toBe(true);
    expect(res.text).toContain('role="alert"');
    expect(res.text).toContain("We couldn&#39;t log you in.");
    expect(res.text).toContain("Invalid email or password");
  });

  test("500: an unexpected failure does not leak details", async () => {
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
    mockLogin.mockRejectedValue(new Error("mongo password is hunter2"));

    const res = await login({ email: "jerry@example.com", password: "password123" });

    expect(res.status).toBe(500);
    expect(isFragment(res.text)).toBe(true);
    expect(res.text).toContain("Something went wrong");
    expect(res.text).not.toContain("hunter2");

    consoleError.mockRestore();
  });

  test("without HX-Request the answer is still the JSON from the contract", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ email: "jerry@example.com", password: "password123" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual(user);
    expect(res.headers["hx-redirect"]).toBeUndefined();
  });
});

describe("POST /auth/logout from the header button (HTMX)", () => {
  test("200: sends HX-Redirect to the home page and ends the session", async () => {
    const agent = await loggedInAgent();
    expect((await agent.get("/auth/me")).status).toBe(200);

    const res = await agent.post("/auth/logout").set(htmx);

    expect(res.status).toBe(200);
    expect(res.headers["hx-redirect"]).toBe("/");
    expect((await agent.get("/auth/me")).status).toBe(401);
  });

  test("after logging out the nav is the guest nav again", async () => {
    const agent = await loggedInAgent();
    await agent.post("/auth/logout").set(htmx);

    const html = (await agent.get("/lost-items")).text;

    expect(html).toContain('href="/login"');
    expect(html).not.toContain("Log out");
  });
});
