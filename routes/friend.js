const {
  sendFriendRequest,
  acceptFriendRequest,
  getFriends,
  getPendingRequests,
} = require("../controllers/friend/index.js");

const { authenticateToken } = require("../services/middleware.js");

module.exports = function friendRoutes(app) {
  app.post("/api/v1/friend/request", authenticateToken, sendFriendRequest);
  app.put("/api/v1/friend/accept/:id", authenticateToken, acceptFriendRequest);
  app.get("/api/v1/friend/list", authenticateToken, getFriends);
  app.get("/api/v1/friend/pending", authenticateToken, getPendingRequests);
};
