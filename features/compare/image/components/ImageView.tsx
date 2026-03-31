"use client";

import { MdImage } from "react-icons/md";

export function ImageView() {
  return (
    <div className="flex h-full w-full flex-col bg-bg-secondary">
      <div className="flex h-(--header-height) shrink-0 items-center border-b border-border-default bg-bg-primary px-3 sm:px-6">
        <div className="flex items-center gap-2 sm:gap-3">
          <MdImage className="text-xl sm:text-2xl text-text-secondary" />
          <h2 className="text-lg sm:text-xl font-bold text-text-primary">Image</h2>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-2xl rounded-xl border border-dashed border-border-default bg-bg-primary p-6 sm:p-10 text-center">
          <p className="text-base font-semibold text-text-primary">Image compare is coming soon.</p>
          <p className="mt-2 text-sm text-text-secondary">
            This tab is ready for the upcoming image diff implementation.
          </p>
        </div>
      </div>
    </div>
  );
}
