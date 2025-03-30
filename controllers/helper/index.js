const { generateToken } = require("../../services/token");

// Helper function to handle device login logic
const handleDeviceLogin = async (currentUser, deviceData) => {
  const deviceExists = currentUser.loggedInDevices.some(
    (device) => device.deviceId === deviceData.deviceId
  );

  if (!deviceExists) {
    currentUser.loggedInDevices.push(deviceData);
    await currentUser.save(); // Save the updated user document
  }
};

// Helper function to create the token data
const createTokenData = (user) => {
  return {
    id: user._id,
    userId: user.user_id,
    name: user.name,
    email: user.email,
    googleImg: user.googleImg,
    fullData: user,
  };
};

// Helper function to generate a token
const generateUserToken = async (user) => {
  const tokenData = createTokenData(user);
  return await generateToken(tokenData);
};

module.exports = {
  handleDeviceLogin,
  generateUserToken,
  createTokenData,
};
