import { jest, beforeEach, describe, test, expect } from "@jest/globals";
import bcrypt from "bcrypt";
import { findUserByEmail, insertUser } from "../repositories/usersRepository";

const mockInsertUser = jest.fn();
const mockFindUserByEmail = jest.fn();

jest.unstable_mockModule("../repositories/usersRepository.js", () => ({
  insertUser: mockInsertUser,
  findUserByEmail: mockFindUserByEmail,
}));

const { signup, login } = await import("../services/authService.js");

const user = {
  _id: "0123456789",
  email: "dat@example.com",
  passwordHash: "",
  role: "user",
};

beforeEach(() => {
  jest.resetAllMocks();

  mockFindUserByEmail.mockResolvedValue(null);

  mockInsertUser.mockImplementation(async ({ email, passwordHash }) => ({
    ...user,
    email,
    passwordHash,
  }));
});

describe("Signup", () => {
  test("creates a user with a hashed password", async () => {
    const result = await signup("dat@example.com", "password123");

    expect(result.ok).toBe(true);
    expect(mockInsertUser).toHaveBeenCalledTimes(1);

    const savedData = mockInsertUser.mock.calls[0][0];

    expect(savedData.email).toBe("dat@example.com");
    expect(savedData.passwordHash).not.toBe("password123");
    expect(
      await bcrypt.compare("password123", savedData.passwordHash)
    ).toBe(true);
  });

  test("clean email", async () => {
    await signup("  DAT@EXAMPLE.COM  ", "password123");

    expect(mockFindUserByEmail).toHaveBeenCalledWith(
      "dat@example.com"
    );
    expect(mockInsertUser).toHaveBeenCalledWith(
      expect.objectContaining({ email: "dat@example.com" })
    );
  });

  test("rejects duplicate email", async () => {
    mockFindUserByEmail.mockResolvedValue(user);

    const result = await signup("dat@example.com", "password123");

    expect(result).toEqual({
      ok: false,
      error: {
        status: 409,
        message: "Email already registered",
      },
    });

    expect(mockInsertUser).not.toHaveBeenCalled();
  });

  test.each([
    ["invalid email", "not-an-email", "password123"],
    ["short password", "dat@example.com", "short"],
    ["missing email", undefined, "password123"],
    ["missing password", "dat@example.com", undefined],
  ])("rejects %s", async (_, email, password) => {
    const result = await signup(email, password);

    expect(result.ok).toBe(false);
    expect(result.error.status).toBe(400);
    expect(mockInsertUser).not.toHaveBeenCalled();
  });

  test("handles duplicate key errors from MongoDB", async () => {
    mockInsertUser.mockRejectedValue({ code: 11000 });

    const result = await signup("dat@example.com", "password123");

    expect(result.error.status).toBe(409);
  });

  test("does not expose passwordHash in DTO", async () => {
    const result = await signup("dat@example.com", "password123");

    expect(result.value).toEqual({
      id: user._id,
      email: "dat@example.com",
      role: "user",
    });

    expect(result.value).not.toHaveProperty("passwordHash");
  });
});


describe("Login", () => {
  test("accepts correct credentials", async () => {
    const hash = await bcrypt.hash("password123", 4);

    mockFindUserByEmail.mockResolvedValue({
      ...user,
      passwordHash: hash,
    });

    const result = await login("dat@example.com", "password123");

    expect(result.ok).toBe(true);
    expect(result.value).toEqual({
      id: user._id,
      email: user.email,
      role: "user",
    });
  });

  test("rejects unknown email", async () => {
    const result = await login("unknown@example.com", "password123");

    expect(result.error.status).toBe(401);
    expect(result.error.message).toBe("Invalid email or password");
  });

  test("rejects incorrect password", async () => {
    const hash = await bcrypt.hash("password123", 4);

    mockFindUserByEmail.mockResolvedValue({
      ...user,
      passwordHash: hash,
    });

    const result = await login("dat@example.com", "wrongpassword");

    expect(result.error.status).toBe(401);
    expect(result.error.message).toBe("Invalid email or password");
  });

  test("does not expose passwordHash after login", async () => {
    const hash = await bcrypt.hash("password123", 4);

    mockFindUserByEmail.mockResolvedValue({
      ...user,
      passwordHash: hash,
    });

    const result = await login("dat@example.com", "password123");

    expect(result.value).not.toHaveProperty("passwordHash");
  });
});
