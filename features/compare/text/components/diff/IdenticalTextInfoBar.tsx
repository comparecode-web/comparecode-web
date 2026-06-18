import { MdInfoOutline } from "react-icons/md";

interface IdenticalTextInfoBarProps {
  isVisible: boolean;
}

export function IdenticalTextInfoBar({ isVisible }: IdenticalTextInfoBarProps) {
  if (!isVisible) {
    return null;
  }

  return (
    <div className="flex min-h-9 shrink-0 items-center gap-2 border-b border-info-border bg-info-bg px-3 py-2 text-sm font-semibold text-info sm:px-4">
      <MdInfoOutline className="h-5 w-5 shrink-0" aria-hidden="true" />
      <span className="min-w-0 leading-5">The two texts are completely identical.</span>
    </div>
  );
}
