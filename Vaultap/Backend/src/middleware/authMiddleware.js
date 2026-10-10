const jwt = require('jsonwebtoken');

// Ye function har protected route se pehle chalta hai
// Check karta hai: request ke saath valid JWT token bheja gaya hai ya nahi
function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization; // format: "Bearer <token>"

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Login zaroori hai' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId; // agle function mein ye userId available hoga
    next(); // sab theek hai, aage badho
  } catch (err) {
    return res.status(401).json({ error: 'Token invalid ya expire ho gaya, dobara login karo' });
  }
}

module.exports = { verifyToken };
