interface PublicFormHeaderBannerProps {
  imageUrl: string;
  usesDefaultImage: boolean;
}

export const PublicFormHeaderBanner = ({ imageUrl, usesDefaultImage }: PublicFormHeaderBannerProps) => (
  <article className="overflow-hidden rounded-2xl border border-[#eceef0] bg-white shadow-sm">
    <div className="relative aspect-[772/194.5] w-full">
      <img
        src={imageUrl}
        alt=""
        className={
          usesDefaultImage
            ? 'absolute inset-0 h-full w-full bg-[#f0f4f8] object-contain object-center p-8'
            : 'absolute inset-0 h-full w-full object-cover'
        }
      />
    </div>
  </article>
);
