import { describe, it, expect, vi } from "vitest";
import responseFormatter from "../../middleware/responseFormatter.js";
import { errorHandler } from "../../middleware/errorHandler.js";

const createMock = (url = "/test") => {
  const req = { originalUrl: url, url };
  const res = {
    statusCode: 200,
    headers: {},
    status(code) {
      this.statusCode = code;
      return this;
    },
    _json: null,
    json(payload) {
      this._json = payload;
      return this;
    },
  };
  const next = vi.fn();
  return { req, res, next };
};

describe("responseFormatter middleware", () => {
  it("wraps raw objects in standardized shape", () => {
    const { req, res, next } = createMock("/api/foo");
    const mw = responseFormatter();
    mw(req, res, next);

    res.json({ foo: "bar" });
    expect(res._json).toMatchObject({ success: true, data: { foo: "bar" } });
  });

  it("preserves already standardized responses", () => {
    const { req, res, next } = createMock("/api/foo");
    const mw = responseFormatter();
    mw(req, res, next);

    res.json({ success: true, message: "ok", data: { a: 1 } });
    expect(res._json).toEqual({ success: true, message: "ok", data: { a: 1 } });
  });

  it("exposes res.success and res.fail helpers", () => {
    const { req, res, next } = createMock("/api/foo");
    const mw = responseFormatter();
    mw(req, res, next);

    res.success("Done", { a: 1 });
    expect(res._json).toEqual({ success: true, message: "Done", data: { a: 1 } });

    res.fail("Bad", 400, "BAD_REQUEST");
    expect(res.statusCode).toBe(400);
    expect(res._json).toEqual({ success: false, message: "Bad", data: null, errorCode: "BAD_REQUEST" });
  });
});
