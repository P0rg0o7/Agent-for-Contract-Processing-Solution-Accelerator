# Sticker worksheet (De Bono hats)

A local-first worksheet that turns De Bono thinking hats notes into a polished image-generation prompt, then calls OpenRouter to generate a sticker image with a Gemini image model.

## Prerequisites

- Node.js 18+
- An OpenRouter API key with access to your chosen Gemini image model

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create an `.env` file in the project root (copy from `.env.example`) and fill in your values:

```bash
cp .env.example .env
```

3. Start the app (frontend + proxy server):

```bash
npm run dev
```

- Frontend: `http://localhost:5173`
- Proxy server: `http://localhost:5174`

## OpenRouter configuration

This app reads OpenRouter settings from environment variables (server-side only):

- `OPENROUTER_API_KEY` – required.
- `OPENROUTER_MODEL` – default model string (e.g. a Gemini image model). This is configurable in the UI too.
- `OPENROUTER_SITE_URL` – used for the `HTTP-Referer` header.
- `OPENROUTER_APP_NAME` – used for the `X-Title` header.

### Model naming note

OpenRouter model strings can change or differ between providers. Keep the model name configurable by setting `OPENROUTER_MODEL` in `.env` and by editing it in the **Advanced options** panel.

## How it works

- The worksheet collects structured prompts by hat colour.
- The prompt preview updates live and includes sticker quality guards.
- The proxy server relays `/api/generate` to OpenRouter and injects your API key.

## Troubleshooting

- **“Missing environment variables”** – check the `.env` file exists and contains `OPENROUTER_API_KEY`.
- **401/403 from OpenRouter** – verify your API key and model access.
- **No image returned** – the selected model may not support images. Update the model string in Advanced options.
- **Rate limited** – wait a moment and retry. OpenRouter may throttle excessive requests.

## Development notes

- This project uses Vite + React + TypeScript.
- The proxy server lives in `server/index.js` to keep the API key out of the client bundle.

## License

See [LICENSE](LICENSE).
