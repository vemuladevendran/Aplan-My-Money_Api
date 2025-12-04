const moment = require('moment');

// Mock Data for Simulation
const MOCK_TRANSACTIONS = [
  {
    amount: 12.50,
    date: moment().format('YYYY-MM-DD'),
    name: "Starbucks",
    category: ["Food and Drink", "Coffee Shop"],
    payment_channel: "in store"
  },
  {
    amount: 45.00,
    date: moment().subtract(1, 'days').format('YYYY-MM-DD'),
    name: "Uber",
    category: ["Travel", "Taxi"],
    payment_channel: "online"
  },
  {
    amount: 120.00,
    date: moment().subtract(2, 'days').format('YYYY-MM-DD'),
    name: "Target",
    category: ["Shops", "Supermarket"],
    payment_channel: "in store"
  }
];

const createLinkToken = async (userId) => {
  // In a real implementation, you would call Plaid API here
  return { link_token: "mock-link-token-" + userId };
};

const exchangePublicToken = async (publicToken) => {
  // Simulate exchanging token
  return {
    access_token: "mock-access-token-" + publicToken,
    item_id: "mock-item-id-" + publicToken
  };
};

const getTransactions = async (accessToken, startDate, endDate) => {
  // Simulate fetching transactions
  // In real implementation, use Plaid client
  console.log(`Fetching transactions for token ${accessToken} from ${startDate} to ${endDate}`);
  
  // Return mock transactions
  return {
    transactions: MOCK_TRANSACTIONS,
    total_transactions: MOCK_TRANSACTIONS.length
  };
};

module.exports = {
  createLinkToken,
  exchangePublicToken,
  getTransactions
};
