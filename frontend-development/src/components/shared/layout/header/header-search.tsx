import { Search } from 'lucide-react';

export const HeaderSearch = () => {
  return (
    <div className="relative w-full max-w-md hidden md:block">
      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
        <Search className="w-4 h-4 text-slate-400" />
      </div>
      <input
        type="search"
        className="block w-full p-2 pl-10 text-sm text-slate-900 border border-slate-200 rounded-lg bg-slate-50 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-colors"
        placeholder="Search across Corventra..."
      />
    </div>
  );
};
