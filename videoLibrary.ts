/**
 * OmniCut Studio Video & Generative Scene Library
 */

export interface VideoAsset {
  id: string;
  title: string;
  src: string;
  category: 'animals' | 'nature' | 'cyberpunk' | 'drone' | 'tech' | 'space' | 'general';
  tags: string[];
  color: string;
  visualTag: string;
}

export const VERIFIED_STOCK_VIDEOS: VideoAsset[] = [
  {
    id: 'vid-pig-eating',
    title: '🐖 Real Pig Eating & Feeding',
    src: 'https://upload.wikimedia.org/wikipedia/commons/8/8b/Piglets_feeding.webm',
    category: 'animals',
    tags: ['pig', 'pigs', 'piglet', 'boar', 'swine', 'hog', 'pork', 'eating', 'feeding', 'farm', 'mud', 'sty', 'eat'],
    color: '#F472B6',
    visualTag: 'pig',
  },
  {
    id: 'vid-ocean-waves',
    title: '🌊 Cinematic Ocean Waves & Coastline',
    src: 'https://vjs.zencdn.net/v/oceans.mp4',
    category: 'nature',
    tags: ['ocean', 'sea', 'water', 'waves', 'beach', 'coast', 'nature', 'blue', 'surf', 'island', 'travel', 'summer', 'marine', 'tide', 'deep'],
    color: '#06B6D4',
    visualTag: 'ocean',
  },
  {
    id: 'vid-cat-jump',
    title: '🐱 AI Generated: Feline Agility & Jump',
    src: 'https://upload.wikimedia.org/wikipedia/commons/f/f1/Cat_jumping_backwards.webm',
    category: 'animals',
    tags: ['cat', 'kitten', 'pet', 'animal', 'jump', 'pounce', 'feline', 'cute', 'dog', 'puppy', 'wildlife', 'creature'],
    color: '#F59E0B',
    visualTag: 'cat',
  },
  {
    id: 'vid-golden-sunset',
    title: '🌅 Drone Sunset & Golden Gate Aerial',
    src: 'https://upload.wikimedia.org/wikipedia/commons/f/f7/Golden_Gate_Bridge_timelapse.webm',
    category: 'drone',
    tags: ['sunset', 'golden', 'bridge', 'timelapse', 'drone', 'aerial', 'landscape', 'sun', 'sky', 'horizon', 'city', 'dusk', 'sunrise', 'california'],
    color: '#F97316',
    visualTag: 'sunset',
  },
  {
    id: 'vid-sintel-action',
    title: '⚡ Cybernetic & Cinematic Sci-Fi Journey',
    src: 'https://test-videos.co.uk/vids/sintel/mp4/h264/720/Sintel_720_10s_1MB.mp4',
    category: 'cyberpunk',
    tags: ['cyberpunk', 'tech', 'ai', 'robot', 'future', 'coding', 'software', 'hacker', 'digital', 'sci-fi', 'action', 'story', 'dragon', 'warrior', 'cyber'],
    color: '#8B5CF6',
    visualTag: 'cyberpunk',
  },
  {
    id: 'vid-jellyfish-glow',
    title: '✨ Deep Sea Bioluminescent Neon Glow',
    src: 'https://test-videos.co.uk/vids/jellyfish/mp4/h264/720/Jellyfish_720_10s_1MB.mp4',
    category: 'tech',
    tags: ['jellyfish', 'glow', 'neon', 'crypto', 'dark', 'particles', 'ambient', 'space', 'galaxy', 'quantum', 'mystery', 'stars', 'cosmos', 'astronomy'],
    color: '#EC4899',
    visualTag: 'neon',
  },
  {
    id: 'vid-flower-bloom',
    title: '🌸 Organic Growth & Creative Awakening',
    src: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
    category: 'nature',
    tags: ['flower', 'garden', 'nature', 'organic', 'blossom', 'spring', 'growth', 'creative', 'art', 'peace', 'plants', 'forest', 'meadow', 'field', 'green'],
    color: '#10B981',
    visualTag: 'nature',
  },
  {
    id: 'vid-bunny-viral',
    title: '🐰 High-Retention Animated Mascot Scene',
    src: 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_1MB.mp4',
    category: 'animals',
    tags: ['bunny', 'rabbit', 'character', 'fun', 'viral', 'humor', 'tiktok', 'mascot', 'kids', 'story', 'animation', 'funny', 'grass', 'farm', 'meadow'],
    color: '#3B82F6',
    visualTag: 'animation',
  },
];

