export type GenerateImageRequest = {
  prompt: string;
  negative: string;
  model: string;
  aspectRatio: string;
  seed?: string;
  transparentBackground?: boolean;
};

export type GenerateImageResponse = {
  images: string[];
};

export async function generateStickerImage(payload: GenerateImageRequest): Promise<GenerateImageResponse> {
  const response = await fetch('/api/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const message = data?.detail || data?.error || 'Image generation failed.';
    throw new Error(message);
  }

  const data = await response.json();
  if (!data.images || !Array.isArray(data.images)) {
    throw new Error('Unexpected response from image generator.');
  }

  return data;
}
