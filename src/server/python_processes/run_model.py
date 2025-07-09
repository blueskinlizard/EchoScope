import torch
import torch.nn as nn
import numpy as np
import os
import sys
import json

from model_defs import Time_Series_Model, SpectrogramModel, EchoScopeFusionModel 

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

def load_inputs(iq_path, spec_path):
    if not os.path.exists(iq_path):
        raise FileNotFoundError(f"IQ data not found: {iq_path}")
    if not os.path.exists(spec_path):
        raise FileNotFoundError(f"Spectrogram data not found: {spec_path}")

    iq_data = np.load(iq_path)
    spec_data = np.load(spec_path) 

    iq_tensor = torch.tensor(iq_data, dtype=torch.float32).transpose(0, 1).unsqueeze(0) 
    spec_tensor = torch.tensor(spec_data, dtype=torch.float32).unsqueeze(0) 

    return iq_tensor.to(device), spec_tensor.to(device)

def load_model(model_path):
    script_dir = os.path.dirname(os.path.abspath(__file__)) 

    # Clarify our classifier = nn.Identity or else we'll be passing in the raw logits into our fusion model!
    ts_model = Time_Series_Model()
    ts_model.fc2 = nn.Identity()
    ts_model_path = os.path.join(script_dir, 'ts_model_full.pth')
    ts_model.load_state_dict(torch.load(ts_model_path), strict=False)
 
    spec_model = SpectrogramModel()
    spec_model.classifier = nn.Identity()
    spec_model_path = os.path.join(script_dir, 'spect_model_full.pth')
    spec_model.load_state_dict(torch.load(spec_model_path), strict=False)

    model = EchoScopeFusionModel(ts_model, spec_model)
    model.load_state_dict(torch.load(model_path, map_location=device), strict=False)
    model.eval()
    return model.to(device)

def predict(model, ts_input, spec_input):
    with torch.no_grad():
        fusion_output, ts_out, spec_out = model(ts_input, spec_input)
        pred = torch.argmax(fusion_output, dim=1).item()
    return pred, fusion_output.softmax(dim=1).cpu().numpy()

def main(iq_path, spec_path, model_path):
    ts_input, spec_input = load_inputs(iq_path, spec_path)
    model = load_model(model_path)

    pred_class, probs = predict(model, ts_input, spec_input)

    result = {
        "predicted_class": int(pred_class),
        "class_probabilities": np.round(probs, 3).tolist()
    }

    print(json.dumps(result))


if __name__ == "__main__":
    iq_path = sys.argv[1]
    spec_path = sys.argv[2]
    model_path = sys.argv[3]

    main(iq_path, spec_path, model_path)
