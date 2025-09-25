import { describe, it, expect } from "vitest";
import express from "express";
import request from "supertest";
import { errorHandler } from "../../middleware/errorHandler.js";

const buildApp = (route) => {
  const app = express();
  app.get("/test", route);
  app.use(errorHandler);
  return app;
};

describe("errorHandler middleware", () => {
  it("maps JWT errors to TOKEN_INVALID", async () => {
    const app = buildApp((_req, _res) => {
      const err = new Error("jwt malformed");
      err.name = "JsonWebTokenError";
      throw err;
    });
    const res = await request(app).get("/test");
    expect(res.status).toBe(401);
    expect(res.body.errorCode).toBe("TOKEN_INVALID");
    expect(res.body.success).toBe(false);
  });

  it("maps validation errors to VALIDATION_ERROR", async () => {
    const app = buildApp((_req, _res) => {
      const err = new Error("Validation failed");
      err.name = "ValidationError";
      err.errors = { a: { message: "a is required" } };
      throw err;
    });
    const res = await request(app).get("/test");
    expect(res.status).toBe(422);
    expect(res.body.errorCode).toBe("VALIDATION_ERROR");
  });
});
