export default function Loading() {
  return (
    <main
      aria-busy
      aria-label="Cargando comercios"
      className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 pt-10 pb-20 sm:px-8 sm:pt-14"
    >
      <div className="h-10 w-2/3 max-w-md animate-pulse rounded-control bg-ink/[0.07] motion-reduce:animate-none" />
      <div className="flex gap-2">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="h-10 w-24 animate-pulse rounded-full bg-ink/[0.07] motion-reduce:animate-none" />
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-[104px] animate-pulse rounded-surface bg-ink/[0.05] motion-reduce:animate-none" />
        ))}
      </div>
    </main>
  );
}
