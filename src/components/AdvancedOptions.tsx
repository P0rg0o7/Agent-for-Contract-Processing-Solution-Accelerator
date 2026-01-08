import { ChangeEvent } from 'react';

type AdvancedOptionsProps = {
  model: string;
  aspectRatio: string;
  seed: string;
  transparentBackground: boolean;
  onChange: (field: string, value: string | boolean) => void;
};

export default function AdvancedOptions({
  model,
  aspectRatio,
  seed,
  transparentBackground,
  onChange
}: AdvancedOptionsProps) {
  return (
    <details className="panel" open={false}>
      <summary className="panel-header">Advanced options</summary>
      <div className="panel-content grid">
        <label>
          Model name
          <input
            type="text"
            value={model}
            onChange={(event: ChangeEvent<HTMLInputElement>) => onChange('model', event.target.value)}
            placeholder="google/gemini-3-pro"
          />
        </label>
        <label>
          Image size / aspect ratio
          <select
            value={aspectRatio}
            onChange={(event: ChangeEvent<HTMLSelectElement>) =>
              onChange('aspectRatio', event.target.value)
            }
          >
            <option value="1:1">Square 1:1</option>
            <option value="4:5">Portrait 4:5</option>
            <option value="16:9">Landscape 16:9</option>
          </select>
        </label>
        <label>
          Seed (optional)
          <input
            type="text"
            value={seed}
            onChange={(event: ChangeEvent<HTMLInputElement>) => onChange('seed', event.target.value)}
            placeholder="Leave empty for random"
          />
        </label>
        <label className="toggle">
          <input
            type="checkbox"
            checked={transparentBackground}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              onChange('transparentBackground', event.target.checked)
            }
          />
          Transparent background preference
        </label>
      </div>
    </details>
  );
}
