/**
 * Logo utility functions for consistent logo rendering across the application
 */

export interface LogoSizeClasses {
  container: string;
  image: string;
  fallback: string;
}

/**
 * Get Tailwind CSS classes for logo based on size configuration
 * @param size - Logo size: 'small', 'medium', 'large'
 * @param context - Context where logo is used: 'nav', 'auth', 'footer'
 * @returns Object with CSS classes for container, image, and fallback icon
 */
export function getLogoClasses(
  size: string = "medium",
  context: "nav" | "auth" | "footer" | "mobile" = "nav",
): LogoSizeClasses {
  const sizeMap = {
    small: {
      nav: {
        container: "flex items-center space-x-1",
        image: "h-2 w-10",   // ratio kept
        fallback: "h-2 w-2",
      },
      "nav-mobile": {
        container: "flex items-center space-x-1",
        image: "h-1.5 w-7.5",
        fallback: "h-1.5 w-1.5",
      },
      auth: {
        container: "flex items-center justify-center space-x-2",
        image: "h-3 w-15",
        fallback: "h-3 w-3",
      },
      footer: {
        container: "flex items-center space-x-1",
        image: "h-1.5 w-7.5",
        fallback: "h-1.5 w-1.5",
      },
      mobile: {
        container: "flex items-center space-x-1",
        image: "h-1.5 w-7.5",
        fallback: "h-1.5 w-1.5",
      },
    },
    medium: {
      nav: {
        container: "flex items-center space-x-2",
        image: "h-4 w-20",   // 1:5 ratio
        fallback: "h-4 w-4",
      },
      "nav-mobile": {
        container: "flex items-center space-x-1",
        image: "h-3 w-15",
        fallback: "h-3 w-3",
      },
      auth: {
        container: "flex items-center justify-center space-x-3",
        image: "h-6 w-30",
        fallback: "h-6 w-6",
      },
      footer: {
        container: "flex items-center space-x-2",
        image: "h-3 w-15",
        fallback: "h-3 w-3",
      },
      mobile: {
        container: "flex items-center space-x-1",
        image: "h-3 w-15",
        fallback: "h-3 w-3",
      },
    },
    large: {
      nav: {
        container: "flex items-center space-x-3",
        image: "h-10 w-50",   // your base ratio (h10:w50)
        fallback: "h-10 w-10",
      },
      "nav-mobile": {
        container: "flex items-center space-x-2",
        image: "h-7 w-35",
        fallback: "h-7 w-7",
      },
      auth: {
        container: "flex items-center justify-center space-x-4",
        image: "h-16 w-80",
        fallback: "h-16 w-16",
      },
      footer: {
        container: "flex items-center space-x-2",
        image: "h-8 w-40",
        fallback: "h-8 w-8",
      },
      mobile: {
        container: "flex items-center space-x-2",
        image: "h-7 w-35",
        fallback: "h-7 w-7",
      },
    },
  };


  const normalizedSize = size.toLowerCase() as keyof typeof sizeMap;
  const normalizedContext = context === "mobile" ? "nav-mobile" : context;

  const sizeConfig = sizeMap[normalizedSize] || sizeMap.medium;
  const contextConfig =
    sizeConfig[normalizedContext as keyof typeof sizeConfig] || sizeConfig.nav;

  return contextConfig;
}

/**
 * Get responsive logo classes that adapt to screen size
 * @param size - Logo size configuration
 * @returns Object with responsive CSS classes
 */
export function getResponsiveLogoClasses(size: string = "medium") {
  const baseClasses = getLogoClasses(size, "nav");
  const mobileClasses = getLogoClasses(size, "mobile");

  return {
    container: `${baseClasses.container}`,
    image: `${mobileClasses.image} sm:${baseClasses.image}`,
    fallback: `${mobileClasses.fallback} sm:${baseClasses.fallback}`,
  };
}

/**
 * Generate text logo/app name classes based on size
 * @param size - Logo size configuration
 * @param isMobile - Whether this is for mobile display
 * @returns CSS classes for text logo
 */
export function getTextLogoClasses(
  size: string = "medium",
  isMobile: boolean = false,
) {
  const sizeMap = {
    small: isMobile ? "text-sm font-bold" : "text-lg font-bold",
    medium: isMobile ? "text-base font-bold" : "text-xl font-bold",
    large: isMobile ? "text-lg font-bold" : "text-2xl font-bold",
  };

  const normalizedSize = size.toLowerCase() as keyof typeof sizeMap;
  return sizeMap[normalizedSize] || sizeMap.medium;
}

/**
 * Logo component props interface
 */
export interface LogoProps {
  logoUrl?: string;
  appName: string;
  size?: string;
  context?: "nav" | "auth" | "footer" | "mobile";
  className?: string;
  showText?: boolean;
  fallbackIcon?: React.ComponentType<{ className?: string }>;
}
