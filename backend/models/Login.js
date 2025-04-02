const mongoose = require('mongoose');

// Define the schema for login attempts
const LoginSchema = new mongoose.Schema({
  username: { type: String, required: true },
  ip_address: { type: String, required: true },
  location: { type: String, required: true },
  device: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  risk_score: { type: Number, default: 0.5 },
  status: { type: String, enum: ['safe', 'suspicious'], default: 'safe' }
});

// Export the model
module.exports = mongoose.model('Login', LoginSchema);