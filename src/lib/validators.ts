import { StickerFormState } from '../types';

export type ValidationResult = {
  isValid: boolean;
  missing: string[];
};

export function validateStickerState(state: StickerFormState): ValidationResult {
  const missing: string[] = [];

  if (!state.white.subject.trim()) {
    missing.push('Subject');
  }

  if (!state.white.action.trim()) {
    missing.push('Action');
  }

  if (!state.green.style.trim()) {
    missing.push('Style');
  }

  if (state.yellow.colours.filter(Boolean).length < 2) {
    missing.push('At least 2 colours');
  }

  return {
    isValid: missing.length === 0,
    missing
  };
}
