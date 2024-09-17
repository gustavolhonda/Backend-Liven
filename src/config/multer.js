const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: '../uploads', // Pasta onde os arquivos serão armazenados
  filename: (req, file, cb) => {
    // Define o nome do arquivo
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // Limite de 25MB
  fileFilter: (req, file, cb) => {
    // Filtra o tipo de arquivo (ex: MP4)
    if (file.mimetype === 'video/mp4') {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos MP4 são permitidos'));
    }
  },
});

module.exports = upload;