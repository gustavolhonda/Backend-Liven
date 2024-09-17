const { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  sendEmailVerification,
  sendPasswordResetEmail
 } = require('../config/firebase');

const auth = getAuth();

class FirebaseAuthController {
  
  registerUser(req, res) {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(422).json({
        email: "Email is required",
        password: "Password is required",
      });
    }
    createUserWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        sendEmailVerification(auth.currentUser)
          .then(() => {
            res.status(201).json({ message: "Verification email sent! User created successfully!" });
          })
          .catch((error) => {
            console.error(error);
            res.status(500).json({ error: "Error sending email verification" });
          });
      })
      .catch((error) => {
        const errorMessage = error.message || "An error occurred while registering user";
        res.status(500).json({ error: errorMessage });
      });
  }

  
loginUser(req, res) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(422).json({
      error: "Email e senha são obrigatórios",
    });
  }
  signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => { 
      const idToken = userCredential._tokenResponse.idToken;
      if (idToken) {
        res.cookie('access_token', idToken, {
          httpOnly: true,
          secure: false,
          maxAge: 60 * 60 * 1000,
        });
        const user = {
          uid: userCredential.user.uid,
          email: userCredential.user.email,
        };
        res.status(200).json({ message: "Login realizado com sucesso", user });
      } else {
        res.status(500).json({ error: "Erro interno do servidor" });
      }
    })
    .catch((error) => {
      console.error('Erro ao fazer login:', error);

      let errorMessage = "Erro ao fazer login";

      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        errorMessage = "Usuário ou senha não cadastrados";
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = "Muitas tentativas de login. Por favor, tente novamente mais tarde.";
      } else {
        errorMessage = error.message;
      }

      res.status(401).json({ error: errorMessage });
    });
}


  logoutUser(req, res) {
    signOut(auth)
      .then(() => {
        res.clearCookie('access_token');
        res.status(200).json({ message: "User logged out successfully" });
      })
      .catch((error) => {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
      });
  }

  resetPassword(req, res){
    const { email } = req.body;
    if (!email ) {
      return res.status(422).json({
        email: "Email is required"
      });
    }
    sendPasswordResetEmail(auth, email)
      .then(() => {
        res.status(200).json({ message: "Password reset email sent successfully!" });
      })
      .catch((error) => {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
      });
  }
   
}

module.exports = new FirebaseAuthController();
 
 

