// Parse a multi-model PDB (a MODEL/ENDMDL trajectory, as written by the
// reference-MD script) into per-frame coordinate arrays.

export type Frame = { x: number; y: number; z: number }[]; // indexed by atom order

export type Trajectory = {
  frames: Frame[];
  elements: string[]; // element per atom (from the first frame), same order
};

function elementOf(line: string): string {
  const col = line.slice(76, 78).trim().toUpperCase();
  if (col) return col;
  // Fall back to the atom name (columns 13-16), stripping digits.
  return line.slice(12, 16).replace(/[^A-Za-z]/g, "").toUpperCase().slice(0, 2);
}

export function parseMultiModelPdb(text: string): Trajectory {
  const lines = text.split(/\r?\n/);
  const frames: Frame[] = [];
  const elements: string[] = [];
  let current: Frame | null = null;
  let sawModel = false;

  const flush = () => {
    if (current && current.length > 0) frames.push(current);
    current = null;
  };

  for (const line of lines) {
    const rec = line.slice(0, 6);
    if (rec === "MODEL ") {
      sawModel = true;
      flush();
      current = [];
      continue;
    }
    if (rec === "ENDMDL") {
      flush();
      continue;
    }
    if (rec === "ATOM  " || rec === "HETATM") {
      if (current === null) current = []; // single-model file with no MODEL record
      const x = parseFloat(line.slice(30, 38));
      const y = parseFloat(line.slice(38, 46));
      const z = parseFloat(line.slice(46, 54));
      current.push({
        x: Number.isFinite(x) ? x : 0,
        y: Number.isFinite(y) ? y : 0,
        z: Number.isFinite(z) ? z : 0,
      });
      if (frames.length === 0) elements.push(elementOf(line));
    }
  }
  // Trailing frame with no ENDMDL, or a single-model file.
  if (current && current.length > 0) {
    if (!sawModel || frames.length === 0) frames.push(current);
  }

  return { frames, elements };
}
