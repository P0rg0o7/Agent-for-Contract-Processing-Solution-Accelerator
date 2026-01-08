import { useEffect, useMemo, useState } from 'react';
import HatSection from './components/HatSection';
import PromptPreview from './components/PromptPreview';
import ImagePanel from './components/ImagePanel';
import AdvancedOptions from './components/AdvancedOptions';
import { buildStickerPrompt } from './lib/promptBuilder';
import { validateStickerState } from './lib/validators';
import { generateStickerImage } from './services/openrouter';
import { StickerFormState } from './types';

const STORAGE_KEY = 'sticker-worksheet-state';

const defaultState: StickerFormState = {
  blue: {
    purpose: '',
    audience: '',
    vibe: '',
    shape: 'rounded square',
    border: 'white'
  },
  white: {
    subject: '',
    action: '',
    mustInclude: ['', '', ''],
    mustNot: ['', ''],
    backgroundType: 'transparent',
    backgroundDetail: ''
  },
  red: {
    feeling: '',
    expression: ''
  },
  yellow: {
    heroDetail: '',
    colours: [],
    colourVibe: ''
  },
  black: {
    avoidFlags: [],
    avoidCustom: ''
  },
  green: {
    style: '',
    accessories: ['', '']
  },
  global: {
    kidMode: true,
    useLocalStorage: false,
    advancedOptions: {
      model: 'google/gemini-3-pro',
      aspectRatio: '1:1',
      transparentBackground: true,
      seed: ''
    }
  }
};

const RANDOM_SUBJECTS = ['panda', 'rocket', 'wizard cat', 'tropical fish', 'friendly robot'];
const RANDOM_ACTIONS = ['reading a book', 'skateboarding', 'blowing bubbles', 'building a kite', 'painting a mural'];
const RANDOM_ACCESSORIES = ['sparkly hat', 'tiny backpack', 'star wand', 'leaf crown', 'rainbow scarf'];
const RANDOM_STYLES = ['flat vector', 'soft pastel', 'marker doodle', 'cute chibi', 'paper cut-out'];
const RANDOM_COLOURS = ['sky blue', 'sunny yellow', 'coral', 'mint', 'lavender', 'peach'];

const AVOID_OPTIONS = ['too dark', 'too busy', 'realistic skin', 'sharp edges', 'messy background'];

function randomItem<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

