import { jest, beforeEach } from "@jest/globals";

const mockInsertLostItem = jest.fn();
const mockFindAllLostItems = jest.fn();

jest.unstable_mockModule("../repositories/lostItemsRepository.js", () => ({
  insertLostItem: mockInsertLostItem,
  findAllLostItems: mockFindAllLostItems,
}));

const { createLostItem, getAllLostItems } = await import("../services/lostItemsService.js");

const input = {
  title: "Lost Badminton Racket",
  description: "Badminton Racket",
  category: "Sport",
  location: "UMass Library",
  dateLost: "2026-10-12",
};

beforeEach(() => {
  jest.resetAllMocks();

  mockInsertLostItem.mockImplementation(async (data) => ({
    _id: "fake",
    ...data,
  }));

  mockFindAllLostItems.mockResolvedValue([]);
});

describe("Input validation", () => {
  test.each([
    ["null", null],
    ["undefined", undefined],
    ["string", "invalid"],
    ["number", 123],
    ["array", []],
    ["boolean", true],
  ])("rejects %s input", async (_, wrongInput) => {
    const result = await createLostItem(wrongInput);

    expect(result).toEqual({
      ok: false,
      error: "Invalid item data",
    });
    expect(mockInsertLostItem).not.toHaveBeenCalled();
  });
});

describe("Required fields", () => {
  const fields = ["title", "description", "category", "location"];

  test.each(fields)("rejects missing %s", async (field) => {
    const wrongInput = { ...input };
    delete wrongInput[field];

    const result = await createLostItem(wrongInput);

    expect(result).toEqual({
      ok: false,
      error: `${field} is required`,
    });
    expect(mockInsertLostItem).not.toHaveBeenCalled();
  });

  test.each(fields)("rejects empty %s", async (field) => {
    const result = await createLostItem({
      ...input,
      [field]: "",
    });

    expect(result.error).toBe(`${field} is required`);
    expect(mockInsertLostItem).not.toHaveBeenCalled();
  });

  test.each(fields)("rejects whitespace-only %s", async (field) => {
    const result = await createLostItem({
      ...input,
      [field]: "   ",
    });

    expect(result.error).toBe(`${field} is required`);
    expect(mockInsertLostItem).not.toHaveBeenCalled();
  });

  test.each(fields)("rejects non-string %s", async (field) => {
    const result = await createLostItem({
      ...input,
      [field]: 123,
    });

    expect(result.error).toBe(`${field} is required`);
    expect(mockInsertLostItem).not.toHaveBeenCalled();
  });
});

describe("Required field length limits", () => {
  const limits = [
    ["title", 3, 100],
    ["description", 1, 1000],
    ["category", 1, 50],
    ["location", 1, 150],
  ];

  test.each(limits)(
    "rejects %s below minimum length",
    async (field, min, max) => {
      if (min === 1) return; // Empty strings are tested separately.

      const result = await createLostItem({
        ...input,
        [field]: "a".repeat(min - 1),
      });

      expect(result.error).toBe(
        `${field} must be between ${min} and ${max} characters`
      );
      expect(mockInsertLostItem).not.toHaveBeenCalled();
    }
  );

  test.each(limits)(
    "rejects %s above maximum length",
    async (field, min, max) => {
      const result = await createLostItem({
        ...input,
        [field]: "a".repeat(max + 1),
      });

      expect(result.error).toBe(
        `${field} must be between ${min} and ${max} characters`
      );
      expect(mockInsertLostItem).not.toHaveBeenCalled();
    }
  );

  test.each(limits)(
    "accepts %s at minimum length",
    async (field, min) => {
      const result = await createLostItem({
        ...input,
        [field]: "a".repeat(min),
      });

      expect(result.ok).toBe(true);
      expect(mockInsertLostItem).toHaveBeenCalledTimes(1);
    }
  );

  test.each(limits)(
    "accepts %s at maximum length",
    async (field, min, max) => {
      const result = await createLostItem({
        ...input,
        [field]: "a".repeat(max),
      });

      expect(result.ok).toBe(true);
      expect(mockInsertLostItem).toHaveBeenCalledTimes(1);
    }
  );
});

