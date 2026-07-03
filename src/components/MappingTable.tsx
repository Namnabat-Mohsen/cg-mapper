"use client";

import type { Bead } from "@/types/molecule";
import {
  MARTINI3_TYPE_GROUPS,
  BEAD_SIZES,
  beadLabel,
  beadRadiusForSize,
  type BeadSize,
} from "@/lib/beads";

type MappingTableProps = {
  beads: Bead[];
  onUpdate: (id: string, patch: Partial<Bead>) => void;
  onDelete: (id: string) => void;
};

export default function MappingTable({
  beads,
  onUpdate,
  onDelete,
}: MappingTableProps) {
  if (beads.length === 0) {
    return (
      <p className="mt-4 text-sm text-neutral-500">
        No beads yet. Select atoms above and click “Create bead from
        selection”.
      </p>
    );
  }

  return (
    <div className="mt-4 overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-neutral-700 text-left text-neutral-400">
            <th className="py-2 pr-4">Bead</th>
            <th className="py-2 pr-4">Name</th>
            <th className="py-2 pr-4">Size</th>
            <th className="py-2 pr-4">Type</th>
            <th className="py-2 pr-4">Label</th>
            <th className="py-2 pr-4">Radius (Å)</th>
            <th className="py-2 pr-4"># Atoms</th>
            <th className="py-2 pr-4">Atom serials</th>
            <th className="py-2 pr-4">Center (x, y, z)</th>
            <th className="py-2 pr-4"></th>
          </tr>
        </thead>
        <tbody>
          {beads.map((bead) => (
            <tr
              key={bead.id}
              className="border-b border-neutral-800 text-neutral-200"
            >
              <td className="py-2 pr-4">
                <span className="inline-flex items-center gap-2">
                  <span
                    className="inline-block h-3 w-3 rounded-full"
                    style={{ backgroundColor: bead.color }}
                  />
                  {bead.id}
                </span>
              </td>
              <td className="py-2 pr-4">
                <input
                  value={bead.name}
                  onChange={(e) => onUpdate(bead.id, { name: e.target.value })}
                  className="w-20 rounded border border-neutral-700 bg-neutral-950 px-2 py-1 text-sm"
                />
              </td>
              <td className="py-2 pr-4">
                <select
                  value={bead.size}
                  onChange={(e) => {
                    const size = e.target.value as BeadSize;
                    onUpdate(bead.id, {
                      size,
                      radius: beadRadiusForSize(size),
                    });
                  }}
                  className="rounded border border-neutral-700 bg-neutral-950 px-2 py-1 text-sm"
                >
                  {BEAD_SIZES.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.id} · {s.label} ({s.mapping})
                    </option>
                  ))}
                </select>
              </td>
              <td className="py-2 pr-4">
                <select
                  value={bead.type}
                  onChange={(e) => onUpdate(bead.id, { type: e.target.value })}
                  className="rounded border border-neutral-700 bg-neutral-950 px-2 py-1 text-sm"
                >
                  {MARTINI3_TYPE_GROUPS.map((group) => (
                    <optgroup key={group.label} label={group.label}>
                      {group.types.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </td>
              <td className="py-2 pr-4 font-mono text-neutral-100">
                {beadLabel(bead.size, bead.type)}
              </td>
              <td className="py-2 pr-4">
                <input
                  type="number"
                  step={0.1}
                  min={0.5}
                  value={bead.radius}
                  onChange={(e) =>
                    onUpdate(bead.id, { radius: Number(e.target.value) })
                  }
                  className="w-16 rounded border border-neutral-700 bg-neutral-950 px-2 py-1 text-sm"
                />
              </td>
              <td className="py-2 pr-4">{bead.atoms.length}</td>
              <td className="max-w-xs py-2 pr-4 text-neutral-400">
                {bead.atoms.join(", ")}
              </td>
              <td className="py-2 pr-4 text-neutral-400">
                {bead.position.x.toFixed(2)}, {bead.position.y.toFixed(2)},{" "}
                {bead.position.z.toFixed(2)}
              </td>
              <td className="py-2 pr-4">
                <button
                  onClick={() => onDelete(bead.id)}
                  className="rounded border border-red-900/60 px-2 py-1 text-xs text-red-300 hover:bg-red-950/40"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
