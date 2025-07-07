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

  //Run plotting script w/ file route data
  const baseName = path.basename(wavFilePath, path.extname(wavFilePath));
  const iqNpyPath = path.join(path.dirname(wavFilePath), baseName + "_iq.npy");

  let plotOutput = '';
  let plotError = '';

  pythonProcess.stdout.on('data', (data) => {
    output += data.toString();
  });

  pythonProcess.stderr.on('data', (data) => {
    errorOutput += data.toString();
  });

  pythonProcess.on('close', (code) => {
    //Generate our graph once we know that our previous script is done processing
    const plotScriptPath = path.resolve(__dirname, 'plot_data.py');
    const graphProcess = spawn('python3', [plotScriptPath, iqNpyPath, path.dirname(wavFilePath)]);

    graphProcess.stdout.on('data', (data) => {
      plotOutput += data.toString();
    });

    graphProcess.stderr.on('data', (data) => {
      plotError += data.toString();
    });
    graphProcess.on('close', (code) => {
      if(code === 0) {
        console.log('Plot generated successfully.');
        console.log(plotOutput);
      }else {
        console.error('Plot script error:');
        console.error(plotError);
      }
    });

    // Delete our .wav file after conversion into echoscope format/graphing
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
          fileID: baseName,
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

router.post('/fetchIQGraph', async(req, res) =>{
  const graphID = req.body;
  const graphPath = path.join(__dirname, '..', 'uploads', `${graphID}_iq.png`);
  if(fs.existsSync(graphPath)) {
    res.sendFile(graphPath);
  }else {
    res.status(404).json({ error: 'Image not found' });
  }

})

module.exports = router; 