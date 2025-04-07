const mongoose = require("mongoose");
const BudgetExpense = require("../../models/Budget/budget_expense.js");
const Chat = require("../../models/Budget/chat.js");
const { getDateRangeFromDuckling } = require("../../utility/duckling.js");
const { getCategoriesFromGemini } = require("../../utility/gemini.js");
const Chrono = require("chrono-node");

const { ObjectId } = mongoose.Types;

// Fallback: Chrono + Manual Parsing
function extractDateRangeFallback(query) {
  const lowerQuery = query.toLowerCase();

  if (lowerQuery.includes("this month")) {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    start.setUTCHours(0, 0, 0, 0);
    end.setUTCHours(23, 59, 59, 999);
    return { start: start.toISOString(), end: end.toISOString() };
  }

  if (lowerQuery.includes("last month")) {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 0);
    start.setUTCHours(0, 0, 0, 0);
    end.setUTCHours(23, 59, 59, 999);
    return { start: start.toISOString(), end: end.toISOString() };
  }

  if (lowerQuery.includes("next month")) {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 2, 0);
    start.setUTCHours(0, 0, 0, 0);
    end.setUTCHours(23, 59, 59, 999);
    return { start: start.toISOString(), end: end.toISOString() };
  }

  const results = Chrono.parse(query);
  if (!results.length) return null;

  const parsed = results[0];
  const startDate = parsed.start?.date();
  const endDate = parsed.end?.date();

  if (!startDate) return null;

  if (!endDate) {
    startDate.setUTCHours(0, 0, 0, 0);
    const singleDayEnd = new Date(startDate);
    singleDayEnd.setUTCHours(23, 59, 59, 999);
    return { start: startDate.toISOString(), end: singleDayEnd.toISOString() };
  }

  startDate.setUTCHours(0, 0, 0, 0);
  endDate.setUTCHours(23, 59, 59, 999);
  return { start: startDate.toISOString(), end: endDate.toISOString() };
}

// Main route handler
const handleUserQuery = async (req, res, next) => {
  const userId = req.user.id;
  const query = req.query.data;

  let dateRange = await getDateRangeFromDuckling(query);


  const lowerQuery = query.toLowerCase();
  const isMonthlyTerm =
    lowerQuery.includes("this month") ||
    lowerQuery.includes("last month") ||
    lowerQuery.includes("next month");

  const isSingleDay =
    dateRange &&
    new Date(dateRange.start).toISOString().slice(0, 10) ===
      new Date(dateRange.end).toISOString().slice(0, 10);

  if (!dateRange || (isMonthlyTerm && isSingleDay)) {
    dateRange = extractDateRangeFallback(query);
  }

  const categories = await getCategoriesFromGemini(query);

  let result;

  console.log(dateRange, categories, "checking");

  if (
    /highest\s+spending|highest\s+spend|highest\s+expense|most\s+spent/i.test(
      query
    )
  ) {
    result = await getHighestSpending(userId, dateRange, categories);
  } else if (/total\s+income/i.test(query)) {
    result = await getTotalIncome(userId, dateRange);
  } else if (query.includes("spent on") || query.includes("spent for")) {
    result = await getTotalExpense(userId, dateRange, categories);
  } else if (/total\s+expense|spend|spending|expense/i.test(query)) {
    result = await getTotalExpense(userId, dateRange, categories);
  } else {
    result = { message: "Query not recognized" };
  }

  const data = {
    query,
    result,
    userId,
  };

  await Chat.create(data);
  return res.status(200).json(data);
};

// --- Expense Logic with multi-category support

const getTotalExpense = async (userId, dateRange, categories) => {
  const filters = {
    created_by: new ObjectId(userId),
    isDeleted: false,
  };

  if (dateRange) {
    filters.expense_date = {
      $gte: new Date(dateRange.start),
      $lt: new Date(dateRange.end),
    };
  }

  if (categories && categories.length > 0) {
    filters.expense_type = { $in: categories };
  }

  try {
    const result = await BudgetExpense.aggregate([
      { $match: filters },
      {
        $group: {
          _id: null,
          totalExpense: { $sum: "$amount" },
          records: { $push: "$$ROOT" },
        },
      },
    ]);

    return result.length
      ? { totalExpense: result[0].totalExpense, records: result[0].records }
      : { totalExpense: 0, records: [] };
  } catch (err) {
    console.error("Error in getTotalExpense:", err);
    return { totalExpense: 0, records: [] };
  }
};

const getHighestSpending = async (userId, dateRange, categories) => {
  const filters = {
    created_by: new ObjectId(userId),
    isDeleted: false,
    transaction_type: "expense",
  };

  if (dateRange) {
    filters.expense_date = {
      $gte: new Date(dateRange.start),
      $lt: new Date(dateRange.end),
    };
  }

  if (categories && categories.length > 0) {
    filters.expense_type = { $in: categories };
  }

  try {
    const result = await BudgetExpense.aggregate([
      { $match: filters },
      { $sort: { amount: -1 } },
      { $limit: 1 },
    ]);
    return result.length
      ? { highestSpending: result[0], records: result }
      : { highestSpending: null, records: [] };
  } catch (err) {
    console.error("Error in getHighestSpending:", err);
    return { highestSpending: null, records: [] };
  }
};

const getTotalIncome = async (userId, dateRange) => {
  const filters = {
    created_by: new ObjectId(userId),
    isDeleted: false,
    transaction_type: "income",
  };

  if (dateRange) {
    filters.expense_date = {
      $gte: new Date(dateRange.start),
      $lt: new Date(dateRange.end),
    };
  }

  try {
    const result = await BudgetExpense.aggregate([
      { $match: filters },
      {
        $group: {
          _id: null,
          totalIncome: { $sum: "$amount" },
          records: { $push: "$$ROOT" },
        },
      },
    ]);
    return result.length
      ? { totalIncome: result[0].totalIncome, records: result[0].records }
      : { totalIncome: 0, records: [] };
  } catch (err) {
    console.error("Error in getTotalIncome:", err);
    return { totalIncome: 0, records: [] };
  }
};

module.exports = {
  handleUserQuery,
};
