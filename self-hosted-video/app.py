import gradio as gr
import torch
from diffusers import CogVideoXPipeline
from diffusers.utils import export_to_video
import tempfile

print("Loading CogVideoX-2B...")
pipe = CogVideoXPipeline.from_pretrained("THUDM/CogVideoX-2b", torch_dtype=torch.float16)
pipe.enable_model_cpu_offload()
pipe.vae.enable_slicing()
print("Loaded!")

def generate(prompt):
    frames = pipe(prompt=prompt, num_frames=49, guidance_scale=6, num_inference_steps=50, height=480, width=720).frames[0]
    with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as f:
        export_to_video(frames, f.name, fps=8)
        return f.name

demo = gr.Interface(
    fn=generate,
    inputs=gr.Textbox(label="Prompt", value="African woman dancing, cinematic"),
    outputs=gr.Video(label="Video"),
    title="OmniCut - Your Own Video Generator"
)
demo.launch()
