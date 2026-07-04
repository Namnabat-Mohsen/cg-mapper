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
    <nav className="flex items-center">
      {steps.map((s, idx) => {
        const active = s.id === current;
        const done = s.id < current;
        const reachable = s.id <= maxReachable;
        return (
          <div key={s.id} className="flex flex-1 items-center last:flex-none">
            <button
              onClick={() => reachable && onSelect(s.id)}
              disabled={!reachable}
              className={
                "group flex shrink-0 items-center gap-2 rounded-full py-1.5 pl-1.5 pr-3 text-sm transition-colors " +
                (active
                  ? "bg-teal-500/15 text-teal-200"
                  : reachable
                  ? "text-neutral-300 hover:bg-neutral-800"
                  : "text-neutral-600 cursor-not-allowed")
              }
            >
              <span
                className={
                  "flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium " +
                  (active
                    ? "bg-teal-500 text-white"
                    : done
                    ? "bg-teal-600/70 text-white"
                    : reachable
                    ? "bg-neutral-700 text-neutral-200"
                    : "bg-neutral-800 text-neutral-600")
                }
              >
                {done ? "✓" : s.id}
              </span>
              <span className="hidden sm:inline">{s.label}</span>
            </button>
            {idx < steps.length - 1 && (
              <span
                className={
                  "mx-1 h-px flex-1 " +
                  (s.id < current ? "bg-teal-600/60" : "bg-neutral-800")
                }
              />
            )}
          </div>
        );
      })}
    </nav>
  );
}
