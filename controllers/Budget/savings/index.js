const Savings = require("../../../models/Budget/Savings");

// Create Savings Goal
const createSavings = async (req, res, next) => {
  try {
    const { name, target_amount, current_amount, target_date, notes, currency } = req.body;
    const userId = req.user.id;

    const savings = new Savings({
      user_id: userId,
      name,
      target_amount,
      current_amount: current_amount || 0,
      target_date,
      notes,
      currency: currency || req.user.fullData.default_currency,
    });

    await savings.save();
    return res.status(201).json(savings);
  } catch (error) {
    console.log(error);
    next(error);
  }
};

// Get All Savings
const getSavings = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const savings = await Savings.find({ user_id: userId, isDeleted: false });
    return res.status(200).json(savings);
  } catch (error) {
    console.log(error);
    next(error);
  }
};

// Update Savings
const updateSavings = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const savings = await Savings.findOne({ id, user_id: userId, isDeleted: false });

    if (!savings) {
      return res.status(404).json({ message: "Savings goal not found" });
    }

    const updates = req.body;
    Object.keys(updates).forEach((key) => {
      savings[key] = updates[key];
    });

    await savings.save();
    return res.status(200).json(savings);
  } catch (error) {
    console.log(error);
    next(error);
  }
};

// Delete Savings
const deleteSavings = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const savings = await Savings.findOne({ id, user_id: userId });

    if (!savings) {
      return res.status(404).json({ message: "Savings goal not found" });
    }

    savings.isDeleted = true;
    await savings.save();

    return res.status(200).json({ message: "Savings goal deleted successfully" });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

// Add Amount to Savings (Helper)
const addAmountToSavings = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;
    const userId = req.user.id;

    const savings = await Savings.findOne({ id, user_id: userId, isDeleted: false });

    if (!savings) {
      return res.status(404).json({ message: "Savings goal not found" });
    }

    savings.current_amount += Number(amount);
    await savings.save();

    return res.status(200).json(savings);
  } catch (error) {
    console.log(error);
    next(error);
  }
};

module.exports = {
  createSavings,
  getSavings,
  updateSavings,
  deleteSavings,
  addAmountToSavings,
};
