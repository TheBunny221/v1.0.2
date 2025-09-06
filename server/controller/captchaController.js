import crypto from "crypto";

// In-memory store for CAPTCHA codes (in production, use Redis or database)
const captchaStore = new Map();

// Clean up expired CAPTCHAs every 5 minutes
setInterval(
  () => {
    const now = Date.now();
    for (const [key, data] of captchaStore.entries()) {
      if (now - data.timestamp > 5 * 60 * 1000) {
        // 5 minutes expiry
        captchaStore.delete(key);
      }
    }
  },
  5 * 60 * 1000,
);

const generateCaptchaText = () => {
  const chars = "ABCDEFGHIJKLMNPQRSTUVWXYZ123456789"; // Excluding O and 0 for clarity
  let result = "";
  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const generateCaptchaSVG = (text) => {
  const width = 160;
  const height = 60;
  const fontSize = 24;

  // Generate random background color
  const bgColor = `hsl(${Math.floor(Math.random() * 60) + 200}, 50%, 95%)`;

  // Generate noise lines
  let noiseLines = "";
  for (let i = 0; i < 3; i++) {
    const x1 = Math.random() * width;
    const y1 = Math.random() * height;
    const x2 = Math.random() * width;
    const y2 = Math.random() * height;
    const color = `hsl(${Math.floor(Math.random() * 360)}, 70%, 60%)`;
    noiseLines += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="1.5" opacity="0.3"/>`;
  }

  // Generate text with random positions and rotations
  let textElements = "";
  const spacing = width / (text.length + 1);

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const x = spacing * (i + 1) + (Math.random() - 0.5) * 10;
    const y = height / 2 + 8 + (Math.random() - 0.5) * 10;
    const rotation = (Math.random() - 0.5) * 30;
    const color = `hsl(${Math.floor(Math.random() * 360)}, 80%, 30%)`;

    textElements += `
      <text x="${x}" y="${y}" 
            font-family="Arial, sans-serif" 
            font-size="${fontSize}" 
            font-weight="bold" 
            fill="${color}" 
            text-anchor="middle"
            transform="rotate(${rotation} ${x} ${y})">
        ${char}
      </text>`;
  }

  // Generate noise dots
  let noiseDots = "";
  for (let i = 0; i < 15; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const color = `hsl(${Math.floor(Math.random() * 360)}, 60%, 50%)`;
    noiseDots += `<circle cx="${x}" cy="${y}" r="1.5" fill="${color}" opacity="0.4"/>`;
  }

  return `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="${bgColor}"/>
      ${noiseLines}
      ${noiseDots}
      ${textElements}
    </svg>
  `;
};

export const generateCaptcha = async (req, res) => {
  try {
    const captchaText = generateCaptchaText();
    const captchaId = crypto.randomUUID();

    // Store CAPTCHA with timestamp
    captchaStore.set(captchaId, {
      text: captchaText.toLowerCase(), // Store in lowercase for case-insensitive comparison
      timestamp: Date.now(),
    });

    // Generate SVG
    const svg = generateCaptchaSVG(captchaText);

    res.json({
      success: true,
      data: {
        captchaId,
        captchaSvg: svg,
      },
    });
  } catch (error) {
    console.error("Error generating CAPTCHA:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate CAPTCHA",
    });
  }
};

export const verifyCaptcha = async (req, res) => {
  try {
    const { captchaId, captchaText } = req.body;

    if (!captchaId || !captchaText) {
      return res.status(400).json({
        success: false,
        message: "CAPTCHA ID and text are required",
      });
    }

    const storedCaptcha = captchaStore.get(captchaId);

    if (!storedCaptcha) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired CAPTCHA",
      });
    }

    // Check if CAPTCHA is expired (5 minutes)
    if (Date.now() - storedCaptcha.timestamp > 5 * 60 * 1000) {
      captchaStore.delete(captchaId);
      return res.status(400).json({
        success: false,
        message: "CAPTCHA has expired",
      });
    }

    // Verify CAPTCHA text (case-insensitive)
    const isValid = storedCaptcha.text === captchaText.toLowerCase().trim();

    if (isValid) {
      // Remove CAPTCHA after successful verification
      captchaStore.delete(captchaId);
      res.json({
        success: true,
        message: "CAPTCHA verified successfully",
      });
    } else {
      res.status(400).json({
        success: false,
        message: "Invalid CAPTCHA text",
      });
    }
  } catch (error) {
    console.error("Error verifying CAPTCHA:", error);
    res.status(500).json({
      success: false,
      message: "Failed to verify CAPTCHA",
    });
  }
};

// Utility function to verify CAPTCHA for other controllers
export const verifyCaptchaForComplaint = (captchaId, captchaText) => {
  console.log(captchaId, captchaText)
  return new Promise((resolve, reject) => {
    if (!captchaId || !captchaText) {
      return reject(new Error("CAPTCHA ID and text are required"));
    }

    const storedCaptcha = captchaStore.get(captchaId);

    if (!storedCaptcha) {
      return reject(new Error("Invalid or expired CAPTCHA"));
    }

    // Check if CAPTCHA is expired (5 minutes)
    if (Date.now() - storedCaptcha.timestamp > 5 * 60 * 1000) {
      captchaStore.delete(captchaId);
      return reject(new Error("CAPTCHA has expired"));
    }

    // Verify CAPTCHA text (case-insensitive)
    const isValid = storedCaptcha.text === captchaText.toLowerCase().trim();

    if (isValid) {
      // Remove CAPTCHA after successful verification
      captchaStore.delete(captchaId);
      resolve(true);
    } else {
      reject(new Error("Invalid CAPTCHA text"));
    }
  });
};
