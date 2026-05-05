import { Pencil, Power, Trash2, Users } from 'lucide-react';
import type { ManagedDepartment } from '../types/admin.types';

interface DepartmentListTableProps {
  departments: ManagedDepartment[];
  isLoading: boolean;
  onEdit: (dept: ManagedDepartment) => void;
  onToggleActive: (dept: ManagedDepartment) => void;
  onDelete: (dept: ManagedDepartment) => void;
}

const formatDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: '2-digit' });
  } catch {
    return iso;
  }
};

export const DepartmentListTable = ({
  departments,
  isLoading,
  onEdit,
  onToggleActive,
  onDelete
}: DepartmentListTableProps) => {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-[#eceef0] bg-white px-6 py-10 text-center text-sm text-[#737784]">
        Memuat daftar department dari server...
      </div>
    );
  }
  if (departments.length === 0) {
    return (
      <div className="rounded-xl border border-[#eceef0] bg-white px-6 py-10 text-center text-sm text-[#737784]">
        Belum ada department. Klik "Add Department" untuk membuat yang pertama.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[#eceef0] bg-white shadow-sm">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-[#eceef0] bg-[#f8fafc] text-xs font-bold uppercase tracking-wider text-[#737784]">
            <th className="px-4 py-3">Code</th>
            <th className="px-4 py-3">Nama</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Users</th>
            <th className="px-4 py-3">Dibuat</th>
            <th className="px-4 py-3 text-right">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {departments.map((d) => {
            const hasUsers = d.userCount > 0;
            return (
              <tr key={d.id} className="border-b border-[#eceef0] last:border-b-0 hover:bg-[#f8fafc]">
                <td className="px-4 py-3">
                  <span className="font-mono text-xs font-bold text-[#003c90]">{d.code}</span>
                </td>
                <td className="px-4 py-3 font-medium text-[#191c1e]">{d.name}</td>
                <td className="px-4 py-3">
                  {d.isActive ? (
                    <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold uppercase text-emerald-700">
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold uppercase text-slate-600">
                      Inactive
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1 text-xs text-[#191c1e]">
                    <Users className="h-3.5 w-3.5 text-[#737784]" />
                    {d.userCount}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-[#737784]">{formatDate(d.createdAt)}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => onEdit(d)}
                      className="inline-flex items-center gap-1 rounded-md border border-[#eceef0] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#191c1e] transition-colors hover:bg-[#f2f4f6]"
                      title="Edit name / status"
                    >
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => onToggleActive(d)}
                      className={
                        d.isActive
                          ? 'inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs font-semibold text-amber-700 transition-colors hover:bg-amber-100'
                          : 'inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100'
                      }
                      title={d.isActive ? 'Set inactive' : 'Set active'}
                    >
                      <Power className="h-3.5 w-3.5" /> {d.isActive ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(d)}
                      disabled={hasUsers}
                      className="inline-flex items-center gap-1 rounded-md border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-700 transition-colors hover:bg-rose-100 disabled:cursor-not-allowed disabled:border-[#eceef0] disabled:bg-[#f2f4f6] disabled:text-[#737784]"
                      title={hasUsers ? `Reassign ${d.userCount} user dulu` : 'Hapus department'}
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
