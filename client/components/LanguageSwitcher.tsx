import React, { useState } from "react";
import { useAppSelector, useAppDispatch } from "../store/hooks";
import {
  setLanguage,
  selectLanguage,
  selectTranslations,
} from "../store/slices/languageSlice";
import { updateUserPreferences } from "../store/slices/authSlice";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Badge } from "./ui/badge";
import { Globe, Check, Loader2 } from "lucide-react";
import { toast } from "./ui/use-toast";
import { cn } from "../lib/utils";

// Language configuration
const LANGUAGES = {
  en: {
    code: "en",
    name: "English",
    nativeName: "English",
    flag: "🇺🇸",
    rtl: false,
  },
  hi: {
    code: "hi",
    name: "Hindi",
    nativeName: "हिन्दी",
    flag: "🇮🇳",
    rtl: false,
  },
  ml: {
    code: "ml",
    name: "Malayalam",
    nativeName: "മലയാളം",
    flag: "🇮🇳",
    rtl: false,
  },
} as const;

export type LanguageCode = keyof typeof LANGUAGES;

interface LanguageSwitcherProps {
  variant?: "select" | "dropdown" | "buttons";
  showFlag?: boolean;
  showNativeName?: boolean;
  showBadge?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
  onLanguageChange?: (language: LanguageCode) => void;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  variant = "dropdown",
  showFlag = true,
  showNativeName = true,
  showBadge = false,
  size = "md",
  className,
  onLanguageChange,
}) => {
  const dispatch = useAppDispatch();
  const currentLanguage = useAppSelector(selectLanguage);
  const translations = useAppSelector(selectTranslations);
  const { isAuthenticated, isLoading } = useAppSelector((state) => state.auth);
  const [isChanging, setIsChanging] = useState(false);

  const handleLanguageChange = async (newLanguage: LanguageCode) => {
    if (newLanguage === currentLanguage || isChanging) return;

    setIsChanging(true);

    try {
      // Update language in store
      dispatch(setLanguage(newLanguage));

      // Update user preferences if authenticated
      if (isAuthenticated) {
        await dispatch(
          updateUserPreferences({ language: newLanguage }),
        ).unwrap();
      }

      // Show success toast
      toast({
        title: translations?.messages?.operationSuccess || "Language Updated",
        description: `Language changed to ${LANGUAGES[newLanguage].name}`,
        variant: "default",
      });

      // Call optional callback
      onLanguageChange?.(newLanguage);

      // Update document language attribute
      document.documentElement.lang = newLanguage;

      // Update document direction for RTL languages
      document.documentElement.dir = LANGUAGES[newLanguage].rtl ? "rtl" : "ltr";
    } catch (error) {
      // Rollback language change on error
      dispatch(setLanguage(currentLanguage));

      toast({
        title: translations?.messages?.error || "Error",
        description: "Failed to update language preferences",
        variant: "destructive",
      });
    } finally {
      setIsChanging(false);
    }
  };

  const getLanguageLabel = (lang: LanguageCode, showFull = false) => {
    const language = LANGUAGES[lang];
    const parts = [];

    if (showFlag) parts.push(language.flag);
    if (showNativeName || showFull) parts.push(language.nativeName);
    else parts.push(language.name);

    return parts.join(" ");
  };

  const sizeClasses = {
    sm: "text-sm h-8",
    md: "text-sm h-9",
    lg: "text-base h-10",
  };

  if (variant === "select") {
    return (
      <div className={cn("relative", className)}>
        <Select
          value={currentLanguage}
          onValueChange={handleLanguageChange}
          disabled={isChanging || isLoading}
        >
          <SelectTrigger
            className={cn(sizeClasses[size], "w-auto min-w-[120px]")}
          >
            <SelectValue>
              {isChanging ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Changing...</span>
                </div>
              ) : (
                getLanguageLabel(currentLanguage)
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {Object.entries(LANGUAGES).map(([code, language]) => (
              <SelectItem key={code} value={code}>
                <div className="flex items-center space-x-2">
                  <span>{language.flag}</span>
                  <span>{language.nativeName}</span>
                  {code === currentLanguage && (
                    <Check className="h-4 w-4 text-green-600" />
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {showBadge && (
          <Badge
            variant="secondary"
            className="absolute -top-2 -right-2 text-xs"
          >
            {LANGUAGES[currentLanguage].code.toUpperCase()}
          </Badge>
        )}
      </div>
    );
  }

  if (variant === "dropdown") {
    return (
      <div className={cn("relative", className)}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size={size}
              disabled={isChanging || isLoading}
              className={cn(
                "w-auto min-w-[120px] justify-start",
                sizeClasses[size],
              )}
            >
              {isChanging ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Changing...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Globe className="h-4 w-4" />
                  <span>{getLanguageLabel(currentLanguage)}</span>
                </div>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-[180px]">
            {Object.entries(LANGUAGES).map(([code, language]) => (
              <DropdownMenuItem
                key={code}
                onClick={() => handleLanguageChange(code as LanguageCode)}
                disabled={code === currentLanguage}
                className={cn(
                  "flex items-center justify-between space-x-2 cursor-pointer",
                  code === currentLanguage && "bg-accent",
                )}
              >
                <div className="flex items-center space-x-2">
                  <span>{language.flag}</span>
                  <div className="flex flex-col">
                    <span className="font-medium">{language.nativeName}</span>
                    <span className="text-xs text-muted-foreground">
                      {language.name}
                    </span>
                  </div>
                </div>
                {code === currentLanguage && (
                  <Check className="h-4 w-4 text-green-600" />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        {showBadge && (
          <Badge
            variant="secondary"
            className="absolute -top-2 -right-2 text-xs"
          >
            {LANGUAGES[currentLanguage].code.toUpperCase()}
          </Badge>
        )}
      </div>
    );
  }

  // Button variant
  return (
    <div className={cn("flex space-x-1", className)}>
      {Object.entries(LANGUAGES).map(([code, language]) => (
        <Button
          key={code}
          variant={code === currentLanguage ? "default" : "outline"}
          size={size}
          onClick={() => handleLanguageChange(code as LanguageCode)}
          disabled={isChanging || isLoading || code === currentLanguage}
          className={cn(
            "relative",
            sizeClasses[size],
            code === currentLanguage && "pointer-events-none",
          )}
        >
          {isChanging && code === currentLanguage ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            getLanguageLabel(code as LanguageCode)
          )}
          {showBadge && code === currentLanguage && (
            <Badge
              variant="secondary"
              className="absolute -top-2 -right-2 text-xs"
            >
              <Check className="h-3 w-3" />
            </Badge>
          )}
        </Button>
      ))}
    </div>
  );
};

// Hook for language utilities
export const useLanguage = () => {
  const dispatch = useAppDispatch();
  const currentLanguage = useAppSelector(selectLanguage);
  const translations = useAppSelector(selectTranslations);

  const changeLanguage = (language: LanguageCode) => {
    dispatch(setLanguage(language));
  };

  const getCurrentLanguageInfo = () => LANGUAGES[currentLanguage];

  const isRTL = () => LANGUAGES[currentLanguage].rtl;

  const formatDate = (date: Date, options?: Intl.DateTimeFormatOptions) => {
    const locale =
      currentLanguage === "hi"
        ? "hi-IN"
        : currentLanguage === "ml"
          ? "ml-IN"
          : "en-US";

    return new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "long",
      day: "numeric",
      ...options,
    }).format(date);
  };

  const formatNumber = (number: number, options?: Intl.NumberFormatOptions) => {
    const locale =
      currentLanguage === "hi"
        ? "hi-IN"
        : currentLanguage === "ml"
          ? "ml-IN"
          : "en-US";

    return new Intl.NumberFormat(locale, options).format(number);
  };

  const formatCurrency = (amount: number, currency = "INR") => {
    const locale =
      currentLanguage === "hi"
        ? "hi-IN"
        : currentLanguage === "ml"
          ? "ml-IN"
          : "en-IN";

    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
    }).format(amount);
  };

  const getDirection = () => (isRTL() ? "rtl" : "ltr");

  return {
    currentLanguage,
    translations,
    changeLanguage,
    getCurrentLanguageInfo,
    isRTL,
    formatDate,
    formatNumber,
    formatCurrency,
    getDirection,
    availableLanguages: LANGUAGES,
  };
};

// Text direction provider component
interface TextDirectionProviderProps {
  children: React.ReactNode;
}

export const TextDirectionProvider: React.FC<TextDirectionProviderProps> = ({
  children,
}) => {
  const { getDirection } = useLanguage();

  React.useEffect(() => {
    document.documentElement.dir = getDirection();
  }, [getDirection]);

  return <>{children}</>;
};

// Translation helper component
interface TranslateProps {
  path: string;
  values?: Record<string, string | number>;
  fallback?: string;
}

export const Translate: React.FC<TranslateProps> = ({
  path,
  values,
  fallback,
}) => {
  const translations = useAppSelector(selectTranslations);

  const getNestedValue = (obj: any, path: string) => {
    return path.split(".").reduce((current, key) => current?.[key], obj);
  };

  let text = getNestedValue(translations, path) || fallback || path;

  // Replace placeholders with values
  if (values && typeof text === "string") {
    Object.entries(values).forEach(([key, value]) => {
      text = text.replace(new RegExp(`{${key}}`, "g"), String(value));
    });
  }

  return <>{text}</>;
};

// Higher-order component for automatic translation
export function withTranslations<P extends object>(
  Component: React.ComponentType<P & { t: any }>,
) {
  return function TranslatedComponent(props: P) {
    const translations = useAppSelector(selectTranslations);
    return <Component {...props} t={translations} />;
  };
}

export default LanguageSwitcher;
