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
  const spectrogramPath = path.join(path.dirname(wavFilePath), baseName + '_iq_spectrogram.npy');

  const wavToIqScript = path.resolve(__dirname, './python_processes/wav_to_model.py');
  const iqToSpecScript = path.resolve(__dirname, './python_processes/iq_to_spect.py');
  const inferenceScript = path.resolve(__dirname, './python_processes/run_model.py');
  const plotScript = path.resolve(__dirname, './python_processes/plot_data.py');
  const modelPath = path.resolve(__dirname, './python_processes/fusion_model_full.pth');

  const pythonProcess = spawn('python3', [wavToIqScript, wavFilePath]);

  let output = '', errorOutput = '';

  pythonProcess.stdout.on('data', (data) => {
    output += data.toString();
  });

  pythonProcess.stderr.on('data', (data) => {
    errorOutput += data.toString();
  });

  pythonProcess.on('close', (code) => {
    if(code !== 0) {
      fs.unlink(wavFilePath, () => {});
      return res.status(500).json({
        message: 'Error processing IQ data',
        error: errorOutput.trim(),
      });
    }
    const genSpec = spawn('python3', [iqToSpecScript, iqNpyPath]);

    let genSpecError = '';
    genSpec.stderr.on('data', (data) => { genSpecError += data.toString(); });

    genSpec.on('close', (specCode) => {
      if(specCode !== 0) {
        fs.unlink(wavFilePath, () => {});
        return res.status(500).json({
          message: 'Error generating spectrogram',
          error: genSpecError.trim(),
        });
      }

      const inferProcess = spawn('python3', [inferenceScript, iqNpyPath, spectrogramPath, modelPath]);

      let inferOut = '', inferErr = '';
      inferProcess.stdout.on('data', (data) => { inferOut += data.toString(); });
      inferProcess.stderr.on('data', (data) => { inferErr += data.toString(); });

      inferProcess.on('close', (inferCode) => {
        if(inferCode !== 0) {
          return res.status(500).json({
            message: 'Error during model inference',
            error: inferErr.trim(),
          });
        }
        const graphProcess = spawn('python3', [plotScript, iqNpyPath, path.dirname(wavFilePath)]);

        let plotError = '';
        graphProcess.stderr.on('data', (data) => { plotError += data.toString(); });

        graphProcess.on('close', (plotCode) => {
          fs.unlink(wavFilePath, () => {});

          if(plotCode !== 0) {
            return res.status(500).json({
              message: 'Error generating IQ plot',
              error: plotError.trim(),
            });
          }

          res.json({
            message: 'File processed and analyzed successfully',
            file: req.file,
            fileID: baseName,
            prediction: JSON.parse(inferOut.trim()),
          });
        });
      });
    });
  });
});


router.post('/fetchIQGraph', async (req, res) => {
  const { graphID } = req.body;
  const graphPath = path.join(__dirname, 'uploads', `${graphID}_iq.png`);

  console.log(`Looking for image at: ${graphPath}`);
  
  if(fs.existsSync(graphPath)) {
    res.sendFile(path.resolve(graphPath));
  } else {
    res.status(404).json({ error: 'Image not found', path: graphPath});
  }
});

module.exports = router;
