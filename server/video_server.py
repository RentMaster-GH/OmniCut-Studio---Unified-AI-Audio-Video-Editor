# pip install fastapi uvicorn torch diffusers transformers accelerate
from fastapi import FastAPI
from fastapi.responses import FileResponse
import torch
from diffusers import CogVideoXImageToVideoPipeline
from diffusers.utils import export_to_video
import uuid, os

app = FastAPI()
pipe = CogVideoXImageToVideoPipeline.from_pretrained(
    "THUDM/CogVideoX-5b",
    torch_dtype=torch.bfloat16
)
pipe.enable_model_cpu_offload()
pipe.vae.enable_tiling()

@app.post("/generate")
async def generate(prompt: str, duration: int = 6):
    # SAME METHOD AS RUNWAY
    video = pipe(
        prompt=prompt,
        num_frames=duration * 8, # 8fps
        guidance_scale=6,
        num_inference_steps=50
    ).frames[0]
    
    path = f"/tmp/{uuid.uuid4()}.mp4"
    export_to_video(video, path, fps=8)
    return FileResponse(path, media_type="video/mp4")

# uvicorn video_server:app --port 8000 --host 0.0.0.0
