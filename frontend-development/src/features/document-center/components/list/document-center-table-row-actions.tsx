import { FolderOpen } from 'lucide-react';

interface DocumentCenterTableRowActionsProps {
  onOpen: () => void;
}

const baseBtn =
  'inline-flex text-[#737784] transition-colors hover:text-[#003c90] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1d59c1]/40';

export const DocumentCenterTableRowActions = ({ onOpen }: DocumentCenterTableRowActionsProps) => (
  <div className="flex items-center justify-center gap-2">
    <button
      type="button"
      className={baseBtn}
      onClick={onOpen}
      aria-label="Buka repository dokumen"
      title="Buka"
    >
      <FolderOpen className="h-4 w-4" strokeWidth={2} />
    </button>
  </div>
);
