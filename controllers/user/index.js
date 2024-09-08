const User = require("../../models/user.js");
const Expense = require("../../models/expense.js");
const { generateUserId } = require("../../utility/generateid.js");
const { OAuth2Client } = require("google-auth-library");
const { generateToken } = require("../../services/token.js");

const createUser = async (req, res, next) => {
  try {
    const user = new User({ ...req.body, user_id: generateUserId() });
    await user.save();
    const email = req.body.email;
    const currentUser = await User.findOne({ email });

    if (currentUser) {
      const deviceData = req.body.loggedInDevices[0];
      const deviceExists = currentUser.loggedInDevices.some(
        (device) => device.deviceId === deviceData.deviceId
      );

      if (!deviceExists) {
        currentUser.loggedInDevices.push(deviceData);
        await currentUser.save(); // Save the updated user document
      }
    }

    const tokenData = {
      id: currentUser._id,
      userId: currentUser.user_id,
      name: currentUser.name,
      email: currentUser.email,
      googleImg: currentUser.googleImg,
      fullData: currentUser,
    };

    const token = await generateToken(tokenData);
    return res.status(200).json({ token: token });
  } catch (error) {
    console.log(error);
  }
};

const loginUser = async (req, res, next) => {
  try {
    const { email, idToken } = req.body;

    // Validate that email and idToken are provided
    if (!email || !idToken) {
      return res
        .status(400)
        .json({ message: "Email and ID Token are required." });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (!existingUser) {
      await createUser(req, res, next); // Ensure createUser function is defined and handles user creation
    }

    // Initialize the OAuth2Client with the correct client ID
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

    // Verify the ID token
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID, // Specify the client ID of your app
    });

    const currentUser = await User.findOne({ email });

    if (currentUser) {
      const deviceData = req.body.loggedInDevices[0];
      const deviceExists = currentUser.loggedInDevices.some(
        (device) => device.deviceId === deviceData.deviceId
      );

      if (!deviceExists) {
        currentUser.loggedInDevices.push(deviceData);
        await currentUser.save(); // Save the updated user document
      }
    }

    const tokenData = {
      id: currentUser._id,
      userId: currentUser.user_id,
      name: currentUser.name,
      email: currentUser.email,
      googleImg: currentUser.googleImg,
      fullData: currentUser,
    };

    const token = await generateToken(tokenData);
    return res.status(200).json({ token: token });
  } catch (error) {
    console.error(error);
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
  loginUser,
};
