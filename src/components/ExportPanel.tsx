"use client";

import { useMemo, useState } from "react";
import type { Bead } from "@/types/molecule";
import {
  buildMapping,
  mappingToJSON,
  downloadTextFile,
} from "@/lib/exporters";

type ExportPanelProps = {
  beads: Bead[];
  atomCount: number;
  fileName: string;
};

export default function ExportPanel({
  beads,
  atomCount,
  fileName,
}: ExportPanelProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [copied, setCopied] = useState(false);

  const json = useMemo(
    () => mappingToJSON(buildMapping(beads, atomCount, fileName)),
    [beads, atomCount, fileName]
  );

  const disabled = beads.length === 0;
  const downloadName =
    (fileName.replace(/\.[^.]+$/, "") || "molecule") + "_mapping.json";

  function handleDownload() {
    downloadTextFile(downloadName, json);
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(json);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={handleDownload}
          disabled={disabled}
          className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500 disabled:cursor-not-allowed disabled:bg-neutral-700 disabled:opacity-60"
        >
          Download mapping JSON
        </button>
        <button
          onClick={handleCopy}
          disabled={disabled}
          className="rounded-lg border border-neutral-700 px-4 py-2 text-sm text-neutral-200 hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {copied ? "Copied!" : "Copy JSON"}
        </button>
        <button
          onClick={() => setShowPreview((v) => !v)}
          disabled={disabled}
          className="rounded-lg border border-neutral-700 px-4 py-2 text-sm text-neutral-200 hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {showPreview ? "Hide preview" : "Show preview"}
        </button>
        <span className="text-sm text-neutral-500">
          {disabled
            ? "Create at least one bead to export."
            : `Saves as ${downloadName}`}
        </span>
      </div>

      {showPreview && !disabled && (
        <pre className="mt-4 max-h-96 overflow-auto rounded-lg border border-neutral-800 bg-neutral-950 p-4 text-xs text-neutral-300">
          {json}
        </pre>
      )}
    </div>
  );
}
