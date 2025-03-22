const {
  budgetCreateExpense,
  budgetGetExpenseById,
  budgetUpdateExpense,
  budgetDeleteExpense,
  budgetGetAllExpenses,
  budgetSyncExpenses,
} = require("../../controllers/Budget/budget_expense/index.js");

const {
  handleUserQuery,
  getChats,
} = require("../../controllers/Budget/nlp-search.js");

const { authenticateToken } = require("../../services/middleware.js");

module.exports = function budgetExpenseRoutes(app) {
  app.post("/api/v1/budget/expenses", authenticateToken, budgetCreateExpense);
  app.get(
    "/api/v1/budget/expenses/:id",
    authenticateToken,
    budgetGetExpenseById
  );
  app.put(
    "/api/v1/budget/expenses/:id",
    authenticateToken,
    budgetUpdateExpense
  );
  app.delete(
    "/api/v1/budget/expenses/:id",
    authenticateToken,
    budgetDeleteExpense
  );
  app.get("/api/v1/budget/expenses", authenticateToken, budgetGetAllExpenses);
  app.post(
    "/api/v1/budget/expenses/sync",
    authenticateToken,
    budgetSyncExpenses
  );
  app.get("/api/v1/budget/search", authenticateToken, handleUserQuery);
  app.get("/api/v1/budget/chat", authenticateToken, getChats);
};
