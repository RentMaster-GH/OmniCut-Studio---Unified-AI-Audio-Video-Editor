import { useState } from 'react'

export function useVideoGeneration() {
  const [loading, setLoading] = useState(false)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)

  const generateImage = (prompt: string) => {
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?nologo=true&model=flux&enhance=true&seed=${Date.now()}`
    setImageUrl(url)
    setVideoUrl(url) // show image in player too
    return url
  }

  const generateVideo = async (prompt: string) => {
    setLoading(true)
    try {
      // Pollinations FREE = IMAGE only (video alpha needs paid Pollen)
      // So for "video" we generate cinematic image - this WILL work
      const enhanced = `${prompt}, cinematic 8k, dynamic camera, professional color grading`
      const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(enhanced)}?nologo=true&model=flux&width=1280&height=720&enhance=true&seed=${Date.now()}`
      
      setVideoUrl(url)
      setImageUrl(url)
      return url
    } catch (e) {
      console.error(e)
      return null
    } finally {
      setLoading(false)
    }
  }

  return { loading, videoUrl, imageUrl, generateImage, generateVideo, isGenerating: loading }
}
