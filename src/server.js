const express = require('express');
const formidable = require('formidable');
const fs = require('fs');
const path = require('path');
const { Configuration, OpenAIApi } = require('openai');

// 初始化 OpenAI
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY, // 设置你的 OpenAI API 密钥
});
const openai = new OpenAIApi(configuration);

const app = express();
const PORT = process.env.PORT || 3000;
const UPLOAD_DIR = path.join(__dirname, '../public/uploads');

// 确保上传目录存在
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// 静态文件服务
app.use(express.static('public'));

// 处理图片上传和风格转换
app.post('/convert', async (req, res) => {
  try {
    const form = formidable({ multiples: true });
    const { fields, files } = await form.parse(req);

    // 获取上传的图片和风格描述
    const imageFile = files.image;
    const styleDescription = fields.styleDescription[0];

    if (!imageFile || !styleDescription) {
      return res.status(400).json({ error: 'Please upload an image and provide a style description.' });
    }

    // 读取上传的图片
    const imageBuffer = fs.readFileSync(imageFile.filepath);
    const imageBase64 = imageBuffer.toString('base64');

    // 调用 OpenAI API 进行图片转换
    const response = await openai.createImageEdit(
      [
        {
          image: `data:image/${imageFile.mimetype.split('/')[1]};base64,${imageBase64}`,
          prompt: styleDescription,
          n: 1,
          size: '512x512',
        },
      ],
      {
        response_format: 'url',
      }
    );

    // 获取生成的图片 URL
    const generatedImageUrl = response.data.data[0].url;

    // 返回结果
    res.json({
      success: true,
      imageUrl: generatedImageUrl,
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'An error occurred during image conversion.' });
  }
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
