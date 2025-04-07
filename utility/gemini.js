const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

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

const getCategoriesFromGemini = async (query) => {
  const prompt = `
You are a category extractor for an expense tracking app.

From this user query: "${query}", extract all relevant expense categories from this list:
${JSON.stringify(predefinedCategories)}

Return a valid JSON array of matching categories (like ["snacks", "film"]). If nothing matches, return empty [].
  `.trim();

  try {
    const result = await model.generateContent(prompt);
    const text = await result.response.text();

    // Clean + try to parse
    const cleaned = text.trim().replace(/```(json)?/g, "");
    const categories = JSON.parse(cleaned);
    return Array.isArray(categories) ? categories : ["others"];
  } catch (err) {
    console.error("Gemini error:", err.message);
    return ["others"];
  }
};

module.exports = { getCategoriesFromGemini };
