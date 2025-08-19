// Token utilities for handling authentication issues

export const clearInvalidToken = () => {
  // Clear token from localStorage
  localStorage.removeItem("token");

  // Reload the page to reset the application state
  window.location.reload();
};

export const isTokenInLocalStorage = (): boolean => {
  return !!localStorage.getItem("token");
};

export const getTokenFromStorage = (): string | null => {
  return localStorage.getItem("token");
};

// Check if we should clear token based on error
export const shouldClearToken = (error: any): boolean => {
  if (!error) return false;

  // Check for specific error codes that indicate invalid token
  const errorData = error?.data?.data || error?.data;
  const errorCodes = [
    "USER_NOT_FOUND",
    "TOKEN_INVALID",
    "TOKEN_EXPIRED",
    "TOKEN_MALFORMED",
  ];

  return errorCodes.includes(errorData?.code);
};
