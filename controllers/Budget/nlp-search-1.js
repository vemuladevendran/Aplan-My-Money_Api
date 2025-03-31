const mongoose = require("mongoose");
const moment = require("moment");

const BudgetExpense = require("../../models/Budget/budget_expense.js");
const Chat = require("../../models/Budget/chat.js");
const { ObjectId } = mongoose.Types;
const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);

const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Main Function to Handle User Query
const handleUserQuery = async (req, res, next) => {
  const userId = new ObjectId(req.user.id);
  const query = req.query.data;

  let aiPrompt = `You are an intelligent assistant for a finance tracking app. Based on the user’s natural language question, generate the MongoDB query logic to be inserted inside an existing Node.js function called handleUserQuery.

Here is the Mongoose schema you’re working with:

const BudgetExpenseSchema = new mongoose.Schema({
  id: { type: String, default: uuidv4, unique: true },
  transaction_type: { type: String, enum: ["expense", "income"], required: true },
  expense_type: { type: String },
  expense_name: { type: String },
  expense_date: { type: Date, default: Date.now },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  amount: { type: Number, required: true },
  currency_code: { type: String, default: "USD", trim: true },
  description: { type: String, trim: true },
  payment_type: { type: String, enum: ["Cash", "Card", "UPI", "Other"], default: "Card" },
  group_name: { type: String, default: "general" },
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

Rules you must follow while generating the response:

- Always filter by created_by: new ObjectId(userId) and isDeleted: false.
- If the user asks about a time period (e.g., "last month", "this week", "March 2024"), calculate and include the appropriate date range using expense_date with $gte and $lt.
- If the user mentions one or more categories (e.g., "food", "rent"), include a filter on expense_type.
- If the user is asking for highest or largest expense, sort by amount: -1 and limit to 1.
- If the user is asking for a total (e.g., "total expense"), return { totalExpense: ..., records: [...] } structure.
- If no matching records are found, return a total of 0 and an empty records array.
- if you are unable to generate a valid code, return a empty object.

Your final output should be wrapped like this:

const data = {
  query: '${query}',
  result: result, // result from MongoDB aggregation
  userId: req.user.id,
};

Do not write the full function—just generate the inside code for the function const handleUserQuery = async (req, res, next) => {} this point important.

Sample user questions might include:
- “What are my expenses for last month?”
- “Show me total expense on food and rent this week.”
- “What is my highest expense this year?”
- “How much did I spend on groceries in January?”

Use prior aggregation examples if necessary. Use case-insensitive regex to detect categories from queries (e.g., food, rent, groceries). Use $group with $sum for totals, and always include full matching records in the records field.
user question : '${query}'
userId: '${userId}'
isDeleted: false,

values already i have i named BudgetExpense use only this name remember all the poist dont forget any

return the result at last or return the response with status code 200 and also result,

always remember this point dont write complete function and imports because i already have those
`;

  try {
    const aiResponse = await model.generateContent(
      aiPrompt + `\nUser query: ${query}`
    );
    const code = aiResponse.response.text();
    console.log(code, "==============");

    const cleanedCode = code
      .replace(/```(js|javascript)?/gi, "")
      .replace(/```/g, "")
      .replace(/const\s+\{\s*ObjectId\s*\}.*?;/g, "") // remove AI's ObjectId import
      .replace(/const\s+moment\s*=.*?;/g, "") // remove AI's moment import
      .trim();

    // Prepare dynamic async function execution
    const asyncWrapper = new Function(
      "mongoose",
      "BudgetExpense",
      "userId",
      "query",
      "ObjectId",
      "res",
      "req",
      "moment"
      `
        return (async () => {
          try {
            ${cleanedCode}
          } catch (err) {
            console.error("Error inside AI-generated logic:", err);
            res.status(500).json({ error: "AI-generated logic failed." });
          }
        })();
      `
    );

    // Execute the AI-generated logic
    await asyncWrapper(
      mongoose,
      BudgetExpense,
      userId,
      query,
      ObjectId,
      res,
      req,
      moment
    );
  } catch (error) {
    console.error("Error processing AI-generated query logic:", error);
    return res.status(500).json({ error: "Failed to process your request." });
  }
};

module.exports = {
  handleUserQuery,
};
