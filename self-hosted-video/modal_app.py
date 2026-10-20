import modal

image = modal.Image.debian_slim().pip_install(
    "torch", "diffusers==0.31.0", "transformers", "accelerate", "fastapi[standard]", "pillow", "imageio[ffmpeg]"
)

app = modal.App("omnicut-video", image=image)

@app.cls(gpu="T4", timeout=600, scaledown_window=300)
class VideoGenerator:
    @modal.enter()
    def load_model(self):
        import torch
        from diffusers import CogVideoXPipeline
        print("Loading CogVideoX-2B...")
        self.pipe = CogVideoXPipeline.from_pretrained(
            "THUDM/CogVideoX-2b", 
            torch_dtype=torch.float16
        )
        self.pipe.enable_model_cpu_offload()
        self.pipe.vae.enable_slicing()
        print("Ready!")

    @modal.method()
    def generate_video(self, prompt: str):
        from diffusers.utils import export_to_video
        import tempfile
        
        print(f"Generating: {prompt}")
        frames = self.pipe(
            prompt=prompt,
            num_frames=49,
            guidance_scale=6,
            num_inference_steps=50,
            height=480,
            width=720
        ).frames[0]
        
        with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as f:
            export_to_video(frames, f.name, fps=8)
            return f.name

    @modal.fastapi_endpoint(method="POST")
    def api(self, item: dict):
        prompt = item.get("prompt", "African woman dancing, cinematic")
        video_path = self.generate_video.local(prompt)
        
        from fastapi.responses import FileResponse
        return FileResponse(video_path, media_type="video/mp4", filename="video.mp4")

@app.local_entrypoint()
def main():
    gen = VideoGenerator()
    path = gen.generate_video.remote("African woman dancing, cinematic, 8k")
    print(f"Video saved at: {path}")
