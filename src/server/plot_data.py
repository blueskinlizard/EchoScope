import numpy as np
import matplotlib.pyplot as plt
import os
import sys

def plot_iq_data(iq_array, output_dir, base_name="iq_plot"):
    os.makedirs(output_dir, exist_ok=True)
    
    # Make sure shape has 2 streams and not 1 (Incompatible with our model + graph)
    if iq_array.shape[0] != 2:
        raise ValueError("Expected IQ data with shape (2, N), got shape: {}".format(iq_array.shape))
    
    I = iq_array[0]
    Q = iq_array[1]
    time = np.arange(len(I))

    plt.figure(figsize=(12, 6))
    plt.subplot(2, 1, 1)
    plt.plot(time, I, label='In-phase (I)', color='blue')
    plt.title("In-phase (I) Signal")
    plt.xlabel("Sample")
    plt.ylabel("Amplitude")
    plt.grid(True)

    plt.subplot(2, 1, 2)
    plt.plot(time, Q, label='Quadrature (Q)', color='red')
    plt.title("Quadrature (Q) Signal")
    plt.xlabel("Sample")
    plt.ylabel("Amplitude")
    plt.grid(True)

    plt.tight_layout()
    plot_path = os.path.join(output_dir, f"{base_name}.png")
    plt.savefig(plot_path)
    plt.close()

    print(f"IQ plot saved to: {plot_path}")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        sys.exit(1)

    iq_path = sys.argv[1]
    output_folder = sys.argv[2]

    if not os.path.exists(iq_path):
        raise FileNotFoundError(f"IQ file '{iq_path}' not found.")

    iq_data = np.load(iq_path)
    base_name = os.path.splitext(os.path.basename(iq_path))[0]

    plot_iq_data(iq_data, output_folder, base_name)
