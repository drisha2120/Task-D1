

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const https = require("https");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const { initializeApp, cert, getApps } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

const serviceAccount = require(
  "./dev-deakin-p4-68297-firebase-adminsdk-fbsvc-319c53407f.json"
);

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Firebase Admin
if (getApps().length === 0) {
  initializeApp({
    credential: cert(serviceAccount),
  });
}

const db = getFirestore();

// Middleware
app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

// Health check
app.get("/", (req, res) => {
  res.status(200).json({
    message: "SIT313 D1 backend is running!",
  });
});

// Register a new user
app.post("/register", async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body || {};

    if (
      typeof firstName !== "string" ||
      typeof lastName !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string" ||
      !firstName.trim() ||
      !lastName.trim() ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        message: "Please complete all fields.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(normalizedEmail)) {
      return res.status(400).json({
        message: "Please enter a valid email address.",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must contain at least 8 characters.",
      });
    }

    const existingUsers = await db
      .collection("users")
      .where("email", "==", normalizedEmail)
      .limit(1)
      .get();

    if (!existingUsers.empty) {
      return res.status(409).json({
        message: "An account with this email already exists.",
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userRef = db.collection("users").doc();

    await userRef.set({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: normalizedEmail,
      passwordHash,
      subscription: "Free",
      createdAt: new Date().toISOString(),
    });

    return res.status(201).json({
      message: "Account created successfully.",
      user: {
        id: userRef.id,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: normalizedEmail,
        subscription: "Free",
      },
    });
  } catch (error) {
    console.error("Registration error:", error.message);

    return res.status(500).json({
      message: "An internal server error occurred.",
    });
  }
});

// Log in and return a signed JWT
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        message: "Please enter your email and password.",
      });
    }

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is missing from backend .env");

      return res.status(500).json({
        message: "Authentication is not configured.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const usersSnapshot = await db
      .collection("users")
      .where("email", "==", normalizedEmail)
      .limit(1)
      .get();

    if (usersSnapshot.empty) {
      return res.status(401).json({
        message: "Incorrect email or password.",
      });
    }

    const userDoc = usersSnapshot.docs[0];
    const user = userDoc.data();

    // Only accounts registered with this backend have passwordHash.
    if (!user.passwordHash) {
      return res.status(401).json({
        message: "Please register using the updated registration form.",
      });
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.passwordHash
    );

    if (!passwordMatches) {
      return res.status(401).json({
        message: "Incorrect email or password.",
      });
    }

    const token = jwt.sign(
      { email: user.email },
      process.env.JWT_SECRET,
      {
        subject: userDoc.id,
        expiresIn: "2h",
      }
    );

    return res.status(200).json({
      message: "Login successful.",
      token,
      user: {
        id: userDoc.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        subscription: user.subscription || "Free",
      },
    });
  } catch (error) {
    console.error("Login error:", error.message);

    return res.status(500).json({
      message: "An internal server error occurred.",
    });
  }
});

app.post("/upgrade", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Please log in to upgrade.",
      });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        message: "Authentication is not configured.",
      });
    }

    const token = authHeader.slice(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.sub;

    if (!userId) {
      return res.status(401).json({
        message: "Invalid authentication token.",
      });
    }

    const userRef = db.collection("users").doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({
        message: "User account not found.",
      });
    }

    if (userDoc.data().subscription === "Paid") {
      return res.status(409).json({
        message: "You already have a Paid subscription.",
      });
    }

    await userRef.update({
      subscription: "Paid",
      upgradedAt: new Date().toISOString(),
    });

    return res.status(200).json({
      message: "Subscription upgraded successfully.",
      subscription: "Paid",
    });
  } catch (error) {
    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError"
    ) {
      return res.status(401).json({
        message: "Your session is invalid or expired. Please log in again.",
      });
    }

    console.error("Upgrade error:", error.message);

    return res.status(500).json({
      message: "An internal server error occurred.",
    });
  }
});


// Newsletter subscription route
app.post("/subscribe", (req, res) => {
  try {
    const { email } = req.body || {};

    if (typeof email !== "string" || !email.trim()) {
      return res.status(400).json({
        message: "Please provide your email address.",
      });
    }

    const normalizedEmail = email.trim();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(normalizedEmail)) {
      return res.status(400).json({
        message: "Please enter a valid email address.",
      });
    }
    const apiKey = process.env.MAILGUN_API_KEY;
    const domain = process.env.MAILGUN_DOMAIN;
    const from = process.env.MAILGUN_FROM;

    if (!apiKey || !domain || !from) {
      console.error("Mailgun configuration is incomplete.");

      return res.status(500).json({
        message: "Email service configuration is incomplete.",
      });
    }

    const formData = new URLSearchParams({
      from,
      to: normalizedEmail,
      subject: "Thank you for subscribing!",
      text: "Thank you for subscribing to my newsletter!",
    }).toString();

    const options = {
      hostname: "api.mailgun.net",
      path: `/v3/${domain}/messages`,
      method: "POST",
      auth: `api:${apiKey}`,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": Buffer.byteLength(formData),
      },
    };

    const mailgunRequest = https.request(options, (mailgunResponse) => {
      let responseData = "";

      mailgunResponse.on("data", (chunk) => {
        responseData += chunk;
      });

      mailgunResponse.on("end", () => {
        if (
          mailgunResponse.statusCode >= 200 &&
          mailgunResponse.statusCode < 300
        ) {
          return res.status(200).json({
            message: "Welcome email sent successfully!",
          });
        }

        console.error("Mailgun error:", responseData);

        return res.status(502).json({
          message: "The email service could not send your email.",
        });
      });
    });

    mailgunRequest.on("error", (error) => {
      console.error("Mailgun request error:", error.message);

      if (!res.headersSent) {
        return res.status(502).json({
          message: "Could not connect to the email service.",
        });
      }
    });

    mailgunRequest.write(formData);
    mailgunRequest.end();
  } catch (error) {
    console.error("Subscription error:", error.message);

    return res.status(500).json({
      message: "An internal server error occurred.",
    });
  }
});

// Error handler
app.use((error, req, res, next) => {
  if (error instanceof SyntaxError && error.status === 400) {
    return res.status(400).json({
      message: "Invalid JSON request.",
    });
  }

  console.error("Server error:", error.message);

  return res.status(500).json({
    message: "An internal server error occurred.",
  });
});

// Make Firestore available to other backend modules
app.locals.db = db;

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
