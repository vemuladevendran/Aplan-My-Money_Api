const plaidService = require("../../services/plaidService");
const Card = require("../../models/Card");
const Expense = require("../../models/expense");
const BudgetExpense = require("../../models/Budget/budget_expense");
const mongoose = require("mongoose");

// Create Link Token
const createLinkToken = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const tokenData = await plaidService.createLinkToken(userId);
    res.json(tokenData);
  } catch (error) {
    console.log(error);
    next(error);
  }
};

// Link Account (Exchange Token and Create Card)
const linkAccount = async (req, res, next) => {
  try {
    const { public_token, account_name, institution_name, account_id } = req.body;
    const userId = req.user.id;

    const { access_token, item_id } = await plaidService.exchangePublicToken(public_token);

    // Create a new Card entry linked to Plaid
    const card = new Card({
      user_id: userId,
      card_name: account_name || institution_name || "Bank Account",
      card_type: "Debit", // Default, or get from Plaid metadata
      last_four_digits: "0000", // Placeholder or get from Plaid
      bank_name: institution_name || "Plaid Bank",
      plaid_access_token: access_token,
      plaid_item_id: item_id,
      plaid_account_id: account_id
    });

    await card.save();
    res.status(201).json({ message: "Account linked successfully", card });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

// Sync Transactions
const syncTransactions = async (req, res, next) => {
  try {
    const { cardId } = req.params;
    const userId = req.user.id;

    const card = await Card.findOne({ id: cardId, user_id: userId }).select('+plaid_access_token');

    if (!card || !card.plaid_access_token) {
      return res.status(404).json({ message: "Card not found or not linked to bank" });
    }

    // Fetch transactions for the last 30 days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    const endDate = new Date();

    const { transactions } = await plaidService.getTransactions(
      card.plaid_access_token,
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0]
    );

    let addedCount = 0;

    for (const txn of transactions) {
      // Check if expense already exists (avoid duplicates)
      // Ideally, store plaid_transaction_id in Expense model to prevent dupes
      // For simulation, we'll check by name, date, and amount
      
      const existing = await BudgetExpense.findOne({
        created_by: userId,
        amount: txn.amount,
        expense_name: txn.name,
        // expense_date: new Date(txn.date) // Date comparison can be tricky
      });

      if (!existing) {
        const newExpense = new BudgetExpense({
            created_by: userId,
            amount: txn.amount,
            transaction_type: "expense",
            expense_name: txn.name,
            expense_type: txn.category ? txn.category[0] : "Uncategorized",
            expense_date: new Date(txn.date),
            payment_type: "Card",
            card_id: card._id,
            description: `Imported from ${card.bank_name}`
        });
        await newExpense.save();
        addedCount++;
      }
    }

    res.json({ message: "Sync complete", transactions_found: transactions.length, expenses_added: addedCount });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

module.exports = {
  createLinkToken,
  linkAccount,
  syncTransactions
};
