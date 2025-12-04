const Expense = require('../../models/expense.js');
const User = require('../../models/user.js');
const Friend = require('../../models/Friend.js');
const mongoose = require('mongoose');

const createExpense = async (req, res, next) => {
  try {
    const { splits, group_id, card_id } = req.body;
    const userId = req.user.id;

    // Resolve user_ids in splits if they are strings (e.g., "UI-574107")
    const resolvedSplits = [];
    if (splits && splits.length > 0) {
      for (const split of splits) {
        if (split.user_id && typeof split.user_id === "string" && !mongoose.Types.ObjectId.isValid(split.user_id)) {
           // It's a custom user_id string, find the user
           const user = await User.findOne({ user_id: split.user_id });
           if (!user) {
             return res.status(404).json({ message: `User with ID ${split.user_id} not found` });
           }
           
           // Check if friend (if not in a group context, or strictly enforcing friendship)
           // For now, assuming if they are in the same group or friends, it's allowed.
           // You might want to add strict friendship check here if needed.

           resolvedSplits.push({ ...split, user_id: user._id });
        } else {
          resolvedSplits.push(split);
        }
      }
    }

    const expenseData = {
      ...req.body,
      splits: resolvedSplits.length > 0 ? resolvedSplits : splits,
      created_by: userId,
    };

    if (card_id) {
        expenseData.card_id = card_id;
    }

    const expense = new Expense(expenseData);
    await expense.save();
    res.status(201).json(expense);
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const getExpenseById = async (req, res, next) => {
  try {
    const expense = await Expense.findById(req.params.id).populate('group_id created_by splits.user_id');
    if (!expense) return res.status(404).json({ message: 'Expense not found' });
    res.json(expense);
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const updateExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!expense) return res.status(404).json({ message: 'Expense not found' });
    res.json(expense);
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const deleteExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findByIdAndUpdate(req.params.id, { isDeleted: true }, { new: true });
    if (!expense) return res.status(404).json({ message: 'Expense not found' });
    res.json(expense);
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const updateExpenseSplits = async (req, res, next) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) return res.status(404).json({ message: 'Expense not found' });

    expense.splits = req.body.splits;
    expense.split_type = req.body.split_type;
    await expense.save();
    res.json(expense);
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const getAllExpensesForGroup = async (req, res, next) => {
    try {
      const groupId = req.params.groupId; // Group ID from the request parameters
  
      // Find all expenses related to the specific group
      const expenses = await Expense.find({ group_id: groupId }).populate('created_by splits.user_id');
  
      if (!expenses || expenses.length === 0) {
        return res.status(404).json({ message: "No expenses found for this group" });
      }
  
      res.json(expenses);
    } catch (error) {
      console.log(error);
      next(error);
    }
  };

module.exports = {
  createExpense,
  getExpenseById,
  updateExpense,
  deleteExpense,
  updateExpenseSplits,
  getAllExpensesForGroup
};
