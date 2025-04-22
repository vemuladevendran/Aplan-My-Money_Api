const activityController = require("../../activity");

const BudgetExpense = require("../../../models/Budget/budget_expense.js");
const User = require("../../../models/user.js");
const mongoose = require("mongoose");

const { ObjectId } = mongoose.Types;

// Create BudgetExpense
const budgetCreateExpense = async (req, res, next) => {
  try {
    const { transaction_type, amount } = req.body; // Get the transaction type (income or expense)

    const budgetExpense = new BudgetExpense({
      ...req.body,
      currency_code: req.user.fullData.default_currency,
      created_by: req.user.id, // Associate the expense with the logged-in user
    });

    // Save the expense
    await budgetExpense.save();

    // Get the user
    const user = await User.findById(req.user.id);

    // Update user's total_balance, total_income, and total_expense based on the transaction_type
    if (transaction_type === "income") {
      user.total_income += amount;
      user.total_balance += amount;
    } else if (transaction_type === "expense") {
      user.total_expense += amount;
      user.total_balance -= amount;
    }

    // Save the updated user data
    await user.save();
    await activityController.logActivity(
      req.user.id,
      transaction_type === "income"
        ? "income_added"
        : "expense_added",
      `New transaction is happened the amount is ${amount}`
    );
    return res.status(201).json(budgetExpense);
  } catch (error) {
    console.log(error);
    next(error);
  }
};

// Get BudgetExpense by ID (Ensure user can only see their own data)
const budgetGetExpenseById = async (req, res, next) => {
  try {
    const budgetExpense = await BudgetExpense.findOne({
      id: req.params.id,
      created_by: req.user.id, // Only allow the user to get their own expense
    });

    if (!budgetExpense)
      return res
        .status(404)
        .json({ message: "Budget expense not found or access denied" });
    res.json(budgetExpense);
  } catch (error) {
    console.log(error);
    next(error);
  }
};

// Update BudgetExpense (Ensure user can only update their own expense)
const budgetUpdateExpense = async (req, res, next) => {
  try {
    const budgetExpense = await BudgetExpense.findOne({
      id: req.params.id,
      created_by: req.user.id,
    });

    if (!budgetExpense)
      return res
        .status(404)
        .json({ message: "Budget expense not found or access denied" });

    const oldAmount = budgetExpense.amount; // Store the old amount before updating
    const oldTransactionType = budgetExpense.transaction_type; // Store the old transaction type

    // Update the expense with the new data
    const updatedExpense = await BudgetExpense.findOneAndUpdate(
      { id: req.params.id, created_by: req.user.id },
      req.body,
      { new: true }
    );

    // Get the user
    const user = await User.findById(req.user.id);

    // Revert the old totals (before update)
    if (oldTransactionType === "income") {
      user.total_income -= oldAmount;
      user.total_balance -= oldAmount;
    } else if (oldTransactionType === "expense") {
      user.total_expense -= oldAmount;
      user.total_balance += oldAmount;
    }

    // Update the user's totals with the new values
    if (updatedExpense.transaction_type === "income") {
      user.total_income += updatedExpense.amount;
      user.total_balance += updatedExpense.amount;
    } else if (updatedExpense.transaction_type === "expense") {
      user.total_expense += updatedExpense.amount;
      user.total_balance -= updatedExpense.amount;
    }

    // Save the updated user data
    await user.save();

    res.json(updatedExpense);
  } catch (error) {
    console.log(error);
    next(error);
  }
};

