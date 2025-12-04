const BudgetExpense = require("../../models/Budget/budget_expense");
const Expense = require("../../models/expense");
const mongoose = require("mongoose");

// Get Spending by Card
const getSpendingByCard = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { from, to } = req.query;

    const matchStage = {
      created_by: new mongoose.Types.ObjectId(userId),
      isDeleted: false,
      card_id: { $exists: true, $ne: null },
    };

    if (from && to) {
      matchStage.expense_date = {
        $gte: new Date(from),
        $lte: new Date(to),
      };
    }

    // Aggregate from BudgetExpense (Personal)
    const personalSpending = await BudgetExpense.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: "$card_id",
          totalAmount: { $sum: "$amount" },
        },
      },
      {
        $lookup: {
          from: "cards",
          localField: "_id",
          foreignField: "_id",
          as: "card",
        },
      },
      {
        $unwind: "$card",
      },
      {
        $project: {
          card_name: "$card.card_name",
          last_four_digits: "$card.last_four_digits",
          totalAmount: 1,
        },
      },
    ]);

    // Aggregate from Group Expense (Shared)
    // Note: Group expenses might not have card_id directly if not updated, but we added it.
    // Also, we need to consider if the user paid for it.
    const groupSpending = await Expense.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: "$card_id",
          totalAmount: { $sum: "$amount" },
        },
      },
      {
        $lookup: {
          from: "cards",
          localField: "_id",
          foreignField: "_id",
          as: "card",
        },
      },
      {
        $unwind: "$card",
      },
      {
        $project: {
          card_name: "$card.card_name",
          last_four_digits: "$card.last_four_digits",
          totalAmount: 1,
        },
      },
    ]);

    // Merge results
    const result = [...personalSpending, ...groupSpending];
    // You might want to merge duplicates if the same card is used in both (though IDs should be unique per collection query)

    return res.status(200).json(result);
  } catch (error) {
    console.log(error);
    next(error);
  }
};

// Get Split Analytics (Who owes what)
const getSplitAnalytics = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // This logic is similar to getUserAndGroupBalances but aggregated
    // We can reuse or expand on that. For now, let's return a summary.

    const expenses = await Expense.find({
      splits: { $elemMatch: { user_id: userId } },
      isDeleted: false,
    }).populate("group_id created_by");

    let totalOwedToYou = 0;
    let totalYouOwe = 0;

    expenses.forEach((expense) => {
      const userSplit = expense.splits.find(
        (split) => split.user_id.toString() === userId.toString()
      );

      if (expense.created_by._id.toString() === userId.toString()) {
        // You paid, others owe you
        // Total amount - your share = what others owe you
        totalOwedToYou += expense.amount - userSplit.amount;
      } else {
        // Someone else paid, you owe them your share
        totalYouOwe += userSplit.amount;
      }
    });

    return res.status(200).json({
      totalOwedToYou,
      totalYouOwe,
      netBalance: totalOwedToYou - totalYouOwe,
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

module.exports = {
  getSpendingByCard,
  getSplitAnalytics,
};
