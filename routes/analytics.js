const {
  getSpendingByCard,
  getSplitAnalytics,
} = require("../controllers/analytics/index.js");

const { authenticateToken } = require("../services/middleware.js");

module.exports = function analyticsRoutes(app) {
  app.get("/api/v1/analytics/spending-by-card", authenticateToken, getSpendingByCard);
  app.get("/api/v1/analytics/split-summary", authenticateToken, getSplitAnalytics);
};
