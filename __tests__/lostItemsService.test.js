import { jest, beforeEach } from "@jest/globals";

const mockInsertLostItem = jest.fn();
const mockFindAllLostItems = jest.fn();
const mockFindLostItemById = jest.fn();
const mockUpdateLostItemById = jest.fn();
const mockRemoveLostItemById = jest.fn();

jest.unstable_mockModule("../repositories/lostItemsRepository.js", () => ({
  insertLostItem: mockInsertLostItem,
  findAllLostItems: mockFindAllLostItems,
  findLostItemById: mockFindLostItemById,
  updateLostItemById: mockUpdateLostItemById,
  removeLostItemById: mockRemoveLostItemById,
}));

const {
  createLostItem,
  getAllLostItems,
  getLostItemById,
  updateLostItem,
  deleteLostItem,
} = await import("../services/lostItemsService.js");


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
  mockFindLostItemById.mockResolvedValue(null);
  mockUpdateLostItemById.mockResolvedValue(null);
  mockRemoveLostItemById.mockResolvedValue(null);
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

  test.each(limits.filter(([, min]) => min > 1))(
    "rejects %s below minimum length",
    async (field, min, max) => {

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

const validId = "507f1f77bcf86cd799439011";

const existingItem = {
  _id: validId,
  ...input,
  dateLost: new Date("2026-10-12T00:00:00.000Z"),
  color: "Black",
  brand: "Yonex",
  contactInfo: "private@example.com",
  status: "open",
};

describe("Get by ID", () => {
  test("rejects invalid ID", async () => {
    const result = await getLostItemById("invalid");

    expect(result.error).toBe("Invalid item ID");
    expect(mockFindLostItemById).not.toHaveBeenCalled();
  });

  test("returns not found", async () => {
    const result = await getLostItemById(validId);

    expect(result.error).toBe("Item not found");
  });

  test("returns existing item", async () => {
    mockFindLostItemById.mockResolvedValue(existingItem);

    const result = await getLostItemById(validId);

    expect(result).toEqual({
      ok: true,
      value: existingItem,
    });
    expect(mockFindLostItemById).toHaveBeenCalledWith(validId);
  });

  test("propagates repository errors", async () => {
    mockFindLostItemById.mockRejectedValue(
      new Error("Database unavailable")
    );

    await expect(getLostItemById(validId)).rejects.toThrow(
      "Database unavailable"
    );
  });
});

describe("Update by ID", () => {
  beforeEach(() => {
    mockFindLostItemById.mockResolvedValue(existingItem);
    mockUpdateLostItemById.mockResolvedValue(existingItem);
  });

  test("rejects invalid ID", async () => {
    const result = await updateLostItem("invalid", {
      location: "Library",
    });

    expect(result.error).toBe("Invalid item ID");
    expect(mockUpdateLostItemById).not.toHaveBeenCalled();
  });

  test.each([null, [], "invalid", 123])(
    "rejects invalid update data: %p",
    async (updates) => {
      const result = await updateLostItem(validId, updates);

      expect(result.error).toBe("Invalid update data");
      expect(mockUpdateLostItemById).not.toHaveBeenCalled();
    }
  );

  test("rejects empty updates", async () => {
    const result = await updateLostItem(validId, {});

    expect(result.error).toBe("Invalid update fields");
    expect(mockUpdateLostItemById).not.toHaveBeenCalled();
  });

  test.each(["_id", "status", "contactInfo", "createdAt"])(
    "rejects protected field %s",
    async (field) => {
      const result = await updateLostItem(validId, {
        [field]: "malicious",
      });

      expect(result.error).toBe("Invalid update fields");
      expect(mockUpdateLostItemById).not.toHaveBeenCalled();
    }
  );

  test("returns not found", async () => {
    mockFindLostItemById.mockResolvedValue(null);

    const result = await updateLostItem(validId, {
      location: "Library",
    });

    expect(result.error).toBe("Item not found");
    expect(mockUpdateLostItemById).not.toHaveBeenCalled();
  });

  test.each([
    [{ title: "" }, "title is required"],
    [{ title: "ab" }, "title must be between 3 and 100 characters"],
    [{ color: 123 }, "color must be a string"],
    [{ dateLost: "invalid" }, "dateLost must be a valid date in YYYY-MM-DD format"],
  ])("rejects invalid field values", async (updates, error) => {
    const result = await updateLostItem(validId, updates);

    expect(result.error).toBe(error);
    expect(mockUpdateLostItemById).not.toHaveBeenCalled();
  });

  test("updates only supplied fields", async () => {
    const updated = {
      ...existingItem,
      location: "Student Union",
    };

    mockUpdateLostItemById.mockResolvedValue(updated);

    const result = await updateLostItem(validId, {
      location: "  Student Union  ",
    });

    expect(result).toEqual({
      ok: true,
      value: updated,
    });

    expect(mockUpdateLostItemById).toHaveBeenCalledWith(
      validId,
      { location: "Student Union" }
    );
  });

  test("handles item deleted during update", async () => {
    mockUpdateLostItemById.mockResolvedValue(null);

    const result = await updateLostItem(validId, {
      location: "Library",
    });

    expect(result.error).toBe("Item not found");
  });

  test("propagates repository errors", async () => {
    mockUpdateLostItemById.mockRejectedValue(
      new Error("Database unavailable")
    );

    await expect(
      updateLostItem(validId, { location: "Library" })
    ).rejects.toThrow("Database unavailable");
  });

  test("rejects future date update", async () => {
    const future = new Date();
    future.setUTCDate(future.getUTCDate() + 2);

    const result = await updateLostItem(validId, {
      dateLost: future.toISOString().slice(0, 10),
    });

    expect(result.error).toBe("dateLost cannot be in the future");
    expect(mockUpdateLostItemById).not.toHaveBeenCalled();
  });
});

describe("Delete by ID", () => {
  test("rejects invalid ID", async () => {
    const result = await deleteLostItem("invalid");

    expect(result.error).toBe("Invalid item ID");
    expect(mockRemoveLostItemById).not.toHaveBeenCalled();
  });

  test("returns not found", async () => {
    const result = await deleteLostItem(validId);

    expect(result.error).toBe("Item not found");
  });

  test("deletes an existing item", async () => {
    mockRemoveLostItemById.mockResolvedValue(existingItem);

    const result = await deleteLostItem(validId);

    expect(result).toEqual({
      ok: true,
      value: existingItem,
    });

    expect(mockRemoveLostItemById).toHaveBeenCalledWith(validId);
  });

  test("propagates repository errors", async () => {
    mockRemoveLostItemById.mockRejectedValue(
      new Error("Database unavailable")
    );

    await expect(deleteLostItem(validId)).rejects.toThrow(
      "Database unavailable"
    );
  });
});
