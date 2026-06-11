import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export const SCHEDELUX_LOGO_SRC = "/schedelux-logo.png";
export const SCHEDELUX_TAGLINE = "BOOK | MANAGE | GROW";

/** Horizontal lockup — 1024×297 source */
const LOGO_WIDTH = 1024;
const LOGO_HEIGHT = 297;

type SchedeluxLogoProps = {
  /** full = hero panels, header = nav bars, compact = tight spaces */
  variant?: "full" | "header" | "compact";
  className?: string;
  href?: string | null;
  priority?: boolean;
};

export function SchedeluxLogo({
  variant = "header",
  className,
  href = "/",
  priority = false,
}: SchedeluxLogoProps) {
  const image = (
    <Image
      src={SCHEDELUX_LOGO_SRC}
      alt={`Schedelux — ${SCHEDELUX_TAGLINE}`}
      width={LOGO_WIDTH}
      height={LOGO_HEIGHT}
      priority={priority}
      quality={95}
      className={cn(
        "h-auto w-auto max-w-none object-contain object-left",
        variant === "full" && "w-[min(560px,94vw)]",
        variant === "header" && "h-12 w-auto sm:h-14",
        variant === "compact" && "h-10 w-auto sm:h-11",
        className
      )}
    />
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex shrink-0 items-center" aria-label="Schedelux home">
        {image}
      </Link>
    );
  }

  return <span className="inline-flex shrink-0 items-center">{image}</span>;
}
