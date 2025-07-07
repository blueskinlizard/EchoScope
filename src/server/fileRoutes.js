const express = require('express')
const router = express.Router()
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { spawn } = require("child_process");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/')
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });
// Save our .wav file
router.post('/uploadSound', upload.single('file'), (req, res) => {

  // Convert our .wav file to a format readable by EchoScope
  console.log(`Converting file: ${req.file} to EchoScope/RadioML format`)
  const wavFilePath = path.resolve(req.file.path);
  const scriptPath = path.resolve(__dirname, '../data_conversion/wav_to_model.py');

  const pythonProcess = spawn('python3', [scriptPath, wavFilePath]);

  let output = '';
  let errorOutput = '';

  pythonProcess.stdout.on('data', (data) => {
    output += data.toString();
  });

  pythonProcess.stderr.on('data', (data) => {
    errorOutput += data.toString();
  });

  pythonProcess.on('close', (code) => {
    // Delete our .wav file after conversion into echoscope format
    fs.unlink(wavFilePath, (err) => {
      if (err) {
        console.error(`Error deleting .wav file: ${err.message}`);
      } else {
        console.log(`Deleted uploaded file: ${wavFilePath}`);
      }

      if (code === 0) {
        res.json({
          message: 'File processed successfully',
          file: req.file,
          output: output.trim()
        });
      } else {
        res.status(500).json({
          message: 'Error processing file',
          error: errorOutput.trim()
        });
      }
    });
  });
});

module.exports = router; 