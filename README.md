# EchoScope

**Smart Radio Signal Classification using Deep Learning**

## EchoScope is a high-performance deep learning system for classifying raw IQ radio signals and spectrograms. 

#### EchoScope uses a dual-branch architecture—LSTMs for IQ data and Transformers for spectrograms—with a web dashboard for `.wav` uploads, signal visualization, and real-time predictions.

---

## 🚀 Features

- **Dual-Branch Model**
  - **IQ Branch**: Bidirectional LSTM/GRU over time-series IQ data.
  - **Spectrogram Branch**: Transformer-based patch encoder over spectrogram inputs.

- **Web Dashboard**
  - Upload `.wav` files for inference.
  - Visualize I/Q data. 
  - View class probabilities and predicted labels.

- **Robust Architecture**
  - Transformer encoder with patch embedding for spectrogram data.
  - Bi-directional LSTM feature extractor for sequential IQ.
  - Fused logits across both modalities.
 
## 🧰 Tech Stack

### 🔗 Backend
- **Python 3.10+**
- **PyTorch** – Deep learning framework for model development and training
- **NumPy** – Numerical computing and signal data handling
- **Scikit-learn** – Data preprocessing and evaluation
- **Scipy** – Actual spectrogram generation from data
- **Matplotlib** – Visualizations (e.g., spectrograms, attention maps)

### 🌐 Frontend
- **React.js** – Web UI framework for dashboard interface
### ⚙️ Middleware / Server
- **Node.js** – Server-side runtime for dashboard backend
- **Express.js** – Handles file uploads and communication with Python scripts
- **Python** – Generates I/Q visualizations & is used for the model pipeline. 

### 🧪 Tools & Utilities
- **Jupyter Notebook** – For model prototyping and analysis
---
