import { highlightTerms } from '@/lib/parse';
import { useT } from './i18n';
import type { Summary } from '@/lib/types';
import { Sparkle } from './Icons';

/** One color per top-level branch; children inherit it. */
const BRANCH_COLORS = ['#1677ff', '#13a8a8', '#722ed1', '#fa8c16', '#eb2f96', '#52c41a'];

export function Overview({ summary }: { summary: Summary }) {
  const t = useT();
  return (
    <div className="space-y-5 px-4 py-4">
      <section>
        <h3 className="mb-2 flex items-center gap-1.5 text-[15px] font-semibold text-zinc-900">
          <Sparkle className="h-4 w-4 text-accent" /> {t.overview}
        </h3>
        <p className="text-[13.5px] leading-[1.7] text-zinc-700">
          {highlightTerms(summary.overview, summary.keyTerms).map((s, i) =>
            s.highlight ? <mark key={i} className="rounded-[4px] bg-accent-tint px-0.5 font-medium text-accent-ink">{s.text}</mark> : <span key={i}>{s.text}</span>,
          )}
        </p>
      </section>
      {summary.sections.map((sec, i) => {
        const c = BRANCH_COLORS[i % BRANCH_COLORS.length];
        return (
          <section key={i} data-branch={i}>
            <h4 className="mb-1.5 flex items-center gap-2 text-[14px] font-bold text-zinc-900">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: c, boxShadow: `0 0 0 3px ${c}26` }} />
              {sec.title}
            </h4>
            <ul className="relative ml-[4.5px]">
              {sec.bullets.map((b, j) => {
                const last = j === sec.bullets.length - 1;
                return (
                  <li key={j} className="relative pb-2 pl-[30px] last:pb-0">
                    {/* trunk continues past this item */}
                    {!last && <span className="absolute bottom-0 left-0 top-0 w-[1.5px]" style={{ background: c, opacity: 0.55 }} />}
                    {/* curved elbow from the trunk into this node */}
                    <span className="absolute left-0 top-0 h-[13px] w-4 rounded-bl-[10px] border-b-[1.5px] border-l-[1.5px]" style={{ borderColor: c, opacity: 0.55 }} />
                    <span className="absolute left-[15px] top-[10px] h-[7px] w-[7px] rounded-full" style={{ background: c }} />
                    <span className="block text-[13px] leading-[1.6] text-zinc-700">{b}</span>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
