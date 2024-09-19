const Transcription = require('../models/Transcription');
const { admin } = require('../config/firebase');
const ffmpeg = require('fluent-ffmpeg');
require('dotenv').config();
const { OpenAI } = require('openai');
const fs = require('fs');
const path = require('path');
const { Op } = require('sequelize');

// Inicializa a API do OpenAI para usar nas requisições de transcrição
const openai = new OpenAI();

// Define a classe TranscriptionController, que controla as funções relacionadas às transcrições
class TranscriptionController {
  static async createTranscription(req, res) {
     // Obtém o arquivo enviado pelo usuário (via multipart/form-data) e o ID do usuário autenticado
    const file = req.file;
    const userId = req.user.uid;

    // Verificar cota do usuário
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reseta o horário para 00:00:00, comparando apenas a data

    // Conta quantas transcrições o usuário já criou hoje
    const count = await Transcription.count({
      where: {
        userId,
        createdAt: {
          [Op.gte]: today, // Contagem de transcrições criadas a partir de hoje
        },
      },
    });

    // Define o limite diário de transcrições (3 neste caso)
    const DAILY_LIMIT = 5; 

    // Se o usuário ultrapassou o limite, exclui o arquivo e retorna um erro 429
    if (count >= DAILY_LIMIT) {
      // Deleta o arquivo enviado
      fs.unlinkSync(file.path);

      return res.status(429).json({ error: 'Limite diário de transcrições atingido' });
    }

    try {
      // Criar registro no banco de dados
      const transcription = await Transcription.create({
        userId, // ID do usuário autenticado
        originalFileName: file.filename, // Nome original do arquivo
      });

      // Iniciar processamento assíncrono
      TranscriptionController.processTranscription(transcription, file.path);

      // Responde imediatamente ao usuário que o arquivo foi recebido e será processado
      res.status(200).json({ message: 'Arquivo recebido e será processado', transcriptionId: transcription.id });
    } catch (error) {
      // Em caso de erro ao criar a transcrição, aparece o erro e responde com erro 500
      console.error('Erro ao criar transcrição:', error);
      res.status(500).json({ error: 'Erro ao criar transcrição' });
    }
  }

  // Método que faz o processamento da transcrição (conversão para MP3 e chamada à API da OpenAI)
  static async processTranscription(transcription, filePath) {
    try {
      // Envia para OpenAI
      const transcriptionText = await TranscriptionController.transcribeWithOpenAI(filePath);

      // Atualiza o status da transcrição no banco de dados como "concluído" e salva o texto transcrito
      transcription.status = 'completed';
      transcription.transcriptionText = transcriptionText;
      await transcription.save();

      // Remove os arquivos temporários (o original e o MP3)
      fs.unlinkSync(filePath);
      //fs.unlinkSync(mp3Path);
    } catch (error) {
      // Em caso de erro, registra a falha e atualiza o status da transcrição para "falha"
      console.error('Erro ao processar transcrição:', error);
      transcription.status = 'failed';
      await transcription.save();
    }
  }

  // Método para converter o arquivo para MP3 usando o ffmpeg
  static convertToMp3(inputPath, outputPath) {
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .toFormat('mp3') //Converte para MP3
        .on('error', (err) => {
          console.error('Erro ao converter para MP3:', err); // Registra erro na conversão
          reject(err); // Rejeita a promessa em caso de erro
        })
        .on('end', () => {
          console.log('Conversão para MP3 concluída');
          resolve(); // Resolve a promessa quando a conversão é concluída
        })
        .save(outputPath); // Salva o arquivo convertido no caminho de saída
    });
  }

  // Método para chamar a API da OpenAI para transcrever o arquivo de áudio
  static async transcribeWithOpenAI(filePath) {
    // Faz a requisição para a API da OpenAI, passando o arquivo MP3 e o modelo de transcrição
    const response = await openai.audio.transcriptions.create({
      file: fs.createReadStream(filePath), // Envia o arquivo como um stream
      model: "whisper-1", // Usa o modelo de transcrição "whisper-1"
      response_format: "text", // Formato de resposta será texto
    });
    return response; // Retorna a resposta da API
  }

  // Método para obter todas as transcrições de um usuário
  static async getTranscriptions(req, res) {
    const userId = req.user.uid; // Obtém o ID do usuário a partir do token de autenticação

    try {
      // Busca todas as transcrições do usuário, ordenadas pela data de criação (mais recente primeiro)
      const transcriptions = await Transcription.findAll({
        where: { userId },
        order: [['createdAt', 'DESC']],
      });
      res.status(200).json({ transcriptions }); // Retorna as transcrições encontradas
    } catch (error) {
      // Em caso de erro, aparece o erro e retorna uma resposta de erro 500
      console.error('Erro ao obter transcrições:', error);
      res.status(500).json({ error: 'Erro ao obter transcrições' });
    }
  }

  // Método para baixar uma transcrição concluída
  static async downloadTranscription(req, res) {
    const { id } = req.params; // Obtém o ID da transcrição dos parâmetros da URL
    const userId = req.user.uid; // Obtém o ID da transcrição dos parâmetros da URL

    try {
      // Busca a transcrição pelo ID e pelo ID do usuário
      const transcription = await Transcription.findOne({
        where: { id, userId }, 
      });

      // Se a transcrição não for encontrada, retorna um erro 404
      if (!transcription) {
        return res.status(404).json({ error: 'Transcrição não encontrada' });
      }

      // Se a transcrição ainda não estiver concluída, retorna um erro 400
      if (transcription.status !== 'completed') {
        return res.status(400).json({ error: 'Transcrição ainda não está pronta' });
      }

      // Configura os headers para permitir o download do arquivo como texto
      res.setHeader('Content-Disposition', `attachment; filename=transcription_${id}.txt`);
      res.setHeader('Content-Type', 'text/plain');
      res.send(transcription.transcriptionText); // Envia o texto da transcrição para o cliente
    } catch (error) {
      // Em caso de erro, loga o erro e retorna uma resposta de erro 500
      console.error('Erro ao baixar transcrição:', error);
      res.status(500).json({ error: 'Erro ao baixar transcrição' });
    }
  }
}

// Exporta a classe TranscriptionController para ser usada em outros lugares da aplicação
module.exports = TranscriptionController;