export default function App() {
  const [state, setState] = useState<StickerFormState>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as StickerFormState;
        if (parsed?.global?.useLocalStorage) {
          return { ...defaultState, ...parsed } as StickerFormState;
        }
      }
    } catch {
      return defaultState;
    }
    return defaultState;
  });

  const [status, setStatus] = useState('Ready to generate your sticker.');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (state.global.useLocalStorage) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [state]);

  const promptResult = useMemo(() => buildStickerPrompt(state), [state]);
  const validation = useMemo(() => validateStickerState(state), [state]);

  const updateState = (path: string, value: string | boolean | string[]) => {
    setState((prev) => {
      const next = structuredClone(prev);
      const keys = path.split('.');
      let current: any = next;
      keys.slice(0, -1).forEach((key) => {
        current = current[key];
      });
      current[keys[keys.length - 1]] = value;
      return next;
    });
  };

  const updateArrayItem = (path: string, index: number, value: string) => {
    setState((prev) => {
      const next = structuredClone(prev);
      const keys = path.split('.');
      let current: any = next;
      keys.forEach((key) => {
        current = current[key];
      });
      current[index] = value;
      return next;
    });
  };

  const toggleAvoidFlag = (flag: string) => {
    setState((prev) => {
      const next = structuredClone(prev);
      if (next.black.avoidFlags.includes(flag)) {
        next.black.avoidFlags = next.black.avoidFlags.filter((item) => item !== flag);
      } else {
        next.black.avoidFlags = [...next.black.avoidFlags, flag];
      }
      return next;
    });
  };

  const updateColours = (value: string) => {
    const colours = value
      .split(',')
      .map((colour) => colour.trim())
      .filter(Boolean);
    updateState('yellow.colours', colours);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(promptResult.prompt);
    setStatus('Prompt copied to clipboard.');
  };

  const handleReset = () => {
    setState(defaultState);
    setImageUrl(null);
    setStatus('Reset complete.');
    setError(null);
  };

  const handleRandomise = () => {
    setState((prev) => ({
      ...prev,
      white: {
        ...prev.white,
        subject: randomItem(RANDOM_SUBJECTS),
        action: randomItem(RANDOM_ACTIONS)
      },
      green: {
        ...prev.green,
        style: randomItem(RANDOM_STYLES),
        accessories: [randomItem(RANDOM_ACCESSORIES), prev.green.accessories[1]]
      },
      yellow: {
        ...prev.yellow,
        colours: [randomItem(RANDOM_COLOURS), randomItem(RANDOM_COLOURS)]
      }
    }));
  };

  const handleGenerate = async (variant = false) => {
    setError(null);
    if (!validation.isValid) {
      setStatus('Please fill in the missing essentials before generating.');
      return;
    }

    setIsLoading(true);
    setStatus('Sending your sticker brief to OpenRouter…');

    try {
      const variationNote = variant
        ? 'Add a subtle variation: slight pose change or a different accessory while keeping all constraints.'
        : '';

      const prompt = variationNote ? `${promptResult.prompt} ${variationNote}` : promptResult.prompt;
      const response = await generateStickerImage({
        prompt,
        negative: promptResult.negative,
        model: state.global.advancedOptions.model,
        aspectRatio: state.global.advancedOptions.aspectRatio,
        seed: state.global.advancedOptions.seed || undefined,
        transparentBackground: state.global.advancedOptions.transparentBackground
      });

      const [firstImage] = response.images;
      const resolved = await resolveImageUrl(firstImage);
      setImageUrl(resolved);
      setStatus('Sticker ready!');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong.';
      setError(message);
      setStatus('Generation failed. Please review the details and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (!imageUrl) return;
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = 'sticker.png';
    link.click();
  };

  const missingList = validation.missing;

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <p className="eyebrow">Sticker worksheet</p>
          <h1>Thinking hats sticker builder</h1>
          <p className="subtitle">Plan your sticker, generate a prompt, then create an image.</p>
        </div>
        <div className="toggle-row">
          <label className="toggle">
            <input
              type="checkbox"
              checked={state.global.kidMode}
              onChange={(event) => updateState('global.kidMode', event.target.checked)}
            />
            Safety / kid mode
          </label>
          <label className="toggle">
            <input
              type="checkbox"
              checked={state.global.useLocalStorage}
              onChange={(event) => updateState('global.useLocalStorage', event.target.checked)}
            />
            Remember my progress
          </label>
        </div>
      </header>

      <main className="layout">
        <div className="worksheet">
          <HatSection hat="blue" title="Blue hat: goal and plan">
            <div className="grid">
              <label>
                Purpose
                <input
                  type="text"
                  value={state.blue.purpose}
                  onChange={(event) => updateState('blue.purpose', event.target.value)}
                  placeholder="What is this sticker for?"
                />
              </label>
              <label>
                Audience
                <input
                  type="text"
                  value={state.blue.audience}
                  onChange={(event) => updateState('blue.audience', event.target.value)}
                  placeholder="Who is it for?"
                />
              </label>
              <label>
                Vibe
                <input
                  type="text"
                  value={state.blue.vibe}
                  onChange={(event) => updateState('blue.vibe', event.target.value)}
                  placeholder="Cheerful, calm, bold?"
                />
              </label>
              <label>
                Sticker shape
                <input
                  type="text"
                  value={state.blue.shape}
                  onChange={(event) => updateState('blue.shape', event.target.value)}
                  placeholder="Rounded square, circle…"
                />
              </label>
              <label>
                Sticker border
                <select
                  value={state.blue.border}
                  onChange={(event) => updateState('blue.border', event.target.value)}
                >
                  <option value="white">Thick white border</option>
                  <option value="coloured">Coloured border</option>
                  <option value="none">No border</option>
                </select>
              </label>
            </div>
          </HatSection>

          <HatSection hat="white" title="White hat: facts and requirements">
            <div className="grid">
              <label className={missingList.includes('Subject') ? 'missing' : ''}>
                Subject
                <input
                  type="text"
                  value={state.white.subject}
                  onChange={(event) => updateState('white.subject', event.target.value)}
                  placeholder="Main character or object"
                />
              </label>
              <label className={missingList.includes('Action') ? 'missing' : ''}>
                Action
                <input
                  type="text"
                  value={state.white.action}
                  onChange={(event) => updateState('white.action', event.target.value)}
                  placeholder="What is it doing?"
                />
              </label>
              {state.white.mustInclude.map((value, index) => (
                <label key={`include-${index}`}>
                  Must include {index + 1}
                  <input
                    type="text"
                    value={value}
                    onChange={(event) => updateArrayItem('white.mustInclude', index, event.target.value)}
                  />
                </label>
              ))}
              {state.white.mustNot.map((value, index) => (
                <label key={`not-${index}`}>
                  Must not {index + 1}
                  <input
                    type="text"
                    value={value}
                    onChange={(event) => updateArrayItem('white.mustNot', index, event.target.value)}
                  />
                </label>
              ))}
              <label>
                Background type
                <select
                  value={state.white.backgroundType}
                  onChange={(event) => updateState('white.backgroundType', event.target.value)}
                >
                  <option value="transparent">Transparent</option>
                  <option value="simple">Simple colour/gradient</option>
                  <option value="scene">Simple scene</option>
                </select>
              </label>
              <label>
                Background details
                <input
                  type="text"
                  value={state.white.backgroundDetail}
                  onChange={(event) => updateState('white.backgroundDetail', event.target.value)}
                  placeholder="Soft sky, light dots…"
                />
              </label>
            </div>
          </HatSection>

          <HatSection hat="red" title="Red hat: feelings">
            <div className="grid">
              <label>
                Feeling
                <input
                  type="text"
                  value={state.red.feeling}
                  onChange={(event) => updateState('red.feeling', event.target.value)}
                  placeholder="Happy, brave, curious"
                />
              </label>
              <label>
                Expression
                <input
                  type="text"
                  value={state.red.expression}
                  onChange={(event) => updateState('red.expression', event.target.value)}
                  placeholder="Big smile, wide eyes"
                />
              </label>
            </div>
          </HatSection>

          <HatSection hat="yellow" title="Yellow hat: shine and colour">
            <div className="grid">
              <label>
                Hero detail
                <input
                  type="text"
                  value={state.yellow.heroDetail}
                  onChange={(event) => updateState('yellow.heroDetail', event.target.value)}
                  placeholder="What should pop?"
                />
              </label>
              <label className={missingList.includes('At least 2 colours') ? 'missing' : ''}>
                Colour palette (comma-separated)
                <input
                  type="text"
                  value={state.yellow.colours.join(', ')}
                  onChange={(event) => updateColours(event.target.value)}
                  placeholder="e.g. coral, mint, navy"
                />
              </label>
              <label>
                Colour vibe
                <input
                  type="text"
                  value={state.yellow.colourVibe}
                  onChange={(event) => updateState('yellow.colourVibe', event.target.value)}
                  placeholder="Warm, soft, bold"
                />
              </label>
            </div>
          </HatSection>

          <HatSection hat="black" title="Black hat: what to avoid">
            <div className="checkbox-group">
              {AVOID_OPTIONS.map((option) => (
                <label key={option} className="checkbox">
                  <input
                    type="checkbox"
                    checked={state.black.avoidFlags.includes(option)}
                    onChange={() => toggleAvoidFlag(option)}
                  />
                  {option}
                </label>
              ))}
            </div>
            <label>
              Anything else to avoid
              <input
                type="text"
                value={state.black.avoidCustom}
                onChange={(event) => updateState('black.avoidCustom', event.target.value)}
                placeholder="e.g. no stripes"
              />
            </label>
          </HatSection>

          <HatSection hat="green" title="Green hat: style and twist">
            <div className="grid">
              <label className={missingList.includes('Style') ? 'missing' : ''}>
                Style
                <input
                  type="text"
                  value={state.green.style}
                  onChange={(event) => updateState('green.style', event.target.value)}
                  placeholder="Flat vector, cosy, inked"
                />
              </label>
              {state.green.accessories.map((value, index) => (
                <label key={`accessory-${index}`}>
                  Accessory or twist {index + 1}
                  <input
                    type="text"
                    value={value}
                    onChange={(event) => updateArrayItem('green.accessories', index, event.target.value)}
                  />
                </label>
              ))}
            </div>
            <div className="button-row">
              <button type="button" className="secondary" onClick={handleRandomise}>
                Randomise kid-friendly ideas
              </button>
            </div>
          </HatSection>
        </div>

        <aside className="sidebar">
          {missingList.length > 0 && (
            <div className="missing-panel" role="alert">
              <h3>Missing essentials</h3>
              <ul>
                {missingList.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          )}
          <PromptPreview promptResult={promptResult} onCopy={handleCopy} onReset={handleReset} />
          <AdvancedOptions
            model={state.global.advancedOptions.model}
            aspectRatio={state.global.advancedOptions.aspectRatio}
            seed={state.global.advancedOptions.seed}
            transparentBackground={state.global.advancedOptions.transparentBackground}
            onChange={(field, value) => updateState(`global.advancedOptions.${field}`, value)}
          />
          <ImagePanel
            isLoading={isLoading}
            status={status}
            error={error}
            imageUrl={imageUrl}
            onGenerate={handleGenerate}
            onDownload={handleDownload}
          />
        </aside>
      </main>

      <footer className="app-footer">
        <p>
          Built to run locally. Your worksheet stays in your browser unless you choose to save it.
        </p>
      </footer>
    </div>
  );
}

async function resolveImageUrl(image: string): Promise<string> {
  if (image.startsWith('data:image')) {
    return image;
  }
  if (image.startsWith('http')) {
    const response = await fetch(image);
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  }
  return image;
}
