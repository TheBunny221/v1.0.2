import { describe, it, expect } from "vitest";
import express from "express";
import request from "supertest";
import responseFormatter from "../../middleware/responseFormatter.js";
import { errorHandler } from "../../middleware/errorHandler.js";

const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.use(responseFormatter());

  app.get("/raw-object", (req, res) => {
    res.json({ foo: "bar" });
  });

  app.get("/already-standard", (req, res) => {
    res.json({ success: true, message: "ok", data: { a: 1 } });
  });

  app.get("/throw", (_req, _res) => {
    throw Object.assign(new Error("Boom"), { statusCode: 500, errorCode: "SERVER_ERROR" });
  });

  app.use(errorHandler);

  return app;
};

describe("responseFormatter middleware", () => {
  it("wraps raw objects in standardized shape", async () => {
    const app = buildApp();
    const res = await request(app).get("/raw-object");
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ success: true, data: { foo: "bar" } });
  });

  it("preserves already standardized responses", async () => {
    const app = buildApp();
    const res = await request(app).get("/already-standard");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, message: "ok", data: { a: 1 } });
  });

  it("formats thrown errors with error handler", async () => {
    const app = buildApp();
    const res = await request(app).get("/throw");
    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.errorCode).toBe("SERVER_ERROR");
    expect(typeof res.body.message).toBe("string");
  });
});
