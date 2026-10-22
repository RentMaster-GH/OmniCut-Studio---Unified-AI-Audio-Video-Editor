export interface SubtitleCue { start: number; end: number; text: string; }

export function generateJollofScript(): SubtitleCue[] {
  return [
    { start: 0, end: 18, text: "Welcome to authentic Ghanaian Jollof! Today we cook the perfect party jollof in 10 minutes." },
    { start: 18, end: 38, text: "Ingredients: 3 cups jasmine rice, fresh tomatoes, onions, bell peppers, tomato paste, and spices." },
    { start: 38, end: 58, text: "First, wash your rice thoroughly and blend your tomatoes, onions, and peppers into a smooth puree." },
    { start: 58, end: 80, text: "Chop your onions finely. This is the secret base for that rich jollof flavor." },
    { start: 80, end: 105, text: "Heat oil in your pot, fry the onions until golden, then add tomato paste and fry for 5 minutes." },
    { start: 105, end: 135, text: "Now pour in your blended tomato mix. Let it fry until the oil separates. This is key!" },
    { start: 135, end: 165, text: "Add thyme, curry, bay leaves, and stock cubes. Stir well and taste the stew." },
    { start: 165, end: 195, text: "Add your washed rice, stir to coat every grain with that beautiful red stew." },
    { start: 195, end: 225, text: "Add water just to cover the rice, cover with foil and lid. Cook on low heat for 20 minutes." },
    { start: 225, end: 255, text: "Do NOT open it! Let it steam. The smoky party flavor comes from this step." },
    { start: 255, end: 285, text: "Check now! Fluffy, separated grains with that signature orange-red color." },
    { start: 285, end: 315, text: "Stir gently from bottom, add butter for richness and extra sliced onions." },
    { start: 315, end: 350, text: "Mold your jollof on a plate, add fried chicken, plantain, and coleslaw." },
    { start: 350, end: 380, text: "Look at that! Perfect Ghanaian party jollof. Smoky, flavorful, unforgettable." },
    { start: 380, end: 420, text: "Subscribe for more African recipes. What should we cook next? Comment below!" },
    { start: 420, end: 600, text: "Enjoy your meal! Medaase! This jollof will make you famous at any party. [Music continues]" },
  ];
}

export function cuesToVTT(cues: SubtitleCue[]): string {
  let vtt = "WEBVTT\n\n";
  cues.forEach(c => {
    const fmt = (s: number) => `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toFixed(3).padStart(6,'0')}`;
    vtt += `${fmt(c.start)} --> ${fmt(c.end)}\n${c.text}\n\n`;
  });
  return vtt;
}

export function cuesToSRT(cues: SubtitleCue[]): string {
  return cues.map((c,i) => {
    const fmt = (s: number) => {
      const h = Math.floor(s/3600); const m = Math.floor((s%3600)/60); const sec = Math.floor(s%60); const ms = Math.floor((s%1)*1000);
      return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')},${String(ms).padStart(3,'0')}`;
    };
    return `${i+1}\n${fmt(c.start)} --> ${fmt(c.end)}\n${c.text}\n`;
  }).join('\n');
}
