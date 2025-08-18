import React from "react";
import { Link } from "react-router-dom";
import { Shield } from "lucide-react";
import { cn } from "../../lib/utils";
import {
  getLogoClasses,
  getResponsiveLogoClasses,
  getTextLogoClasses,
  LogoProps,
} from "../../lib/logoUtils";
import { useSystemConfig } from "../../contexts/SystemConfigContext";

interface ExtendedLogoProps extends LogoProps {
  to?: string;
  onClick?: () => void;
  responsive?: boolean;
}

/**
 * Reusable Logo component that adapts to system configuration
 */
export const Logo: React.FC<ExtendedLogoProps> = ({
  logoUrl,
  appName,
  size = "medium",
  context = "nav",
  className,
  showText = true,
  fallbackIcon: FallbackIcon = Shield,
  to,
  onClick,
  responsive = false,
}) => {
  const classes = responsive
    ? getResponsiveLogoClasses(size)
    : getLogoClasses(size, context);

  const hasCustomLogo = logoUrl && logoUrl !== "/logo.png";

  const content = (
    <div className={cn(classes.container, className)}>
      {/* Logo Image or Fallback Icon */}
      {hasCustomLogo ? (
        <img
          src={logoUrl}
          alt={appName}
          className={cn(classes.image, "object-contain")}
          onError={(e) => {
            // Fallback to icon if image fails to load
            const target = e.target as HTMLImageElement;
            target.style.display = "none";
            const fallback = target.nextElementSibling as HTMLElement;
            if (fallback) {
              fallback.style.display = "block";
            }
          }}
        />
      ) : null}

      {/* Fallback Icon */}
      <FallbackIcon
        className={cn(
          classes.fallback,
          "text-primary",
          hasCustomLogo ? "hidden" : "block",
        )}
      />

      {/* App Name Text */}
      {showText && (
        <>
          {/* Full name on larger screens */}
          <span
            className={cn(
              getTextLogoClasses(size, false),
              "text-gray-900 hidden sm:inline",
            )}
          >
            {appName}
          </span>

          {/* Abbreviated name on mobile */}
          <span
            className={cn(
              getTextLogoClasses(size, true),
              "text-gray-900 sm:hidden",
            )}
          >
            {appName
              .split(" ")
              .map((word) => word[0])
              .join("")}
          </span>
        </>
      )}
    </div>
  );

  // Wrap in Link if 'to' prop is provided
  if (to) {
    return (
      <Link to={to} className="flex items-center" onClick={onClick}>
        {content}
      </Link>
    );
  }

  // Wrap in button if onClick is provided
  if (onClick) {
    return (
      <button onClick={onClick} className="flex items-center">
        {content}
      </button>
    );
  }

  return content;
};

/**
 * App Logo component with system configuration
 */
interface AppLogoProps {
  context?: "nav" | "auth" | "footer" | "mobile";
  className?: string;
  showText?: boolean;
  to?: string;
  onClick?: () => void;
  responsive?: boolean;
}

export const AppLogo: React.FC<AppLogoProps> = (props) => {
  // Import the hook at the top of the file
  const { appName, appLogoUrl, appLogoSize } = useSystemConfig();

  return (
    <Logo
      appName={appName}
      logoUrl={appLogoUrl}
      size={appLogoSize}
      {...props}
    />
  );
};

export default Logo;