describe("Date validation", () => {
  test.each([
    ["missing", undefined],
    ["null", null],
    ["number", 123],
    ["empty", ""],
    ["wrong format", "10/12/2026"],
    ["missing zero padding", "2026-1-2"],
    ["invalid month", "2026-13-01"],
    ["invalid day", "2026-02-30"],
    ["non-leap February 29", "2025-02-29"],
    ["extra time component", "2026-10-12T00:00:00Z"],
  ])("rejects %s date", async (_, dateLost) => {
    const result = await createLostItem({
      ...input,
      dateLost,
    });

    expect(result).toEqual({
      ok: false,
      error: "dateLost must be a valid date in YYYY-MM-DD format",
    });
    expect(mockInsertLostItem).not.toHaveBeenCalled();
  });

  test("rejects a future date", async () => {
    const future = new Date();
    future.setUTCDate(future.getUTCDate() + 2);

    const result = await createLostItem({
      ...input,
      dateLost: future.toISOString().slice(0, 10),
    });

    expect(result.error).toBe("dateLost cannot be in the future");
    expect(mockInsertLostItem).not.toHaveBeenCalled();
  });

  test("accepts a valid leap day", async () => {
    const result = await createLostItem({
      ...input,
      dateLost: "2024-02-29",
    });

    expect(result.ok).toBe(true);
    expect(mockInsertLostItem).toHaveBeenCalledWith(
      expect.objectContaining({
        dateLost: new Date("2024-02-29T00:00:00.000Z"),
      })
    );
  });
});

describe("Optional fields", () => {
  const limits = [
    ["color", 50],
    ["brand", 80],
    ["contactInfo", 150],
  ];

  test.each(limits)(
    "defaults omitted %s to empty string",
    async (field) => {
      const result = await createLostItem(input);

      expect(result.ok).toBe(true);
      expect(mockInsertLostItem).toHaveBeenCalledWith(
        expect.objectContaining({ [field]: "" })
      );
    }
  );

  test.each(limits)(
    "rejects non-string %s",
    async (field) => {
      const result = await createLostItem({
        ...input,
        [field]: 123,
      });

      expect(result.error).toBe(`${field} must be a string`);
      expect(mockInsertLostItem).not.toHaveBeenCalled();
    }
  );

  test.each(limits)(
    "rejects %s above maximum length",
    async (field, max) => {
      const result = await createLostItem({
        ...input,
        [field]: "a".repeat(max + 1),
      });

      expect(result.error).toBe(
        `${field} must be at most ${max} characters`
      );
      expect(mockInsertLostItem).not.toHaveBeenCalled();
    }
  );

  test.each(limits)(
    "accepts %s at maximum length",
    async (field, max) => {
      const result = await createLostItem({
        ...input,
        [field]: "a".repeat(max),
      });

      expect(result.ok).toBe(true);
      expect(mockInsertLostItem).toHaveBeenCalledTimes(1);
    }
  );
});


describe("Service behavior", () => {
  test("trims required and optional strings", async () => {
    const result = await createLostItem({
      ...input,
      title: "  Lost Racket  ",
      color: "  Black  ",
    });

    expect(result.ok).toBe(true);
    expect(mockInsertLostItem).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Lost Racket",
        color: "Black",
      })
    );
  });

  test("ignores client-supplied server fields", async () => {
    await createLostItem({
      ...input,
      _id: "malicious-id",
      status: "closed",
      createdAt: "2020-01-01",
      updatedAt: "2020-01-01",
    });

    const savedData = mockInsertLostItem.mock.calls[0][0];

    expect(savedData).not.toHaveProperty("_id");
    expect(savedData).not.toHaveProperty("status");
    expect(savedData).not.toHaveProperty("createdAt");
    expect(savedData).not.toHaveProperty("updatedAt");
  });

  test("returns the saved item from repository", async () => {
    const savedItem = { _id: "saved-123", title: "Saved item" };
    mockInsertLostItem.mockResolvedValue(savedItem);

    const result = await createLostItem(input);

    expect(result).toEqual({
      ok: true,
      value: savedItem,
    });
    expect(mockInsertLostItem).toHaveBeenCalledTimes(1);
  });

  test("propagates unexpected repository errors", async () => {
    mockInsertLostItem.mockRejectedValue(new Error("Database unavailable"));

    await expect(createLostItem(input)).rejects.toThrow(
      "Database unavailable"
    );
  });

  test("returns an empty list", async () => {
    mockFindAllLostItems.mockResolvedValue([]);

    const result = await getAllLostItems();

    expect(result).toEqual([]);
    expect(mockFindAllLostItems).toHaveBeenCalledTimes(1);
  });

  test("returns items from repository", async () => {
    const items = [
      { _id: "1", title: "Item 1" },
      { _id: "2", title: "Item 2" },
    ];

    mockFindAllLostItems.mockResolvedValue(items);

    const result = await getAllLostItems();

    expect(result).toEqual(items);
    expect(mockFindAllLostItems).toHaveBeenCalledTimes(1);
  });

  test("propagates listing errors", async () => {
    mockFindAllLostItems.mockRejectedValue(new Error("Database unavailable"));

    await expect(getAllLostItems()).rejects.toThrow(
      "Database unavailable"
    );
  });
});
