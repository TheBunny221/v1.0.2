/**
 * Utility to debug fetch issues in production environments
 * Especially useful for handling third-party library interference like FullStory
 */

export interface FetchDebugInfo {
  originalFetchAvailable: boolean;
  currentFetchType: string;
  thirdPartyOverrides: string[];
  environment: "development" | "production";
}

export function debugFetchEnvironment(): FetchDebugInfo {
  const info: FetchDebugInfo = {
    originalFetchAvailable: !!(globalThis as any).__originalFetch,
    currentFetchType: "unknown",
    thirdPartyOverrides: [],
    environment:
      process.env.NODE_ENV === "development" ? "development" : "production",
  };

  // Check what type of fetch we're dealing with
  if (window.fetch) {
    const fetchString = window.fetch.toString();

    if (fetchString.includes("native code")) {
      info.currentFetchType = "native";
    } else if (
      fetchString.includes("fullstory") ||
      fetchString.includes("fs.js")
    ) {
      info.currentFetchType = "fullstory-wrapped";
      info.thirdPartyOverrides.push("FullStory");
    } else if (fetchString.length > 100) {
      info.currentFetchType = "third-party-wrapped";
      info.thirdPartyOverrides.push("Unknown third-party library");
    } else {
      info.currentFetchType = "polyfill";
    }
  }

  // Check for other common overrides
  if ((window as any).FS) {
    info.thirdPartyOverrides.push("FullStory");
  }

  if ((window as any).gtag) {
    info.thirdPartyOverrides.push("Google Analytics");
  }

  if ((window as any).analytics) {
    info.thirdPartyOverrides.push("Segment");
  }

  return info;
}

export function logFetchDebugInfo() {
  const info = debugFetchEnvironment();
  console.group("🔍 Fetch Environment Debug Info");
  console.log("Original Fetch Available:", info.originalFetchAvailable);
  console.log("Current Fetch Type:", info.currentFetchType);
  console.log("Third-party Overrides:", info.thirdPartyOverrides);
  console.log("Environment:", info.environment);

  if (info.thirdPartyOverrides.length > 0) {
    console.warn(
      "⚠️ Third-party libraries may be interfering with fetch requests",
    );
  }

  console.groupEnd();
  return info;
}

/**
 * Creates a robust fetch function that tries multiple approaches
 */
export function createRobustFetch(): typeof fetch {
  return async function robustFetch(
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> {
    const originalFetch = (globalThis as any).__originalFetch;

    // Try original fetch first if available
    if (originalFetch) {
      try {
        return await originalFetch(input, init);
      } catch (error) {
        console.warn("Original fetch failed, trying current fetch:", error);
      }
    }

    // Try current fetch
    try {
      return await fetch(input, init);
    } catch (error) {
      console.warn(
        "Current fetch failed, trying XMLHttpRequest fallback:",
        error,
      );

      // XMLHttpRequest fallback for critical requests
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        const url = typeof input === "string" ? input : input.toString();
        const method = init?.method || "GET";

        xhr.timeout = 15000;
        xhr.onload = () => {
          const response = new Response(xhr.responseText, {
            status: xhr.status,
            statusText: xhr.statusText,
            headers: new Headers(
              xhr
                .getAllResponseHeaders()
                .split("\r\n")
                .filter((line) => line.trim())
                .reduce(
                  (headers, line) => {
                    const [key, value] = line.split(": ");
                    if (key && value) headers[key] = value;
                    return headers;
                  },
                  {} as Record<string, string>,
                ),
            ),
          });
          resolve(response);
        };

        xhr.onerror = () => reject(new Error("XMLHttpRequest failed"));
        xhr.ontimeout = () => reject(new Error("XMLHttpRequest timeout"));

        xhr.open(method, url);

        // Set headers
        if (init?.headers) {
          const headers = new Headers(init.headers);
          headers.forEach((value, key) => {
            xhr.setRequestHeader(key, value);
          });
        }

        xhr.send(init?.body as any);
      });
    }
  };
}
