"use client";

import { useEffect, useRef } from "react";
import type { Bead } from "@/types/molecule";

type MoleculeViewerProps = {
  pdbText: string;
  selected: number[];
  beads: Bead[];
  onToggleSelect: (serial: number) => void;
};

const BASE_STYLE = {
  stick: { radius: 0.15 },
  sphere: { scale: 0.25 },
};

const SELECTED_STYLE = {
  stick: { radius: 0.15 },
  sphere: { scale: 0.45, color: "yellow" },
};

export default function MoleculeViewer({
  pdbText,
  selected,
  beads,
  onToggleSelect,
}: MoleculeViewerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewerRef = useRef<any>(null);

  // Keep latest values in refs so the click handler + initial draw always
  // see current state (the handler is registered once when the model loads).
  const onToggleRef = useRef(onToggleSelect);
  const selectedRef = useRef(selected);
  const beadsRef = useRef(beads);
  onToggleRef.current = onToggleSelect;
  selectedRef.current = selected;
  beadsRef.current = beads;

  // Build the viewer whenever the molecule changes.
  useEffect(() => {
    if (!containerRef.current || !pdbText) return;

    let cancelled = false;

    async function loadViewer() {
      const mod = await import("3dmol");
      const $3Dmol = (mod as any).default || mod;
      if (cancelled || !containerRef.current) return;

      const viewer = $3Dmol.createViewer(containerRef.current, {
        backgroundColor: "#050505",
      });
      viewerRef.current = viewer;

      viewer.clear();
      viewer.addModel(pdbText, "pdb");

      // Clicking any atom toggles its selection.
      viewer.setClickable({}, true, (atom: any) => {
        if (atom && typeof atom.serial === "number") {
          onToggleRef.current(atom.serial);
        }
      });

      redraw(viewer, beadsRef.current, selectedRef.current);
      viewer.zoomTo();
      viewer.render();
      viewer.resize();
    }

    loadViewer();

    return () => {
      cancelled = true;
      if (viewerRef.current) {
        viewerRef.current.clear();
        viewerRef.current = null;
      }
    };
  }, [pdbText]);

  // Re-style / redraw beads when selection or beads change.
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    redraw(viewer, beads, selected);
    viewer.render();
  }, [selected, beads]);

  return (
    <div className="h-[520px] w-full overflow-hidden rounded-xl border border-neutral-800 bg-black">
      <div ref={containerRef} className="relative h-full w-full" />
    </div>
  );
}

// Apply atom styles (base -> per-bead color -> selection) and draw bead spheres.
function redraw(viewer: any, beads: Bead[], selected: number[]) {
  viewer.removeAllShapes();
  viewer.setStyle({}, BASE_STYLE);

  for (const bead of beads) {
    if (bead.atoms.length > 0) {
      viewer.setStyle(
        { serial: bead.atoms },
        { stick: { radius: 0.15 }, sphere: { scale: 0.3, color: bead.color } }
      );
    }
  }

  if (selected.length > 0) {
    viewer.setStyle({ serial: selected }, SELECTED_STYLE);
  }

  for (const bead of beads) {
    viewer.addSphere({
      center: bead.position,
      radius: bead.radius,
      color: bead.color,
      alpha: 0.35,
    });
  }
}
