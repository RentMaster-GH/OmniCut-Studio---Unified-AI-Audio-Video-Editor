/**
 * OmniCut Studio - SELF-SUFFICIENT GENERATIVE ENGINE
 * No mp4s. No API. No Pexels. Infinite prompts.
 * Every prompt generates a unique procedural scene.
 */

export interface VideoAsset {
  id: string;
  title: string;
  src: string;
  category: string;
  tags: string[];
  color: string;
  visualTag: string;
  isGenerative: boolean;
}

export function matchVideoForPrompt(prompt: string): VideoAsset {
  const p = prompt.toLowerCase();
  const hash = prompt.split('').reduce((a, b) => a + b.charCodeAt(0), 0) % 360;
  return {
    id: `gen-${hash}-${Date.now()}`,
    title: prompt.slice(0, 40),
    src: '', // Empty = force generative canvas
    category: 'generative',
    tags: p.split(' '),
    color: `hsl(${hash}, 80%, 60%)`,
    visualTag: p,
    isGenerative: true
  }
}

const imageCache: Map<string, HTMLImageElement> = new Map();

function hashPrompt(prompt: string): number {
  return prompt.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
}

function drawPig(ctx: CanvasRenderingContext2D, x: number, y: number, time: number, isEating: boolean, scale = 1) {
  ctx.save();
  ctx.scale(scale, scale);
  const eatBob = isEating ? Math.sin(time * 10) * 6 : Math.sin(time * 0.5) * 2;
  
  // Body
  ctx.fillStyle = '#f9a8d4';
  ctx.beginPath();
  ctx.ellipse(x, y, 70, 38, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#ec4899';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Legs
  ctx.fillStyle = '#f9a8d4';
  [[-35, 20], [-15, 22], [15, 22], [35, 20]].forEach(([ox, oy]) => {
    ctx.fillRect(x + ox, y + oy, 12, 22);
  });

  // Head
  ctx.beginPath();
  ctx.ellipse(x + 62, y + 8 + eatBob, 34, 28, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Snout
  ctx.fillStyle = '#f472b6';
  ctx.beginPath();
  ctx.ellipse(x + 88, y + 15 + eatBob, 14, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  // Nostrils
  ctx.fillStyle = '#831843';
  ctx.beginPath();
  ctx.arc(x + 86, y + 13 + eatBob, 2, 0, Math.PI * 2);
  ctx.arc(x + 91, y + 13 + eatBob, 2, 0, Math.PI * 2);
  ctx.fill();

  // Eye
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.arc(x + 70, y + 2 + eatBob, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(x + 71, y + 1 + eatBob, 1.5, 0, Math.PI * 2);
  ctx.fill();

  // Ear
  ctx.fillStyle = '#f9a8d4';
  ctx.beginPath();
  ctx.ellipse(x + 55, y - 18 + eatBob, 12, 16, -0.3, 0, Math.PI * 2);
  ctx.fill();

  // Tail
  ctx.strokeStyle = '#f9a8d4';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x - 65, y - 5, 8, 0, Math.PI * 1.5);
  ctx.stroke();

  ctx.restore();
}

function drawParticles(ctx: CanvasRenderingContext2D, x: number, y: number, time: number, type: 'food' | 'spark' | 'water') {
  for (let i = 0; i < 12; i++) {
    const px = x + (Math.random() - 0.5) * 60 + Math.sin(time * 5 + i) * 10;
    const py = y + Math.random() * 20 + Math.sin(time * 8 + i) * 5;
    if (type === 'food') {
      ctx.fillStyle = `hsl(${25 + i * 5}, 85%, 60%)`;
      ctx.beginPath();
      ctx.arc(px, py, 3 + Math.random() * 2, 0, Math.PI * 2);
      ctx.fill();
    } else if (type === 'spark') {
      ctx.fillStyle = `hsla(${50 + i * 10}, 100%, 60%, ${0.5 + Math.sin(time + i) * 0.3})`;
      ctx.beginPath();
      ctx.arc(px, py, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

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
  const p = (prompt || visualTag || 'OmniCut').toLowerCase();
  const has = (w: string) => p.includes(w);
  const hue = hashPrompt(p) % 360;
  const t = time;

  // IMAGE MODE
  if (imageSrc) {
    let img = imageCache.get(imageSrc);
    if (!img) {
      img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = imageSrc;
      imageCache.set(imageSrc, img);
    }
    if (img.complete && img.naturalWidth > 0) {
      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, 0, width, height);
      const zoom = 1.05 + Math.sin(t * 0.04) * 0.05;
      const panX = Math.cos(t * 0.03) * 15;
      const panY = Math.sin(t * 0.02) * 10;
      ctx.save();
      ctx.translate(width / 2 + panX, height / 2 + panY);
      ctx.scale(zoom, zoom);
      const aspect = img.naturalWidth / img.naturalHeight;
      let dw = width, dh = height;
      if (aspect > width / height) dw = height * aspect; else dh = width / aspect;
      ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh);
      ctx.restore();
      return;
    }
  }

  // BACKGROUND BASED ON PROMPT - INFINITE VARIATIONS
  const bg = ctx.createLinearGradient(0, 0, 0, height);
  if (has('farm') || has('pig') || has('cow') || has('field') || has('grass') || has('pasture')) {
    bg.addColorStop(0, `hsl(${200}, 70%, 65%)`);
    bg.addColorStop(0.48, `hsl(${200}, 60%, 75%)`);
    bg.addColorStop(0.5, `hsl(${120}, 40%, 35%)`);
    bg.addColorStop(1, `hsl(${120}, 35%, 20%)`);
  } else if (has('ocean') || has('sea') || has('beach') || has('water') || has('wave')) {
    bg.addColorStop(0, '#0f172a');
    bg.addColorStop(0.5, '#0e7490');
    bg.addColorStop(1, '#083344');
  } else if (has('space') || has('galaxy') || has('stars') || has('cosmos') || has('planet')) {
    bg.addColorStop(0, '#020617');
    bg.addColorStop(1, '#1e1b4b');
  } else if (has('cyber') || has('neon') || has('city') || has('future') || has('tech')) {
    bg.addColorStop(0, '#09090b');
    bg.addColorStop(1, `hsl(${hue}, 60%, 15%)`);
  } else {
    bg.addColorStop(0, `hsl(${hue}, 50%, 18%)`);
    bg.addColorStop(0.5, `hsl(${(hue+20)%360}, 45%, 25%)`);
    bg.addColorStop(1, `hsl(${(hue+40)%360}, 35%, 12%)`);
  }
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  // STARS FOR SPACE OR NIGHT
  if (has('space') || has('night') || has('stars')) {
    ctx.save();
    for (let i = 0; i < 100; i++) {
      const sx = (i * 137 + hashPrompt(p + i)) % width;
      const sy = (i * 57 + Math.sin(i) * 100 + t * 5) % (height * 0.6);
      ctx.fillStyle = `rgba(255,255,255,${0.3 + Math.sin(t + i) * 0.3})`;
      ctx.beginPath();
      ctx.arc(sx, sy, (i % 3) * 0.8 + 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // GROUND / HORIZON
  const horizon = height * 0.52;
  if (has('farm') || has('pig') || has('cow') || has('field')) {
    // Sun
    ctx.save();
    const sunGrad = ctx.createRadialGradient(width * 0.78, height * 0.18, 10, width * 0.78, height * 0.18, 110);
    sunGrad.addColorStop(0, 'rgba(254,240,138,0.9)');
    sunGrad.addColorStop(1, 'rgba(253,224,71,0)');
    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(width * 0.78, height * 0.18, 110, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // MAIN SUBJECT - ANY PROMPT WORKS
  const centerX = width * 0.5;
  const centerY = height * 0.62;

  if (has('pig') || has('boar') || has('swine') || has('hog')) {
    const isEating = has('eat') || has('feed') || has('munch');
    drawPig(ctx, centerX, centerY, t, isEating, 1.2);
    
    // Trough if eating
    if (isEating) {
      ctx.fillStyle = '#78350f';
      ctx.fillRect(centerX + 20, centerY + 32, 120, 16);
      ctx.fillStyle = '#451a03';
      ctx.fillRect(centerX + 20, centerY + 32, 120, 4);
      drawParticles(ctx, centerX + 80, centerY + 28, t, 'food');
    }
    
    // Label
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🐖 PIG EATING - PROCEDURAL GENERATIVE', centerX, height * 0.92);
  }
  else if (has('cow') || has('bull')) {
    ctx.save();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, 80, 45, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.fillStyle = '#000';
    [[-20,-10],[20,-5],[0,15]].forEach(([ox,oy])=>{
      ctx.beginPath();
      ctx.ellipse(centerX+ox, centerY+oy, 12, 10, 0, 0, Math.PI*2);
      ctx.fill();
    });
    ctx.fillStyle = '#f5f5dc';
    ctx.beginPath();
    ctx.ellipse(centerX+70, centerY+5+Math.sin(t*8)*3, 30, 25, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.restore();
    if (has('eat')) drawParticles(ctx, centerX+70, centerY+20, t, 'food');
  }
  else if (has('cat') || has('dog') || has('bunny') || has('rabbit')) {
    const emoji = has('cat') ? '🐱' : has('dog') ? '🐶' : '🐰';
    ctx.save();
    ctx.font = '100px serif';
    ctx.textAlign = 'center';
    const bounce = has('jump') || has('run') ? Math.abs(Math.sin(t*4))*20 : Math.sin(t*0.8)*5;
    ctx.fillText(emoji, centerX, centerY + bounce);
    ctx.restore();
    if (has('eat')) drawParticles(ctx, centerX, centerY+30, t, 'food');
  }
  else if (has('dragon') || has('dinosaur') || has('t-rex')) {
    ctx.save();
    ctx.fillStyle = has('dragon') ? '#16a34a' : '#78350f';
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, 90, 50, Math.sin(t*0.5)*0.1, 0, Math.PI*2);
    ctx.fill();
    // Head
    ctx.beginPath();
    ctx.ellipse(centerX+80, centerY-10+Math.sin(t*2)*5, 40, 35, 0, 0, Math.PI*2);
    ctx.fill();
    // Fire
    if (has('fire') || has('dragon')) {
      ctx.fillStyle = `hsl(${10+Math.sin(t*10)*10}, 100%, 60%)`;
      ctx.beginPath();
      ctx.moveTo(centerX+110, centerY-10);
      ctx.lineTo(centerX+150+Math.sin(t*10)*10, centerY-20);
      ctx.lineTo(centerX+150, centerY);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }
  else {
    // GENERIC FOR ANY OTHER PROMPT - Abstract generative art unique to prompt
    ctx.save();
    for (let i = 0; i < 60; i++) {
      const px = (hashPrompt(p+i.toString()) + t* (30+i%20)) % width;
      const py = (i*73 + Math.sin(t*0.5+i)*100 + t*15) % height;
      const size = 2 + (hashPrompt(p+i.toString()) % 6);
      ctx.fillStyle = `hsla(${(hue+i*15)%360}, 80%, 60%, ${0.6 + Math.sin(t+i)*0.3})`;
      ctx.beginPath();
      ctx.arc(px, py, size, 0, Math.PI*2);
      ctx.fill();
    }
    // Central orb that pulses with prompt
    ctx.fillStyle = `hsla(${hue}, 80%, 60%, 0.15)`;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 80 + Math.sin(t*2)*15, 0, Math.PI*2);
    ctx.fill();
    ctx.strokeStyle = `hsl(${hue}, 80%, 60%)`;
    ctx.lineWidth = 2;
    ctx.stroke();
    
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 18px Syne, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(p.slice(0,30).toUpperCase(), centerX, centerY);
    ctx.font = '12px JetBrains Mono';
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fillText('100% PROCEDURAL • NO EXTERNAL VIDEO • INFINITE PROMPTS', centerX, centerY+28);
    ctx.restore();
  }

  // GLOBAL ANIMATED WAVE LINE (your signature)
  ctx.save();
  ctx.beginPath();
  ctx.strokeStyle = `hsl(${hue}, 80%, 60%)`;
  ctx.lineWidth = 2.5;
  ctx.shadowColor = `hsl(${hue}, 80%, 60%)`;
  ctx.shadowBlur = 12;
  ctx.moveTo(0, horizon);
  for (let x = 0; x <= width; x += 14) {
    const wave = Math.sin(x*0.015 + t*3.5)* (isPlaying?18:6);
    ctx.lineTo(x, horizon + wave);
  }
  ctx.stroke();
  ctx.restore();
}

// BACKWARD COMPATIBILITY - keeps old imports working
export const VERIFIED_STOCK_VIDEOS: VideoAsset[] = [];
