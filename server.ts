import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini Client
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey) {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
} else {
  console.warn('⚠️ Warning: GEMINI_API_KEY is not defined. AI Assistant features will be disabled.');
}

// 1. API: Smart Agricultural AI Assistant
app.post('/api/gemini', async (req, res) => {
  try {
    const { task, prompt } = req.body;

    if (!ai) {
      return res.status(503).json({
        error: 'Tính năng AI chưa được cấu hình. Vui lòng kiểm tra phím bí mật GEMINI_API_KEY trong cấu hình hệ thống.'
      });
    }

    let fullPrompt = prompt;

    // Structure prompts based on tasks to give specialized agricultural advice
    if (task === 'optimize-description') {
      fullPrompt = `Bạn là một chuyên gia marketing nông sản Việt Nam xuất sắc. Hãy viết lại mô tả sản phẩm sau cho nông dân một cách thu hút nhất, làm nổi bật tính tươi ngon, nguồn gốc hữu cơ, quy trình thu hoạch an toàn vệ sinh, cam kết không chất bảo quản, kích thích người tiêu dùng mua hàng. Hãy chia thành 3 phần: Giới thiệu hấp dẫn, Thông tin chi tiết (gồm quy trình trồng/thu hoạch), Hướng dẫn sử dụng và bảo quản. Giữ ngôn ngữ mộc mạc, đáng tin cậy của nhà nông.
Sản phẩm: ${prompt}`;
    } else if (task === 'recipe-advisor') {
      fullPrompt = `Bạn là một đầu bếp Việt Nam chuyên nghiệp và chuyên gia dinh dưỡng nông sản. Hãy gợi ý 2-3 món ăn ngon dễ làm từ nông sản tươi ngon sau, nêu rõ lợi ích dinh dưỡng cho sức khỏe người tiêu dùng, mẹo lựa chọn rau củ quả tươi ngon nhất khi mua sắm, và cách bảo quản nguyên liệu tươi lâu nhất tại nhà.
Nông sản: ${prompt}`;
    } else if (task === 'farmer-advisor') {
      fullPrompt = `Bạn là kỹ sư nông nghiệp thông minh và chuyên gia tư vấn kinh tế nông thôn Việt Nam. Hãy trả lời câu hỏi sau của nông dân liên quan đến kỹ thuật gieo trồng, phòng trừ sâu bệnh sinh học, kinh nghiệm thu hoạch bảo quản sau thu hoạch, hoặc tư vấn định giá nông sản mùa vụ một cách cụ thể, thực tế và dễ áp dụng nhất.
Câu hỏi: ${prompt}`;
    } else {
      // General agricultural chatbot
      fullPrompt = `Bạn là "Trợ Lý Nông Sản Việt" - Một AI thông minh chuyên phục vụ trao đổi buôn bán nông sản trực tiếp. Hãy trả lời thắc mắc sau của người dùng một cách thân thiện, hữu ích, tập trung vào giá trị nông sản sạch, hỗ trợ nông dân và bảo vệ sức khỏe người tiêu dùng.
Nội dung: ${prompt}`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: fullPrompt,
    });

    const reply = response.text;
    res.json({ text: reply });
  } catch (error) {
    console.error('Gemini API error:', error);
    res.status(500).json({
      error: 'Có lỗi xảy ra khi xử lý phản hồi từ AI. Vui lòng thử lại sau ít phút.',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

// health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Configure Vite or Static Assets serving based on environment
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running at http://localhost:${PORT}`);
  });
}

startServer();
