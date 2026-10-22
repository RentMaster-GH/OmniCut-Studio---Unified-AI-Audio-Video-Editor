import { generateWithFreeProxy } from './lib/freeProxy.ts';
(async () => {
  const url = await generateWithFreeProxy("aura the cat - OmniCut mascot, cyberpunk style", "image");
  console.log("IMAGE:", url);
  
  const videoUrl = await generateWithFreeProxy("cat dancing in futuristic city", "video");
  console.log("VIDEO:", videoUrl);
})();
