/**
 * OmniCut Studio Video & Generative Scene Library
 * 
 * High-speed, verified video assets with automated semantic prompt matching
 * and procedural dynamic visual generation for ANY prompt.
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
    id: 'vid-ocean-waves',
    title: '🌊 Cinematic Ocean Waves & Coastline',
    src: 'https://vjs.zencdn.net/v/oceans.mp4',
    category: 'nature',
    tags: ['ocean', 'sea', 'water', 'waves', 'beach', 'coast', 'nature', 'blue', 'surf', 'island', 'travel', 'summer', 'marine', 'tide', 'deep', 'hydrothermal', 'vent'],
    color: '#06B6D4',
    visualTag: 'ocean',
  },
  {
    id: 'vid-sintel-action',
    title: '⚡ Epic Sci-Fi Action & Cinematic Odyssey',
    src: 'https://media.w3.org/2010/05/sintel/trailer.mp4',
    category: 'cyberpunk',
    tags: ['cyberpunk', 'tech', 'ai', 'robot', 'future', 'coding', 'software', 'hacker', 'digital', 'sci-fi', 'action', 'story', 'dragon', 'warrior', 'cyber', 'movie', 'film', 'epic', 'cinema'],
    color: '#8B5CF6',
    visualTag: 'cyberpunk',
  },
  {
    id: 'vid-bunny-wildlife',
    title: '🌿 Wildlife Fauna, Meadow & Creatures',
    src: 'https://media.w3.org/2010/05/bunny/trailer.mp4',
    category: 'animals',
    tags: ['bunny', 'rabbit', 'character', 'fun', 'viral', 'humor', 'tiktok', 'mascot', 'kids', 'story', 'animation', 'funny', 'grass', 'farm', 'meadow', 'animal', 'creature', 'fauna', 'cat', 'dog', 'cow', 'pasture', 'field'],
    color: '#3B82F6',
    visualTag: 'animation',
  },
  {
    id: 'vid-dramatic-nature',
    title: '🌋 Dramatic Earth, Volcano & Landscapes',
    src: 'https://media.w3.org/2010/05/video/movie_300.mp4',
    category: 'nature',
    tags: ['nature', 'earth', 'fire', 'volcano', 'drama', 'sunset', 'golden', 'landscape', 'mountain', 'snow', 'winter', 'dinosaur', 'jurassic', 'history', 'pyramid', 'ancient', 'documentary'],
    color: '#F97316',
    visualTag: 'sunset',
  },
  {
    id: 'vid-jellyfish-glow',
    title: '✨ Deep Sea Bioluminescent Neon Glow',
    src: 'https://test-videos.co.uk/vids/jellyfish/mp4/h264/720/Jellyfish_720_10s_1MB.mp4',
    category: 'tech',
    tags: ['jellyfish', 'glow', 'neon', 'crypto', 'dark', 'particles', 'ambient', 'space', 'galaxy', 'quantum', 'mystery', 'stars', 'cosmos', 'astronomy', 'alien', 'moon'],
    color: '#EC4899',
    visualTag: 'neon',
  },
  {
    id: 'vid-flower-bloom',
    title: '🌸 Organic Growth & Botanical Bloom',
    src: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
    category: 'nature',
    tags: ['flower', 'garden', 'nature', 'organic', 'blossom', 'spring', 'growth', 'creative', 'art', 'peace', 'plants', 'forest', 'meadow', 'field', 'green', 'biology', 'botanical'],
    color: '#10B981',
    visualTag: 'nature',
  },
];

/**
 * Intelligent keyword matching to pick the best stock video
 */
