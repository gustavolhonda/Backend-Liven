# Sistema de Transcrição de Áudio - Backend

## 📌 Descrição

O **Sistema de Transcrição de Áudio - Backend** é uma aplicação desenvolvida em **Node.js** que permite aos usuários fazer upload de arquivos de áudio ou vídeo, processá-los e obter transcrições utilizando a API da **OpenAI**. O sistema gerencia a autenticação dos usuários via **Firebase** e armazena informações das transcrições em um banco de dados **PostgreSQL** utilizando **Sequelize**.

## 🚀 Funcionalidades

- **Upload de Arquivos:** Permite que os usuários façam upload de arquivos de áudio/vídeo com mais de 25MB.
- **Processamento de Arquivos:** Converte arquivos para o formato MP3 e divide arquivos grandes em segmentos menores para transcrição.
- **Transcrição:** Utiliza a API da OpenAI para transcrever o áudio.
- **Gerenciamento de Transcrições:** Permite aos usuários visualizar, gerenciar e baixar suas transcrições.
- **Autenticação:** Gerencia a autenticação dos usuários utilizando Firebase.

## 🛠 Tecnologias Utilizadas

- **Node.js**
- **Express.js**
- **Sequelize ORM**
- **PostgreSQL**
- **Firebase Admin SDK**
- **Fluent-ffmpeg**
- **OpenAI API**
- **Multer** (para gerenciamento de uploads)
- **Dotenv** (para variáveis de ambiente)

## 📂 Estrutura de Pastas

