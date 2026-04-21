const navItems = [
  { href: '#project-info', label: 'Project Information' },
  { href: '#background', label: 'Background Summary' },
  { href: '#scope', label: 'Finalized Scope of Work' },
  { href: '#fees', label: 'Fee Structure & Payment Terms' },
  { href: '#docs', label: 'Client Documents' },
  { href: '#outstanding-data', label: 'Outstanding Data' },
  { href: '#risks', label: 'Key Risks / Red Flags' },
  { href: '#communication', label: 'Communication Protocol' },
  { href: '#team', label: 'Project Team Assignment' },
  { href: '#checklist', label: 'Handover Checklist' }
];

export const HandoverUpdateQuickNavigation = () => {
  return (
    <aside className="sticky top-20 max-h-[calc(100vh-6rem)] self-start space-y-2 overflow-y-auto md:col-span-2">
      <p className="px-2 text-xs font-bold uppercase tracking-widest text-[#737784]">Quick Navigation</p>
      <nav className="space-y-1">
        {navItems.map((item, index) => {
          const isActive = index === 0;
          return (
            <a
              key={item.href}
              href={item.href}
              className={
                isActive
                  ? 'flex items-center gap-3 rounded-lg bg-[#d9e2ff]/30 p-2 text-sm font-bold text-[#003c90] transition-colors'
                  : 'flex items-center gap-3 rounded-lg p-2 text-sm font-medium text-[#737784] transition-colors hover:bg-[#f2f4f6] hover:text-[#003c90]'
              }
            >
              <span
                className={
                  isActive
                    ? 'flex h-6 w-6 items-center justify-center rounded-full bg-[#003c90] text-[10px] font-bold text-white'
                    : 'flex h-6 w-6 items-center justify-center rounded-full border border-[#c3c6d5] text-[10px] font-semibold text-[#737784]'
                }
              >
                {index + 1}
              </span>
              {item.label}
            </a>
          );
        })}
      </nav>
    </aside>
  );
};
