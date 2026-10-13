import { highlightTerms } from '@/lib/parse';
import type { Summary } from '@/lib/types';
import { BulletIcons, Sparkle } from './Icons';

export function Overview({ summary }: { summary: Summary }) {
  return (
    <div className="space-y-5 px-4 py-4">
      <section>
        <h3 className="mb-2 flex items-center gap-1.5 text-[15px] font-semibold text-zinc-900">
          <Sparkle className="h-4 w-4 text-accent" /> 概览
        </h3>
        <p className="text-[13.5px] leading-[1.7] text-zinc-700">
          {highlightTerms(summary.overview, summary.keyTerms).map((s, i) =>
            s.highlight ? <mark key={i} className="rounded-[4px] bg-accent-tint px-0.5 font-medium text-accent-ink">{s.text}</mark> : <span key={i}>{s.text}</span>,
          )}
        </p>
      </section>
      {summary.sections.map((sec, i) => {
        const Icon = BulletIcons[sec.icon];
        return (
          <section key={i}>
            <h4 className="mb-2 text-[14px] font-bold text-zinc-900">{sec.title}</h4>
            <ul className="relative">
              {sec.bullets.map((b, j) => (
                <li key={j} className="relative flex gap-2.5 pb-3 last:pb-0">
                  {j < sec.bullets.length - 1 && <span className="absolute left-[11px] top-6 bottom-0 w-px bg-zinc-200" />}
                  <span className="z-[1] flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-zinc-50 text-zinc-600 ring-1 ring-zinc-200">
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <span className="pt-0.5 text-[13px] leading-[1.6] text-zinc-700">{b}</span>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
