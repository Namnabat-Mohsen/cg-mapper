"use client";

import type { Suggestion } from "@/lib/suggest";
import { examplesForType } from "@/lib/martiniExamples";
import StructureThumb from "@/components/StructureThumb";

type SuggestionCardProps = {
  suggestion: Suggestion | null;
  onUse: (size: Suggestion["size"], type: string) => void;
};

const CONFIDENCE_STYLE: Record<Suggestion["confidence"], string> = {
  high: "bg-emerald-500/10 text-emerald-300",
  medium: "bg-sky-500/10 text-sky-300",
  low: "bg-amber-500/10 text-amber-300",
};

export default function SuggestionCard({
  suggestion,
  onUse,
}: SuggestionCardProps) {
  if (!suggestion) return null;

  const {
    size,
    type,
    label,
    confidence,
    sizeReason,
    typeReason,
    warnings,
    detected,
    profile,
  } = suggestion;
  const examples = examplesForType(type);

  return (
    <div className="mt-4 rounded-xl border border-indigo-800/50 bg-indigo-950/30 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-indigo-200">
            Martini 3 suggestion
          </span>
          <span className="rounded-md bg-indigo-500/20 px-2 py-1 font-mono text-lg text-white">
            {label}
          </span>
          <span
            className={
              "rounded-full px-2 py-0.5 text-xs " + CONFIDENCE_STYLE[confidence]
            }
          >
            {confidence} confidence
          </span>
        </div>
        <button
          onClick={() => onUse(size, type)}
          className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500"
        >
          Use suggestion ({label})
        </button>
      </div>

      <ul className="mt-3 space-y-1 text-sm text-indigo-100/80">
        <li>
          <span className="text-indigo-300">Size ({size}):</span> {sizeReason}
        </li>
        <li>
          <span className="text-indigo-300">Type ({type}):</span> {typeReason}
        </li>
      </ul>

      <p className="mt-2 text-xs text-indigo-300/70">
        Heavy atoms: {profile.heavy} · C{profile.C} O{profile.O} N{profile.N} S
        {profile.S} P{profile.P} halogen{profile.halogen} · bonds in selection:{" "}
        {profile.bondsInSelection}
      </p>

      {detected.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {detected.map((g) => (
            <span
              key={g}
              className="rounded-full bg-indigo-500/15 px-2 py-0.5 text-xs text-indigo-200"
            >
              {g}
            </span>
          ))}
        </div>
      )}

      {warnings.length > 0 && (
        <ul className="mt-3 space-y-1 text-sm text-amber-300">
          {warnings.map((w, i) => (
            <li key={i}>⚠ {w}</li>
          ))}
        </ul>
      )}

      {examples && (
        <div className="mt-4 border-t border-indigo-800/40 pt-3">
          <p className="text-sm text-indigo-200">
            Representative {examples.className} examples (Martini 3)
          </p>
          <p className="mt-0.5 text-xs text-indigo-300/70">
            {examples.description}
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            {examples.examples.map((ex) => (
              <div
                key={ex.name}
                className="w-32 rounded-lg border border-neutral-800 bg-neutral-950/60 p-2 text-center"
              >
                <div className="flex justify-center">
                  <StructureThumb smiles={ex.smiles} />
                </div>
                <div className="mt-1 text-xs font-medium text-neutral-100">
                  {ex.name}
                </div>
                <div className="text-[11px] leading-tight text-neutral-400">
                  {ex.maps}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="mt-3 text-xs text-neutral-500">
        Heuristic guide based on Martini 3 mapping rules — examples are
        illustrative; review before applying.
      </p>
    </div>
  );
}
