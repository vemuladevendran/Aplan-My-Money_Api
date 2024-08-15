
const Expense = require('../models/expense.js');
const User = require('../models/user.js');

const calculateGroupFinancials = async (userId, groupId) => {
  let totalAmountYouOwe = 0;
  let totalAmountYouAreOwed = 0;

  const memberDetails = {};

  const expenses = await Expense.find({ group_id: groupId, splits: { $elemMatch: { user_id: userId } } });

  for (const expense of expenses) {
    for (const split of expense.splits) {
      const splitUserId = split.user_id.toString();

      // Initialize member details if not already
      if (!memberDetails[splitUserId]) {
        const member = await User.findById(splitUserId);
        memberDetails[splitUserId] = {
          name: member.name,
          amountOwedToYou: 0,
          amountYouOwe: 0,
        };
      }

      if (expense.created_by.toString() === userId.toString()) {
        // You created this expense, others owe you
        totalAmountYouAreOwed += split.amount;
        memberDetails[splitUserId].amountOwedToYou += split.amount;
      } else if (split.user_id.toString() === userId.toString()) {
        // You owe to someone else
        totalAmountYouOwe += split.amount;
        const creatorId = expense.created_by.toString();

        if (!memberDetails[creatorId]) {
          const member = await User.findById(creatorId);
          memberDetails[creatorId] = {
            name: member.name,
            amountOwedToYou: 0,
            amountYouOwe: 0,
          };
        }

        memberDetails[creatorId].amountYouOwe += split.amount;
      }
    }
  }

  const totalBalance = totalAmountYouAreOwed - totalAmountYouOwe;

  // Filter out members with zero balances
  const filteredMemberDetails = Object.entries(memberDetails)
    .filter(([, details]) => details.amountOwedToYou !== 0 || details.amountYouOwe !== 0)
    .reduce((acc, [key, value]) => {
      acc[key] = value;
      return acc;
    }, {});

  return {
    totalBalance,
    totalAmountYouOwe,
    totalAmountYouAreOwed,
    memberDetails: filteredMemberDetails,
  };
};

module.exports = { calculateGroupFinancials };
