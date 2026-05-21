import { FolderSearch } from 'lucide-react';

export const DocumentCenterListEmptyState = () => (
  <div className="rounded-xl border border-dashed border-[#d5d9de] bg-white px-6 py-16 text-center shadow-sm">
    <FolderSearch className="mx-auto h-10 w-10 text-[#737784]/60" />
    <p className="mt-4 text-sm font-semibold text-[#191c1e]">Tidak ada lead yang cocok dengan filter</p>
    <p className="mt-1 text-sm text-[#737784]">Ubah kata kunci atau reset filter untuk melihat daftar repository.</p>
  </div>
);
