import { cn } from "@chatbotx.io/ui/lib/utils"
import Image from "next/image"

/** The CaveChat mark (bat/triangle), generated from the chosen logo file. */
export const BRAND_MARK_URL = "/brand/v2/mark-512.png"

/** Whether a tenant logo URL is one of the built-in CaveChat assets. */
export const isDefaultBrandAsset = (url: string | null | undefined) =>
  !url || url.includes("/brand/v2/") || url.includes("/brand/cavechat-")

type BrandLogoProps = {
  /** Visual height of the logo: sidebar (`sm`), home (`md`) or sign-in (`lg`). */
  size?: "sm" | "md" | "lg"
  className?: string
  alt?: string
}

const SIZES = {
  sm: { mark: "size-7", text: "text-[19px]", gap: "gap-2" },
  md: { mark: "size-9", text: "text-2xl", gap: "gap-2.5" },
  lg: { mark: "size-12", text: "text-[32px]", gap: "gap-3" },
} as const

/**
 * CaveChat logo: the mark as a sharp PNG plus the wordmark as live text in the
 * interface font, so it stays crisp at any size and always matches the UI.
 * "Cave" follows the theme foreground; "Chat" is the brand red.
 */
export const BrandLogo = ({
  size = "sm",
  className,
  alt = "CaveChat",
}: BrandLogoProps) => {
  const s = SIZES[size]
  return (
    <span
      className={cn("inline-flex select-none items-center", s.gap, className)}
    >
      <Image
        alt=""
        aria-hidden
        className={cn("shrink-0 object-contain", s.mark)}
        height={128}
        priority
        src={BRAND_MARK_URL}
        unoptimized
        width={128}
      />
      <span
        aria-label={alt}
        className={cn(
          "font-bold leading-none tracking-tight",
          s.text,
        )}
        role="img"
      >
        <span className="text-foreground">Cave</span>
        <span className="text-[#fa0101]">Chat</span>
      </span>
    </span>
  )
}
