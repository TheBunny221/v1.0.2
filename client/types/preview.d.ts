declare module "pdfjs-dist/build/pdf.worker.min.mjs?url" {
  const src: string;
  export default src;
}

declare module "docx-preview" {
  export function renderAsync(
    data: ArrayBuffer | Uint8Array,
    container: HTMLElement,
    style?: unknown,
    options?: any,
  ): Promise<void>;
}
