export type StickerFormState = {
  blue: {
    purpose: string;
    audience: string;
    vibe: string;
    shape: string;
    border: 'white' | 'coloured' | 'none';
  };
  white: {
    subject: string;
    action: string;
    mustInclude: [string, string, string];
    mustNot: [string, string];
    backgroundType: 'transparent' | 'simple' | 'scene';
    backgroundDetail: string;
  };
  red: {
    feeling: string;
    expression: string;
  };
  yellow: {
    heroDetail: string;
    colours: string[];
    colourVibe: string;
  };
  black: {
    avoidFlags: string[];
    avoidCustom: string;
  };
  green: {
    style: string;
    accessories: [string, string];
  };
  global: {
    kidMode: boolean;
    useLocalStorage: boolean;
    advancedOptions: {
      model: string;
      aspectRatio: '1:1' | '4:5' | '16:9';
      transparentBackground: boolean;
      seed: string;
    };
  };
};

export type PromptBuildResult = {
  prompt: string;
  negative: string;
  warnings: string[];
};
