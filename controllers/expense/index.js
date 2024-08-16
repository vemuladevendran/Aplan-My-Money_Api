const Expense = require('../../models/expense.js');

const createExpense = async (req, res, next) => {
  try {
    const expense = new Expense({ ...req.body });
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
