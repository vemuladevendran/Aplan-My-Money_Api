const User = require('../../models/user.js');
const Expense = require('../../models/expense.js');
const { generateUserId } = require('../../utility/generateid.js');

const createUser = async (req, res, next) => {
  try {
    const { email, phone_number } = req.body;
    
    // Check if email or phone number already exists
    const existingUser = await User.findOne({ $or: [{ email }, { phone_number }] });
    if (existingUser) {
      return res.status(400).json({ message: 'Email or Phone Number already exists' });
    }

    const user = new User({ ...req.body, user_id: generateUserId() });
    await user.save();
    res.status(201).json(user);
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { status: 'Inactive' }, { new: true });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const getUserAndGroupBalances = async (req, res, next) => {
    try {
      const userId = req.user.id; // User ID from the token
  
      const user = await User.findById(userId).populate('groups');
      if (!user) return res.status(404).json({ message: 'User not found' });
  
      let totalAmountYouOwe = 0;
      let totalAmountYouAreOwed = 0;
      const groupBalances = [];
  
      // Iterate over all groups the user is a part of
      for (const group of user.groups) {
        let groupTotalOwe = 0;
        let groupTotalOwed = 0;
  
        const expenses = await Expense.find({ group_id: group._id, splits: { $elemMatch: { user_id: userId } } });
  
        expenses.forEach(expense => {
          const userSplit = expense.splits.find(split => split.user_id.toString() === userId.toString());
          if (expense.created_by.toString() === userId.toString()) {
            groupTotalOwed += userSplit.amount;
          } else {
            groupTotalOwe += userSplit.amount;
          }
        });
  
        const groupBalance = groupTotalOwed - groupTotalOwe;
  
        totalAmountYouOwe += groupTotalOwe;
        totalAmountYouAreOwed += groupTotalOwed;
  
        groupBalances.push({
          groupId: group._id,
          groupName: group.name,
          groupTotalOwe,
          groupTotalOwed,
          groupBalance,
        });
      }
  
      const totalBalance = totalAmountYouAreOwed - totalAmountYouOwe;
  
      res.json({
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone_number: user.phone_number,
          totalBalance,
          totalAmountYouOwe,
          totalAmountYouAreOwed,
        },
        groupBalances,
      });
    } catch (error) {
      console.log(error);
      next(error);
    }
  };


module.exports = { createUser, getUser, updateUser, deleteUser, getUserAndGroupBalances };
