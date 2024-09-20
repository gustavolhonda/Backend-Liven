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
  storage: storage,
  limits: {
    fileSize: 200 * 1024 * 1024, // 200MB
  },
  /*fileFilter: (req, file, cb) => {
    const filetypes = /mp3|mp4|wav|m4a/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo inválido. Apenas MP3, MP4, WAV e M4A são permitidos.'));
    }
  },*/
});

module.exports = upload;