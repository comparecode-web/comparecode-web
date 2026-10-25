import type { DiffAlgorithm } from "../store/useImageCompareStore";

export function DiffLegend({ diffAlgorithm }: { diffAlgorithm: DiffAlgorithm }) {
  return (
    <>
      {diffAlgorithm === "highlight" && (
        <div className="flex flex-wrap items-center gap-4 shrink-0">
          <span className="flex items-center gap-1.5 text-xs text-text-secondary"><span className="inline-block w-3 h-3 rounded-sm bg-[#28C850]" /> Brightened in modified</span>
          <span className="flex items-center gap-1.5 text-xs text-text-secondary"><span className="inline-block w-3 h-3 rounded-sm bg-[#F03C3C]" /> Darkened in modified</span>
          <span className="flex items-center gap-1.5 text-xs text-text-secondary"><span className="inline-block w-3 h-3 rounded-sm bg-[#808080]" /> Unchanged</span>
        </div>
      )}
      {diffAlgorithm === "absolute" && (
        <div className="flex flex-wrap items-center gap-4 shrink-0">
          <span className="flex items-center gap-1.5 text-xs text-text-secondary"><span className="inline-block w-3 h-3 rounded-sm bg-black border border-border-default" /> Identical</span>
          <span className="flex items-center gap-1.5 text-xs text-text-secondary"><span className="inline-block w-3 h-3 rounded-sm bg-white border border-border-default" /> Maximum difference</span>
          <span className="text-xs text-text-secondary">Per-channel |orig − mod| × 4</span>
        </div>
      )}
      {diffAlgorithm === "subtract" && (
        <div className="flex flex-wrap items-center gap-4 shrink-0">
          <span className="flex items-center gap-1.5 text-xs text-text-secondary"><span className="inline-block w-3 h-3 rounded-sm bg-black border border-border-default" /> Same or original brighter</span>
          <span className="flex items-center gap-1.5 text-xs text-text-secondary"><span className="inline-block w-3 h-3 rounded-sm bg-white border border-border-default" /> Modified is brighter</span>
        </div>
      )}
      {diffAlgorithm === "perceptual" && (
        <div className="flex flex-wrap items-center gap-4 shrink-0">
          <span className="flex items-center gap-1.5 text-xs text-text-secondary"><span className="inline-block w-3 h-3 rounded-sm bg-[#101018]" /> Imperceptible (ΔE &lt; 2)</span>
          <span className="flex items-center gap-1.5 text-xs text-text-secondary"><span className="inline-block w-3 h-3 rounded-sm bg-[#FFE600]" /> Noticeable</span>
          <span className="flex items-center gap-1.5 text-xs text-text-secondary"><span className="inline-block w-3 h-3 rounded-sm bg-[#FF6000]" /> Clear</span>
          <span className="flex items-center gap-1.5 text-xs text-text-secondary"><span className="inline-block w-3 h-3 rounded-sm bg-[#FF0000]" /> Dramatic (ΔE &gt; 50)</span>
        </div>
      )}
      {diffAlgorithm === "heatmap" && (
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <span className="text-xs text-text-secondary font-semibold">Change intensity:</span>
          <span className="flex items-center gap-1.5 text-xs text-text-secondary"><span className="inline-block w-3 h-3 rounded-sm bg-black border border-border-default" /> None</span>
          <span className="flex items-center gap-1.5 text-xs text-text-secondary"><span className="inline-block w-3 h-3 rounded-sm bg-[#0000FF]" /> Low</span>
          <span className="flex items-center gap-1.5 text-xs text-text-secondary"><span className="inline-block w-3 h-3 rounded-sm bg-[#00FFFF]" /></span>
          <span className="flex items-center gap-1.5 text-xs text-text-secondary"><span className="inline-block w-3 h-3 rounded-sm bg-[#00FF00]" /></span>
          <span className="flex items-center gap-1.5 text-xs text-text-secondary"><span className="inline-block w-3 h-3 rounded-sm bg-[#FFFF00]" /> High</span>
          <span className="flex items-center gap-1.5 text-xs text-text-secondary"><span className="inline-block w-3 h-3 rounded-sm bg-[#FF0000]" /> Max</span>
        </div>
      )}
      {diffAlgorithm === "ssim" && (
        <div className="flex flex-wrap items-center gap-4 shrink-0">
          <span className="text-xs text-text-secondary font-semibold">Structural dissimilarity:</span>
          <span className="flex items-center gap-1.5 text-xs text-text-secondary"><span className="inline-block w-3 h-3 rounded-sm bg-black border border-border-default" /> Identical (SSIM = 1)</span>
          <span className="flex items-center gap-1.5 text-xs text-text-secondary"><span className="inline-block w-3 h-3 rounded-sm bg-[#00FFFF]" /> Some change</span>
          <span className="flex items-center gap-1.5 text-xs text-text-secondary"><span className="inline-block w-3 h-3 rounded-sm bg-[#FF0000]" /> Major difference</span>
        </div>
      )}
      {diffAlgorithm === "edge" && (
        <div className="flex flex-wrap items-center gap-4 shrink-0">
          <span className="flex items-center gap-1.5 text-xs text-text-secondary"><span className="inline-block w-3 h-3 rounded-sm bg-black border border-border-default" /> No change boundary</span>
          <span className="flex items-center gap-1.5 text-xs text-text-secondary"><span className="inline-block w-3 h-3 rounded-sm bg-[#00FFFF]" /> Edge of changed region</span>
        </div>
      )}
      {diffAlgorithm === "threshold" && (
        <div className="flex flex-wrap items-center gap-4 shrink-0">
          <span className="flex items-center gap-1.5 text-xs text-text-secondary"><span className="inline-block w-3 h-3 rounded-sm bg-white border border-border-default" /> Changed</span>
          <span className="flex items-center gap-1.5 text-xs text-text-secondary"><span className="inline-block w-3 h-3 rounded-sm bg-black border border-border-default" /> Unchanged</span>
        </div>
      )}
      {diffAlgorithm === "channel-split" && (
        <div className="flex flex-wrap items-center gap-4 shrink-0">
          <span className="flex items-center gap-1.5 text-xs text-text-secondary"><span className="inline-block w-3 h-3 rounded-sm bg-[#ff4040]" /> R channel diff</span>
          <span className="flex items-center gap-1.5 text-xs text-text-secondary"><span className="inline-block w-3 h-3 rounded-sm bg-[#40ff40]" /> G channel diff</span>
          <span className="flex items-center gap-1.5 text-xs text-text-secondary"><span className="inline-block w-3 h-3 rounded-sm bg-[#4080ff]" /> B channel diff</span>
        </div>
      )}
    </>
  );
}
