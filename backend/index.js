require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const PinataClient = require('@pinata/sdk');
const { ruleBasedScore, computeHash } = require("./utils/scoring");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Validate required environment variables
if (!process.env.PINATA_API_KEY || !process.env.PINATA_API_SECRET || !process.env.SERVER_SALT) {
  console.error("❌ Missing required environment variables in .env");
  process.exit(1);
}

// Initialize Pinata SDK
const pinata = new PinataClient(
  process.env.PINATA_API_KEY,
  process.env.PINATA_API_SECRET
);

// Health check endpoint
app.get("/", (req, res) => {
  res.send("✅ Backend is running");
});

// POST /score — accepts structured features and returns score + breakdown + hash
app.post("/score", (req, res) => {
  const features = req.body;
  console.log("📥 Received /score request:", features);

  // Basic input validation
  if (
    typeof features.upi_avg_txn_value !== "number" ||
    typeof features.git_commits_90d !== "number" ||
    typeof features.edu_verified !== "boolean" ||
    typeof features.social_followers !== "number"
  ) {
    console.warn("⚠️ Invalid input format:", features);
    return res.status(400).json({ error: "Invalid input format. Expected numeric and boolean fields." });
  }

  try {
    const { score, contributions } = ruleBasedScore(features);
    const rawHash = computeHash(features, process.env.SERVER_SALT);
    res.json({ score, contributions, rawHash });
  } catch (err) {
    console.error("❌ Scoring error:", err);
    res.status(500).json({ error: "Failed to compute score" });
  }
});

// POST /pin — pins metadata JSON to IPFS via Pinata
app.post("/pin", async (req, res) => {
  const metadata = req.body;
  console.log("📥 Received /pin request:", metadata);

  try {
    const result = await pinata.pinJSONToIPFS(metadata);
    res.json({ cid: result.IpfsHash });
  } catch (err) {
    console.error("❌ Pinata error:", err);
    res.status(500).json({ error: "Failed to pin metadata" });
  }
});

// Start backend server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Backend server running at http://localhost:${PORT}`);
});