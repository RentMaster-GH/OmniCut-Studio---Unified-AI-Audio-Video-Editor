/**
 * OmniCut Studio Video & Generative Scene Library
 * High-speed, verified video assets with automated prompt keyword matching
 * and procedural visual fallbacks.
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
    id: 'vid-cat-jump',
    title: '🐱 AI Generated: Feline Agility & Jump',
    src: 'https://upload.wikimedia.org/wikipedia/commons/f/f1/Cat_jumping_backwards.webm',
    category: 'animals',
    tags: ['cat', 'kitten', 'pet', 'animal', 'jump', 'pounce', 'feline', 'cute'],
    color: '#F59E0B',
    visualTag: 'cat',
  },
  {
    id: 'vid-ocean-waves',
    title: '🌊 Cinematic Ocean Waves & Coastline',
    src: 'https://vjs.zencdn.net/v/oceans.mp4',
    category: 'nature',
    tags: ['ocean', 'sea', 'water', 'waves', 'beach', 'coast', 'nature', 'blue', 'surf', 'island', 'travel'],
    color: '#06B6D4',
    visualTag: 'ocean',
  },
  {
    id: 'vid-golden-sunset',
    title: '🌅 Drone Sunset & Golden Gate Aerial',
    src: 'https://upload.wikimedia.org/wikipedia/commons/f/f7/Golden_Gate_Bridge_timelapse.webm',
    category: 'drone',
    tags: ['sunset', 'golden', 'bridge', 'timelapse', 'drone', 'aerial', 'landscape', 'sun', 'sky', 'horizon', 'city'],
    color: '#F97316',
    visualTag: 'sunset',
  },
  {
    id: 'vid-sintel-action',
    title: '⚡ Cybernetic & Cinematic Sci-Fi Journey',
    src: 'https://test-videos.co.uk/vids/sintel/mp4/h264/720/Sintel_720_10s_1MB.mp4',
    category: 'cyberpunk',
    tags: ['cyberpunk', 'tech', 'ai', 'robot', 'future', 'coding', 'software', 'hacker', 'digital', 'sci-fi', 'action', 'story'],
    color: '#8B5CF6',
    visualTag: 'cyberpunk',
  },
  {
    id: 'vid-jellyfish-glow',
    title: '✨ Deep Sea Bioluminescent Neon Glow',
    src: 'https://test-videos.co.uk/vids/jellyfish/mp4/h264/720/Jellyfish_720_10s_1MB.mp4',
    category: 'tech',
    tags: ['jellyfish', 'glow', 'neon', 'crypto', 'dark', 'particles', 'ambient', 'space', 'galaxy', 'quantum', 'mystery'],
    color: '#EC4899',
    visualTag: 'neon',
  },
  {
    id: 'vid-flower-bloom',
    title: '🌸 Organic Growth & Creative Awakening',
    src: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
    category: 'nature',
    tags: ['flower', 'garden', 'nature', 'organic', 'blossom', 'spring', 'growth', 'creative', 'art', 'peace'],
    color: '#10B981',
    visualTag: 'nature',
  },
  {
    id: 'vid-bunny-viral',
    title: '🐰 High-Retention Animated Mascot Scene',
    src: 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_1MB.mp4',
    category: 'animals',
    tags: ['bunny', 'rabbit', 'character', 'fun', 'viral', 'humor', 'tiktok', 'mascot', 'kids', 'story'],
    color: '#3B82F6',
    visualTag: 'animation',
  },
];

/**
 * Intelligent keyword matching to pick the best stock video
 */
