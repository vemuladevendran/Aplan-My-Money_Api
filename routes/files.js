const {
  exportExpensesCSV,
  exportExpensesExcel,
} = require("../controllers/files/index");

const { authenticateToken } = require("../services/middleware");

module.exports = function filesRoutes(app) {
  app.get("/api/v1/files/expense-csv", authenticateToken, exportExpensesCSV);
  app.get(
    "/api/v1/files/expense-excel",
    authenticateToken,
    exportExpensesExcel
  );
};
