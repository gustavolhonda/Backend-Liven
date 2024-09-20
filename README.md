📄 README para o Backend
📌 Título do Projeto
Sistema de Transcrição de Áudio

📝 Descrição
O Sistema de Transcrição de Áudio é uma aplicação backend desenvolvida em Node.js que permite aos usuários fazer upload de arquivos de áudio ou vídeo, processá-los e obter transcrições utilizando a API da OpenAI. O sistema também gerencia a autenticação dos usuários via Firebase e armazena informações das transcrições em um banco de dados PostgreSQL utilizando Sequelize.

🚀 Funcionalidades
Upload de Arquivos: Permite que os usuários façam upload de arquivos de áudio/vídeo com mais de 25MB.
Processamento de Arquivos: Converte arquivos para o formato MP3 e divide arquivos grandes em segmentos menores para transcrição.
Transcrição: Utiliza a API da OpenAI para transcrever o áudio.
Gerenciamento de Transcrições: Permite aos usuários visualizar, gerenciar e baixar suas transcrições.
Autenticação: Gerencia a autenticação dos usuários utilizando Firebase.

🛠 Tecnologias Utilizadas
Node.js
Express.js
Sequelize ORM
PostgreSQL
Firebase Admin SDK
Fluent-ffmpeg
OpenAI API
Multer (para gerenciamento de uploads)
Dotenv (para variáveis de ambiente)

🔧 Instalação
Clone o Repositório:

git clone https://github.com/seu-usuario/seu-repositorio-backend.git
cd seu-repositorio-backend
Instale as Dependências:


npm install
Configure as Variáveis de Ambiente:

Crie um arquivo .env na raiz do projeto e adicione as seguintes variáveis:

env
Copiar código
PORT=8081
DATABASE_URL=postgres://usuario:senha@localhost:5432/seu_banco
OPENAI_API_KEY=sk-SEU-API-KEY-AQUI
FIREBASE_PROJECT_ID=seu-projeto-id
FIREBASE_CLIENT_EMAIL=seu-email@seu-projeto.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nSEU-PRIVATE-KEY-AQUI\n-----END PRIVATE KEY-----\n"

🏃‍♂️ Executando a Aplicação
Inicie o Servidor:

npm start


📄 Documentação da API
A seguir estão os principais endpoints disponíveis na API:

POST /api/transcriptions

Descrição: Cria uma nova transcrição.
Headers: Authorization: Bearer <token>
Body: multipart/form-data com o campo file.
Resposta:
200 OK com transcriptionId.
429 Too Many Requests se o limite diário for atingido.
500 Internal Server Error em caso de erro no servidor.
GET /api/transcriptions

Descrição: Obtém todas as transcrições do usuário autenticado.
Headers: Authorization: Bearer <token>
Resposta:
200 OK com a lista de transcrições.
500 Internal Server Error em caso de erro no servidor.
GET /api/transcriptions/:id/download

Descrição: Baixa uma transcrição específica.
Headers: Authorization: Bearer <token>
Parâmetros: id da transcrição.
Resposta:
200 OK com o arquivo de transcrição.
400 Bad Request se a transcrição não estiver pronta.
404 Not Found se a transcrição não for encontrada.
500 Internal Server Error em caso de erro no servidor.

🛡 Segurança
Autenticação: Utiliza tokens JWT gerados via Firebase para autenticar usuários.
Validação de Arquivos: Restringe os tipos e tamanhos de arquivos permitidos.
Variáveis de Ambiente: Todas as chaves sensíveis são armazenadas em variáveis de ambiente.

Se você implementou testes, inclua instruções sobre como executá-los.

🤝 Contribuição
Contribuições são bem-vindas! Sinta-se à vontade para abrir issues ou pull requests.
