// Importação de funções do Firebase Authentication para gerenciar a autenticação de usuários.
const { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  sendEmailVerification,
  sendPasswordResetEmail
 } = require('../config/firebase');

// Inicializa o serviço de autenticação do Firebase.
const auth = getAuth();

// Definição da classe FirebaseAuthController que gerencia as operações de autenticação.
class FirebaseAuthController {
  
  // Função para registrar um novo usuário
  registerUser(req, res) {
    const { email, password } = req.body; // Obtém o email e a senha do corpo da requisição

    // Verifica se o email ou a senha não foram fornecidos
    if (!email || !password) {
      return res.status(422).json({
        email: "Email is required", // Retorna erro se o email estiver faltando
        password: "Password is required", // Retorna erro se a senha estiver faltando
      });
    }

    // Cria um novo usuário com o email e senha fornecidos
    createUserWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        // Após criar o usuário, envia um email de verificação
        sendEmailVerification(auth.currentUser)
          .then(() => {
            // Responde com sucesso se o email de verificação foi enviado
            res.status(201).json({ message: "Email de verificação enviado! Usuário criado com sucesso." });
          })
          .catch((error) => {
            // Se houver um erro ao enviar o email de verificação, loga o erro e retorna um status 500
            console.error(error);
            res.status(500).json({ error: "Erro ao enviar o email de verificação" });
          });
      })
      .catch((error) => {
        // Se houver erro ao criar o usuário, captura a mensagem de erro e retorna status 500
        const errorMessage = error.message || "Um erro ocorreu ao criar o usuário";
        res.status(500).json({ error: errorMessage });
      });
  }

  // Função para realizar o login do usuário
  loginUser(req, res) {
    const { email, password } = req.body; // Obtém o email e senha do corpo da requisição

    // Verifica se o email ou a senha não foram fornecidos
    if (!email || !password) {
      return res.status(422).json({
        error: "Email e senha são obrigatórios", // Retorna erro se email ou senha estiverem ausentes
      });
    }

    // Tenta realizar o login com o email e senha fornecidos
    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => { 
        const idToken = userCredential._tokenResponse.idToken; // Obtém o token de autenticação do Firebase

        // Se o token de autenticação for válido
        if (idToken) {
          // Armazena o token no cookie de forma segura, com tempo de expiração de 1 hora
          res.cookie('access_token', idToken, {
            httpOnly: true, // O cookie não pode ser acessado via JavaScript no cliente
            secure: false,  // O cookie não é seguro (HTTPS), pode ser mudado para true em produção
            maxAge: 60 * 60 * 1000, // O cookie expira em 1 hora
          });

          // Cria um objeto contendo informações básicas do usuário
          const user = {
            uid: userCredential.user.uid,
            email: userCredential.user.email,
          };

          // Retorna uma resposta de sucesso com as informações do usuário
          res.status(200).json({ message: "Login realizado com sucesso", user });
        } else {
          // Se não houver token, retorna erro interno do servidor
          res.status(500).json({ error: "Erro interno do servidor" });
        }
      })
      .catch((error) => {
        // Se houver erro durante o login, loga o erro no console
        console.error('Erro ao fazer login:', error);

        // Define uma mensagem de erro padrão
        let errorMessage = "Erro ao fazer login";

        // Verifica o tipo do erro para fornecer uma mensagem mais específica
        if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
          errorMessage = "Usuário ou senha incorretos"; // Erro de usuário ou senha incorreta
        } else if (error.code === 'auth/too-many-requests') {
          errorMessage = "Muitas tentativas de login. Por favor, tente novamente mais tarde."; // Erro de muitas tentativas
        } else {
          errorMessage = error.message; // Outras mensagens de erro
        }

        // Retorna uma resposta de erro com status 401 (não autorizado)
        res.status(401).json({ error: errorMessage });
      });
  }

  // Função para realizar o logout do usuário
  logoutUser(req, res) {
    signOut(auth) // Realiza o logout do usuário
      .then(() => {
        res.clearCookie('access_token'); // Remove o cookie de autenticação
        res.status(200).json({ message: "User logged out successfully" }); // Retorna sucesso
      })
      .catch((error) => {
        // Se houver erro ao deslogar, loga o erro no console e retorna status 500
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
      });
  }

  // Função para enviar um email de redefinição de senha
  resetPassword(req, res) {
    const { email } = req.body; // Obtém o email do corpo da requisição

    // Verifica se o email foi fornecido
    if (!email) {
      return res.status(422).json({
        email: "Email is required" // Retorna erro se o email estiver ausente
      });
    }

    // Envia o email de redefinição de senha
    sendPasswordResetEmail(auth, email)
      .then(() => {
        res.status(200).json({ message: "Password reset email sent successfully!" }); // Retorna sucesso se o email foi enviado
      })
      .catch((error) => {
        // Se houver erro ao enviar o email, loga o erro no console e retorna status 500
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
      });
  }
}

// Exporta a instância do FirebaseAuthController
module.exports = new FirebaseAuthController();
