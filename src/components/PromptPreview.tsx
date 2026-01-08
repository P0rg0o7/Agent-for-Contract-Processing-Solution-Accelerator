import { PromptBuildResult } from '../types';

type PromptPreviewProps = {
  promptResult: PromptBuildResult;
  onCopy: () => void;
  onReset: () => void;
};

export default function PromptPreview({ promptResult, onCopy, onReset }: PromptPreviewProps) {
  return (
    <section className="panel">
      <header className="panel-header">
        <h2>Prompt preview</h2>
        <div className="panel-actions">
          <button type="button" className="secondary" onClick={onCopy}>
            Copy prompt
          </button>
          <button type="button" className="ghost" onClick={onReset}>
            Reset
          </button>
        </div>
      </header>
      <div className="panel-content">
        <p className="prompt-text">{promptResult.prompt}</p>
        <p className="prompt-negative">
          <strong>Negative constraints:</strong> {promptResult.negative || 'None'}
        </p>
        {promptResult.warnings.length > 0 && (
          <ul className="warnings" role="status">
            {promptResult.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
