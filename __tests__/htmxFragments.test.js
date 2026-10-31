import { jest, beforeAll, afterAll, beforeEach } from "@jest/globals";

const mockCreateLostItem = jest.fn();
const mockGetAllLostItems = jest.fn();

jest.unstable_mockModule("../services/lostItemsService.js", () => ({
  createLostItem: mockCreateLostItem,
  getAllLostItems: mockGetAllLostItems,
}));

const { default: app } = await import("../app.js");
const { Ok, Err } = await import("../utils/result.js");

const savedItem = {
  _id: "000000000000000000000001",
  title: "Green umbrella",
  description: "Left in room 101",
  category: "Other",
  location: "Library",
  dateLost: new Date("2026-10-12T00:00:00.000Z"),
  color: "",
  brand: "",
  contactInfo: "private@umass.edu",
  status: "open",
  createdAt: new Date("2026-10-14T18:00:00.000Z"),
};

const isFragment = (html) => {
  if (!html || typeof html !== "string" || html.trim() === "") {
    return false;
  }

  if (/<html|<head|<body|<!doctype/i.test(html)) {
    return false;
  }

  return /<[a-z][\s\S]*>/i.test(html);
};

let server;
let base;

beforeAll(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, resolve);
  });
  base = `http://localhost:${server.address().port}`;
});

afterAll(async () => {
  await new Promise((resolve) => server.close(resolve));
});

beforeEach(() => {
  jest.resetAllMocks();
});

const submitForm = (fields) =>
  fetch(`${base}/lost-items`, {
    method: "POST",
    headers: {
      "HX-Request": "true",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(fields).toString(),
  });

describe("POST /lost-items (HTMX form submit)", () => {
  test("201: answers with an HTML fragment showing the new item", async () => {
    mockCreateLostItem.mockResolvedValue(Ok(savedItem));

    const res = await submitForm({ title: "Green umbrella" });
    const html = await res.text();

    expect(res.status).toBe(201);
    expect(res.headers.get("content-type")).toMatch(/text\/html/);
    expect(isFragment(html)).toBe(true);
    expect(html).toContain("Green umbrella");
    expect(html).toContain("submitted");
    expect(mockCreateLostItem).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Green umbrella" }),
    );
  });

  test("201: never shows the private contact info", async () => {
    mockCreateLostItem.mockResolvedValue(Ok(savedItem));

    const html = await (await submitForm({ title: "Green umbrella" })).text();

    expect(html).not.toContain("private@umass.edu");
  });

  test("400: answers with a fragment containing the validation message", async () => {
    mockCreateLostItem.mockResolvedValue(Err("title is required"));

    const res = await submitForm({ title: "" });
    const html = await res.text();

    expect(res.status).toBe(400);
    expect(isFragment(html)).toBe(true);
    expect(html).toContain("Title is required");
  });

  it("should return a 404 fragment for unknown HTMX routes", async () => {
    const res = await request(app)
      .get("/api/some-unknown-route")
      .set("HX-Request", "true");

    expect(res.status).toBe(404);
    expect(isFragment(res.text)).toBe(true);
    expect(res.text).toContain("Not found");
  });

  test("500: answers with a fragment and does not leak error details", async () => {
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    mockCreateLostItem.mockRejectedValue(new Error("db password is hunter2"));

    const res = await submitForm({ title: "Green umbrella" });
    const html = await res.text();

    expect(res.status).toBe(500);
    expect(isFragment(html)).toBe(true);
    expect(html).toContain("Something went wrong");
    expect(html).not.toContain("hunter2");

    consoleError.mockRestore();
  });

  test("an HTMX request to an unknown route gets a 404 fragment", async () => {
    const res = await fetch(`${base}/nope`, {
      headers: { "HX-Request": "true" },
    });
    const html = await res.text();

    expect(res.status).toBe(404);
    expect(isFragment(html)).toBe(true);
  });
});

describe("pages and API around the HTMX interaction", () => {
  test("the report form page loads htmx and posts with hx-post", async () => {
    const res = await fetch(`${base}/lost-items/new`);
    const html = await res.text();

    expect(res.status).toBe(200);
    expect(html).toContain("/vendor/htmx/htmx.min.js");
    expect(html).toContain('hx-post="/lost-items"');
    expect(html).toContain("/css/tailwind.css");
  });

  test("the JSON API still answers with JSON", async () => {
    mockCreateLostItem.mockResolvedValue(Ok(savedItem));

    const res = await fetch(`${base}/api/lost-items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Green umbrella" }),
    });
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.title).toBe("Green umbrella");
    expect(body.data).not.toHaveProperty("contactInfo");
  });
});
