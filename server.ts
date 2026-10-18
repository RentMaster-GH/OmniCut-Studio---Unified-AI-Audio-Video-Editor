cat > server.ts << 'EOF'
import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
app.use(express.json({ limit: '50mb' }));
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

app.get('/api/health', (req,res)=> res.json({status:'ok', gemini: !!process.env.GEMINI_API_KEY}));
app.post('/api/ai/generate-script', async (req,res)=>{
  try{
    const {prompt, tone='engaging', duration='30s', format='16:9'} = req.body;
    if(!prompt) return res.status(400).json({error:'Prompt required'});
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: `Create video script for: "${prompt}". Tone: ${tone}, Duration: ${duration}, Format: ${format}`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            projectTitle: {type: Type.STRING},
            summary: {type: Type.STRING},
            scenes: {type: Type.ARRAY, items: {type: Type.OBJECT, properties: {title:{type:Type.STRING}, duration:{type:Type.NUMBER}, narration:{type:Type.STRING}, visualPrompt:{type:Type.STRING}, overlayText:{type:Type.STRING}, brollKeyword:{type:Type.STRING}, audioMood:{type:Type.STRING}}, required:['title','duration','narration','visualPrompt','overlayText','brollKeyword','audioMood']}},
            suggestedMusic:{type:Type.STRING}, viralScore:{type:Type.NUMBER}, hookAnalysis:{type:Type.STRING}
          },
          required:['projectTitle','summary','scenes','suggestedMusic','viralScore','hookAnalysis']
        }
      }
    });
    res.json(JSON.parse(response.text||'{}'));
  }catch(e:any){
    console.error(e);
    res.json({projectTitle: req.body.prompt, summary:'Fallback storyboard', scenes:[{title:'Hook',duration:5,narration:'Hook narration',visualPrompt:'Futuristic workspace',overlayText:'START NOW',brollKeyword:'technology',audioMood:'cinematic'}], suggestedMusic:'Upbeat', viralScore:90, hookAnalysis:'Fallback'});
  }
});

async function startServer(){
  if(process.env.NODE_ENV!=='production'){
    const vite = await createViteServer({server:{middlewareMode:true},appType:'spa'});
    app.use(vite.middlewares);
  }else{
    app.use(express.static(path.join(__dirname,'dist')));
    app.get('*',(req,res)=> res.sendFile(path.join(__dirname,'dist','index.html')));
  }
  app.listen(PORT,'0.0.0.0',()=> console.log(`🚀 Running on ${PORT}`));
}
startServer();
EOF
cat server.ts
