"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { cn } from "@/utils/uiHelpers";
import { markdownTableLimits } from "@/features/markdown/services/markdownEditorCommands";

const gridSize = 8;

interface MarkdownTablePickerProps {
  onInsert: (rows: number, columns: number) => void;
}

function clampNumber(value: string, min: number, max: number): number {
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? min : Math.min(max, Math.max(min, parsed));
}

export function MarkdownTablePicker({ onInsert }: MarkdownTablePickerProps) {
  const gridRef = useRef<HTMLDivElement | null>(null);
  const [active, setActive] = useState({ rows: 2, columns: 2 });
  const [customRows, setCustomRows] = useState(2);
  const [customColumns, setCustomColumns] = useState(2);

  const focusCell = (rows: number, columns: number) => {
    setActive({ rows, columns });
    gridRef.current?.querySelector<HTMLButtonElement>(`[data-cell="${rows}-${columns}"]`)?.focus();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const moves: Record<string, [number, number]> = {
      ArrowUp: [-1, 0],
      ArrowDown: [1, 0],
      ArrowLeft: [0, -1],
      ArrowRight: [0, 1]
    };
    const move = moves[event.key];
    if (!move) {
      return;
    }

    event.preventDefault();
    const rows = Math.min(gridSize, Math.max(1, active.rows + move[0]));
    const columns = Math.min(gridSize, Math.max(1, active.columns + move[1]));
    focusCell(rows, columns);
  };

  return (
    <div className="grid gap-3">
      <div>
        <div className="mb-2 text-xs font-bold text-text-secondary" aria-live="polite">
          {active.columns} x {active.rows} table
        </div>
        <div ref={gridRef} role="grid" aria-label="Table size" className="grid w-max grid-cols-8 gap-1" onKeyDown={handleKeyDown}>
          {Array.from({ length: gridSize }, (_, rowIndex) => (
            <div key={rowIndex} role="row" className="contents">
              {Array.from({ length: gridSize }, (_, columnIndex) => {
                const rows = rowIndex + 1;
                const columns = columnIndex + 1;
                const isHighlighted = rows <= active.rows && columns <= active.columns;
                const isActive = rows === active.rows && columns === active.columns;

                return (
                  <button
                    key={columnIndex}
                    type="button"
                    role="gridcell"
                    data-cell={`${rows}-${columns}`}
                    tabIndex={isActive ? 0 : -1}
                    aria-label={`${columns} columns, ${rows} rows`}
                    aria-selected={isActive}
                    className={cn(
                      "size-4 rounded-sm border transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent",
                      isHighlighted ? "border-accent bg-accent/25" : "border-border-strong bg-bg-primary"
                    )}
                    onMouseEnter={() => setActive({ rows, columns })}
                    onFocus={() => setActive({ rows, columns })}
                    onClick={() => onInsert(rows, columns)}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-border-default pt-3">
        <div className="mb-2 text-xs font-bold text-text-secondary">Custom size</div>
        <div className="grid grid-cols-2 gap-2">
          <FormField label="Columns">{(field) => <Input
            {...field}
            size="sm"
            type="number"
            min={markdownTableLimits.minColumns}
            max={markdownTableLimits.maxColumns}
            value={customColumns}
            onChange={(event) => setCustomColumns(clampNumber(event.target.value, markdownTableLimits.minColumns, markdownTableLimits.maxColumns))}
          />}</FormField>
          <FormField label="Rows">{(field) => <Input
            {...field}
            size="sm"
            type="number"
            min={markdownTableLimits.minRows}
            max={markdownTableLimits.maxRows}
            value={customRows}
            onChange={(event) => setCustomRows(clampNumber(event.target.value, markdownTableLimits.minRows, markdownTableLimits.maxRows))}
          />}</FormField>
        </div>
        <div className="mt-2 text-xs text-text-secondary">
          Max {markdownTableLimits.maxColumns} columns, {markdownTableLimits.maxRows} rows.
        </div>
        <Button size="sm" className="mt-3 w-full" onClick={() => onInsert(customRows, customColumns)}>
          Insert
        </Button>
      </div>
    </div>
  );
}
