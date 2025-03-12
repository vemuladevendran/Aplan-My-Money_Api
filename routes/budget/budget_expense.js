const {
    budgetCreateExpense,
    budgetGetExpenseById,
    budgetUpdateExpense,
    budgetDeleteExpense,
    budgetGetAllExpenses,
    budgetSyncExpenses
  } = require("../../controllers/Budget/budget_expense/index.js");
  
  const { authenticateToken } = require("../../services/middleware.js");
  
  module.exports = function budgetExpenseRoutes(app) {
    app.post("/api/v1/budget/expense", authenticateToken, budgetCreateExpense);
    app.get("/api/v1/budget/expense/:id", authenticateToken, budgetGetExpenseById);
    app.put("/api/v1/budget/expense/:id", authenticateToken, budgetUpdateExpense);
    app.delete("/api/v1/budget/expense/:id", authenticateToken, budgetDeleteExpense);
    app.get("/api/v1/budget/expenses", authenticateToken, budgetGetAllExpenses);
    app.post("/api/v1/budget/expenses/sync", authenticateToken, budgetSyncExpenses);

  };
  