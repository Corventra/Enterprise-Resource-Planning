import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { UserProfileSummary } from './user-profile-summary';
import { headerUserMenu } from '../../../../app/navigation/header-menu';
import { Link } from 'react-router'; // Actually react-router uses Link/NavLink

export const UserMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Dummy user data
  const currentUser = {
    name: 'Jane Cooper',
    role: 'Financial Controller'
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button 
        className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <UserProfileSummary name={currentUser.name} role={currentUser.role} />
        <ChevronDown className="w-4 h-4 text-slate-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-slate-200 overflow-hidden z-50">
          <div className="px-4 py-3 border-b border-slate-100 md:hidden">
            <span className="block text-sm font-semibold text-slate-800">{currentUser.name}</span>
            <span className="block text-xs text-slate-500">{currentUser.role}</span>
          </div>
          <ul className="py-1">
            {headerUserMenu.map((item) => (
              <li key={item.path}>
                {(() => {
                  const ItemIcon = item.icon;
                  const itemClassName = item.isDanger
                    ? 'block px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors'
                    : 'block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors';

                  return (
                <Link
                  to={item.path}
                  className={itemClassName}
                  onClick={() => setIsOpen(false)}
                >
                  <span className="flex items-center gap-2">
                    {ItemIcon && <ItemIcon className="w-4 h-4" />}
                    <span>{item.label}</span>
                  </span>
                </Link>
                  );
                })()}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
