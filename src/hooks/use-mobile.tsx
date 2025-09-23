import * as React from "react"

const MOBILE_BREAKPOINT = 768
const TABLET_BREAKPOINT = 1024

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)
  const [isTablet, setIsTablet] = React.useState<boolean | undefined>(undefined)
  const [isTouchDevice, setIsTouchDevice] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const tabletMql = window.matchMedia(`(max-width: ${TABLET_BREAKPOINT - 1}px)`)
    
    const updateDeviceState = () => {
      const width = window.innerWidth
      setIsMobile(width < MOBILE_BREAKPOINT)
      setIsTablet(width < TABLET_BREAKPOINT && width >= MOBILE_BREAKPOINT)
      setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0)
    }
    
    mql.addEventListener("change", updateDeviceState)
    tabletMql.addEventListener("change", updateDeviceState)
    updateDeviceState()
    
    return () => {
      mql.removeEventListener("change", updateDeviceState)
      tabletMql.removeEventListener("change", updateDeviceState)
    }
  }, [])

  return {
    isMobile: !!isMobile,
    isTablet: !!isTablet,
    isTouchDevice: !!isTouchDevice,
    isDesktop: !isMobile && !isTablet
  }
}

// Keep backward compatibility
export function useIsMobileOnly() {
  const { isMobile } = useIsMobile()
  return isMobile
}
