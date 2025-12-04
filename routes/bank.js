const {
  createLinkToken,
  linkAccount,
  syncTransactions,
} = require("../controllers/bank/index.js");

const { authenticateToken } = require("../services/middleware.js");

module.exports = function bankRoutes(app) {
  app.post("/api/v1/bank/link-token", authenticateToken, createLinkToken);
  app.post("/api/v1/bank/link", authenticateToken, linkAccount);
  app.post("/api/v1/bank/sync/:cardId", authenticateToken, syncTransactions);
};
