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


app.use(express.json({ limit: '200mb' })); // Aumenta o limite para JSON
app.use(express.urlencoded({ extended: true, limit: '200mb' })); // Aumenta o limite para URL-encoded
app.use(cookieParser())

app.get('/', (req, res) => {
    res.send('Hello World');
});


const router = require("./routes");
app.use(router);


sequelize.sync()
  .then(() => {
    console.log('Banco de dados sincronizado');
    app.listen(PORT, () => {
      console.log(`Servidor rodando na porta ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Erro ao sincronizar o banco de dados:', error);
  });