"use client"

import { cn } from "@chatbotx.io/ui/lib/utils"
import Image from "next/image"
import { useEffect, useState } from "react"
import { useTenantSettings } from "@/features/tenant"
import { useCurrentTheme } from "@/hooks/use-current-theme"
import {
  BRAND_MARK_URL,
  BrandLogo,
  isDefaultBrandAsset,
} from "./brand-logo"

type BrandIconProps = {
  alt?: string
  className?: string
}

export const BrandIcon = ({ alt = "CaveChat", className }: BrandIconProps) => {
  const currentTheme = useCurrentTheme()
  const [mounted, setMounted] = useState(false)
  const { logoLightUrl, logoDarkUrl, faviconUrl } = useTenantSettings()

  useEffect(() => {
    setMounted(true)
  }, [])

  const logoUrl = currentTheme === "dark" ? logoLightUrl : logoDarkUrl
  const useBuiltIn = isDefaultBrandAsset(logoUrl)
  const iconUrl = isDefaultBrandAsset(faviconUrl) ? BRAND_MARK_URL : faviconUrl

  return (
    <>
      {/* Logo - shown when expanded */}
      {useBuiltIn ? (
        <BrandLogo
          alt={alt}
          className={cn(
            className,
            "brand-expanded group-data-[collapsible=icon]:hidden",
          )}
          size="sm"
        />
      ) : mounted ? (
        <Image
          alt={alt}
          className={cn(
            className,
            "brand-expanded h-8 w-auto object-contain group-data-[collapsible=icon]:hidden",
          )}
          height={80}
          src={logoUrl}
          unoptimized
          width={271}
        />
      ) : (
        <div className={cn(className, "h-8 w-auto")} />
      )}
      {/* Icon - shown when collapsed (square mark, never stretched or inverted) */}
      <Image
        alt={alt}
        className={cn(
          className,
          "brand-collapsed hidden size-8 object-contain group-data-[collapsible=icon]:block",
        )}
        height={128}
        loading="eager"
        src={iconUrl}
        unoptimized
        width={128}
      />
    </>
  )
}
