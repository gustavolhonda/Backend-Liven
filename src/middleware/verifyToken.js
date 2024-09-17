
const { admin } = require('../config/firebase');

const verifyToken = async (req, res, next) => {
  const idToken = req.cookies.access_token;
  if (!idToken) {
    return res.status(401).json({ error: 'Não autorizado' });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      // Outros campos se necessário
    };
    next();
  } catch (error) {
    console.error('Erro ao verificar o token:', error);
    return res.status(401).json({ error: 'Não autorizado' });
  }
};

module.exports = verifyToken;
