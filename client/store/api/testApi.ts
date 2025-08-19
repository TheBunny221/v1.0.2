import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

// Simple test API with minimal configuration
export const testApi = createApi({
  reducerPath: "testApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "/api/",
    prepareHeaders: (headers, { getState }) => {
      const state = getState() as any;
      const token = state?.auth?.token || localStorage.getItem("token");
      if (token) {
        headers.set("authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  endpoints: (builder) => ({
    // Simple ping endpoint to test basic functionality
    ping: builder.query<any, void>({
      query: () => "ping",
    }),
  }),
});

export const { usePingQuery } = testApi;
