const path = require("path");
const { spawn } = require("child_process");
const BudgetExpense = require("../../models/Budget/budget_expense.js");
const mongoose = require("mongoose");
const { ObjectId } = mongoose.Types;

const predictExpense = async (req, res, next) => {
  try {
    let filters = {
      created_by: new ObjectId(req.user.id),
      isDeleted: false,
    };

    const expenses = await BudgetExpense.find(filters).lean();
    const expenseData = JSON.stringify(expenses);

    // const py = spawn("python3", [
    //   path.join(__dirname, "predict_expenses.py") // ✅ correct relative path
    // ]);

    const py = spawn(path.join(__dirname, "../../venv/bin/python3"), [
      path.join(__dirname, "predict_expenses.py")
    ]);
    

    let result = "";

    py.stdin.write(expenseData);
    py.stdin.end();

    py.stdout.on("data", (data) => {
      result += data.toString();
    });

    py.stderr.on("data", (err) => {
      console.error("Python error:", err.toString());
    });

    py.on("close", (code) => {
      if (code !== 0) return res.status(500).send("Python script failed");
      res.json(JSON.parse(result));
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  predictExpense,
};
