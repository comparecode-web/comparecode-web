import type { ReactNode } from "react";

interface AlignmentWorkspaceProps {
  stage: ReactNode;
  preview: ReactNode;
  manual: ReactNode;
  automatic: ReactNode;
}

export function AlignmentWorkspace({ stage, preview, manual, automatic }: AlignmentWorkspaceProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden md:grid md:grid-cols-[14rem_minmax(0,1fr)_18rem] xl:grid-cols-[17rem_minmax(0,1fr)_22rem]">
      <div className="flex min-h-0 min-w-0 flex-1 md:col-start-2 md:row-start-1">{stage}</div>
      <aside className="min-h-0 min-w-0 shrink-0 overflow-y-auto border-r border-t border-border-default bg-bg-secondary p-3 custom-scrollbar max-md:max-h-[27.5%] md:col-start-1 md:row-start-1 md:border-t-0">
        <div className="flex flex-col gap-3">{preview}{automatic}</div>
      </aside>
      <aside className="min-h-0 min-w-0 shrink-0 overflow-y-auto border-t border-border-default bg-bg-secondary p-3 custom-scrollbar max-md:max-h-[27.5%] md:col-start-3 md:row-start-1 md:border-l md:border-t-0">
        {manual}
      </aside>
    </div>
  );
}
