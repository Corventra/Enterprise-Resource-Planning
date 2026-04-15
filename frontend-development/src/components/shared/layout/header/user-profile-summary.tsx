interface UserProfileSummaryProps {
  name: string;
  role: string;
  avatarUrl?: string;
}

export const UserProfileSummary = ({ name, role, avatarUrl }: UserProfileSummaryProps) => {
  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <div className="flex items-center gap-3">
      <div className="flex flex-col items-end hidden md:flex">
        <span className="text-sm font-semibold text-slate-800 leading-none">{name}</span>
        <span className="text-xs text-slate-500 mt-1">{role}</span>
      </div>
      <div className="flex-shrink-0 w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold text-sm border border-blue-200 shadow-sm">
        {avatarUrl ? (
          <img src={avatarUrl} alt={name} className="w-full h-full rounded-full object-cover" />
        ) : (
          initials
        )}
      </div>
    </div>
  );
};
