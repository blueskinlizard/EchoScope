import numpy as np
import scipy.io.wavfile as wavfile
import scipy.signal
import sys
import os

def load_wav_to_iq_array(filename, target_length=128):
    sample_rate, data = wavfile.read(filename)
    if data.ndim == 1:
        raise ValueError("Expected stereo IQ data (2 channels), but got mono (1 channel, incompatible w/ echoscope).")
    
    if data.dtype == np.int16:
        data = data.astype(np.float32) / 32768.0
    elif data.dtype == np.int32:
        data = data.astype(np.float32) / 2147483648.0
    elif data.dtype == np.uint8:
        data = (data.astype(np.float32) - 128) / 128.0
    else:
        data = data.astype(np.float32)

    I = data[:, 0]
    Q = data[:, 1]

    def resize_channel(channel):
        if len(channel) > target_length:
            return scipy.signal.resample(channel, target_length)
        elif len(channel) < target_length:
            return np.pad(channel, (0, target_length - len(channel)), 'constant')
        else:
            return channel

    I_resized = resize_channel(I)
    Q_resized = resize_channel(Q)

    # Convert into (2, 128) size to be able to be used by echoscope model
    iq_array = np.stack([I_resized, Q_resized], axis=0)

    return iq_array, sample_rate

if __name__ == "__main__":
    if len(sys.argv) < 2:
        raise ValueError("Usage: python wav_to_model.py <path/to/file.wav>")
    
    filename = sys.argv[1]

    if not os.path.exists(filename):
        raise FileNotFoundError(f"File '{filename}' does not exist.")
    
    iq_data, fs = load_wav_to_iq_array(filename)

    base_name = os.path.splitext(os.path.basename(filename))[0]
    output_path = os.path.join(os.path.dirname(filename), base_name + "_iq.npy")
    np.save(output_path, iq_data)
    
    print("IQ data shape:", iq_data.shape)
    print("Sample rate:", fs)
