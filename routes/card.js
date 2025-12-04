const {
  addCard,
  getCards,
  deleteCard,
} = require("../controllers/card/index.js");

const { authenticateToken } = require("../services/middleware.js");

module.exports = function cardRoutes(app) {
  app.post("/api/v1/card", authenticateToken, addCard);
  app.get("/api/v1/card", authenticateToken, getCards);
  app.delete("/api/v1/card/:id", authenticateToken, deleteCard);
};
