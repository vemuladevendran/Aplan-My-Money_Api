const Friend = require("../../models/Friend");
const User = require("../../models/user");

// Send Friend Request
const sendFriendRequest = async (req, res, next) => {
  try {
    const { user_id } = req.body; // Target user's unique string ID (e.g., "UI-574107")
    const requesterId = req.user.id;

    const recipient = await User.findOne({ user_id: user_id, isDeleted: false });
    if (!recipient) {
      return res.status(404).json({ message: "User not found" });
    }

    if (recipient._id.toString() === requesterId) {
      return res.status(400).json({ message: "Cannot send friend request to yourself" });
    }

    const existingFriendship = await Friend.findOne({
      $or: [
        { requester: requesterId, recipient: recipient._id },
        { requester: recipient._id, recipient: requesterId },
      ],
      isDeleted: false,
    });

    if (existingFriendship) {
      if (existingFriendship.status === "pending") {
        return res.status(400).json({ message: "Friend request already pending" });
      } else if (existingFriendship.status === "accepted") {
        return res.status(400).json({ message: "Already friends" });
      }
    }

    const newFriendship = new Friend({
      requester: requesterId,
      recipient: recipient._id,
      status: "pending",
    });

    await newFriendship.save();
    return res.status(201).json({ message: "Friend request sent", friendship: newFriendship });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

// Accept Friend Request
const acceptFriendRequest = async (req, res, next) => {
  try {
    const { id } = req.params; // Friendship ID
    const userId = req.user.id;

    const friendship = await Friend.findOne({ id: id, isDeleted: false });

    if (!friendship) {
      return res.status(404).json({ message: "Friend request not found" });
    }

    if (friendship.recipient.toString() !== userId) {
      return res.status(403).json({ message: "Not authorized to accept this request" });
    }

    friendship.status = "accepted";
    await friendship.save();

    return res.status(200).json({ message: "Friend request accepted", friendship });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

// Get Friends List
const getFriends = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const friendships = await Friend.find({
      $or: [{ requester: userId }, { recipient: userId }],
      status: "accepted",
      isDeleted: false,
    }).populate("requester recipient", "name email user_id googleImg");

    const friends = friendships.map((f) => {
      const isRequester = f.requester._id.toString() === userId;
      return isRequester ? f.recipient : f.requester;
    });

    return res.status(200).json(friends);
  } catch (error) {
    console.log(error);
    next(error);
  }
};

// Get Pending Requests
const getPendingRequests = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const requests = await Friend.find({
      recipient: userId,
      status: "pending",
      isDeleted: false,
    }).populate("requester", "name email user_id googleImg");

    return res.status(200).json(requests);
  } catch (error) {
    console.log(error);
    next(error);
  }
};

module.exports = {
  sendFriendRequest,
  acceptFriendRequest,
  getFriends,
  getPendingRequests,
};
