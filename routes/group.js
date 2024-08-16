const {
  createGroup,
  getAllActiveGroups,
  getGroupById,
  updateGroup,
  deleteGroup,
  addMemberToGroup,
  removeMemberFromGroup,
} = require("../controllers/group/index");

const {authenticateToken} = require("../services/middleware")


module.exports = function groupRoutes(app) {
    app.post("/api/v1/group", authenticateToken, createGroup);
    app.get("/api/v1/group", authenticateToken, getAllActiveGroups);
    app.get("/api/v1/group/:groupId", authenticateToken, getGroupById);
    app.put("/apiv1/group/:id", authenticateToken, updateGroup)
    app.delete("/api/v1/group/:id", authenticateToken, deleteGroup);
    app.put("/api/v1/group/add-member/:groupId", authenticateToken, addMemberToGroup);
    app.put("/api/v1/group/remove-member/:groupId/:memberId", authenticateToken, removeMemberFromGroup);
}
