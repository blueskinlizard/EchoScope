import torch
import torch.nn as nn
import torch.nn.functional as F


class Time_Series_Model(nn.Module):
    def __init__(self, input_size=2, hidden_size=256, output_size=6, num_layers=2):
        super().__init__()
        self.lstm = nn.LSTM(
            input_size=input_size,
            hidden_size=hidden_size,
            num_layers=num_layers,
            batch_first=True,
            bidirectional=True,
            dropout=0.3
        )
        self.bn = nn.BatchNorm1d(hidden_size*2)
        self.fc1 = nn.Linear(hidden_size*2, hidden_size)
        self.fc2 = nn.Linear(hidden_size, output_size)
        self.dropout = nn.Dropout(0.5)
        
    def forward(self, x):
        lstm_out, _ = self.lstm(x)
        last_out = lstm_out[:, -1, :]
        out = self.bn(last_out)
        out = F.relu(self.fc1(out))
        out = self.dropout(out)
        out = self.fc2(out)
        return out
    

class SpectrogramPatchEncoder(nn.Module):
    def __init__(self, in_channels=2, patch_size=(1, 1), embed_dim=128, img_size=(17, 29)):
        super().__init__()
        self.img_size = img_size
        self.patch_size = patch_size
        self.embed_dim = embed_dim

        self.num_patches = (img_size[0] // patch_size[0]) * (img_size[1] // patch_size[1])
        
        self.proj = nn.Conv2d(
            in_channels,
            embed_dim,
            kernel_size=patch_size,
            stride=patch_size
        )
        
        self.cls_token = nn.Parameter(torch.randn(1, 1, embed_dim))
        self.pos_embed = nn.Parameter(torch.randn(1, self.num_patches + 1, embed_dim))

    def forward(self, x):
        B = x.size(0)
        x = self.proj(x) 
        x = x.flatten(2).transpose(1, 2)

        cls_tokens = self.cls_token.expand(B, -1, -1)

        x = torch.cat((cls_tokens, x), dim=1)
        x = x + self.pos_embed

        return x

class SpectrogramModel(nn.Module):
    def __init__(self, in_channels=2, img_size=(17, 29), patch_size=(3, 3), embed_dim=256, num_classes=6):
        super().__init__()
        self.patch_encoder = SpectrogramPatchEncoder(
            in_channels=in_channels,
            patch_size=patch_size,
            embed_dim=embed_dim,
            img_size=img_size
        )
        self.transformer = nn.TransformerEncoder(
            nn.TransformerEncoderLayer(d_model=embed_dim, nhead=8, dim_feedforward=512, batch_first=True),
            num_layers=4
        )
        self.classifier = nn.Sequential(
            nn.LayerNorm(embed_dim),
            nn.Dropout(0.5),
            nn.Linear(embed_dim, num_classes)
        )
    def forward(self, x):
        x = self.patch_encoder(x)
        x = self.transformer(x)
        x = x[:, 0]
        x = self.classifier(x)
        return x
    
class EchoScopeFusionModel(nn.Module):
    def __init__(self, ts_model: nn.Module, spec_model: nn.Module,
                 fused_hidden_dim=512, num_classes=6): 
        super().__init__()
        self.ts_branch = ts_model
        self.spec_branch = spec_model

        for param in self.ts_branch.parameters():
            param.requires_grad = False
        for param in self.spec_branch.parameters():
            param.requires_grad = False
            
        for param in self.ts_branch.fc1.parameters():
            param.requires_grad = True
        for param in self.spec_branch.transformer.parameters():
            param.requires_grad = True

        ts_output_dim = 256  
        spec_output_dim = spec_model.patch_encoder.embed_dim 

        self.cross_attn = nn.MultiheadAttention(embed_dim=ts_output_dim, num_heads=4)
        self.fusion = nn.Sequential(
            nn.Linear(ts_output_dim + spec_output_dim, fused_hidden_dim),
            nn.GELU(),  
            nn.BatchNorm1d(fused_hidden_dim),
            nn.Linear(fused_hidden_dim, fused_hidden_dim//2),
            nn.GELU(),
            nn.Dropout(0.3), 
            nn.Linear(fused_hidden_dim//2, num_classes)
        )
        
        self.ts_classifier = nn.Linear(ts_output_dim, num_classes)
        self.spec_classifier = nn.Linear(spec_output_dim, num_classes)

    def forward(self, ts_input, spec_input):
        ts_feat = self.ts_branch(ts_input)  
        spec_feat = self.spec_branch(spec_input)
        ts_q = ts_feat.unsqueeze(0)      
        spec_kv = spec_feat.unsqueeze(0)  
        attn_out, _ = self.cross_attn(query=ts_q, key=spec_kv, value=spec_kv)
        attn_out = attn_out.squeeze(0)  
        ts_feat = ts_feat + attn_out      
        fused = torch.cat([ts_feat, spec_feat], dim=1) 
        out = self.fusion(fused) 
        ts_out = self.ts_classifier(ts_feat)
        spec_out = self.spec_classifier(spec_feat)
        return out, ts_out, spec_out