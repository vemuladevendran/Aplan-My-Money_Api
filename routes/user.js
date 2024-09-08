const {
  getUserById,
  updateUser,
  deleteUser,
  getUserAndGroupBalances,
  loginUser,
  getUsers
} = require("../controllers/user/index");

const {authenticateToken} = require("../services/middleware")



module.exports = function userRoutes(app) {
    app.post("/api/v1/user/login", loginUser);
    app.get("/api/v1/user/search", authenticateToken, getUsers);
    app.get("/api/v1/user", authenticateToken, getUserById);
    app.put("/api/v1/user", authenticateToken, updateUser);
    app.delete("/api/v1/user", authenticateToken, deleteUser);
    app.get("/api/v1/user/balance-details", authenticateToken, getUserAndGroupBalances);
}