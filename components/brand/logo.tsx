import { cn } from "@/lib/utils";

/**
 * Marca Acopia. Reemplaza el texto "Acopio Hub" y el icono cuadrado.
 * El archivo vive en /public/LogoAcopia.png.
 */
export function Logo({
  className,
  height = 36,
}: {
  className?: string;
  height?: number;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/LogoAcopia.png"
      alt="Acopia"
      height={height}
      style={{ height }}
      className={cn("w-auto select-none", className)}
      draggable={false}
    />
  );
}
