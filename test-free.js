const prompt = "African woman dancing, cinematic";
const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1280&height=720&model=turbo&seed=${Math.floor(Math.random()*9999)}&nologo=true`;
console.log("Your free video/image URL:");
console.log(url);
console.log("\nOpen this in browser - it works 100% free, no key");
