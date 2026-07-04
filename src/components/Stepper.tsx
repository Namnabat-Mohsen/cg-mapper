"use client";

export type StepDef = { id: number; label: string };

type StepperProps = {
  steps: StepDef[];
  current: number;
  maxReachable: number;
  onSelect: (id: number) => void;
};

export default function Stepper({
  steps,
  current,
  maxReachable,
  onSelect,
}: StepperProps) {
  return (
    <nav className="mt-6 flex flex-wrap gap-2">
      {steps.map((s) => {
        const active = s.id === current;
        const reachable = s.id <= maxReachable;
        return (
          <button
            key={s.id}
            onClick={() => reachable && onSelect(s.id)}
            disabled={!reachable}
            className={
              "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors " +
              (active
                ? "border-sky-500 bg-sky-500/15 text-white"
                : reachable
                ? "border-neutral-700 text-neutral-300 hover:bg-neutral-800"
                : "border-neutral-800 text-neutral-600 cursor-not-allowed")
            }
          >
            <span
              className={
                "flex h-5 w-5 items-center justify-center rounded-full text-xs " +
                (active
                  ? "bg-sky-500 text-white"
                  : reachable
                  ? "bg-neutral-700 text-neutral-200"
                  : "bg-neutral-800 text-neutral-600")
              }
            >
              {s.id}
            </span>
            {s.label}
          </button>
        );
      })}
    </nav>
  );
}
