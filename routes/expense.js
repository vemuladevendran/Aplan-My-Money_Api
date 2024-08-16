const {
  createExpense,
  getExpenseById,
  updateExpense,
  deleteExpense,
  updateExpenseSplits,
  getAllExpensesForGroup,
} = require("../controllers/expense/index");

const {authenticateToken} = require("../services/middleware")

module.exports = function expenseRoutes(app) {
    app.post("/api/v1/expense", authenticateToken, createExpense);
    app.get("/api/v1/expense/:id", authenticateToken, getExpenseById);
    app.put("/api/v1/expense/:id", authenticateToken, updateExpense);
    app.delete("/api/v1/expense/:id", authenticateToken, deleteExpense);
    app.get("/api/v1/expense/group/:groupId", authenticateToken, getAllExpensesForGroup);

}
