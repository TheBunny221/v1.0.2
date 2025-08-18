import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export interface CaptchaResponse {
  success: boolean;
  data: {
    captchaId: string;
    captchaSvg: string;
  };
}

export interface CaptchaVerifyRequest {
  captchaId: string;
  captchaText: string;
}

export interface CaptchaVerifyResponse {
  success: boolean;
  message: string;
}

export const captchaApi = createApi({
  reducerPath: "captchaApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "/api/captcha",
  }),
  endpoints: (builder) => ({
    generateCaptcha: builder.query<CaptchaResponse, void>({
      query: () => ({
        url: "/generate",
        method: "GET",
      }),
    }),
    verifyCaptcha: builder.mutation<CaptchaVerifyResponse, CaptchaVerifyRequest>({
      query: (data) => ({
        url: "/verify",
        method: "POST",
        body: data,
      }),
    }),
  }),
});

export const { useGenerateCaptchaQuery, useVerifyCaptchaMutation } = captchaApi;