export function matchVideoForPrompt(prompt: string, sceneIndex = 0): VideoAsset {
  const p = prompt.toLowerCase();
  if (p.includes('pig') || p.includes('boar') || p.includes('swine') || p.includes('hog') || p.includes('piglet')) {
    return VERIFIED_STOCK_VIDEOS[0];
  }
  if (p.includes('cow') || p.includes('bull') || p.includes('farm') || p.includes('pasture') || p.includes('bunny') || p.includes('rabbit')) {
    return VERIFIED_STOCK_VIDEOS[7];
  }
  if (p.includes('cat') || p.includes('kitten') || p.includes('pet') || p.includes('feline') || p.includes('dog') || p.includes('puppy')) {
    return VERIFIED_STOCK_VIDEOS[2];
  }
  if (p.includes('ocean') || p.includes('sea') || p.includes('water') || p.includes('beach') || p.includes('wave') || p.includes('surf') || p.includes('river')) {
    return VERIFIED_STOCK_VIDEOS[1];
  }
  if (p.includes('sunset') || p.includes('drone') || p.includes('landscape') || p.includes('golden') || p.includes('bridge') || p.includes('aerial') || p.includes('city') || p.includes('skyline') || p.includes('mountain') || p.includes('snow') || p.includes('winter')) {
    return VERIFIED_STOCK_VIDEOS[3];
  }
  if (p.includes('flower') || p.includes('nature') || p.includes('garden') || p.includes('plant') || p.includes('organic') || p.includes('spring') || p.includes('green field') || p.includes('meadow') || p.includes('dinosaur') || p.includes('jurassic')) {
    return VERIFIED_STOCK_VIDEOS[6];
  }
  if (p.includes('space') || p.includes('galaxy') || p.includes('stars') || p.includes('cosmos') || p.includes('neon') || p.includes('glow') || p.includes('crypto') || p.includes('quantum') || p.includes('jellyfish') || p.includes('magic') || p.includes('wizard')) {
    return VERIFIED_STOCK_VIDEOS[5];
  }
  if (p.includes('ai') || p.includes('cyberpunk') || p.includes('tech') || p.includes('code') || p.includes('future') || p.includes('robot') || p.includes('action') || p.includes('car') || p.includes('dragon') || p.includes('sword') || p.includes('knight') || p.includes('warrior')) {
    return VERIFIED_STOCK_VIDEOS[4];
  }
  let bestMatch: VideoAsset = VERIFIED_STOCK_VIDEOS[sceneIndex % VERIFIED_STOCK_VIDEOS.length];
  let highestScore = -1;
  for (const video of VERIFIED_STOCK_VIDEOS) {
    let score = 0;
    for (const tag of video.tags) {
      if (p.includes(tag)) score += 2;
    }
    if (score > highestScore) {
      highestScore = score;
      bestMatch = video;
    }
  }
  return bestMatch;
}

const imageCache: Map<string, HTMLImageElement> = new Map();

