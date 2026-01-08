import { FormEvent } from 'react';

type ImagePanelProps = {
  isLoading: boolean;
  status: string;
  error: string | null;
  imageUrl: string | null;
  onGenerate: (variant?: boolean) => void;
  onDownload: () => void;
};

export default function ImagePanel({
  isLoading,
  status,
  error,
  imageUrl,
  onGenerate,
  onDownload
}: ImagePanelProps) {
  return (
    <section className="panel">
      <header className="panel-header">
        <h2>Image generation</h2>
      </header>
      <form
        className="panel-content"
        onSubmit={(event: FormEvent) => {
          event.preventDefault();
          onGenerate();
        }}
      >
        <div className="button-row">
          <button type="submit" disabled={isLoading}>
            {isLoading ? 'Generating…' : 'Generate sticker image'}
          </button>
          <button
            type="button"
            className="secondary"
            disabled={isLoading}
            onClick={() => onGenerate(true)}
          >
            Generate variation
          </button>
        </div>
        <p className="status-text" role="status" aria-live="polite">
          {status}
        </p>
        {error && <p className="error-text">{error}</p>}
        {imageUrl && (
          <div className="image-preview">
            <img src={imageUrl} alt="Generated sticker" />
            <button type="button" className="secondary" onClick={onDownload}>
              Download PNG
            </button>
          </div>
        )}
      </form>
    </section>
  );
}
