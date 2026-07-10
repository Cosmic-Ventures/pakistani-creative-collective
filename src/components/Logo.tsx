import Image from "next/image";

export default function Logo({
  variant = "dark",
  className = "",
}: {
  variant?: "dark" | "light";
  className?: string;
}) {
  const isLight = variant === "light";
  return (
    <Image
      src={isLight ? "/brand/logo-light.png" : "/brand/logo-dark.png"}
      alt="Pakistani Creative Collective — created by Aneesa Talks"
      width={isLight ? 1709 : 1690}
      height={isLight ? 770 : 748}
      priority
      className={className}
    />
  );
}
