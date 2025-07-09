import numpy as np
import os
import sys
from scipy.signal import spectrogram

def generate_spectrogram(iq_sample, fs=1.0, nperseg=32, noverlap=24, 
                         noise_std=0.01, shift_max=2, pad_to=256):
    iq_sample = iq_sample / (np.linalg.norm(iq_sample, axis=1, keepdims=True) + 1e-10)

    # Same function parameters for spectrogram generation as seen in the notebook (Check it out btw!)

    if pad_to > iq_sample.shape[1]:
        pad_width = pad_to - iq_sample.shape[1]
        iq_sample = np.pad(iq_sample, ((0, 0), (0, pad_width)), mode='reflect')

    spec_channels = []
    for ch in range(iq_sample.shape[0]):
        f, t, Sxx = spectrogram(iq_sample[ch], fs=fs, nperseg=nperseg, noverlap=noverlap)
        Sxx = np.abs(Sxx)
        Sxx_db = 10 * np.log10(Sxx + 1e-10)
        spec_channels.append(Sxx_db)

    spectrogram_img = np.stack(spec_channels, axis=0)  
    return spectrogram_img

def standardize_spectrogram(spec, mean_path, std_path):
    global_mean = np.load(mean_path)
    global_std = np.load(std_path)

    print('Global mean:', global_mean, type(global_mean), global_mean.shape if hasattr(global_mean, 'shape') else 'scalar')
    print('Global std:', global_std, type(global_std), global_std.shape if hasattr(global_std, 'shape') else 'scalar')

    return (spec - global_mean) / (global_std + 1e-9)

if __name__ == "__main__":

    iq_path = sys.argv[1]
    if not os.path.exists(iq_path):
        raise FileNotFoundError(f"IQ data file '{iq_path}' does not exist.")

    iq_data = np.load(iq_path)  

    spectrogram_img = generate_spectrogram(iq_data)
    
    # Current program path
    script_dir = os.path.dirname(os.path.abspath(__file__))

    # Standardize spectrogram using global stats (as saved in our notebook during data processing)
    mean_path = os.path.join(script_dir, 'global_mean.npy')
    std_path = os.path.join(script_dir, 'global_std.npy')

    
    if not os.path.exists(mean_path) or not os.path.exists(std_path):
        raise FileNotFoundError("global_mean.npy or global_std.npy not found in 'data_conversion'")

    standardized_spec = standardize_spectrogram(spectrogram_img, mean_path, std_path)

    base_name = os.path.splitext(os.path.basename(iq_path))[0]
    output_path = os.path.join(os.path.dirname(iq_path), base_name + "_spectrogram.npy")
    np.save(output_path, standardized_spec)

    print("Saved standardized spectrogram:", output_path)
    print("Spectrogram shape:", standardized_spec.shape)
