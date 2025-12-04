const Budget = require("../../../models/Budget/Budget");
const BudgetExpense = require("../../../models/Budget/budget_expense");
const mongoose = require("mongoose");

// Set or Update Budget
const setBudget = async (req, res, next) => {
  try {
    const { amount, period, category, alert_threshold, currency } = req.body;
    const userId = req.user.id;

    let budget = await Budget.findOne({
      user_id: userId,
      period: period || "monthly",
      category: category || "all",
      isDeleted: false,
    });

    if (budget) {
      budget.amount = amount;
      if (alert_threshold) budget.alert_threshold = alert_threshold;
      if (currency) budget.currency = currency;
      await budget.save();
    } else {
      budget = new Budget({
        user_id: userId,
        amount,
        period,
        category,
        alert_threshold,
        currency: currency || req.user.fullData.default_currency,
      });
      await budget.save();
    }

    return res.status(200).json(budget);
  } catch (error) {
    console.log(error);
    next(error);
  }
};

// Get Budget
const getBudget = async (req, res, next) => {
  try {
    const { period, category } = req.query;
    const userId = req.user.id;

    const query = {
      user_id: userId,
      isDeleted: false,
    };

    if (period) query.period = period;
    if (category) query.category = category;

    const budgets = await Budget.find(query);
    return res.status(200).json(budgets);
  } catch (error) {
    console.log(error);
    next(error);
  }
};

// Check Budget Status (Helper for frontend to check status)
const checkBudgetStatus = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { period = "monthly" } = req.query;

    // Get active budget
    const budget = await Budget.findOne({
      user_id: userId,
      period: period,
      category: "all", // Simplified for now, can be expanded
      isDeleted: false,
    });

    if (!budget) {
      return res.status(200).json({ message: "No budget set" });
    }

    // Calculate total expenses for the period
    const now = new Date();
    let startDate, endDate;

    if (period === "monthly") {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    } else if (period === "yearly") {
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
    }

    const expenses = await BudgetExpense.aggregate([
      {
        $match: {
          created_by: new mongoose.Types.ObjectId(userId),
          transaction_type: "expense",
          isDeleted: false,
          expense_date: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" },
        },
      },
    ]);

    const totalExpense = expenses.length > 0 ? expenses[0].total : 0;
    const remaining = budget.amount - totalExpense;
    const percentageUsed = (totalExpense / budget.amount) * 100;

    return res.status(200).json({
      budget: budget.amount,
      total_expense: totalExpense,
      remaining,
      percentage_used: percentageUsed,
      is_exceeded: totalExpense > budget.amount,
      alert_threshold: budget.alert_threshold,
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

module.exports = {
  setBudget,
  getBudget,
  checkBudgetStatus,
};