// Delete BudgetExpense (soft delete by setting isDeleted to true) - Ensure user can only delete their own expense
const budgetDeleteExpense = async (req, res, next) => {
  try {
    const budgetExpense = await BudgetExpense.findOne({
      id: req.params.id,
      created_by: req.user.id,
    });

    if (!budgetExpense)
      return res
        .status(404)
        .json({ message: "Budget expense not found or access denied" });

    // Soft delete the expense (set `isDeleted` to true)
    budgetExpense.isDeleted = true;
    await budgetExpense.save();

    // Get the user
    const user = await User.findById(req.user.id);

    // Revert the totals based on the transaction type
    if (budgetExpense.transaction_type === "income") {
      user.total_income -= budgetExpense.amount;
      user.total_balance -= budgetExpense.amount;
    } else if (budgetExpense.transaction_type === "expense") {
      user.total_expense -= budgetExpense.amount;
      user.total_balance += budgetExpense.amount;
    }

    // Save the updated user data
    await user.save();

    await activityController.logActivity(
      req.user.id,
      transaction_type === "income"
        ? "income_deleted"
        : "expense_deleted",
      `Transaction has been deleted  the amount is ${amount}`
    );
    return res.json(budgetExpense);
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const budgetGetAllExpenses = async (req, res, next) => {
  try {
    let filters = {
      created_by: new ObjectId(req.user.id),
      isDeleted: false,
    };

    // Apply expense_type filter if present
    if (req.query.expense_type) {
      filters.expense_type = req.query.expense_type;
    }

    // Apply payment_type filter if present
    if (req.query.payment_type) {
      filters.payment_type = req.query.payment_type;
    }

    // Apply year and/or month filters
    if (req.query.year && req.query.month) {
      const year = parseInt(req.query.year);
      const month = parseInt(req.query.month) - 1; // 0-indexed

      const startDate = new Date(year, month, 1); // First day
      const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999); // Last moment of last day

      filters.expense_date = { $gte: startDate, $lte: endDate };
    } else if (req.query.year) {
      const year = parseInt(req.query.year);
      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year, 11, 31, 23, 59, 59, 999);

      filters.expense_date = { $gte: startDate, $lte: endDate };
    }

    // Fetch filtered expenses
    const budgetExpenses = await BudgetExpense.find(filters).sort({
      expense_date: -1,
    });

    // res.set("Cache-Control", "public, max-age=3600")

    return res.status(200).json(budgetExpenses);
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const budgetSyncExpenses = async (req, res, next) => {
  try {
    const { expenses } = req.body; // Array of new expenses from frontend

    if (!expenses || expenses.length === 0) {
      return res.status(400).json({ message: "No expenses to sync" });
    }

    // Assign created_by field for all expenses
    const expensesWithUser = expenses.map((exp) => ({
      ...exp,
      created_by: req.user.id, // Ensure expenses are linked to the user
    }));

    // Insert all new expenses at once
    const insertedExpenses = await BudgetExpense.insertMany(expensesWithUser);

    res.json({
      message: "Expenses synced successfully",
      data: insertedExpenses,
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

// graph data

const budgetGetMonthlyGraphData = async (req, res, next) => {
  try {
    const { year, month } = req.query;

    if (!year || !month) {
      return res.status(400).json({ message: "Year and month are required." });
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const rawData = await BudgetExpense.aggregate([
      {
        $match: {
          created_by: new ObjectId(req.user.id),
          isDeleted: false,
          expense_date: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: {
            date: {
              $dateToString: { format: "%Y-%m-%d", date: "$expense_date" },
            },
            transaction_type: "$transaction_type",
          },
          totalAmount: { $sum: "$amount" },
        },
      },
      {
        $group: {
          _id: "$_id.date",
          data: {
            $push: {
              type: "$_id.transaction_type",
              amount: "$totalAmount",
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          date: "$_id",
          income: {
            $ifNull: [
              {
                $first: {
                  $filter: {
                    input: "$data",
                    as: "item",
                    cond: { $eq: ["$$item.type", "income"] },
                  },
                },
              },
              { amount: 0 },
            ],
          },
          expense: {
            $ifNull: [
              {
                $first: {
                  $filter: {
                    input: "$data",
                    as: "item",
                    cond: { $eq: ["$$item.type", "expense"] },
                  },
                },
              },
              { amount: 0 },
            ],
          },
        },
      },
      {
        $project: {
          date: 1,
          income: "$income.amount",
          expense: "$expense.amount",
        },
      },
      {
        $sort: { date: 1 },
      },
    ]);

    const totalMonthExpense = rawData.reduce(
      (sum, day) => sum + (day.expense || 0),
      0
    );
    const totalMonthIncome = rawData.reduce(
      (sum, day) => sum + (day.income || 0),
      0
    );

    return res.status(200).json({
      daily_data: rawData,
      total_month_expense: totalMonthExpense,
      total_month_income: totalMonthIncome,
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

// category ranking
const budgetGetCategoryRanking = async (req, res, next) => {
  try {
    const { year, month } = req.query;

    if (!year || !month) {
      return res.status(400).json({ message: "Year and month are required." });
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const categoryData = await BudgetExpense.aggregate([
      {
        $match: {
          created_by: new ObjectId(req.user.id),
          transaction_type: "expense",
          isDeleted: false,
          expense_date: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: "$expense_type",
          totalAmount: { $sum: "$amount" },
          transaction_type: { $first: "expense" },
          expenses: {
            $push: {
              id: "$id",
              expense_name: "$expense_name",
              expense_type: "$expense_type",
              amount: "$amount",
              expense_date: "$expense_date",
              description: "$description",
              payment_type: "$payment_type",
              transaction_type: "$transaction_type",
              group_name: "$group_name",
              currency_code: "$currency_code",
              createdAt: "$createdAt",
              updatedAt: "$updatedAt",
            },
          },
        },
      },
      {
        $sort: { totalAmount: -1 },
      },
    ]);

    return res.status(200).json(categoryData);
  } catch (error) {
    console.log(error);
    next(error);
  }
};



const searchExpenses = async (req, res, next) => {
  try {
    let { searchText, expense_type, group_name } = req.query;
    const userId = req.user.id;

    // Normalize to arrays
    expense_type = Array.isArray(expense_type)
      ? expense_type
      : expense_type
        ? [expense_type]
        : [];

    group_name = Array.isArray(group_name)
      ? group_name
      : group_name
        ? [group_name]
        : [];

    const matchStage = {
      created_by: new ObjectId(userId),
      isDeleted: false,
    };

    if (group_name.length > 0) {
      matchStage.group_name = { $in: group_name };
    }

    if (expense_type.length > 0) {
      matchStage.expense_type = { $in: expense_type };
    }

    if (searchText?.trim()) {
      matchStage.description = { $regex: searchText.trim(), $options: "i" };
    }

    const results = await BudgetExpense.aggregate([{ $match: matchStage }]);

    return res.status(200).json(results);
  } catch (error) {
    console.log(error);
    next(error);
  }
};






module.exports = {
  budgetCreateExpense,
  budgetGetExpenseById,
  budgetUpdateExpense,
  budgetDeleteExpense,
  budgetGetAllExpenses,
  budgetSyncExpenses,
  budgetGetMonthlyGraphData,
  budgetGetCategoryRanking,
  searchExpenses
};
