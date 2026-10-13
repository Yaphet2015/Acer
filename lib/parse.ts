import { ICON_TYPES, type IconType, type Summary } from './types';

/** Extract and validate the summary JSON returned by the LLM (tolerates code fences / prose). */
export function parseSummary(text: string): Summary {
  let s = text.trim();
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) s = fence[1]!.trim();
  const start = s.indexOf('{'), end = s.lastIndexOf('}');
  if (start < 0 || end <= start) throw new Error('No JSON object in model output');
  const raw = JSON.parse(s.slice(start, end + 1));
  if (typeof raw.overview !== 'string' || !raw.overview.trim()) throw new Error('Missing "overview"');
  const keyTerms = Array.isArray(raw.keyTerms ?? raw.key_terms)
    ? (raw.keyTerms ?? raw.key_terms).filter((t: unknown) => typeof t === 'string' && t.trim()).map((t: string) => t.trim())
    : [];
  const sections = (Array.isArray(raw.sections) ? raw.sections : [])
    .filter((x: any) => x && typeof x.title === 'string')
    .map((x: any) => ({
      title: x.title.trim(),
      icon: (ICON_TYPES.includes(x.icon) ? x.icon : 'list') as IconType,
      bullets: (Array.isArray(x.bullets) ? x.bullets : []).filter((b: unknown) => typeof b === 'string').map((b: string) => b.trim()),
    }));
  return { overview: raw.overview.trim(), keyTerms, sections };
}

export type Segment = { text: string; highlight: boolean };

/** Split text into segments, marking occurrences of key terms (case-insensitive, longest first). */
export function highlightTerms(text: string, terms: string[]): Segment[] {
  const t = [...new Set(terms)].filter(Boolean).sort((a, b) => b.length - a.length);
  if (!t.length) return [{ text, highlight: false }];
  const re = new RegExp('(' + t.map((x) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')', 'gi');
  return text.split(re).filter(Boolean).map((p) => ({ text: p, highlight: t.some((x) => x.toLowerCase() === p.toLowerCase()) }));
}
