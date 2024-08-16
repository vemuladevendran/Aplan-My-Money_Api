const {
  createUser,
  getUserById,
  updateUser,
  deleteUser,
  getUserAndGroupBalances,
} = require("../controllers/user/index");

const {authenticateToken} = require("../services/middleware")



module.exports = function userRoutes(app) {
    app.post("api/v1/user", createUser);
    app.get("api/v1/user", authenticateToken, getUserById);
    app.put("api/v1/user", authenticateToken, updateUser);
    app.delete("api/v1/user", authenticateToken, deleteUser);
    app.get("api/v1/user/balance-details", authenticateToken, getUserAndGroupBalances);
}