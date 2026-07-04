"use client";

/* eslint-disable @next/next/no-img-element */

type AppHeaderProps = {
  onOpenReference: () => void;
};

export default function AppHeader({ onOpenReference }: AppHeaderProps) {
  return (
    <header className="overflow-hidden rounded-2xl bg-gradient-to-br from-white to-slate-100 px-6 py-6 shadow-sm ring-1 ring-black/5">
      <div className="flex flex-col items-center gap-5 sm:flex-row sm:justify-between">
        <img
          src="/logo.png"
          alt="CG-Mapper — coarse-grained molecule mapping tool"
          className="h-32 w-auto object-contain sm:h-36"
        />
        <button
          onClick={onOpenReference}
          className="shrink-0 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
        >
          📖 Martini 3 reference
        </button>
      </div>
    </header>
  );
}
