import Image from "next/image";

const VARIANTS = {
  dark: { src: "/brand/logo-dark.png", width: 1690, height: 748 },
  light: { src: "/brand/logo-light.png", width: 1709, height: 770 },
  square: { src: "/brand/logo-square-white.png", width: 1080, height: 1080 },
} as const;

export default function Logo({
  variant = "dark",
  className = "",
}: {
  variant?: keyof typeof VARIANTS;
  className?: string;
}) {
  const { src, width, height } = VARIANTS[variant];
  return (
    <Image
      src={src}
      alt="Pakistani Creative Collective — created by Aneesa Talks"
      width={width}
      height={height}
      priority
      className={className}
    />
  );
}
