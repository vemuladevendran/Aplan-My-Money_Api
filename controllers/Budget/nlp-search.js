const mongoose = require("mongoose");
const BudgetExpense = require("../../models/Budget/budget_expense.js");
const Chat = require("../../models/Budget/chat.js");
const { ObjectId } = mongoose.Types;
const Chrono = require("chrono-node");
const nlp = require("compromise");

// Predefined list of categories
const predefinedCategories = [
  "beverage",
  "book",
  "pet",
  "food",
  "home",
  "healthcare",
  "electricity",
  "gas",
  "water",
  "rent",
  "car",
  "shoes",
  "bag",
  "clothes",
  "beauty",
  "travel",
  "film",
  "fun",
  "games",
  "sport",
  "gym",
  "education",
  "camera",
  "tech",
  "phone",
  "wedding",
  "snacks",
  "meat",
  "fruit",
  "vegetables",
  "social",
  "bath",
  "music",
  "others",
];

function extractDateRange(query) {
  const parsedDate = Chrono.parseDate(query); // Parse the natural language date

  
  if (!parsedDate) return null; // If no valid date found, return null

  let startDate, endDate;

  startDate = new Date(parsedDate);
  startDate.setDate(1); // Set to the first day of the month
  endDate = new Date(parsedDate.getFullYear(), parsedDate.getMonth() + 1, 0); // Last day of the month

  return { start: startDate.toISOString(), end: endDate.toISOString() };
}

function extractCategory(query) {
  let matchedCategories = [];

  predefinedCategories.forEach((category) => {
    const regex = new RegExp(category, "i"); // Case-insensitive matching
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

// Fetch Total Expense for a user and specific date range
const getTotalExpense = async (userId, dateRange, category) => {
  const filters = {
    created_by: new ObjectId(userId), // Use the `new` keyword to create ObjectId
    isDeleted: false,
  };

  if (dateRange) {
    let startDate = new Date(dateRange.start);
    let endDate = new Date(dateRange.end);

    startDate.setUTCHours(0, 0, 0, 0); // Start of the day (UTC)
    endDate.setUTCHours(23, 59, 59, 999); // End of the day (UTC)

    filters.expense_date = {
      $gte: new Date(startDate.toISOString()), // Ensure proper ISO format for querying
      $lt: new Date(endDate.toISOString()), // Ensure proper ISO format for querying
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

// Fetch Highest Spending for a user and specific date range
const getHighestSpending = async (userId, dateRange, category) => {
  const filters = { created_by: new ObjectId(userId), isDeleted: false }; // Ensure ObjectId

  if (dateRange) {
    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);

    startDate.setUTCHours(0, 0, 0, 0);
    endDate.setUTCHours(23, 59, 59, 999);

    filters.expense_date = { $gte: startDate, $lt: endDate }; // Use $lt
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

// Fetch Total Income for a user and specific date range
const getTotalIncome = async (userId, dateRange) => {
  const filters = {
    created_by: userId,
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

// Main Function to Handle User Query
const handleUserQuery = async (req, res, next) => {
  const userId = req.user.id;
  const query = req.query.data;

  const dateRange = extractDateRange(query);
  const category = extractCategory(query);

  let result;

  // Adjusted order and more specific regex patterns
  if (/highest\s+spending|highest\s+spend|highest\s+expense\s+most\s+spent/i.test(query)) {
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

const getChats = async (req, res, next) => {
  try {
    let filters = { userId: req.user.id, isDeleted: false };
    const result = await Chat.find(filters).sort({ createdAt: 1 });
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  handleUserQuery,
  getChats
};