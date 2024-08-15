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

const getSettlement = async (req, res, next) => {
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

module.exports = {
  createSettlement,
  getSettlement,
  updateSettlement,
  deleteSettlement,
};
