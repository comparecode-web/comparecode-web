import { cn } from "@/utils/uiHelpers";
import type { DiffSurface } from "../../utils/diffSurfaces";
import { LINE_CELL_CLASS, LINE_NUMBER_GUTTER_CLASS, ROW_FRAME_CLASS } from "./rowLayout";

export type DiffSurfaceTarget = "row" | "split-old" | "split-new" | "unified-line";

interface DiffSurfaceLayerProps {
  surfaces: Array<DiffSurface>;
  target: DiffSurfaceTarget;
  className?: string;
}

function SurfaceBody({ surface, target }: { surface: DiffSurface; target: DiffSurfaceTarget }) {
  const fill = cn(
    "h-full transition-colors duration-(--duration-medium)",
    surface.className,
    surface.roundedTop && "rounded-t-md",
    surface.roundedBottom && "rounded-b-md"
  );
  const frame = cn(ROW_FRAME_CLASS, "flex h-full border-transparent");

  if (target === "row") {
    return <div className={frame}><div className={cn("flex-1", fill)} /></div>;
  }
  if (target === "unified-line") {
    return (
      <div className={frame}>
        <div className={LINE_NUMBER_GUTTER_CLASS} />
        <div className={LINE_NUMBER_GUTTER_CLASS} />
        <div className={cn(LINE_CELL_CLASS, "min-w-0", fill)} />
      </div>
    );
  }
  const cell = (
    <div className="flex w-1/2 flex-1">
      <div className={LINE_NUMBER_GUTTER_CLASS} />
      <div className={cn(LINE_CELL_CLASS, fill)} />
    </div>
  );
  const spacer = <div className="w-1/2 flex-1" />;
  return <div className={frame}>{target === "split-old" ? <>{cell}{spacer}</> : <>{spacer}{cell}</>}</div>;
}

export function DiffSurfaceLayer({ surfaces, target, className }: DiffSurfaceLayerProps) {
  return surfaces.map((surface) => (
    <div
      key={surface.key}
      aria-hidden="true"
      data-surface={target}
      className={cn("pointer-events-none absolute left-0 w-full", className)}
      style={{ top: surface.top, height: surface.height }}
    >
      <SurfaceBody surface={surface} target={target} />
    </div>
  ));
}
