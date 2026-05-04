export const DocumentCenterPage = () => {
  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Document Center</h1>
        <p className="mt-1 text-sm text-slate-500">
          Pusat dokumen operasional. Data real akan dihubungkan ke backend pada fase berikutnya.
        </p>
      </header>
      <div className="rounded-xl border border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-600 shadow-sm">
        Belum ada dokumen untuk ditampilkan.
      </div>
    </div>
  );
};
