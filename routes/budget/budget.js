const {
  setBudget,
  getBudget,
  checkBudgetStatus,
} = require("../../controllers/Budget/budget/index.js");

const { authenticateToken } = require("../../services/middleware.js");

module.exports = function budgetRoutes(app) {
  app.post("/api/v1/budget/set", authenticateToken, setBudget);
  app.get("/api/v1/budget/get", authenticateToken, getBudget);
  app.get("/api/v1/budget/status", authenticateToken, checkBudgetStatus);
};
