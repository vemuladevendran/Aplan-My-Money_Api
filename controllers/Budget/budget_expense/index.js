const BudgetExpense = require('../../../models/Budget/budget_expense.js');

// Create BudgetExpense
const budgetCreateExpense = async (req, res, next) => {
    try {
      const budgetExpense = new BudgetExpense({
        ...req.body,
        created_by: req.user.id, // Associate the expense with the logged-in user
      });
      await budgetExpense.save();
      res.status(201).json(budgetExpense);
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
  
      if (!budgetExpense) return res.status(404).json({ message: 'Budget expense not found or access denied' });
      res.json(budgetExpense);
    } catch (error) {
      console.log(error);
      next(error);
    }
  };
  
  // Update BudgetExpense (Ensure user can only update their own expense)
  const budgetUpdateExpense = async (req, res, next) => {
    try {
      const budgetExpense = await BudgetExpense.findOneAndUpdate(
        { id: req.params.id, created_by: req.user.id }, // Only allow the user to update their own expense
        req.body,
        { new: true }
      );
  
      if (!budgetExpense) return res.status(404).json({ message: 'Budget expense not found or access denied' });
      res.json(budgetExpense);
    } catch (error) {
      console.log(error);
      next(error);
    }
  };
  
  // Delete BudgetExpense (soft delete by setting isDeleted to true) - Ensure user can only delete their own expense
  const budgetDeleteExpense = async (req, res, next) => {
    try {
      const budgetExpense = await BudgetExpense.findOneAndUpdate(
        { id: req.params.id, created_by: req.user.id }, // Only allow the user to delete their own expense
        { isDeleted: true },
        { new: true }
      );
  
      if (!budgetExpense) return res.status(404).json({ message: 'Budget expense not found or access denied' });
      res.json(budgetExpense);
    } catch (error) {
      console.log(error);
      next(error);
    }
  };
  
  // Get all BudgetExpenses (Ensure user can only get their own expenses)
  const budgetGetAllExpenses = async (req, res, next) => {
    try {
      const budgetExpenses = await BudgetExpense.find({ created_by: req.user.id }); // Filter expenses by user
  
      if (!budgetExpenses || budgetExpenses.length === 0) {
        return res.status(404).json({ message: "No budget expenses found" });
      }
      res.json(budgetExpenses);
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
  }