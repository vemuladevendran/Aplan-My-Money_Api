const Card = require("../../models/Card");

// Add Card
const addCard = async (req, res, next) => {
  try {
    const { card_name, card_type, last_four_digits, bank_name, balance } = req.body;
    const userId = req.user.id;

    const card = new Card({
      user_id: userId,
      card_name,
      card_type,
      last_four_digits,
      bank_name,
      balance,
    });

    await card.save();
    return res.status(201).json(card);
  } catch (error) {
    console.log(error);
    next(error);
  }
};

// Get Cards
const getCards = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const cards = await Card.find({ user_id: userId, isDeleted: false });
    return res.status(200).json(cards);
  } catch (error) {
    console.log(error);
    next(error);
  }
};

// Delete Card
const deleteCard = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const card = await Card.findOne({ id, user_id: userId });

    if (!card) {
      return res.status(404).json({ message: "Card not found" });
    }

    card.isDeleted = true;
    await card.save();

    return res.status(200).json({ message: "Card deleted successfully" });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

module.exports = {
  addCard,
  getCards,
  deleteCard,
};
