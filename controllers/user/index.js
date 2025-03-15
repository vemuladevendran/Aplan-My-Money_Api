const User = require("../../models/user.js");
const Expense = require("../../models/expense.js");
const { generateUserId } = require("../../utility/generateid.js");
const { OAuth2Client } = require("google-auth-library");
const { hash, verify } = require("../../services/password.js");
const { handleDeviceLogin, generateUserToken } = require("../helper/index.js");



// Method to create a new user (common for both Google and app login)
const createUser = async (userData, passwordRequired = false) => {
  if (passwordRequired) {
    userData.password = await hash(userData.password);  // Hash the password if required
  }

  const user = new User({ ...userData, user_id: generateUserId() });
  await user.save();
  return user;
};

// Google login handler
const googleLoginUser = async (req, res, next) => {
  try {
    const { email, idToken } = req.body;

    if (!email || !idToken) {
      return res.status(400).json({ message: "Email and ID Token are required." });
    }

    const existingUser = await User.findOne({ email });

    // If user doesn't exist, create them using Google login data
    let currentUser;
    if (!existingUser) {
      currentUser = await createUser(req.body, false);  // No password needed for Google login
    } else {
      currentUser = existingUser;
    }

    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,  // Ensure the client ID matches
    });

    // Handle device login logic
    await handleDeviceLogin(currentUser, req.body.loggedInDevices[0]);

    // Generate and send the token
    const token = await generateUserToken(currentUser);
    return res.status(200).json({ token });

  } catch (error) {
    console.error(error);
    next(error);
  }
};

// Create a user using the app's email and password
const createUserApp = async (req, res, next) => {
  try {
    const filters = {
      $or: [
        {
          phone_number: req.body.phone_number,
        },
        {
          email: req.body.email,
        },
      ],
    };

    const doc = await User.findOne(filters);
    if (doc) {
      return res.status(400).json({message: " Email Is Already OR Mobile Number Exist"});
    }

    const currentUser = await createUser(req.body, true);  // Password is required for app login

    // Handle device login logic
    await handleDeviceLogin(currentUser, req.body.loggedInDevices[0]);

    // Generate and send the token
    const token = await generateUserToken(currentUser);
    return res.status(200).json({ token });

  } catch (error) {
    console.log(error);
    next(error);
  }
};

// App login handler
const login = async (req, res, next) => {
  try {
    const doc = await User.findOne({ isDeleted: false, email: req.body.email });
    if (!doc) return res.status(400).json({ message: 'Email is not found' });

    const isPasswordMatch = await verify(req.body.password, doc.password);
    if (!isPasswordMatch) return res.status(400).json({ message: 'Invalid password' });

    // Handle device login logic
    await handleDeviceLogin(doc, req.body.loggedInDevices[0]);

    // Generate and send the token
    const token = await generateUserToken(doc);
    return res.status(200).json({ token });

  } catch (error) {
    console.log(error);
    next(error);
  }
};

const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const getUsers = async (req, res, next) => {
  try {
    const filters = {
      isDeleted: false,
    };

    // If no userId is provided, return an empty array
    if (!req.query.userId) return res.json([]);

    if (req.query.userId) {
      filters.user_id = new RegExp(req.query.userId, "i");
    }

    // Select only the fields needed
    const users = await User.find(filters).select(
      "name email _id user_id googleImg"
    );

    return res.json(users);
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status: "Inactive" },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const getUserAndGroupBalances = async (req, res, next) => {
  try {
    const userId = req.user.id; // User ID from the token

    const user = await User.findById(userId).populate("groups");
    if (!user) return res.status(404).json({ message: "User not found" });

    let totalAmountYouOwe = 0;
    let totalAmountYouAreOwed = 0;
    const groupBalances = [];

    // Iterate over all groups the user is a part of
    for (const group of user.groups) {
      let groupTotalOwe = 0;
      let groupTotalOwed = 0;

      const expenses = await Expense.find({
        group_id: group._id,
        splits: { $elemMatch: { user_id: userId } },
      });

      expenses.forEach((expense) => {
        const userSplit = expense.splits.find(
          (split) => split.user_id.toString() === userId.toString()
        );
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


module.exports = {
  getUserById,
  getUsers,
  updateUser,
  deleteUser,
  getUserAndGroupBalances,
  googleLoginUser,
  createUserApp,
  login,
};
