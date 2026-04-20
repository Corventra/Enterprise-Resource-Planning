import { ChevronLeft, ChevronRight } from 'lucide-react';

interface SidebarToggleProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export const SidebarToggle = ({ isCollapsed, onToggle }: SidebarToggleProps) => {
  const Icon = isCollapsed ? ChevronRight : ChevronLeft;

  return (
    <button
      onClick={onToggle}
      className="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[linear-gradient(135deg,#003c90_0%,#0f52ba_100%)] border-2 border-white hover:bg-[linear-gradient(135deg,#002d6b_0%,#0c4190_100%)] flex items-center justify-center transition-colors shadow-lg z-50 focus:outline-none focus:ring-2 focus:ring-[#003c90]"
      aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
    >
      <Icon className="w-3 h-3 text-white" />
    </button>
  );
};
