import { getApiErrorMessage } from "@/store/api/baseApi";

export type StandardApiResponse<T = any> = {
  success: boolean;
  message: string;
  data?: T | null;
  errorCode?: string;
};

// Map error codes/messages to user-friendly descriptions
export function getFriendlyApiMessage(input: any): string {
  try {
    const errorCode = input?.errorCode || input?.data?.errorCode || input?.data?.code;
    const rawMessage = input?.message || input?.data?.message;

    const codeMap: Record<string, string> = {
      USER_NOT_FOUND: "No account exists with this email. Please register or try again.",
      INVALID_CREDENTIALS: "Incorrect email or password. Try again or use OTP login.",
      ACCOUNT_DEACTIVATED: "Your account is deactivated. Please contact support.",
      TOKEN_EXPIRED: "Session expired. Please login again.",
      TOKEN_INVALID: "Your session is invalid. Please login again.",
      VALIDATION_ERROR: "Please fix the highlighted fields and try again.",
      DATABASE_READONLY: "Service temporarily unavailable. Please try again shortly.",
      CAPTCHA_FAILED: "CAPTCHA verification failed. Please try again.",
      SERVER_ERROR: "Internal server error. Please try again later.",
      NOT_FOUND: "Requested resource was not found.",
    };

    if (errorCode && codeMap[errorCode]) return codeMap[errorCode];

    // Fallback to existing extractor
    const fallback = getApiErrorMessage(input);

    // Rewrite a few common raw messages to be friendlier
    if (typeof fallback === "string") {
      if (/user not found/i.test(fallback)) {
        return "No account exists with this email. Please register or try again.";
      }
      if (/invalid credentials/i.test(fallback)) {
        return "Incorrect email or password. Try again or use OTP login.";
      }
    }

    return fallback || "Something went wrong. Please try again.";
  } catch {
    return "Something went wrong. Please try again.";
  }
}

export function normalizeSuccess<T>(resp: StandardApiResponse<T> | T): StandardApiResponse<T> {
  if (resp && typeof resp === "object" && "success" in (resp as any)) {
    return resp as StandardApiResponse<T>;
  }
  return { success: true, message: "", data: resp as T };
}
