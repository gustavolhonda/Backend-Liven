const Transcription = require('../models/Transcription');
const { admin } = require('../config/firebase');
const ffmpeg = require('fluent-ffmpeg');
require('dotenv').config();
const { OpenAI } = require('openai');
const fs = require('fs');
const path = require('path');
const { Op } = require('sequelize');

const openai = new OpenAI();

class TranscriptionController {
  static async createTranscription(req, res) {
    const file = req.file;
    const userId = req.user.uid;

    // Verificar cota do usuário
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const count = await Transcription.count({
      where: {
        userId,
        createdAt: {
          [Op.gte]: today,
        },
      },
    });

    const DAILY_LIMIT = 10; // Limite diário de 2 transcrições

    if (count >= DAILY_LIMIT) {
      // Deletar o arquivo enviado
      fs.unlinkSync(file.path);

      return res.status(429).json({ error: 'Limite diário de transcrições atingido' });
    }

    try {
      // Criar registro no banco de dados
      const transcription = await Transcription.create({
        userId,
        originalFileName: file.filename,
      });

      // Iniciar processamento assíncrono
      TranscriptionController.processTranscription(transcription, file.path);

      res.status(200).json({ message: 'Arquivo recebido e será processado', transcriptionId: transcription.id });
    } catch (error) {
      console.error('Erro ao criar transcrição:', error);
      res.status(500).json({ error: 'Erro ao criar transcrição' });
    }
  }

  static async processTranscription(transcription, filePath) {
    try {
      const mp3Path = `${filePath}.mp3`;

      // Converter para MP3
      await TranscriptionController.convertToMp3(filePath, mp3Path);

      // Enviar para OpenAI
      const transcriptionText = await TranscriptionController.transcribeWithOpenAI(mp3Path);

      // Atualizar registro no banco de dados
      transcription.status = 'completed';
      console.log('Texto da transcrição:', transcriptionText);
      transcription.transcriptionText = transcriptionText;
      await transcription.save();

      // Remover arquivos temporários
      fs.unlinkSync(filePath);
      fs.unlinkSync(mp3Path);
    } catch (error) {
      console.error('Erro ao processar transcrição:', error);
      transcription.status = 'failed';
      await transcription.save();
    }
  }

  static convertToMp3(inputPath, outputPath) {
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .toFormat('mp3')
        .on('error', (err) => {
          console.error('Erro ao converter para MP3:', err);
          reject(err);
        })
        .on('end', () => {
          console.log('Conversão para MP3 concluída');
          resolve();
        })
        .save(outputPath);
    });
  }

  static async transcribeWithOpenAI(filePath) {
    const response = await openai.audio.transcriptions.create({
      file: fs.createReadStream(filePath),
      model: "whisper-1",
      response_format: "text",
    });
    console.log('Resposta da OpenAI:', response);
    return response;
  }

  static async getTranscriptions(req, res) {
    const userId = req.user.uid;

    try {
      const transcriptions = await Transcription.findAll({
        where: { userId },
        order: [['createdAt', 'DESC']],
      });
      res.status(200).json({ transcriptions });
    } catch (error) {
      console.error('Erro ao obter transcrições:', error);
      res.status(500).json({ error: 'Erro ao obter transcrições' });
    }
  }

  static async downloadTranscription(req, res) {
    const { id } = req.params;
    const userId = req.user.uid;

    try {
      const transcription = await Transcription.findOne({
        where: { id, userId },
      });

      if (!transcription) {
        return res.status(404).json({ error: 'Transcrição não encontrada' });
      }

      if (transcription.status !== 'completed') {
        return res.status(400).json({ error: 'Transcrição ainda não está pronta' });
      }

      res.setHeader('Content-Disposition', `attachment; filename=transcription_${id}.txt`);
      res.setHeader('Content-Type', 'text/plain');
      res.send(transcription.transcriptionText);
    } catch (error) {
      console.error('Erro ao baixar transcrição:', error);
      res.status(500).json({ error: 'Erro ao baixar transcrição' });
    }
  }
}

module.exports = TranscriptionController;