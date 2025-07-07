import os
import numpy as np
import pandas as pd
from scipy.io.wavfile import write
from scipy.signal import resample

# INFO: THE PURPOSE OF THIS FILE IS TO BE RAN WHEN CONVERTING RADIOML DATA TO WAV FORMAT, NOT IN ACTUAL PIPELINE/PROD

radio_ml_2016 = pd.read_pickle('../../data/radio_ml_2016/RML2016.10a_dict.pkl')

samples_per_mod = 10   
concat_count = 1000      
sr_original = 2_000_000  
sr_target = 48000        
output_dir = 'wav_samples_concat'

def iq_to_wav(iq_complex, sr_original, sr_target, filename):
    num_samples = int(len(iq_complex) * sr_target / sr_original)
    print(f"Original length: {len(iq_complex)}, Resampled length: {num_samples}")

    real_resampled = resample(np.real(iq_complex), num_samples)
    imag_resampled = resample(np.imag(iq_complex), num_samples)

    stereo = np.stack([real_resampled, imag_resampled], axis=-1)

    stereo = stereo - np.mean(stereo, axis=0)

    max_val = np.max(np.abs(stereo)) + 1e-12
    stereo_norm = stereo / max_val
    stereo_int16 = (stereo_norm * 32767).astype(np.int16)

    write(filename, sr_target, stereo_int16)
    print(f"Wrote WAV file: {filename} with shape {stereo_int16.shape}")

os.makedirs(output_dir, exist_ok=True)

mod_set = sorted({mod for (mod, snr) in radio_ml_2016.keys()})
snr_target = 18

total_written = 0

for mod in mod_set:
    key = (mod, snr_target)
    if key not in radio_ml_2016:
        print(f"Skipping {mod}, no samples for: {snr_target} dB")
        continue

    mod_dir = os.path.join(output_dir, mod)
    os.makedirs(mod_dir, exist_ok=True)

    samples = radio_ml_2016[key]

    max_i = min(samples_per_mod, len(samples) // concat_count)

    for i in range(max_i):
        iq_chunks = samples[i*concat_count:(i+1)*concat_count]
        iq_concat = np.concatenate(iq_chunks, axis=1) 
        iq_complex = iq_concat[0] + 1j * iq_concat[1]

        filename = os.path.join(mod_dir, f"{mod}_{i}.wav")
        iq_to_wav(iq_complex, sr_original, sr_target, filename)
        total_written += 1

print(f"Done, {total_written} total .wav files saved")