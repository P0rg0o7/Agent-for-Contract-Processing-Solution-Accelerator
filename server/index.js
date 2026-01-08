import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = 5174;

app.use(express.json({ limit: '2mb' }));

const requiredEnv = ['OPENROUTER_API_KEY'];

app.post('/api/generate', async (req, res) => {
  const missing = requiredEnv.filter((key) => !process.env[key]);
  if (missing.length) {
    return res.status(500).json({
      error: 'Server configuration error',
      detail: `Missing environment variables: ${missing.join(', ')}`
    });
  }

  const { prompt, negative, model, aspectRatio, seed, transparentBackground } = req.body ?? {};

  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Prompt is required.' });
  }

  const openRouterModel = model || process.env.OPENROUTER_MODEL;
  if (!openRouterModel) {
    return res.status(400).json({ error: 'Model name is required.' });
  }

  const requestBody = {
    model: openRouterModel,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          ...(negative ? [{ type: 'text', text: `Negative constraints: ${negative}` }] : [])
        ]
      }
    ],
    modalities: ['image', 'text'],
    ...(seed ? { seed } : {}),
    ...(aspectRatio ? { aspect_ratio: aspectRatio } : {}),
    ...(transparentBackground ? { background: 'transparent' } : {})
  };

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.OPENROUTER_SITE_URL || 'http://localhost:5173',
        'X-Title': process.env.OPENROUTER_APP_NAME || 'Sticker Worksheet'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      let detail = 'OpenRouter request failed.';
      try {
        const parsed = JSON.parse(errorText);
        detail = parsed?.error?.message || detail;
      } catch {
        detail = errorText || detail;
      }

      return res.status(response.status).json({
        error: 'Image generation failed.',
        detail
      });
    }

    const data = await response.json();
    const images = extractImages(data);

    if (images.length === 0) {
      return res.status(502).json({
        error: 'No image returned by model.',
        detail: 'The model response did not include any image data.'
      });
    }

    return res.json({ images, raw: { id: data.id } });
  } catch (error) {
    return res.status(500).json({
      error: 'Network error while contacting OpenRouter.',
      detail: error?.message || 'Unknown error'
    });
  }
});

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Proxy server running on http://localhost:${port}`);
});

function extractImages(data) {
  const images = [];
  const choices = data?.choices || [];

  for (const choice of choices) {
    const message = choice?.message;
    if (!message) {
      continue;
    }

    if (Array.isArray(message.content)) {
      for (const part of message.content) {
        if (part?.type === 'image_url' && part?.image_url?.url) {
          images.push(part.image_url.url);
        }
        if (part?.type === 'image' && part?.image?.url) {
          images.push(part.image.url);
        }
        if (part?.type === 'text' && typeof part.text === 'string') {
          const found = extractUrlsFromText(part.text);
          images.push(...found);
        }
      }
    }

    if (typeof message.content === 'string') {
      images.push(...extractUrlsFromText(message.content));
    }

    if (Array.isArray(message.images)) {
      for (const image of message.images) {
        if (image?.url) {
          images.push(image.url);
        }
      }
    }
  }

  if (Array.isArray(data?.images)) {
    for (const image of data.images) {
      if (typeof image === 'string') {
        images.push(image);
      }
      if (image?.url) {
        images.push(image.url);
      }
    }
  }

  return Array.from(new Set(images));
}

function extractUrlsFromText(text) {
  const matches = text.match(/(data:image\/[a-zA-Z]+;base64,[^\s]+)|(https?:\/\/[^\s]+\.(png|jpg|jpeg|webp))/g);
  return matches || [];
}
