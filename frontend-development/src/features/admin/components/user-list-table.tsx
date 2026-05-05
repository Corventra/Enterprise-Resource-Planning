import { KeyRound, Pencil, Trash2 } from 'lucide-react';
import type { ManagedUser } from '../types/admin.types';

interface UserListTableProps {
  users: ManagedUser[];
  isLoading: boolean;
  currentUserId?: number;
  onEdit: (user: ManagedUser) => void;
  onResetPassword: (user: ManagedUser) => void;
  onDelete: (user: ManagedUser) => void;
}

const formatDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: '2-digit' });
  } catch {
    return iso;
  }
};

export const UserListTable = ({
  users,
  isLoading,
  currentUserId,
  onEdit,
  onResetPassword,
  onDelete
}: UserListTableProps) => {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-[#eceef0] bg-white px-6 py-10 text-center text-sm text-[#737784]">
        Memuat daftar user dari server...
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="rounded-xl border border-[#eceef0] bg-white px-6 py-10 text-center text-sm text-[#737784]">
        Tidak ada user. Klik "Add User" untuk membuat akun pertama.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[#eceef0] bg-white shadow-sm">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-[#eceef0] bg-[#f8fafc] text-xs font-bold uppercase tracking-wider text-[#737784]">
            <th className="px-4 py-3">Email</th>
            <th className="px-4 py-3">Nama</th>
            <th className="px-4 py-3">Role</th>
            <th className="px-4 py-3">Departments</th>
            <th className="px-4 py-3">Dibuat</th>
            <th className="px-4 py-3 text-right">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => {
            const isSelf = currentUserId === user.id;
            return (
              <tr key={user.id} className="border-b border-[#eceef0] last:border-b-0 hover:bg-[#f8fafc]">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-[#003c90]">{user.email}</span>
                    {isSelf && (
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                        You
                      </span>
                    )}
                    {!user.isActive && (
                      <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-rose-700">
                        Inactive
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 font-medium text-[#191c1e]">{user.name}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex rounded-full bg-[#d5e3fc]/60 px-2.5 py-1 text-[11px] font-bold text-[#003c90]">
                    {user.role.name}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {user.departments.length === 0 ? (
                    <span className="text-xs italic text-[#737784]">all-spanning</span>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {user.departments.map((d) => (
                        <span
                          key={d.id}
                          className={
                            d.isPrimary
                              ? 'inline-flex items-center gap-1 rounded-full bg-[#003c90] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white'
                              : 'inline-flex items-center rounded-full border border-[#003c90]/30 bg-[#d5e3fc]/40 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#003c90]'
                          }
                          title={d.name}
                        >
                          {d.code}
                          {d.isPrimary && <span className="ml-0.5 opacity-70">★</span>}
                        </span>
                      ))}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-[#737784]">{formatDate(user.createdAt)}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => onEdit(user)}
                      className="inline-flex items-center gap-1 rounded-md border border-[#eceef0] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#191c1e] transition-colors hover:bg-[#f2f4f6]"
                      title="Edit user"
                    >
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => onResetPassword(user)}
                      className="inline-flex items-center gap-1 rounded-md border border-[#eceef0] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#191c1e] transition-colors hover:bg-[#f2f4f6]"
                      title="Reset password"
                    >
                      <KeyRound className="h-3.5 w-3.5" /> Reset
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(user)}
                      disabled={isSelf}
                      className="inline-flex items-center gap-1 rounded-md border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-700 transition-colors hover:bg-rose-100 disabled:cursor-not-allowed disabled:border-[#eceef0] disabled:bg-[#f2f4f6] disabled:text-[#737784]"
                      title={isSelf ? 'Tidak bisa hapus akun sendiri' : 'Hapus user'}
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
