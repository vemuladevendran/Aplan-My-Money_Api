const mongoose = require("mongoose");

const Group = require("../../models/group.js");
const { generateGroupId } = require("../../utility/generateid.js");
const {
  calculateGroupFinancials,
} = require("../../utility/financialCalculations.js");

const createGroup = async (req, res, next) => {
  try {
    const userId = req.user.userId; // Get the current logged-in user ID from the token
    const id = req.user.id; // Get the current logged-in user ID from the token
    const userName = req.user.name;
    const userEmail = req.user.email;


    // Create the initial member object for the group creator
    const creatorMember = {
      id: id,
      user_id: userId,
      name: userName,
      email: userEmail,
      status: "active", 
      is_exist: true,
      balance: 0, // Initial balance set to 0
    };

    const group = new Group({
      ...req.body,
      group_id: generateGroupId(),
      created_by: id,
      members: [creatorMember], // Add the creator as the first member
    });

    await group.save();
    return res.status(201).json(group);
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const getAllActiveGroups = async (req, res, next) => {
  try {
    const userId = req.user.id; // User ID from the token

    // Find all active groups the user is part of
    const groups = await Group.find({
      members: { $elemMatch: { id: userId, is_exist: true } },
      isDeleted: false,
    }).populate("members.id");

    const groupData = await Promise.all(
      groups.map(async (group) => {
        const { totalBalance, totalAmountYouOwe, totalAmountYouAreOwed } =
          await calculateGroupFinancials(userId, group._id);

        return {
          groupId: group._id,
          groupName: group.name,
          groupImage: group.group_default_image,
          groupType: group.group_type,
          totalBalance,
          totalAmountYouOwe,
          totalAmountYouAreOwed,
          members: group.members.map((member) => ({
            memberId: member.id._id,
            name: member.id.name,
            email: member.id.email,
          })),
        };
      })
    );

    res.json(groupData);
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const getGroupById = async (req, res, next) => {
  try {
    const userId = req.user.id; // User ID from the token
    const groupId = req.params.groupId;

    // Populate user details in the members array
    const group = await Group.findById(groupId).populate("members.user_id");
    if (!group) return res.status(404).json({ message: "Group not found" });

    // Check if the population was successful and log group members
    console.log(group.members, "Populated Members");

    const {
      totalBalance,
      totalAmountYouOwe,
      totalAmountYouAreOwed,
      memberDetails,
    } = await calculateGroupFinancials(userId, group._id);

    const groupData = {
      groupId: group._id,
      groupName: group.name,
      groupImage: group.group_default_image,
      groupType: group.group_type,
      totalBalance,
      totalAmountYouOwe,
      totalAmountYouAreOwed,
      members: group.members.map((member) => ({
        memberId: member.user_id ? member.user_id._id : member._id,
        name: member.user_id ? member.user_id.name : member.name,
        email: member.user_id ? member.user_id.email : member.email,
        amountOwedToYou: memberDetails[member.user_id._id]?.amountOwedToYou || 0,
        amountYouOwe: memberDetails[member.user_id._id]?.amountYouOwe || 0,
      })),
      groupDetails: {
        createdBy: group.created_by,
        groupReminders: group.group_reminders,
        coverPhoto: group.cover_photo,
      },
    };

    res.json(groupData);
  } catch (error) {
    console.log(error);
    next(error);
  }
};



const updateGroup = async (req, res, next) => {
  try {
    const group = await Group.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!group) return res.status(404).json({ message: "Group not found" });
    res.json(group);
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const deleteGroup = async (req, res, next) => {
  try {
    const group = await Group.findByIdAndUpdate(
      req.params.id,
      { isDeleted: true },
      { new: true }
    );
    if (!group) return res.status(404).json({ message: "Group not found" });
    res.json(group);
  } catch (error) {
    console.log(error);
    next(error);
  }
};


const addMemberToGroup = async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });

    const membersToAdd = req.body; // Expecting an array of members in the request body

    if (!Array.isArray(membersToAdd) || membersToAdd.length === 0) {
      return res
        .status(400)
        .json({ message: "Members should be a non-empty array" });
    }

    for (const member of membersToAdd) {
      // Ensure 'id' is a valid ObjectId

      if (!member._id || !mongoose.Types.ObjectId.isValid(member._id)) {
        return res
          .status(400)
          .json({ message: `Invalid member id: ${member._id}` });
      }

      // Check if the member with the given 'id' already exists in the group
      const existingMember = group.members.find(
        (m) => m.id.toString() === member._id.toString()
      );

      if (!existingMember) {
        group.members.push({
          id: new mongoose.Types.ObjectId(member._id), // Ensure id is stored as ObjectId
          user_id: member.user_id, 
          name: member.name,
          email: member.email,
          status: member.status || "active",
          is_exist: member.is_exist !== undefined ? member.is_exist : true,
          balance: member.balance || 0,
        });
      }
    }

    await group.save();
    res.json(group);
  } catch (error) {
    console.log(error);
    next(error);
  }
};




const removeMemberFromGroup = async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });

    const member = group.members.id(req.params.memberId);
    if (!member) return res.status(404).json({ message: "Member not found" });

    member.is_exist = false;
    await group.save();
    res.json(group);
  } catch (error) {
    console.log(error);
    next(error);
  }
};

module.exports = {
  createGroup,
  getAllActiveGroups,
  getGroupById,
  updateGroup,
  deleteGroup,
  addMemberToGroup,
  removeMemberFromGroup,
};
