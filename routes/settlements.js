const {
  createSettlement,
  getSettlementById,
  updateSettlement,
  deleteSettlement,
  getAllSettlements,
  getAllSettlementsForGroup,
} = require("../controllers/settlements/index");

const {authenticateToken} = require("../services/middleware")

module.exports = function seettlementRoutes(app) {
    app.post("/api/v1/settlement", authenticateToken, createSettlement);
    app.get("/api/v1/settlement/", authenticateToken, getAllSettlements);
    app.get("/api/v1/settlement/:id", authenticateToken, getSettlementById);
    app.put("/api/v1/settlement/:id", authenticateToken, updateSettlement);
    app.delete("/api/v1/settlement/:id", authenticateToken, deleteSettlement);
    app.get("/api/v1/settlement/group/:id", authenticateToken, getAllSettlementsForGroup);
}