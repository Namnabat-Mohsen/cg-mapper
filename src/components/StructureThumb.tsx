"use client";

import { useEffect, useRef } from "react";

type StructureThumbProps = {
  smiles: string;
  size?: number;
};

// Renders a 2D structure from a SMILES string using smiles-drawer (dark theme).
export default function StructureThumb({ smiles, size = 110 }: StructureThumbProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const mod = await import("smiles-drawer");
      const SmilesDrawer = (mod as any).default || mod;
      if (cancelled || !svgRef.current) return;

      const drawer = new SmilesDrawer.SvgDrawer({
        width: size,
        height: size,
        padding: 8,
        bondThickness: 1.1,
        compactDrawing: true,
      });

      SmilesDrawer.parse(
        smiles,
        (tree: unknown) => {
          if (cancelled || !svgRef.current) return;
          svgRef.current.innerHTML = "";
          try {
            drawer.draw(tree, svgRef.current, "dark");
          } catch {
            /* ignore draw errors for a single thumbnail */
          }
        },
        () => {
          /* ignore parse errors */
        }
      );
    })();

    return () => {
      cancelled = true;
    };
  }, [smiles, size]);

  return (
    <svg
      ref={svgRef}
      width={size}
      height={size}
      className="rounded bg-neutral-950"
    />
  );
}
