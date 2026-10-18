export const VERIFIED_STOCK_VIDEOS: VideoAsset[] = [
  // NEW - REAL PIG EATING VIDEO - No API needed
  {
    id: 'vid-pig-eating',
    title: '🐖 Real Pig Eating & Feeding',
    src: 'https://upload.wikimedia.org/wikipedia/commons/8/8b/Piglets_feeding.webm',
    category: 'animals',
    tags: ['pig', 'pigs', 'piglet', 'boar', 'swine', 'hog', 'pork', 'eating', 'feeding', 'farm', 'mud', 'sty'],
    color: '#F472B6',
    visualTag: 'pig',
  },
  {
    id: 'vid-ocean-waves',
    title: '🌊 Cinematic Ocean Waves & Coastline',
    src: 'https://vjs.zencdn.net/v/oceans.mp4',
    category: 'nature',
    tags: ['ocean', 'sea', 'water', 'waves', 'beach', 'coast', 'nature', 'blue', 'surf', 'island', 'travel', 'summer', 'marine', 'tide', 'deep', 'diving', 'bird'],
    color: '#06B6D4',
    visualTag: 'ocean',
  },
  // ... keep your other 6 videos after this
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

  // FIX: PIG MUST BE FIRST
  if (p.includes('pig') || p.includes('boar') || p.includes('swine') || p.includes('hog') || p.includes('piglet')) {
    return VERIFIED_STOCK_VIDEOS.find(v => v.id === 'vid-pig-eating')!;
  }
  if (p.includes('cow') || p.includes('bull') || p.includes('farm') || p.includes('pasture') || p.includes('bunny') || p.includes('rabbit')) {
    return VERIFIED_STOCK_VIDEOS.find(v => v.id === 'vid-bunny-viral')!;
  }
  if (p.includes('cat') || p.includes('kitten') || p.includes('pet') || p.includes('feline') || p.includes('dog') || p.includes('puppy')) {
    return VERIFIED_STOCK_VIDEOS.find(v => v.id === 'vid-cat-jump')!;
  }
  if (p.includes('ocean') || p.includes('sea') || p.includes('water') || p.includes('beach') || p.includes('wave') || p.includes('surf') || p.includes('river') || p.includes('diving') || p.includes('bird')) {
    return VERIFIED_STOCK_VIDEOS.find(v => v.id === 'vid-ocean-waves')!;
  }
  // ... rest of your logic same

  // Fallback - score match, not sceneIndex
  let bestMatch = VERIFIED_STOCK_VIDEOS[0];
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
  // If no tag matched (pig case before fix), use generative canvas, not ocean
  if (highestScore <= 0) {
    // Return pig if prompt contains eating/feeding and animal
    if (p.includes('eating') || p.includes('feeding')) {
      return VERIFIED_STOCK_VIDEOS[0]; // pig is now index 0
    }
  }
  return bestMatch;
}
