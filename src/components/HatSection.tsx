import { ReactNode } from 'react';

const COLOURS: Record<string, string> = {
  blue: '#2d6cdf',
  white: '#f2f2f2',
  red: '#e24a4a',
  yellow: '#f5c344',
  black: '#333333',
  green: '#42b66c'
};

type HatSectionProps = {
  hat: keyof typeof COLOURS;
  title: string;
  children: ReactNode;
};

export default function HatSection({ hat, title, children }: HatSectionProps) {
  return (
    <section className="hat-section" aria-label={`${title} section`}>
      <header className="hat-header" style={{ borderColor: COLOURS[hat] }}>
        <div className="hat-dot" style={{ backgroundColor: COLOURS[hat] }} aria-hidden />
        <div>
          <h2>{title}</h2>
          <span className="hat-label" style={{ color: COLOURS[hat] }}>
            {hat} hat
          </span>
        </div>
      </header>
      <div className="hat-body">{children}</div>
    </section>
  );
}
