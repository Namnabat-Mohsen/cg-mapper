// Lazily loads the RDKit MinimalLib (WASM) from a CDN and caches the instance.
// Used to turn SMILES into atoms + bonds in the browser.

/* eslint-disable @typescript-eslint/no-explicit-any */

const CDN_BASE = "https://unpkg.com/@rdkit/rdkit/dist";

let rdkitPromise: Promise<any> | null = null;

export function loadRDKit(): Promise<any> {
  if (rdkitPromise) return rdkitPromise;

  rdkitPromise = new Promise((resolve, reject) => {
    const w = window as any;

    const start = () => {
      w.initRDKitModule({ locateFile: (f: string) => `${CDN_BASE}/${f}` })
        .then((RDKit: any) => {
          w.RDKit = RDKit;
          resolve(RDKit);
        })
        .catch(reject);
    };

    if (w.RDKit) return resolve(w.RDKit);
    if (w.initRDKitModule) return start();

    const script = document.createElement("script");
    script.src = `${CDN_BASE}/RDKit_minimal.js`;
    script.async = true;
    script.onload = start;
    script.onerror = () =>
      reject(new Error("Failed to load RDKit from CDN"));
    document.head.appendChild(script);
  });

  return rdkitPromise;
}
