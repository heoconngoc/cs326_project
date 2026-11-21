import { jest, beforeEach, describe, test, expect } from "@jest/globals";
import request from "supertest";
import { JSDOM, VirtualConsole } from "jsdom";
import axe from "axe-core";

// Accessibility checks that run without a browser. Every page is loaded through
// the real app, parsed with jsdom and checked with axe-core, plus a few checks
// written for this app (skip link, labels, hints, focus handling).
//
// jsdom has no layout engine, so axe's color-contrast rule is switched off here.
// Contrast and real keyboard behavior are checked in a browser; see
// docs/accessibility-audit.md.

const mockGetAllLostItems = jest.fn();
const mockGetLostItemById = jest.fn();
const mockUpdateLostItem = jest.fn();
const mockFindUserById = jest.fn();
const mockLogin = jest.fn();

jest.unstable_mockModule("../services/lostItemsService.js", () => ({
  createLostItem: jest.fn(),
  getAllLostItems: mockGetAllLostItems,
  getLostItemById: mockGetLostItemById,
  updateLostItem: mockUpdateLostItem,
  deleteLostItem: jest.fn(),
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

const user = { id: "0123456789", email: "jerry@example.com", role: "user" };

beforeEach(() => {
  jest.resetAllMocks();
  mockGetAllLostItems.mockResolvedValue([savedItem]);
  mockGetLostItemById.mockResolvedValue({ ok: true, value: savedItem });
  mockLogin.mockResolvedValue({ ok: true, value: user });
  mockFindUserById.mockResolvedValue({ _id: user.id, email: user.email, role: user.role });
});

const loggedInAgent = async () => {
  const agent = request.agent(app);
  await agent.post("/auth/login").send({ email: user.email, password: "password123" });
  return agent;
};

// A VirtualConsole with no output keeps jsdom's "not implemented" notices
// (axe probes canvas support) out of the test log.
const parse = (html) =>
  new JSDOM(html, {
    runScripts: "outside-only",
    url: "http://localhost/",
    virtualConsole: new VirtualConsole(),
  });

const runAxe = async (html) => {
  const dom = parse(html);
  dom.window.eval(axe.source);
  return dom.window.axe.run(dom.window.document.documentElement, {
    runOnly: {
      type: "tag",
      values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"],
    },
    rules: { "color-contrast": { enabled: false } },
  });
};

const describeViolations = (violations) =>
  violations
    .map((v) => `${v.id}: ${v.help} -> ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)
    .join("\n");

// Once authorization is on, only logged-in users may open the report form, so
// the pages that need a session are fetched with one. It makes no difference
// while the form is still public.
const pages = [
  ["home", "/", false],
  ["lost items list", "/lost-items", false],
  ["report form", "/lost-items/new", true],
  ["item details", `/lost-items/${ID}`, false],
  ["login", "/login", false],
  ["signup", "/signup", false],
  ["404 page", "/does-not-exist", false],
];

const getPage = async (path, needsLogin = false) => {
  const agent = needsLogin ? await loggedInAgent() : request(app);
  return agent.get(path).set("Accept", "text/html");
};

describe("axe-core finds no violations", () => {
  test.each(pages)("%s", async (_name, path, needsLogin) => {
    const res = await getPage(path, needsLogin);

    const results = await runAxe(res.text);

    expect(describeViolations(results.violations)).toBe("");
  });

  test("the list page with a logged-in user (Log out button in the nav)", async () => {
    const agent = await loggedInAgent();

    const res = await agent.get("/lost-items").set("Accept", "text/html");
    const results = await runAxe(res.text);

    expect(res.text).toContain("Log out");
    expect(describeViolations(results.violations)).toBe("");
  });

  test("the empty list page", async () => {
    mockGetAllLostItems.mockResolvedValue([]);

    const res = await request(app).get("/lost-items");
    const results = await runAxe(res.text);

    expect(describeViolations(results.violations)).toBe("");
  });

  test("an HTMX error fragment is announced as an alert and passes axe", async () => {
    mockLogin.mockResolvedValue({
      ok: false,
      error: { status: 401, message: "Invalid email or password" },
    });

    const res = await request(app)
      .post("/auth/login")
      .set("HX-Request", "true")
      .type("form")
      .send({ email: "jerry@example.com", password: "wrong-password" });
    const html = `<!DOCTYPE html><html lang="en"><head><title>t</title></head><body><main>${res.text}</main></body></html>`;
    const results = await runAxe(html);

    expect(res.status).toBe(401);
    expect(parse(html).window.document.querySelector('[role="alert"]')).not.toBeNull();
    expect(describeViolations(results.violations)).toBe("");
  });
});

describe("every page", () => {
  test.each(pages)("%s: language, title, one h1, landmarks", async (_name, path, needsLogin) => {
    const doc = parse((await getPage(path, needsLogin)).text).window.document;

    expect(doc.documentElement.getAttribute("lang")).toBe("en");
    expect(doc.title).toMatch(/· Lost n Found$/);
    expect(doc.querySelectorAll("h1")).toHaveLength(1);
    expect(doc.querySelectorAll("header")).toHaveLength(1);
    expect(doc.querySelectorAll("main")).toHaveLength(1);
    expect(doc.querySelectorAll("footer")).toHaveLength(1);
    expect(doc.querySelector('nav[aria-label="Main"]')).not.toBeNull();
  });

  test.each(pages)("%s: the skip link is the first link and points at <main>", async (_name, path, needsLogin) => {
    const doc = parse((await getPage(path, needsLogin)).text).window.document;

    const first = doc.querySelector("a[href], button, input, summary");
    const main = doc.querySelector("main");

    expect(first.getAttribute("href")).toBe("#main");
    expect(first.textContent).toMatch(/skip to main content/i);
    expect(main.id).toBe("main");
    expect(main.getAttribute("tabindex")).toBe("-1");
  });

  test.each(pages)("%s: ids are unique", async (_name, path, needsLogin) => {
    const doc = parse((await getPage(path, needsLogin)).text).window.document;

    const ids = [...doc.querySelectorAll("[id]")].map((e) => e.id);

    expect(ids.filter((id, i) => ids.indexOf(id) !== i)).toEqual([]);
  });

  test.each(pages)("%s: no positive tabindex (it breaks the natural tab order)", async (_name, path, needsLogin) => {
    const doc = parse((await getPage(path, needsLogin)).text).window.document;

    const positive = [...doc.querySelectorAll("[tabindex]")].filter(
      (e) => Number(e.getAttribute("tabindex")) > 0,
    );

    expect(positive).toHaveLength(0);
  });

  test("the page does not block zooming", async () => {
    const doc = parse((await request(app).get("/")).text).window.document;

    const viewport = doc.querySelector('meta[name="viewport"]').content;

    expect(viewport).not.toMatch(/user-scalable\s*=\s*(no|0)/);
    expect(viewport).not.toMatch(/maximum-scale/);
  });
});

describe("forms", () => {
  const formPages = [
    ["report form", "/lost-items/new", true],
    ["item details (edit form)", `/lost-items/${ID}`, false],
    ["login", "/login", false],
    ["signup", "/signup", false],
  ];

  test.each(formPages)("%s: every field has a visible label", async (_name, path, needsLogin) => {
    const doc = parse((await getPage(path, needsLogin)).text).window.document;
    const fields = [...doc.querySelectorAll("main input:not([type=hidden]), main textarea, main select")];

    expect(fields.length).toBeGreaterThan(0);
    for (const field of fields) {
      const label = doc.querySelector(`label[for="${field.id}"]`);
      expect(label).not.toBeNull();
      expect(label.textContent.trim().length).toBeGreaterThan(0);
    }
  });

  test.each(formPages)("%s: aria-describedby points at elements that exist", async (_name, path, needsLogin) => {
    const doc = parse((await getPage(path, needsLogin)).text).window.document;

    for (const el of doc.querySelectorAll("[aria-describedby]")) {
      for (const id of el.getAttribute("aria-describedby").split(/\s+/)) {
        expect(doc.getElementById(id)).not.toBeNull();
      }
    }
  });

  test.each(formPages)("%s: the answer area is a polite live region", async (_name, path, needsLogin) => {
    const doc = parse((await getPage(path, needsLogin)).text).window.document;

    const feedback = doc.getElementById("form-feedback");

    expect(feedback).not.toBeNull();
    expect(feedback.getAttribute("aria-live")).toBe("polite");
  });

  test.each(formPages)("%s: the required-field asterisk is hidden from screen readers", async (_name, path, needsLogin) => {
    const doc = parse((await getPage(path, needsLogin)).text).window.document;

    const stars = [...doc.querySelectorAll("label span")].filter((s) => s.textContent.trim() === "*");

    for (const star of stars) {
      expect(star.getAttribute("aria-hidden")).toBe("true");
    }
    // The form explains the asterisk in words.
    if (path !== "/login" && path !== "/signup") {
      expect(doc.querySelector("main form").textContent).toMatch(/Fields marked/);
    }
  });

  test.each(formPages)("%s: submit buttons have an id and the form drops duplicate requests", async (_name, path, needsLogin) => {
    const doc = parse((await getPage(path, needsLogin)).text).window.document;
    const form = doc.querySelector("main form[hx-post], main form[hx-patch]");

    expect(form.getAttribute("hx-sync")).toBe("this:drop");
    expect(form.querySelector("button[type=submit]").id).not.toBe("");
  });

  test("nothing disables the focused button while a request runs", async () => {
    // A disabled button drops keyboard focus to <body>. hx-sync is used instead.
    for (const [, path, needsLogin] of formPages) {
      const html = (await getPage(path, needsLogin)).text;
      expect(html).not.toContain("hx-disabled-elt");
    }
  });

  test("the edit form comes back with the same ids after a save, so focus can be restored", async () => {
    mockUpdateLostItem.mockResolvedValue({ ok: true, value: { ...savedItem, title: "Blue umbrella" } });

    const agent = await loggedInAgent();

    const res = await agent
      .patch(`/lost-items/${ID}`)
      .set("HX-Request", "true")
      .type("form")
      .send({ title: "Blue umbrella" });
    const doc = parse(`<body>${res.text}</body>`).window.document;

    expect(doc.querySelector('form#edit-item-form[hx-swap-oob="outerHTML"]')).not.toBeNull();
    expect(doc.querySelector("form#edit-item-form button#edit-save")).not.toBeNull();
    expect(doc.querySelector('[role="status"]').textContent).toContain("Your changes were saved");
  });
});

describe("links and buttons", () => {
  test("the list: each card's links have distinct names", async () => {
    mockGetAllLostItems.mockResolvedValue([
      savedItem,
      { ...savedItem, _id: "000000000000000000000002", title: "Black backpack" },
    ]);
    const doc = parse((await request(app).get("/lost-items")).text).window.document;

    const names = [...doc.querySelectorAll("main a")].map(
      (a) => a.getAttribute("aria-label") || a.textContent.trim(),
    );

    expect(names).toContain("View details for Green umbrella");
    expect(names).toContain("View details for Black backpack");
    expect(new Set(names).size).toBe(names.length);
  });

  test("the aria-label keeps the visible text 'View details' at its start", async () => {
    const doc = parse((await request(app).get("/lost-items")).text).window.document;

    const link = [...doc.querySelectorAll("main a")].find((a) => a.textContent.trim() === "View details");

    expect(link.getAttribute("aria-label").startsWith("View details")).toBe(true);
  });

  test("the item title is escaped inside the aria-label", async () => {
    mockGetAllLostItems.mockResolvedValue([{ ...savedItem, title: '"><img src=x onerror=alert(1)>' }]);

    const html = (await request(app).get("/lost-items")).text;

    expect(html).not.toContain("<img src=x");
  });

  test("the Delete button asks for confirmation and has a text name", async () => {
    const doc = parse((await request(app).get(`/lost-items/${ID}`)).text).window.document;

    const button = doc.getElementById("delete-item");

    expect(button.textContent.trim()).toBe("Delete");
    expect(button.getAttribute("hx-confirm")).toMatch(/cannot be undone/i);
  });

  test("the edit form is behind a native <details>, which works with the keyboard", async () => {
    const doc = parse((await request(app).get(`/lost-items/${ID}`)).text).window.document;

    const summary = doc.querySelector("details > summary");

    expect(summary.textContent.trim()).toBe("Edit this report");
    expect(doc.querySelector("details form#edit-item-form")).not.toBeNull();
  });
});
