type Fn = () => void;
const subs = new Map<string, Set<Fn>>();
export const bus = {
  on(e: string, f: Fn) { if (!subs.has(e)) subs.set(e, new Set()); subs.get(e)!.add(f); return () => { subs.get(e)!.delete(f); }; },
  emit(e: string) { subs.get(e)?.forEach((f) => f()); },
};
