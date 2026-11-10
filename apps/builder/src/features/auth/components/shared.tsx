"use client"

import { CardTitle } from "@chatbotx.io/ui/components/ui/card"
import Image from "next/image"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { useEffect, useState } from "react"
import { BrandLogo, isDefaultBrandAsset } from "@/components/brand-logo"
import { useTenantSettings } from "@/features/tenant"
import { useCurrentTheme } from "@/hooks/use-current-theme"

export type AuthHeaderProps = {
  title: string
}

export const AuthHeader = ({ title }: AuthHeaderProps) => {
  const currentTheme = useCurrentTheme()
  const [mounted, setMounted] = useState(false)
  const { name, logoLightUrl, logoDarkUrl } = useTenantSettings()

  useEffect(() => {
    setMounted(true)
  }, [])

  const logoUrl = currentTheme === "dark" ? logoLightUrl : logoDarkUrl

  return (
    <>
      <div className="flex h-16 items-center justify-center">
        {isDefaultBrandAsset(logoUrl) ? (
          <BrandLogo alt={name} size="lg" />
        ) : mounted ? (
          <Image
            alt={name}
            className="h-16 w-auto object-contain"
            height={80}
            priority={true}
            src={logoUrl}
            unoptimized
            width={271}
          />
        ) : null}
      </div>

      <CardTitle className="font-semibold text-foreground text-xl">{title}</CardTitle>
    </>
  )
}

export const AcceptTermsAndPolicy = ({
  termsOfService,
  privacyPolicy,
}: {
  termsOfService: string
  privacyPolicy: string
}) => {
  const t = useTranslations()

  return (
    <div className="text-balance text-center text-muted-foreground text-xs [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:text-primary">
      <span>{t("auth.acceptTermsAndPolicy")}</span>{" "}
      <Link href={termsOfService} target="_blank">
        {t("auth.termsOfService")}
      </Link>{" "}
      <span>{t("auth.and")}</span>{" "}
      <Link href={privacyPolicy} target="_blank">
        {t("auth.privacyPolicy")}
      </Link>
    </div>
  )
}

export const OrSeparator = () => {
  const t = useTranslations()

  return (
    <div className="relative flex h-4 w-full items-center justify-center text-center text-sm">
      <hr className="w-full" />
      <span className="absolute bg-card px-2 font-medium text-foreground/60 text-sm">
        {t("auth.orContinueWith")}
      </span>
    </div>
  )
}
