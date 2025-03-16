const BudgetExpense = require('../../../models/Budget/budget_expense.js');
const User = require('../../../models/user.js');

// Create BudgetExpense
const budgetCreateExpense = async (req, res, next) => {
  try {
    const { transaction_type, amount } = req.body;  // Get the transaction type (income or expense)
    
    const budgetExpense = new BudgetExpense({
      ...req.body,
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
      const budgetExpense = await BudgetExpense.findOne({
        id: req.params.id,
        created_by: req.user.id,
      });
  
      if (!budgetExpense) return res.status(404).json({ message: 'Budget expense not found or access denied' });
  
      const oldAmount = budgetExpense.amount;  // Store the old amount before updating
      const oldTransactionType = budgetExpense.transaction_type;  // Store the old transaction type
  
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
  
      if (!budgetExpense) return res.status(404).json({ message: 'Budget expense not found or access denied' });
  
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

  const budgetSyncExpenses = async (req, res, next) => {
    try {
      const { expenses } = req.body; // Array of new expenses from frontend
  
      if (!expenses || expenses.length === 0) {
        return res.status(400).json({ message: "No expenses to sync" });
      }
  
      // Assign created_by field for all expenses
      const expensesWithUser = expenses.map(exp => ({
        ...exp,
        created_by: req.user.id, // Ensure expenses are linked to the user
      }));
  
      // Insert all new expenses at once
      const insertedExpenses = await BudgetExpense.insertMany(expensesWithUser);
  
      res.json({ message: "Expenses synced successfully", data: insertedExpenses });
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
    budgetSyncExpenses
  }