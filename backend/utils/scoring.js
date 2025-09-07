const crypto = require("crypto");

/**
 * Computes a rule-based credit score from structured features.
 * @param {Object} features - Input features from frontend
 * @returns {Object} - Score and individual contributions
 */
function ruleBasedScore(features) {
  let score = 0;
  let contributions = {};

  // Defensive defaults
  const txnValue = Number(features.upi_avg_txn_value) || 0;
  const gitCommits = Number(features.git_commits_90d) || 0;
  const eduVerified = Boolean(features.edu_verified);
  const followers = Number(features.social_followers) || 0;

  // Weighted contributions
  contributions.avg_txn = Math.min((txnValue / 1000) * 40, 40);
  contributions.git = Math.min((gitCommits / 10) * 20, 20);
  contributions.edu = eduVerified ? 20 : 0;
  contributions.social = Math.min((followers / 100) * 20, 20);

  score = contributions.avg_txn + contributions.git + contributions.edu + contributions.social;

  return {
    score: Math.round(score),
    contributions
  };
}

/**
 * Generates a SHA-256 hash of the raw payload + server salt.
 * @param {Object} rawPayload - Original input features
 * @param {string} serverSalt - Secret salt from .env
 * @returns {string} - SHA-256 hash
 */
function computeHash(rawPayload, serverSalt) {
  return crypto
    .createHash("sha256")
    .update(JSON.stringify(rawPayload) + serverSalt)
    .digest("hex");
}

module.exports = { ruleBasedScore, computeHash };
