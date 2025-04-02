const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const requestIp = require('request-ip');
const Login = require('./models/Login');
const rateLimit = require('express-rate-limit');
const speakeasy = require('speakeasy');
const nodemailer = require('nodemailer');

dotenv.config();
const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(requestIp.mw());

// Rate limiter for login attempts
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: "Too many login attempts. Try again later."
});
app.use("/login", loginLimiter);

// MongoDB Connection
const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/network';
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1); // Exit if MongoDB connection fails
  });

// Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: process.env.EMAIL, pass: process.env.EMAIL_PASSWORD }
});

// /login Route
app.post('/login', async (req, res) => {
  try {
    console.log("Incoming login request:", req.body);

    const { username, location, failedAttempts } = req.body;
    const ip = requestIp.getClientIp(req);

    const loginHour = new Date().getHours();
    const isSuspicious = failedAttempts > 3;

    const newLogin = new Login({
      username,
      location,
      ip_address: ip,
      failedAttempts,
      timestamp: new Date(),
      risk_score: isSuspicious ? 0.8 : 0.2,
      status: isSuspicious ? 'suspicious' : 'safe'
    });
    await newLogin.save();

    if (isSuspicious) {
      console.log("Sending suspicious login alert email...");
      await transporter.sendMail({
        from: process.env.EMAIL,
        to: "admin@example.com",
        subject: "Suspicious Login Alert",
        text: `Suspicious login detected for user ${username} from IP ${ip}.`
      });
    }

    res.json({ suspicious: isSuspicious });
  } catch (error) {
    console.error("Error in /login route:", error);
    res.status(500).json({ message: 'Server error', error });
  }
});

// /send-otp Route
app.post('/send-otp', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const otp = speakeasy.totp({ secret: process.env.OTP_SECRET, encoding: "base32" });

    console.log("Sending OTP to:", email);
    await transporter.sendMail({
      from: process.env.EMAIL,
      to: email,
      subject: "Your OTP Code",
      text: `Your OTP code is ${otp}.`
    });

    res.json({ success: true, message: "OTP sent successfully" });
  } catch (error) {
    console.error("Error in /send-otp route:", error);
    res.status(500).json({ message: 'Failed to send OTP', error });
  }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));