export function matchVideoForPrompt(prompt: string, sceneIndex = 0): VideoAsset {
  const p = prompt.toLowerCase();

  // Explicit check for cat / pet prompt
  if (p.includes('cat') || p.includes('kitten') || p.includes('pet') || p.includes('feline')) {
    return VERIFIED_STOCK_VIDEOS[0]; // vid-cat-jump
  }

  // Ocean / water / coast
  if (p.includes('ocean') || p.includes('sea') || p.includes('water') || p.includes('beach') || p.includes('wave') || p.includes('surf')) {
    return VERIFIED_STOCK_VIDEOS[1]; // vid-ocean-waves
  }

  // Sunset / drone / landscape
  if (p.includes('sunset') || p.includes('drone') || p.includes('landscape') || p.includes('golden') || p.includes('bridge') || p.includes('aerial')) {
    return VERIFIED_STOCK_VIDEOS[2]; // vid-golden-sunset
  }

  // Cyberpunk / AI / Tech / Software
  if (p.includes('ai') || p.includes('cyberpunk') || p.includes('tech') || p.includes('software') || p.includes('code') || p.includes('future') || p.includes('robot')) {
    return VERIFIED_STOCK_VIDEOS[3]; // vid-sintel-action
  }

  // Neon / quantum / crypto / space
  if (p.includes('neon') || p.includes('crypto') || p.includes('quantum') || p.includes('space') || p.includes('dark') || p.includes('jellyfish')) {
    return VERIFIED_STOCK_VIDEOS[4]; // vid-jellyfish-glow
  }

  // Flower / nature / garden
  if (p.includes('flower') || p.includes('nature') || p.includes('garden') || p.includes('plant') || p.includes('organic')) {
    return VERIFIED_STOCK_VIDEOS[5]; // vid-flower-bloom
  }

  // Score match based on tags
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

/**
 * Procedural Dynamic Live Visual Generator on HTML5 Canvas
 * Used when video is buffering, transitioning, or to enrich live playback
 */
export function drawLiveGenerativeScene(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number,
  prompt: string,
  visualTag: string,
  isPlaying: boolean
) {
  // Dynamic gradient backdrop
  const grad = ctx.createLinearGradient(0, 0, width, height);

  if (visualTag === 'cat') {
    grad.addColorStop(0, '#1c1917');
    grad.addColorStop(0.5, '#451a03');
    grad.addColorStop(1, '#0c0a09');
  } else if (visualTag === 'cyberpunk' || visualTag === 'neon') {
    grad.addColorStop(0, '#0f172a');
    grad.addColorStop(0.5, '#1e1b4b');
    grad.addColorStop(1, '#020617');
  } else if (visualTag === 'ocean') {
    grad.addColorStop(0, '#042f2e');
    grad.addColorStop(0.5, '#0e7490');
    grad.addColorStop(1, '#083344');
  } else if (visualTag === 'sunset') {
    grad.addColorStop(0, '#451a03');
    grad.addColorStop(0.5, '#7c2d12');
    grad.addColorStop(1, '#18181b');
  } else {
    grad.addColorStop(0, '#090d16');
    grad.addColorStop(0.5, '#1e293b');
    grad.addColorStop(1, '#020617');
  }

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // Animated perspective 3D neon floor grid
  ctx.save();
  ctx.strokeStyle = 'rgba(59, 130, 246, 0.15)';
  ctx.lineWidth = 1.5;
  const horizon = height * 0.55;
  const speed = (time * 60) % 60;

  // Horizontal perspective lines moving towards viewer
  for (let y = horizon; y < height; y += (y - horizon) * 0.35 + 10) {
    const animatedY = y + (speed * (y - horizon)) / 120;
    if (animatedY < height) {
      ctx.beginPath();
      ctx.moveTo(0, animatedY);
      ctx.lineTo(width, animatedY);
      ctx.stroke();
    }
  }

  // Vanishing perspective rays from center
  const centerX = width / 2;
  for (let x = -width; x <= width * 2; x += 100) {
    ctx.beginPath();
    ctx.moveTo(centerX, horizon);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  ctx.restore();

  // Floating ambient light particles
  ctx.save();
  for (let i = 0; i < 28; i++) {
    const px = ((i * 137.5 + time * 35) % width);
    const py = (horizon * 0.85) - Math.abs(Math.sin(i + time * 0.8)) * (horizon * 0.7);
    const radius = 2 + Math.sin(i + time * 2) * 1.5;

    ctx.beginPath();
    ctx.arc(px, py, radius, 0, Math.PI * 2);
    ctx.fillStyle = i % 2 === 0 ? 'rgba(56, 189, 248, 0.55)' : 'rgba(168, 85, 247, 0.55)';
    ctx.shadowColor = i % 2 === 0 ? '#38bdf8' : '#a855f7';
    ctx.shadowBlur = 12;
    ctx.fill();
  }
  ctx.restore();

  // Dynamic Center Waveform / Audio Horizon
  ctx.save();
  ctx.beginPath();
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 2.5;
  ctx.shadowColor = '#38bdf8';
  ctx.shadowBlur = 16;
  ctx.moveTo(0, horizon);

  const freq = 0.015;
  const amp = isPlaying ? 28 : 8;
  for (let x = 0; x <= width; x += 15) {
    const wave = Math.sin(x * freq + time * 4.2) * amp * Math.cos(x * 0.005);
    ctx.lineTo(x, horizon + wave);
  }
  ctx.stroke();
  ctx.restore();
}
