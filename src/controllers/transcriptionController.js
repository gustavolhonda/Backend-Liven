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

    // Define o limite diário de transcrições (5 neste caso)
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

      let mp3Path = filePath;

      // Verifica o tipo do arquivo e converte para MP3 se necessário
      if (path.extname(filePath).toLowerCase() === '.mp4') {
        mp3Path = `${filePath}.mp3`;
        await TranscriptionController.convertToMp3(filePath, mp3Path);
      }

      // Verifica o tamanho do arquivo
      const stats = fs.statSync(mp3Path);
      const fileSizeInMB = stats.size / (1024 * 1024);

      let transcriptionText = '';

      if (fileSizeInMB > 25) {
        // Divide o arquivo em segmentos de 15 minutos (900 segundos)
        console.log('Dividindo arquivo em segmentos menores...');
        const segments = await TranscriptionController.splitAudio(mp3Path, 900); // 900 segundos = 15 minutos

        for (const segment of segments) {
          console.log(`Transcrevendo segmento: ${segment}`);
          const segmentTranscription = await TranscriptionController.transcribeWithOpenAI(segment);
          transcriptionText += segmentTranscription + ' ';
          // Remove o segmento após transcrição
          fs.unlinkSync(segment);
        }
      } else {
        // Transcreve o arquivo diretamente
        transcriptionText = await TranscriptionController.transcribeWithOpenAI(mp3Path);
      }

      // Atualiza o status da transcrição no banco de dados como "concluído" e salva o texto transcrito
      transcription.status = 'completed';
      transcription.transcriptionText = transcriptionText;
      await transcription.save();

      // Remove os arquivos temporários (o original e o MP3)
      fs.unlinkSync(filePath);
      if (filePath !== mp3Path) {
        fs.unlinkSync(mp3Path);
      }

      console.log('Transcrição concluída e salva no banco de dados.');

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
    try {
      // Faz a requisição para a API da OpenAI, passando o arquivo MP3 e o modelo de transcrição
      const response = await openai.audio.transcriptions.create({
        file: fs.createReadStream(filePath), // Envia o arquivo como um stream
        model: "whisper-1", // Usa o modelo de transcrição "whisper-1"
        response_format: "text", // Formato de resposta será texto
      });

      console.log(`Transcrição concluída para o arquivo: ${filePath}`);
      return response; // Retorna a resposta da API
    } catch (error) {
      console.error(`Erro na transcrição com OpenAI para o arquivo ${filePath}:`, error);
      throw error;
    }
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

  /*
   Divide o arquivo de áudio em segmentos de 10 minutos.
    @param {string} inputPath - Caminho do arquivo de entrada.
    @param {number} segmentDuration - Duração de cada segmento em segundos.
    @returns {Promise<string[]>} - Array com os caminhos dos segmentos criados.
  */
  static splitAudio(inputPath, segmentDuration = 900) { // 900 segundos = 15 minutos
    return new Promise((resolve, reject) => {
      // Usa ffprobe para obter metadados do arquivo, incluindo a duração total do áudio
      ffmpeg.ffprobe(inputPath, (err, metadata) => {
        if (err) {
          return reject(err);
        }

        const duration = metadata.format.duration; // Obtém a duração total do áudio
        const numberOfSegments = Math.ceil(duration / segmentDuration); // Calcula o número total de segmentos
        const segmentPaths = []; // Array para armazenar os caminhos dos segmentos gerados

        const splitPromises = []; // Array para armazenar as promessas de divisão de cada segmento

        // Loop para gerar cada segmento
        for (let i = 0; i < numberOfSegments; i++) {
          const startTime = i * segmentDuration; // Define o tempo de início para o segmento atual
          const outputPath = `${path.parse(inputPath).name}_part${i + 1}.mp3`; // Caminho do arquivo de saída para o segmento
          segmentPaths.push(outputPath); // Armazena o caminho do segmento no array

          // Cria uma nova promessa para dividir o segmento
          splitPromises.push(new Promise((res, rej) => {
            ffmpeg(inputPath)
              .setStartTime(startTime) // Define o tempo de início do segmento
              .setDuration(segmentDuration)  // Define a duração do segmento
              .output(outputPath) // Define o caminho do arquivo de saída
              .on('end', () => { // Quando a divisão do segmento terminar
                console.log(`Segmento ${i + 1} criado: ${outputPath}`);
                res(); // Resolve a promessa para o segmento
              })
              .on('error', (error) => {
                console.error(`Erro ao criar segmento ${i + 1}:`, error);
                rej(error); // Rejeita a promessa com o erro
              })
              .run(); // Inicia o processo de divisão usando ffmpeg
          }));
        }

        // Executa todas as promessas de divisão ao mesmo tempo e resolve a promessa principal com os caminhos dos segmentos
        Promise.all(splitPromises)
          .then(() => resolve(segmentPaths)) // Resolve a promessa com os caminhos dos arquivos segmentados
          .catch((error) => reject(error)); // Em caso de erro, rejeita a promessa principal
      });
    });
  }

  // Método para obter o limite diário restante do usuário
  static async getDailyLimit(req, res) {
    const userId = req.user.uid; // Obtém o ID do usuário a partir do token de autenticação

    // Define o limite diário
    const DAILY_LIMIT = 5;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    try {
      // Conta quantas transcrições o usuário já criou hoje
      const count = await Transcription.count({
        where: {
          userId,
          createdAt: {
            [Op.gte]: today,
          },
        },
      });

      const remaining = DAILY_LIMIT - count;

      res.status(200).json({ remainingTranscriptions: remaining >= 0 ? remaining : 0 });
    } catch (error) {
      console.error('Erro ao obter limite diário:', error);
      res.status(500).json({ error: 'Erro ao obter limite diário' });
    }
  }


}

// Exporta a classe TranscriptionController para ser usada em outros lugares da aplicação
module.exports = TranscriptionController;