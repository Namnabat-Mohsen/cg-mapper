"use client";

/* eslint-disable @next/next/no-img-element */

type AppHeaderProps = {
  onOpenReference: () => void;
};

export default function AppHeader({ onOpenReference }: AppHeaderProps) {
  return (
    <header className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="rounded-2xl bg-white p-2 shadow-sm ring-1 ring-black/5">
        <img
          src="/logo.png"
          alt="CG-Mapper — coarse-grained molecule mapping tool"
          className="h-24 w-auto object-contain"
        />
      </div>
      <button
        onClick={onOpenReference}
        className="rounded-lg border border-neutral-700 px-3 py-2 text-sm text-neutral-200 hover:bg-neutral-800"
      >
        📖 Martini 3 reference
      </button>
    </header>
  );
}
