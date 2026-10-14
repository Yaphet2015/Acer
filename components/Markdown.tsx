import { Streamdown } from 'streamdown';

/**
 * Markdown for model output (streamdown: tolerant of half-finished markdown while streaming).
 * Local-only: no code highlighter / mermaid / math plugins, no images, no copy/download controls.
 */
export function Markdown({ text, streaming = false }: { text: string; streaming?: boolean }) {
  return (
    <Streamdown
      className="rp-md"
      mode={streaming ? 'streaming' : 'static'}
      isAnimating={streaming}
      controls={false}
      lineNumbers={false}
      linkSafety={{ enabled: false }}
      disallowedElements={['img']}
      components={{
        a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>,
      }}
    >
      {text}
    </Streamdown>
  );
}
