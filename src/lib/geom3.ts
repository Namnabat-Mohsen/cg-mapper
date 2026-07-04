// Small 3D vector helpers + internal-coordinate measurements shared by the
// topology writer and the Boltzmann-inversion fitter. Positions are in
// Angstrom; distNm returns nm.

export type V = { x: number; y: number; z: number };

export const sub = (a: V, b: V): V => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
export const dot = (a: V, b: V): number => a.x * b.x + a.y * b.y + a.z * b.z;
export const cross = (a: V, b: V): V => ({
  x: a.y * b.z - a.z * b.y,
  y: a.z * b.x - a.x * b.z,
  z: a.x * b.y - a.y * b.x,
});
export const norm = (a: V): number => Math.sqrt(dot(a, a)) || 1e-9;

export function distNm(a: V, b: V): number {
  return norm(sub(a, b)) / 10;
}

// Angle a-b-c (b is the vertex), in degrees.
export function angleDeg(a: V, b: V, c: V): number {
  const ba = sub(a, b);
  const bc = sub(c, b);
  const cosT = dot(ba, bc) / (norm(ba) * norm(bc));
  return (Math.acos(Math.max(-1, Math.min(1, cosT))) * 180) / Math.PI;
}

// Proper/improper dihedral a-b-c-d, in degrees (-180, 180].
export function dihedralDeg(a: V, b: V, c: V, d: V): number {
  const b0 = sub(a, b);
  const b1 = sub(c, b);
  const b2 = sub(d, c);
  const n1 = cross(b0, b1);
  const n2 = cross(b1, b2);
  const b1n = { x: b1.x / norm(b1), y: b1.y / norm(b1), z: b1.z / norm(b1) };
  const m1 = cross(n1, b1n);
  const x = dot(n1, n2);
  const y = dot(m1, n2);
  return (Math.atan2(y, x) * 180) / Math.PI;
}
