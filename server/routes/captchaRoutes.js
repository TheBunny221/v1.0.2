const express = require('express');
const router = express.Router();
const { generateCaptcha, verifyCaptcha } = require('../controller/captchaController');

// Generate new CAPTCHA
router.get('/generate', generateCaptcha);

// Verify CAPTCHA (optional standalone endpoint)
router.post('/verify', verifyCaptcha);

module.exports = router;
