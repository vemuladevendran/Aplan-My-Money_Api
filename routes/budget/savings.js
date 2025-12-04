const {
  createSavings,
  getSavings,
  updateSavings,
  deleteSavings,
  addAmountToSavings,
} = require("../../controllers/Budget/savings/index.js");

const { authenticateToken } = require("../../services/middleware.js");

module.exports = function savingsRoutes(app) {
  app.post("/api/v1/savings", authenticateToken, createSavings);
  app.get("/api/v1/savings", authenticateToken, getSavings);
  app.put("/api/v1/savings/:id", authenticateToken, updateSavings);
  app.delete("/api/v1/savings/:id", authenticateToken, deleteSavings);
  app.post("/api/v1/savings/:id/add", authenticateToken, addAmountToSavings);
};
