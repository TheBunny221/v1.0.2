import express from "express";
import {
  generateCaptcha,
  verifyCaptcha,
} from "../controller/captchaController.js";

const router = express.Router();

// Generate new CAPTCHA
router.get("/generate", generateCaptcha);

// Verify CAPTCHA (optional standalone endpoint)
router.post("/verify", verifyCaptcha);

export default router;
