const generateUserId = () => {
    return `UI-${Math.floor(100000 + Math.random() * 900000)}`;
  };
  
  const generateGroupId = () => {
    return `GP-${Math.floor(100000 + Math.random() * 900000)}`;
  };
  


  module.exports = {
    generateUserId,
    generateGroupId
  }