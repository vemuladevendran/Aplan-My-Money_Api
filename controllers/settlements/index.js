const Settlement = require('../../models/settlement.js');

const createSettlement = async (req, res, next) => {
  try {
    const settlement = new Settlement({ ...req.body });
    await settlement.save();
    res.status(201).json(settlement);
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const getSettlementById = async (req, res, next) => {
  try {
    const settlement = await Settlement.findById(req.params.id).populate('groupId settledBy settledWith');
    if (!settlement) return res.status(404).json({ message: 'Settlement not found' });
    res.json(settlement);
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const updateSettlement = async (req, res, next) => {
  try {
    const settlement = await Settlement.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!settlement) return res.status(404).json({ message: 'Settlement not found' });
    res.json(settlement);
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const deleteSettlement = async (req, res, next) => {
  try {
    const settlement = await Settlement.findByIdAndUpdate(req.params.id, { isDeleted: true }, { new: true });
    if (!settlement) return res.status(404).json({ message: 'Settlement not found' });
    res.json(settlement);
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const getAllSettlements = async (req, res, next) => {
  try {
    const userId = req.user.id; // User ID from the token

    // Find all settlements involving the logged-in user
    const settlements = await Settlement.find({
      $or: [{ settledBy: userId }, { settledWith: userId }],
    }).populate('groupId settledBy settledWith');

    if (!settlements || settlements.length === 0) {
      return res.status(404).json({ message: "No settlements found for this user" });
    }

    res.json(settlements);
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const getAllSettlementsForGroup = async (req, res, next) => {
  try {
    const groupId = req.params.id; // Group ID from the request parameters

    // Find all settlements related to the specific group
    const settlements = await Settlement.find({ groupId: groupId }).populate('settledBy settledWith');

    if (!settlements || settlements.length === 0) {
      return res.status(404).json({ message: "No settlements found for this group" });
    }

    res.json(settlements);
  } catch (error) {
    console.log(error);
    next(error);
  }
};


module.exports = {
  createSettlement,
  getSettlementById,
  updateSettlement,
  deleteSettlement,
  getAllSettlements,
  getAllSettlementsForGroup
};
