const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname),
});

const upload = multer({ storage });

router.post('/uploadSound', upload.single('file'), (req, res) => {
  const wavFilePath = path.resolve(req.file.path);
  const baseName = path.basename(wavFilePath, path.extname(wavFilePath));
  const iqNpyPath = path.join(path.dirname(wavFilePath), baseName + '_iq.npy');
  const scriptPath = path.resolve(__dirname, '../data_conversion/wav_to_model.py');

  const pythonProcess = spawn('python3', [scriptPath, wavFilePath]);

  let output = '', errorOutput = '';

  pythonProcess.stdout.on('data', (data) => {
    output += data.toString();
  });

  pythonProcess.stderr.on('data', (data) => {
    errorOutput += data.toString();
  });

  pythonProcess.on('close', (code) => {
    if (code !== 0) {
      fs.unlink(wavFilePath, () => {});
      return res.status(500).json({
        message: 'Error processing file',
        error: errorOutput.trim(),
      });
    }

    const plotScriptPath = path.resolve(__dirname, 'plot_data.py');
    const graphProcess = spawn('python3', [plotScriptPath, iqNpyPath, path.dirname(wavFilePath)]);

    let plotError = '';

    graphProcess.stderr.on('data', (data) => {
      plotError += data.toString();
    });

    graphProcess.on('close', (plotCode) => {
      fs.unlink(wavFilePath, (err) => {
        if (err) console.error(`Error deleting .wav file: ${err.message}`);
        else console.log(`Deleted uploaded file: ${wavFilePath}`);
      });

      if(plotCode !== 0) {
        console.error('Plot script error:', plotError);
        return res.status(500).json({
          message: 'Error generating plot',
          error: plotError.trim(),
        });
      }

      res.json({
        message: 'File processed successfully',
        file: req.file,
        fileID: baseName,
        output: output.trim(),
      });

    });
  });
});

router.post('/fetchIQGraph', async (req, res) => {
  const { graphID } = req.body;
  const graphPath = path.join(__dirname, 'uploads', `${graphID}_iq.png`);

  console.log(`Looking for image at: ${graphPath}`);
  
  if (fs.existsSync(graphPath)) {
    res.sendFile(path.resolve(graphPath));
  } else {
    res.status(404).json({ error: 'Image not found', path: graphPath});
  }
});

module.exports = router;