export function matchVideoForPrompt(prompt: string, sceneIndex = 0): VideoAsset {
  const p = prompt.toLowerCase();

  // 1. Animals / Pets / Farm / Wildlife / Nature
  if (p.includes('bunny') || p.includes('rabbit') || p.includes('cow') || p.includes('bull') || p.includes('farm') || p.includes('pasture') || p.includes('cat') || p.includes('dog') || p.includes('pet') || p.includes('animal') || p.includes('wildlife')) {
    return VERIFIED_STOCK_VIDEOS[2]; // vid-bunny-wildlife
  }

  // 2. Ocean / Water / Coast / Marine / Deep / Hydrothermal Vents
  if (p.includes('ocean') || p.includes('sea') || p.includes('water') || p.includes('beach') || p.includes('wave') || p.includes('surf') || p.includes('marine') || p.includes('tide') || p.includes('deep') || p.includes('vent')) {
    return VERIFIED_STOCK_VIDEOS[0]; // vid-ocean-waves
  }

  // 3. Sci-Fi / Action / Movie / Drama / Dragon / Cyberpunk / Tech
  if (p.includes('action') || p.includes('sci-fi') || p.includes('movie') || p.includes('film') || p.includes('cyber') || p.includes('dragon') || p.includes('story') || p.includes('car') || p.includes('speed') || p.includes('warrior')) {
    return VERIFIED_STOCK_VIDEOS[1]; // vid-sintel-action
  }

  // 4. Dramatic Earth / Volcano / Sunset / Aerial / Mountains / Winter / History / Documentary
  if (p.includes('volcano') || p.includes('fire') || p.includes('sunset') || p.includes('mountain') || p.includes('snow') || p.includes('dinosaur') || p.includes('jurassic') || p.includes('ancient') || p.includes('pyramid') || p.includes('documentary')) {
    return VERIFIED_STOCK_VIDEOS[3]; // vid-dramatic-nature
  }

  // 5. Space / Galaxy / Neon / Glow / Deep Sea / Quantum
  if (p.includes('space') || p.includes('galaxy') || p.includes('stars') || p.includes('cosmos') || p.includes('neon') || p.includes('glow') || p.includes('jellyfish') || p.includes('alien') || p.includes('quantum')) {
    return VERIFIED_STOCK_VIDEOS[4]; // vid-jellyfish-glow
  }

  // 6. Flowers / Garden / Botany / Organic / Blossom
  if (p.includes('flower') || p.includes('garden') || p.includes('plant') || p.includes('organic') || p.includes('spring') || p.includes('growth') || p.includes('bloom') || p.includes('biology')) {
    return VERIFIED_STOCK_VIDEOS[5]; // vid-flower-bloom
  }

  // Multi-tag score matching fallback
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

// In-memory cache for uploaded images in image-to-video mode
const imageCache: Map<string, HTMLImageElement> = new Map();

/**
 * Procedural Dynamic Live Visual Generator on HTML5 Canvas
 * Generates custom, theme-specific live animated video scenes for ANY prompt!
 */
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

  // CASE 1: Image-to-Video Mode (User uploaded an image)
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

      // Cinematic Ken Burns Zoom & Pan Effect
      const zoomSpeed = 0.04;
      const zoomFactor = 1.05 + Math.sin(time * zoomSpeed) * 0.05;
      const panX = Math.cos(time * 0.03) * 15;
      const panY = Math.sin(time * 0.02) * 10;

      ctx.translate(width / 2 + panX, height / 2 + panY);
      ctx.scale(zoomFactor, zoomFactor);

      // Aspect-ratio cover calculation
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

      // Atmospheric Motion Particles Layer
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

      // Cinematic Vignette Frame
      ctx.save();
      const vignette = ctx.createRadialGradient(
        width / 2,
        height / 2,
        Math.min(width, height) * 0.4,
        width / 2,
        height / 2,
        Math.max(width, height) * 0.75
      );
      vignette.addColorStop(0, 'rgba(0,0,0,0)');
      vignette.addColorStop(1, 'rgba(0,0,0,0.65)');
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
      return;
    }
  }

  // CASE 2: Thematic Procedural Rendering Based on Any Prompt
  const isPastureOrCow =
    p.includes('cow') || p.includes('farm') || p.includes('pasture') || p.includes('field') || p.includes('meadow') || p.includes('grass');
  const isSpaceOrGalaxy =
    p.includes('space') || p.includes('galaxy') || p.includes('stars') || p.includes('cosmos') || p.includes('alien') || p.includes('planet') || p.includes('astronaut');
  const isFireOrDragon =
    p.includes('dragon') || p.includes('fire') || p.includes('flame') || p.includes('volcano') || p.includes('lava') || p.includes('burn');
  const isOcean =
    p.includes('ocean') || p.includes('sea') || p.includes('water') || p.includes('beach') || p.includes('wave') || p.includes('underwater');
  const isCyberOrTech =
    p.includes('cyber') || p.includes('tech') || p.includes('ai') || p.includes('code') || p.includes('robot') || p.includes('matrix') || p.includes('future') || visualTag === 'cyberpunk';
  const isCarOrSpeed =
    p.includes('car') || p.includes('racing') || p.includes('drift') || p.includes('speed') || p.includes('drive') || p.includes('vehicle');

  const isSnowOrMountain =
    p.includes('snow') || p.includes('mountain') || p.includes('winter') || p.includes('ice') || p.includes('alpine') || p.includes('arctic');
  const isDinosaurOrJurassic =
    p.includes('dinosaur') || p.includes('jurassic') || p.includes('t-rex') || p.includes('fossil') || p.includes('primeval');

  // Background Gradient
  const grad = ctx.createLinearGradient(0, 0, width, height);

  if (isPastureOrCow) {
    // Sky to rolling green pastures
    grad.addColorStop(0, '#0284c7'); // Bright sky blue
    grad.addColorStop(0.45, '#38bdf8');
    grad.addColorStop(0.5, '#15803d'); // Rolling green field
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

  // Animated Theme Layer
  const horizon = height * 0.52;

  if (isPastureOrCow) {
    // Sun and rays
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

    // Rolling animated hills
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

    // Floating airborne creature / cow silhouette soaring across the sky
    if (p.includes('cow') || p.includes('flying')) {
      ctx.save();
      const flightX = ((time * 65) % (width + 160)) - 80;
      const flightY = height * 0.28 + Math.sin(time * 2.2) * 22;

      // Glowing aura
      ctx.shadowColor = '#FACC15';
      ctx.shadowBlur = 18;
      ctx.fillStyle = '#FFFFFF';

      // Flying body
      ctx.beginPath();
      ctx.ellipse(flightX, flightY, 26, 16, Math.PI / 18, 0, Math.PI * 2);
      ctx.fill();

      // Head
      ctx.beginPath();
      ctx.ellipse(flightX + 22, flightY - 6, 12, 10, 0, 0, Math.PI * 2);
      ctx.fill();

      // Wings / Cape
      ctx.fillStyle = 'rgba(250, 204, 21, 0.85)';
      ctx.beginPath();
      const wingFlap = Math.sin(time * 8) * 12;
      ctx.moveTo(flightX - 8, flightY - 4);
      ctx.lineTo(flightX + 6, flightY - 26 + wingFlap);
      ctx.lineTo(flightX + 16, flightY - 4);
      ctx.closePath();
      ctx.fill();

      // Trail particles
      for (let t = 0; t < 5; t++) {
        ctx.fillStyle = `rgba(250, 204, 21, ${0.8 - t * 0.15})`;
        ctx.beginPath();
        ctx.arc(flightX - 28 - t * 14, flightY + (t % 2) * 4, 3 - t * 0.4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  } else if (isSpaceOrGalaxy) {
    // Starfield warp
    ctx.save();
    const centerX = width / 2;
    const centerY = height / 2;
    for (let i = 0; i < 60; i++) {
      const angle = (i * 137.5) * (Math.PI / 180);
      const dist = ((i * 25 + time * 120) % (width * 0.7));
      const sx = centerX + Math.cos(angle) * dist;
      const sy = centerY + Math.sin(angle) * dist;
      const size = 1 + (dist / (width * 0.7)) * 3;

      ctx.fillStyle = i % 3 === 0 ? '#38bdf8' : i % 3 === 1 ? '#e879f9' : '#ffffff';
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(sx, sy, size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  } else if (isFireOrDragon) {
    // Fire embers
    ctx.save();
    for (let i = 0; i < 40; i++) {
      const px = (i * 47) % width;
      const py = height - ((time * 80 + i * 35) % height);
      const r = 2 + (i % 4);
      ctx.fillStyle = i % 2 === 0 ? '#f97316' : '#ef4444';
      ctx.shadowColor = '#ea580c';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  } else if (isCarOrSpeed) {
    // Speed lines & road horizon
    ctx.save();
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#f87171';
    ctx.shadowBlur = 14;

    const centerX = width / 2;
    for (let i = 0; i < 16; i++) {
      const rx = (i * 85 + (time * 240) % 85);
      ctx.beginPath();
      ctx.moveTo(centerX, horizon);
      ctx.lineTo(rx - width * 0.2, height);
      ctx.stroke();
    }
    ctx.restore();
  } else if (isSnowOrMountain) {
    // Snowy alpine mountain peaks & blizzard particles
    ctx.save();
    // Jagged mountain silhouette
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.moveTo(0, height);
    ctx.lineTo(0, horizon + 20);
    ctx.lineTo(width * 0.25, horizon - 90);
    ctx.lineTo(width * 0.45, horizon + 10);
    ctx.lineTo(width * 0.7, horizon - 120);
    ctx.lineTo(width * 0.88, horizon - 30);
    ctx.lineTo(width, horizon + 20);
    ctx.lineTo(width, height);
    ctx.closePath();
    ctx.fill();

    // Snow caps
    ctx.fillStyle = '#f1f5f9';
    ctx.beginPath();
    ctx.moveTo(width * 0.2, horizon - 60);
    ctx.lineTo(width * 0.25, horizon - 90);
    ctx.lineTo(width * 0.3, horizon - 65);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(width * 0.64, horizon - 80);
    ctx.lineTo(width * 0.7, horizon - 120);
    ctx.lineTo(width * 0.76, horizon - 85);
    ctx.closePath();
    ctx.fill();

    // Aurora Borealis Ribbon
    ctx.strokeStyle = 'rgba(52, 211, 153, 0.45)';
    ctx.lineWidth = 14;
    ctx.shadowColor = '#34d399';
    ctx.shadowBlur = 24;
    ctx.beginPath();
    for (let x = 0; x <= width; x += 40) {
      const ay = height * 0.2 + Math.sin(x * 0.008 + time * 1.5) * 25;
      if (x === 0) ctx.moveTo(x, ay);
      else ctx.lineTo(x, ay);
    }
    ctx.stroke();

    // Falling snowflakes
    for (let i = 0; i < 45; i++) {
      const sx = (i * 37 + time * 30) % width;
      const sy = (i * 29 + time * 55) % height;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.beginPath();
      ctx.arc(sx, sy, 1.5 + (i % 2.5), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  } else if (isDinosaurOrJurassic) {
    // Prehistoric volcanic jungle & primeval embers
    ctx.save();
    // Volcanic caldera silhouette
    ctx.fillStyle = '#271004';
    ctx.beginPath();
    ctx.moveTo(0, height);
    ctx.lineTo(0, horizon + 30);
    ctx.lineTo(width * 0.35, horizon - 75);
    ctx.lineTo(width * 0.42, horizon - 60); // crater dip
    ctx.lineTo(width * 0.5, horizon - 78);
    ctx.lineTo(width * 0.8, horizon + 30);
    ctx.lineTo(width, horizon + 20);
    ctx.lineTo(width, height);
    ctx.closePath();
    ctx.fill();

    // Crater magma glow
    ctx.shadowColor = '#f97316';
    ctx.shadowBlur = 35;
    ctx.fillStyle = 'rgba(249, 115, 22, 0.7)';
    ctx.beginPath();
    ctx.ellipse(width * 0.42, horizon - 62, 25, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Towering primeval foliage silhouettes
    ctx.fillStyle = '#0f291e';
    for (let i = 0; i < 8; i++) {
      const fx = i * (width / 7);
      ctx.beginPath();
      ctx.arc(fx, horizon + 40, 45, 0, Math.PI, true);
      ctx.fill();
    }

    // Floating prehistoric embers / spores
    for (let i = 0; i < 35; i++) {
      const ex = (i * 61 + Math.sin(time + i) * 20) % width;
      const ey = height - ((time * 45 + i * 40) % height);
      ctx.fillStyle = i % 2 === 0 ? '#facc15' : '#fb923c';
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(ex, ey, 2 + (i % 2), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // Biological Life-Forms & Digital Twin Layer (Human, Animal & Organism Biology)
  const isLivingCreature =
    p.includes('animal') || p.includes('leopard') || p.includes('tiger') || p.includes('wolf') ||
    p.includes('human') || p.includes('avatar') || p.includes('biology') || p.includes('skin') ||
    p.includes('twin') || p.includes('micro') || p.includes('creature') || p.includes('fauna') ||
    p.includes('documentary') || p.includes('nature');

  if (isLivingCreature) {
    ctx.save();
    const centerX = width * 0.5;
    const centerY = height * 0.52;
    const breath = 1.0 + Math.sin(time * 1.6) * 0.04;
    const saccadeX = Math.sin(time * 0.7) * 4;
    const saccadeY = Math.cos(time * 0.9) * 2;

    // Epidermal subsurface melanin warmth glow
    const subGlow = ctx.createRadialGradient(
      centerX + saccadeX,
      centerY - 40,
      15,
      centerX + saccadeX,
      centerY - 20,
      180 * breath
    );
    subGlow.addColorStop(0, 'rgba(251, 146, 60, 0.45)');
    subGlow.addColorStop(0.5, 'rgba(194, 65, 12, 0.15)');
    subGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = subGlow;
    ctx.fillRect(centerX - 200, centerY - 200, 400, 400);

    // Living silhouette & muscular posture
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.scale(breath, breath);

    // Torso / Body structure
    ctx.fillStyle = 'rgba(24, 24, 27, 0.85)';
    ctx.beginPath();
    ctx.ellipse(0, 40, 50, 75, 0, 0, Math.PI * 2);
    ctx.fill();

    // Head & Cranial volume
    ctx.beginPath();
    ctx.ellipse(saccadeX, -45 + saccadeY, 32, 40, 0, 0, Math.PI * 2);
    ctx.fill();

    // Specular Corneal / Eye Caustics with micro-saccades
    const blinkCycle = Math.sin(time * 0.9);
    const isBlinking = blinkCycle > 0.94;
    if (!isBlinking) {
      // Left Eye
      ctx.fillStyle = '#38bdf8';
      ctx.shadowColor = '#0284c7';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.ellipse(-14 + saccadeX, -46 + saccadeY, 4, 3, 0, 0, Math.PI * 2);
      ctx.fill();

      // Right Eye
      ctx.beginPath();
      ctx.ellipse(14 + saccadeX, -46 + saccadeY, 4, 3, 0, 0, Math.PI * 2);
      ctx.fill();

      // Corneal light reflection glint
      ctx.fillStyle = '#ffffff';
      ctx.shadowBlur = 4;
      ctx.fillRect(-15 + saccadeX, -48 + saccadeY, 1.5, 1.5);
      ctx.fillRect(13 + saccadeX, -48 + saccadeY, 1.5, 1.5);
    }
    ctx.restore();
    ctx.restore();
  }

  // Live Audio Horizon Reactive Waveform
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

  // 35mm Natural Film Grain & Volumetric Light Caustics (Life-Like Post-Process)
  ctx.save();
  // Subtle organic film grain dots
  for (let g = 0; g < 60; g++) {
    const gx = (g * 137.5 + time * 90) % width;
    const gy = (g * 89.3 + time * 70) % height;
    ctx.fillStyle = g % 2 === 0 ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.04)';
    ctx.fillRect(gx, gy, 1.5, 1.5);
  }

  // Anamorphic Volumetric Lens Glare
  const lensGrad = ctx.createLinearGradient(0, height * 0.3, width, height * 0.7);
  lensGrad.addColorStop(0, 'rgba(56, 189, 248, 0.06)');
  lensGrad.addColorStop(0.5, 'rgba(236, 72, 153, 0.03)');
  lensGrad.addColorStop(1, 'rgba(250, 204, 21, 0.05)');
  ctx.fillStyle = lensGrad;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}
