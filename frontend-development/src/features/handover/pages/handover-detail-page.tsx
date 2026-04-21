import { useParams } from 'react-router';

export const HandoverDetailPage = () => {
  const { handoverId } = useParams();

  return (
    <div className="rounded-xl border border-dashed border-[#c3c6d5] bg-white p-7 text-center shadow-sm">
      <h1 className="text-lg font-semibold text-[#191c1e]">Handover Detail</h1>
      <p className="mt-2 text-sm text-[#737784]">
        Detail page untuk dokumen <span className="font-semibold text-[#191c1e]">{handoverId}</span> belum tersedia.
      </p>
    </div>
  );
};
