const mongoose = require("mongoose");
const BudgetExpense = require("../../models/Budget/budget_expense.js");
const Chat = require("../../models/Budget/chat.js");
const { ObjectId } = mongoose.Types;
const Chrono = require("chrono-node");
const nlp = require("compromise");

// Predefined list of categories
const predefinedCategories = [
  "beverage", "book", "pet", "food", "home", "healthcare", "electricity", "gas", "water", "rent",
  "car", "shoes", "bag", "clothes", "beauty", "travel", "film", "fun", "games", "sport", "gym",
  "education", "camera", "tech", "phone", "wedding", "snacks", "meat", "fruit", "vegetables",
  "social", "bath", "music", "others",
];

// ✅ Updated extractDateRange using Chrono.parse()
function extractDateRange(query) {
  const lowerQuery = query.toLowerCase();

  // Manual handling for "this month"
  if (lowerQuery.includes("this month")) {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    start.setUTCHours(0, 0, 0, 0);
    end.setUTCHours(23, 59, 59, 999);
    return { start: start.toISOString(), end: end.toISOString() };
  }

  // Handle "last month"
  if (lowerQuery.includes("last month")) {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 0);
    start.setUTCHours(0, 0, 0, 0);
    end.setUTCHours(23, 59, 59, 999);
    return { start: start.toISOString(), end: end.toISOString() };
  }

  // Handle "next month"
  if (lowerQuery.includes("next month")) {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 2, 0);
    start.setUTCHours(0, 0, 0, 0);
    end.setUTCHours(23, 59, 59, 999);
    return { start: start.toISOString(), end: end.toISOString() };
  }

  // Default chrono behavior
  const results = Chrono.parse(query);
  if (!results.length) return null;

  const parsed = results[0];
  const startDate = parsed.start ? parsed.start.date() : null;
  const endDate = parsed.end ? parsed.end.date() : null;

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


function extractCategory(query) {
  let matchedCategories = [];

  predefinedCategories.forEach((category) => {
    const regex = new RegExp(category, "i");
    if (regex.test(query)) {
      matchedCategories.push(category);
    }
  });

  return matchedCategories.length > 0 ? matchedCategories[0] : null;
}

function extractAmount(query) {
  let doc = nlp(query);
  const amount = doc.money().get();
  return amount.length > 0 ? amount[0].value : null;
}

const getTotalExpense = async (userId, dateRange, category) => {
  const filters = {
    created_by: new ObjectId(userId),
    isDeleted: false,
  };

  if (dateRange) {
    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);

    filters.expense_date = {
      $gte: startDate,
      $lt: endDate,
    };
  }

  if (category) {
    filters.expense_type = category;
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
    console.error("Error running query:", err);
    return { totalExpense: 0, records: [] };
  }
};

const getHighestSpending = async (userId, dateRange, category) => {
  const filters = {
    created_by: new ObjectId(userId),
    isDeleted: false,
  };

  if (dateRange) {
    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);

    filters.expense_date = { $gte: startDate, $lt: endDate };
  }

  if (category) {
    filters.expense_type = category;
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
    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);
    filters.expense_date = { $gte: startDate, $lte: endDate };
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
    console.error("Error running query:", err);
    return { totalIncome: 0, records: [] };
  }
};

// Placeholder for category-based spend query (optional)
const getSpendingByCategory = async (userId, category, dateRange) => {
  return getTotalExpense(userId, dateRange, category);
};

const handleUserQuery = async (req, res, next) => {
  const userId = req.user.id;
  const query = req.query.data;

  const dateRange = extractDateRange(query);
  const category = extractCategory(query);

  let result;

  if (/highest\s+spending|highest\s+spend|highest\s+expense|most\s+spent/i.test(query)) {
    result = await getHighestSpending(userId, dateRange, category);
  } else if (/total\s+income/i.test(query)) {
    result = await getTotalIncome(userId, dateRange);
  } else if (query.includes("spent on") || query.includes("spent for")) {
    result = await getSpendingByCategory(userId, category, dateRange);
  } else if (/total\s+expense|spend|spending|expense/i.test(query)) {
    result = await getTotalExpense(userId, dateRange, category);
  } else {
    result = { message: "Query not recognized" };
  }

  const data = {
    query: req.query.data,
    result: result,
    userId: req.user.id,
  };
  await Chat.create(data);
  
  return res.status(200).json(data);
};

module.exports = {
  handleUserQuery,
};
