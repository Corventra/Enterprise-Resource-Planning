const navItems = [
  { href: '#project-info', label: 'Project Information' },
  { href: '#background', label: 'Background Summary' },
  { href: '#scope', label: 'Scope of Work' },
  { href: '#fees', label: 'Fees & Terms' },
  { href: '#docs', label: 'Documents' },
  { href: '#risks', label: 'Risks & Communication' },
  { href: '#team', label: 'Team & Checklist' },
  { href: '#signoff', label: 'Sign-Off & Control' }
];

export const HandoverQuickNavigation = () => {
  return (
    <aside className="max-h-[calc(100vh-6rem)] space-y-3 overflow-y-auto pr-1">
      <p className="px-3 text-xs font-bold uppercase tracking-widest text-[#737784]">Quick Navigation</p>
      <nav className="flex flex-col gap-1 border-l-2 border-[#e6e8ea]">
        {navItems.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className="-ml-[2px] border-l-2 border-transparent py-2 pl-3 text-sm font-medium text-[#434653] transition-colors hover:border-[#003c90] hover:text-[#003c90]"
          >
            {item.label}
          </a>
        ))}
      </nav>
    </aside>
  );
};
