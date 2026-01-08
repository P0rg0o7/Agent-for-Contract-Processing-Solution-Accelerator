import { PromptBuildResult, StickerFormState } from '../types';

const DEFAULT_GUARDS = [
  'centred composition',
  'crisp vector-like edges',
  'high contrast',
  'minimal background or transparent',
  'print-ready sticker',
  'PNG output',
  'no text',
  'no watermark',
  'no extra limbs',
  'no blur'
];

const KID_MODE_NEGATIVES = [
  'no weapons',
  'no gore',
  'no scary imagery',
  'no violence',
  'no blood',
  'no horror',
  'no sharp objects'
];

const STYLE_ALLOW_PHOTO = ['photoreal', 'photographic'];
const SOFT_STYLES = ['watercolour', 'marker', 'crayon', 'doodle'];

export function buildStickerPrompt(state: StickerFormState): PromptBuildResult {
  const warnings: string[] = [];
  const { blue, white, red, yellow, black, green, global } = state;

  const colours = yellow.colours.filter(Boolean);
  if (colours.length > 5) {
    warnings.push('Too many colours selected. Stick to 2–5 for clarity.');
  }

  if (white.backgroundType === 'scene' && !white.backgroundDetail.trim()) {
    warnings.push('Background scene selected but no detail provided.');
  }

  const borderInstruction = blue.border === 'white'
    ? 'thick white sticker border'
    : blue.border === 'coloured'
      ? 'bold coloured sticker border'
      : 'no border';

  const accessories = green.accessories.filter(Boolean).join(' and ');
  const mustInclude = white.mustInclude.filter(Boolean).join(', ');
  const mustNot = white.mustNot.filter(Boolean);

  const style = green.style.trim();
  const isPhotoStyle = STYLE_ALLOW_PHOTO.some((keyword) => style.toLowerCase().includes(keyword));
  const requiresCleanOutline = SOFT_STYLES.some((keyword) => style.toLowerCase().includes(keyword));

  const baseGuards = [...DEFAULT_GUARDS];
  if (requiresCleanOutline) {
    baseGuards.push('clean outlines');
  }

  if (isPhotoStyle) {
    const index = baseGuards.indexOf('crisp vector-like edges');
    if (index >= 0) {
      baseGuards.splice(index, 1, 'crisp, clean edges');
    }
  } else {
    baseGuards.push('not photorealistic');
  }

  const backgroundInstruction = white.backgroundType === 'transparent'
    ? 'transparent or minimal background'
    : white.backgroundType === 'simple'
      ? `simple background (${white.backgroundDetail || 'soft gradient'})`
      : `simple scene background (${white.backgroundDetail || 'minimal props'})`;

  const promptParts = [
    `Sticker illustration of ${white.subject || 'a subject'} ${white.action || 'doing an action'}.`,
    blue.purpose ? `Purpose: ${blue.purpose}.` : '',
    blue.audience ? `Audience: ${blue.audience}.` : '',
    blue.vibe ? `Overall vibe: ${blue.vibe}.` : '',
    white.subject && white.action ? `Focus on ${white.subject} ${white.action}.` : '',
    red.feeling ? `Feeling: ${red.feeling}.` : '',
    red.expression ? `Expression: ${red.expression}.` : '',
    yellow.heroDetail ? `Hero detail: ${yellow.heroDetail}.` : '',
    colours.length ? `Colour palette: ${colours.join(', ')}.` : '',
    yellow.colourVibe ? `Colour vibe: ${yellow.colourVibe}.` : '',
    style ? `Style: ${style}.` : '',
    accessories ? `Accessories or twist: ${accessories}.` : '',
    mustInclude ? `Must include: ${mustInclude}.` : '',
    backgroundInstruction ? `${backgroundInstruction}.` : '',
    blue.shape ? `Sticker shape: ${blue.shape}.` : '',
    borderInstruction ? `Border: ${borderInstruction}.` : '',
    ...baseGuards.map((guard) => `${guard}.`)
  ].filter(Boolean);

  const negativeParts = [
    ...mustNot,
    ...black.avoidFlags,
    black.avoidCustom,
    'no tiny details'
  ];

  if (global.kidMode) {
    negativeParts.push(...KID_MODE_NEGATIVES);
  }

  const negative = negativeParts.filter(Boolean).join(', ');

  return {
    prompt: promptParts.join(' '),
    negative,
    warnings
  };
}
