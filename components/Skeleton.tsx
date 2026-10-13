const Bar = ({ w }: { w: string }) => (
  <div className="relative h-3 overflow-hidden rounded-full bg-zinc-100" style={{ width: w }}>
    <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/80 to-transparent" />
  </div>
);
export function Skeleton() {
  return (
    <div className="space-y-6 p-4">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex gap-3">
          <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-lg bg-zinc-100">
            <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/80 to-transparent" />
          </div>
          <div className="flex-1 space-y-2.5 pt-1"><Bar w="60%" /><Bar w="100%" /><Bar w="92%" /><Bar w="75%" /></div>
        </div>
      ))}
    </div>
  );
}
