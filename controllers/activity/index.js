const ActivityLog = require('../../models/activitylog');

const logActivity = async (userId, action, details = null) => {
    try {
        const activityLog = new ActivityLog({ userId, action, details });
        await activityLog.save();
    } catch (error) {
        console.error("Error logging activity:", error);
    }
};

const getActivityLogs = async (userId, page = 1, limit = 10) => {
    try {
        const skip = (page - 1) * limit;
        const logs = await ActivityLog.find({ userId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        return logs;
    } catch (error) {
        console.error("Error fetching activity logs:", error);
        return [];
    }
};

module.exports = { logActivity, getActivityLogs };
