const express = require('express');
const cookieParser = require('cookie-parser');
require("dotenv").config();
const cors = require('cors');
const PORT = process.env.PORT || 8080;


const sequelize = require('./models/index');
const Transcription = require('./models/Transcription');


const app = express();

app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true,
  }));

app.use(express.json())
app.use(cookieParser())

app.get('/', (req, res) => {
    res.send('Hello World');
});

app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
});

const router = require("./routes");
app.use(router);


sequelize.sync()
  .then(() => {
    console.log('Banco de dados sincronizado');
    const PORT = 8080;
    app.listen(PORT, () => {
      console.log(`Servidor rodando na porta ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Erro ao sincronizar o banco de dados:', error);
  });