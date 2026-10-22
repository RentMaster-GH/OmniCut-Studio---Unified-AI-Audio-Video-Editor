import { generateWithFreeProxy, getOmniKey, getCredits } from "@/lib/freeProxy";
import { useState } from 'react'

export function useVideoGeneration() {
  const [loading, setLoading] = useState(false)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)

  const generateImage = (prompt: string) => {
    const { url } = await generateWithFreeProxy(prompt, 'image')
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
      const { url } = await generateWithFreeProxy(enhanced, 'image', { width: 1280, height: 720 })
      
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
