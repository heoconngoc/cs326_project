import { jest, beforeAll, afterAll, beforeEach } from "@jest/globals";

const mockCreateLostItem = jest.fn();
const mockGetAllLostItems = jest.fn();
const mockGetLostItemById = jest.fn();
const mockUpdateLostItem = jest.fn();
const mockDeleteLostItem = jest.fn();

jest.unstable_mockModule("../services/lostItemsService.js", () => ({
  createLostItem: mockCreateLostItem,
  getAllLostItems: mockGetAllLostItems,
  getLostItemById: mockGetLostItemById,
  updateLostItem: mockUpdateLostItem,
  deleteLostItem: mockDeleteLostItem,
}));

const { default: app } = await import("../app.js");
const { Ok, Err } = await import("../utils/result.js");

const ID = "000000000000000000000001";

const savedItem = {
  _id: ID,
  title: "Green umbrella",
  description: "Left in room 101",
  category: "Other",
  location: "Library",
  dateLost: new Date("2026-10-12T00:00:00.000Z"),
  color: "Green",
  brand: "",
  contactInfo: "private@umass.edu",
  status: "open",
  createdAt: new Date("2026-10-14T18:00:00.000Z"),
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

const htmx = { "HX-Request": "true" };
const form = { ...htmx, "Content-Type": "application/x-www-form-urlencoded" };

describe("GET /lost-items/:id (detail page)", () => {
  test("200: full page with the item, edit form and delete button", async () => {
    mockGetLostItemById.mockResolvedValue(Ok(savedItem));

    const res = await fetch(`${base}/lost-items/${ID}`);
    const html = await res.text();

    expect(res.status).toBe(200);
    expect(mockGetLostItemById).toHaveBeenCalledWith(ID);
    expect(html).toMatch(/<html/i);
    expect(html).toContain("Green umbrella");
    expect(html).toContain("/vendor/htmx/htmx.min.js");
    expect(html).toContain(`hx-patch="/lost-items/${ID}"`);
    expect(html).toContain(`hx-delete="/lost-items/${ID}"`);
    expect(html).toContain("hx-confirm=");
  });

  test("the edit form is pre-filled with the saved values", async () => {
    mockGetLostItemById.mockResolvedValue(Ok(savedItem));

    const html = await (await fetch(`${base}/lost-items/${ID}`)).text();

    expect(html).toContain('value="Green umbrella"');
    expect(html).toContain('value="2026-10-12"');
    expect(html).toContain('value="Library"');
    expect(html).toContain(">Left in room 101</textarea>");
  });

  test("never shows the private contact info", async () => {
    mockGetLostItemById.mockResolvedValue(Ok(savedItem));

    const html = await (await fetch(`${base}/lost-items/${ID}`)).text();

    expect(html).not.toContain("private@umass.edu");
    expect(html).not.toContain('name="contactInfo"');
  });

  test("escapes user-supplied text", async () => {
    mockGetLostItemById.mockResolvedValue(
      Ok({ ...savedItem, title: '<script>alert("x")</script>' }),
    );

    const html = await (await fetch(`${base}/lost-items/${ID}`)).text();

    expect(html).not.toContain('<script>alert("x")</script>');
    expect(html).toContain("&lt;script&gt;");
  });

  test("404: unknown id renders the error page", async () => {
    mockGetLostItemById.mockResolvedValue(Err("Item not found"));

    const res = await fetch(`${base}/lost-items/${ID}`);
    const html = await res.text();

    expect(res.status).toBe(404);
    expect(html).toContain("Item not found");
  });

  test("400: malformed id renders the error page", async () => {
    mockGetLostItemById.mockResolvedValue(Err("Invalid item ID"));

    const res = await fetch(`${base}/lost-items/not-an-id`);
    const html = await res.text();

    expect(res.status).toBe(400);
    expect(html).toContain("Invalid item ID");
  });

  test("/lost-items/new is still the report form, not an id lookup", async () => {
    const res = await fetch(`${base}/lost-items/new`);
    const html = await res.text();

    expect(res.status).toBe(200);
    expect(html).toContain('hx-post="/lost-items"');
    expect(mockGetLostItemById).not.toHaveBeenCalled();
  });
});

describe("list page links", () => {
  test("each card links to its detail page", async () => {
    mockGetAllLostItems.mockResolvedValue([savedItem]);

    const html = await (await fetch(`${base}/lost-items`)).text();

    expect(html).toContain(`href="/lost-items/${ID}"`);
  });
});

describe("PATCH /lost-items/:id (HTMX edit)", () => {
  const edit = (id, fields) =>
    fetch(`${base}/lost-items/${id}`, {
      method: "PATCH",
      headers: form,
      body: new URLSearchParams(fields).toString(),
    });

  test("200: fragment with a saved message and the updated card (out-of-band)", async () => {
    mockUpdateLostItem.mockResolvedValue(
      Ok({ ...savedItem, title: "Blue umbrella" }),
    );

    const res = await edit(ID, { title: "Blue umbrella" });
    const html = await res.text();

    expect(res.status).toBe(200);
    expect(html).not.toMatch(/<html|<body/i);
    expect(html).toContain("Your changes were saved");
    expect(html).toContain('id="item-details" hx-swap-oob="true"');
    expect(html).toContain("Blue umbrella");
    expect(html).not.toContain("private@umass.edu");
    expect(mockUpdateLostItem).toHaveBeenCalledWith(
      ID,
      expect.objectContaining({ title: "Blue umbrella" }),
    );
  });

  test("400: validation message comes back as a fragment", async () => {
    mockUpdateLostItem.mockResolvedValue(Err("title is required"));

    const res = await edit(ID, { title: "" });
    const html = await res.text();

    expect(res.status).toBe(400);
    expect(html).not.toMatch(/<html|<body/i);
    expect(html).toContain("Title is required");
    expect(html).not.toContain("hx-swap-oob");
  });

  test("404: item deleted in the meantime", async () => {
    mockUpdateLostItem.mockResolvedValue(Err("Item not found"));

    const res = await edit(ID, { title: "Blue umbrella" });

    expect(res.status).toBe(404);
    expect(await res.text()).toContain("Item not found");
  });

  test("400: malformed id", async () => {
    mockUpdateLostItem.mockResolvedValue(Err("Invalid item ID"));

    const res = await edit("nope", { title: "Blue umbrella" });

    expect(res.status).toBe(400);
    expect(await res.text()).toContain("Invalid item ID");
  });

  test("500: unexpected failure does not leak details", async () => {
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    mockUpdateLostItem.mockRejectedValue(new Error("db password is hunter2"));

    const res = await edit(ID, { title: "Blue umbrella" });
    const html = await res.text();

    expect(res.status).toBe(500);
    expect(html).toContain("Something went wrong");
    expect(html).not.toContain("hunter2");

    consoleError.mockRestore();
  });
});

describe("DELETE /lost-items/:id (HTMX delete)", () => {
  const remove = (id) =>
    fetch(`${base}/lost-items/${id}`, { method: "DELETE", headers: htmx });

  test("200: sends HX-Redirect to the list and a confirmation fragment", async () => {
    mockDeleteLostItem.mockResolvedValue(Ok(savedItem));

    const res = await remove(ID);
    const html = await res.text();

    expect(res.status).toBe(200);
    expect(res.headers.get("hx-redirect")).toBe("/lost-items");
    expect(html).toContain("deleted");
    expect(html).not.toMatch(/<html|<body/i);
    expect(mockDeleteLostItem).toHaveBeenCalledWith(ID);
  });

  test("404: already deleted shows an error fragment and no redirect", async () => {
    mockDeleteLostItem.mockResolvedValue(Err("Item not found"));

    const res = await remove(ID);

    expect(res.status).toBe(404);
    expect(res.headers.get("hx-redirect")).toBeNull();
    expect(await res.text()).toContain("Item not found");
  });

  test("400: malformed id", async () => {
    mockDeleteLostItem.mockResolvedValue(Err("Invalid item ID"));

    const res = await remove("nope");

    expect(res.status).toBe(400);
    expect(await res.text()).toContain("Invalid item ID");
  });
  test("500: unexpected delete failure does not leak details", async () => {
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    mockDeleteLostItem.mockRejectedValue(new Error("db password is hunter2"));

    const res = await fetch(`${base}/lost-items/${ID}`, {
      method: "DELETE",
      headers: htmx,
    });
    const html = await res.text();

    expect(res.status).toBe(500);
    expect(html).toContain("Something went wrong");
    expect(html).not.toContain("hunter2");
    consoleError.mockRestore();
  });
});

describe("JSON API by id is untouched", () => {
  test("GET /api/lost-items/:id still answers with JSON", async () => {
    mockGetLostItemById.mockResolvedValue(Ok(savedItem));

    const res = await fetch(`${base}/api/lost-items/${ID}`);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.id).toBe(ID);
    expect(body.data).not.toHaveProperty("contactInfo");
  });
});
