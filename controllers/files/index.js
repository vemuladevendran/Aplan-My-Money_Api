const User = require("../../models/user.js");
const BudgetExpense = require("../../models/Budget/budget_expense.js");
const mongoose = require("mongoose");
const { Parser } = require("json2csv");
const ExcelJS = require("exceljs");
const { ObjectId } = mongoose.Types;

// 🔁 Common export logic keys
const exportFields = [
  "Date",
  "Category",
  "Description",
  "TransactionType",
  "PaymentType",
  "GroupName",
  "Currency",
  "Amount",
];

// 🧾 Format records to match export structure
function formatExportData(records) {
  return records.map((r) => ({
    Date: r.expense_date?.toISOString()?.split("T")[0] || "-",
    Category: r.expense_type || "-",
    Description: r.description || "-",
    TransactionType: r.transaction_type || "-",
    PaymentType: r.payment_type || "-",
    GroupName: r.group_name || "-",
    Currency: r.currency_code || "-",
    Amount: r.amount || 0,
  }));
}

// ✅ CSV Export
const exportExpensesCSV = async (req, res, next) => {
  const userId = req.user.id;
  const { from, to } = req.query;

  if (!from || !to || !userId) {
    return res.status(400).json({ error: "Missing from, to, or userId" });
  }

  try {
    const startDate = new Date(from);
    const endDate = new Date(to);
    endDate.setUTCHours(23, 59, 59, 999);

    const records = await BudgetExpense.find({
      created_by: new ObjectId(userId),
      isDeleted: false,
      expense_date: { $gte: startDate, $lte: endDate },
    });

    const formatted = formatExportData(records);

    const parser = new Parser({ fields: exportFields });
    const csv = parser.parse(formatted);

    res.header("Content-Type", "text/csv");
    res.attachment("expenses.csv");
    return res.send(csv);
  } catch (err) {
    next(err);
    console.error("Error exporting CSV:", err);
  }
};

// ✅ Excel Export
const exportExpensesExcel = async (req, res, next) => {
  const userId = req.user.id;
  const { from, to } = req.query;

  if (!from || !to || !userId) {
    return res.status(400).json({ error: "Missing from, to, or userId" });
  }

  try {
    const startDate = new Date(from);
    const endDate = new Date(to);
    endDate.setUTCHours(23, 59, 59, 999);

    const records = await BudgetExpense.find({
      created_by: new ObjectId(userId),
      isDeleted: false,
      expense_date: { $gte: startDate, $lte: endDate },
    });

    const formatted = formatExportData(records);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Expenses");

    worksheet.columns = exportFields.map((key) => ({
      header: key.replace(/_/g, " ").toUpperCase(), // Optional formatting
      key,
      width: 20,
    }));

    worksheet.addRows(formatted);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", "attachment; filename=expenses.xlsx");

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error("Error exporting Excel:", err);
    next(err);
  }
};

module.exports = {
  exportExpensesCSV,
  exportExpensesExcel,
};
