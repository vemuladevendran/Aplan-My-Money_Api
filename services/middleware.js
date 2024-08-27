const { verifyToken } = require('./token');

const authenticateToken = async (req, res, next) => {
  const token = req.headers['authorization'].split('Bearer ').pop();
  console.log(req.headers, '==========');
  
  console.log(token, '---------token');
  
  if (!token) {
      return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = await verifyToken(token);
    console.log(decoded);
    
    req.user = decoded;
    next();
} catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
}
};

module.exports = {authenticateToken};
