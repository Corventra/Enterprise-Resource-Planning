import corventraLogoSrc from '../../assets/branding/corventra-logo.svg';

type CorventraLogoProps = {
  className?: string;
};

/** Logo from `src/assets/branding/corventra-logo.svg` */
export function CorventraLogo({ className = '' }: CorventraLogoProps) {
  return (
    <img
      src={corventraLogoSrc}
      alt="Corventra"
      className={`block object-contain ${className}`.trim()}
    />
  );
}