export function drawLiveGenerativeScene(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number,
  prompt: string,
  visualTag: string,
  isPlaying: boolean,
  imageSrc?: string | null
) {
  const p = (prompt || '').toLowerCase();
  if (imageSrc) {
    let img = imageCache.get(imageSrc);
    if (!img) {
      img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = imageSrc;
      imageCache.set(imageSrc, img);
    }
    if (img.complete && img.naturalWidth > 0) {
      ctx.save();
      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, 0, width, height);
      const zoomSpeed = 0.04;
      const zoomFactor = 1.05 + Math.sin(time * zoomSpeed) * 0.05;
      const panX = Math.cos(time * 0.03) * 15;
      const panY = Math.sin(time * 0.02) * 10;
      ctx.translate(width / 2 + panX, height / 2 + panY);
      ctx.scale(zoomFactor, zoomFactor);
      const imgAspect = img.naturalWidth / img.naturalHeight;
      const canvasAspect = width / height;
      let drawW = width;
      let drawH = height;
      if (imgAspect > canvasAspect) {
        drawW = height * imgAspect;
      } else {
        drawH = width / imgAspect;
      }
      ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
      ctx.restore();
      ctx.save();
      for (let i = 0; i < 20; i++) {
        const px = (i * 97 + time * 45) % width;
        const py = (i * 53 + Math.sin(i + time) * 30 + time * 15) % height;
        const alpha = 0.3 + Math.sin(i + time * 2) * 0.2;
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.beginPath();
        ctx.arc(px, py, 1.5 + (i % 3), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
      ctx.save();
      const vignette = ctx.createRadialGradient(width / 2, height / 2, Math.min(width, height) * 0.4, width / 2, height / 2, Math.max(width, height) * 0.75);
      vignette.addColorStop(0, 'rgba(0,0,0,0)');
      vignette.addColorStop(1, 'rgba(0,0,0,0.65)');
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
      return;
    }
  }
  const isPastureOrCow = p.includes('cow') || p.includes('farm') || p.includes('pasture') || p.includes('field') || p.includes('meadow') || p.includes('grass') || p.includes('pig');
  const isSpaceOrGalaxy = p.includes('space') || p.includes('galaxy') || p.includes('stars') || p.includes('cosmos') || p.includes('alien') || p.includes('planet') || p.includes('astronaut');
  const isFireOrDragon = p.includes('dragon') || p.includes('fire') || p.includes('flame') || p.includes('volcano') || p.includes('lava') || p.includes('burn');
  const isOcean = p.includes('ocean') || p.includes('sea') || p.includes('water') || p.includes('beach') || p.includes('wave') || p.includes('underwater');
  const isCyberOrTech = p.includes('cyber') || p.includes('tech') || p.includes('ai') || p.includes('code') || p.includes('robot') || p.includes('matrix') || p.includes('future') || visualTag === 'cyberpunk';
  const isCarOrSpeed = p.includes('car') || p.includes('racing') || p.includes('drift') || p.includes('speed') || p.includes('drive') || p.includes('vehicle');
  const isSnowOrMountain = p.includes('snow') || p.includes('mountain') || p.includes('winter') || p.includes('ice') || p.includes('alpine') || p.includes('arctic');
  const isDinosaurOrJurassic = p.includes('dinosaur') || p.includes('jurassic') || p.includes('t-rex') || p.includes('fossil') || p.includes('primeval');
  const grad = ctx.createLinearGradient(0, 0, width, height);
  if (isPastureOrCow) {
    grad.addColorStop(0, '#0284c7');
    grad.addColorStop(0.45, '#38bdf8');
    grad.addColorStop(0.5, '#15803d');
    grad.addColorStop(1, '#166534');
  } else if (isSnowOrMountain) {
    grad.addColorStop(0, '#0f172a');
    grad.addColorStop(0.4, '#1e293b');
    grad.addColorStop(0.55, '#cbd5e1');
    grad.addColorStop(1, '#64748b');
  } else if (isDinosaurOrJurassic) {
    grad.addColorStop(0, '#451a03');
    grad.addColorStop(0.45, '#78350f');
    grad.addColorStop(0.55, '#14532d');
    grad.addColorStop(1, '#052e16');
  } else if (isSpaceOrGalaxy) {
    grad.addColorStop(0, '#030712');
    grad.addColorStop(0.5, '#1e1b4b');
    grad.addColorStop(1, '#0f172a');
  } else if (isFireOrDragon) {
    grad.addColorStop(0, '#450a0a');
    grad.addColorStop(0.5, '#991b1b');
    grad.addColorStop(1, '#180202');
  } else if (isOcean) {
    grad.addColorStop(0, '#042f2e');
    grad.addColorStop(0.5, '#0e7490');
    grad.addColorStop(1, '#083344');
  } else if (isCarOrSpeed) {
    grad.addColorStop(0, '#09090b');
    grad.addColorStop(0.6, '#18181b');
    grad.addColorStop(1, '#27272a');
  } else if (isCyberOrTech) {
    grad.addColorStop(0, '#0f172a');
    grad.addColorStop(0.5, '#1e1b4b');
    grad.addColorStop(1, '#020617');
  } else {
    grad.addColorStop(0, '#090d16');
    grad.addColorStop(0.5, '#1e293b');
    grad.addColorStop(1, '#020617');
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);
  const horizon = height * 0.52;
  if (isPastureOrCow) {
    ctx.save();
    const sunGrad = ctx.createRadialGradient(width * 0.75, height * 0.22, 10, width * 0.75, height * 0.22, 120);
    sunGrad.addColorStop(0, 'rgba(254, 240, 138, 0.9)');
    sunGrad.addColorStop(0.5, 'rgba(253, 224, 71, 0.4)');
    sunGrad.addColorStop(1, 'rgba(253, 224, 71, 0)');
    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(width * 0.75, height * 0.22, 120, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.save();
    for (let h = 0; h < 3; h++) {
      ctx.fillStyle = h === 0 ? '#15803d' : h === 1 ? '#166534' : '#14532d';
      ctx.beginPath();
      const waveOffset = h * 120 + time * 20;
      ctx.moveTo(0, height);
      ctx.lineTo(0, horizon + h * 30);
      for (let x = 0; x <= width; x += 30) {
        const y = horizon + h * 25 + Math.sin((x + waveOffset) * 0.005) * 25;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(width, height);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }
  ctx.save();
  ctx.beginPath();
  ctx.strokeStyle = isPastureOrCow ? '#FACC15' : '#38bdf8';
  ctx.lineWidth = 2.5;
  ctx.shadowColor = isPastureOrCow ? '#FACC15' : '#38bdf8';
  ctx.shadowBlur = 14;
  ctx.moveTo(0, horizon);
  const freq = 0.015;
  const amp = isPlaying ? 24 : 8;
  for (let x = 0; x <= width; x += 15) {
    const wave = Math.sin(x * freq + time * 4.2) * amp * Math.cos(x * 0.005);
    ctx.lineTo(x, horizon + wave);
  }
  ctx.stroke();
  ctx.restore();
}
