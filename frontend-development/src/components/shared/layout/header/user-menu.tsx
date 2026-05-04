import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import { UserProfileSummary } from './user-profile-summary';
import { headerUserMenu } from '../../../../app/navigation/header-menu';
import { useAuth } from '../../../../app/store/auth-store';
import { ROLE_LABELS } from '../../../../app/permissions';

export const UserMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  const displayName = user.name;
  const displayRole = ROLE_LABELS[user.role];

  const handleLogout = () => {
    setIsOpen(false);
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <UserProfileSummary name={displayName} role={displayRole} />
        <ChevronDown className="w-4 h-4 text-slate-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-slate-200 overflow-hidden z-50">
          <div className="px-4 py-3 border-b border-slate-100 md:hidden">
            <span className="block text-sm font-semibold text-slate-800">{displayName}</span>
            <span className="block text-xs text-slate-500">{displayRole}</span>
          </div>
          <ul className="py-1">
            {headerUserMenu.map((item) => {
              const ItemIcon = item.icon;
              const itemClassName = item.isDanger
                ? 'block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors cursor-pointer'
                : 'block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors';

              const itemContent = (
                <span className="flex items-center gap-2">
                  {ItemIcon && <ItemIcon className="w-4 h-4" />}
                  <span>{item.label}</span>
                </span>
              );

              return (
                <li key={item.path}>
                  {item.isDanger ? (
                    <button type="button" className={itemClassName} onClick={handleLogout}>
                      {itemContent}
                    </button>
                  ) : (
                    <Link to={item.path} className={itemClassName} onClick={() => setIsOpen(false)}>
                      {itemContent}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};
