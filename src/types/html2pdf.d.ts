declare module 'html2pdf.js' {
  interface Html2PdfOptions {
    margin?: number | number[];
    filename?: string;
    image?: { type?: string; quality?: number };
    html2canvas?: { scale?: number; useCORS?: boolean; letterRendering?: boolean; logging?: boolean; backgroundColor?: string };
    jsPDF?: { unit?: string; format?: string; orientation?: 'portrait' | 'landscape' | string };
    pagebreak?: { mode?: string[] | string };
  }

  interface Html2PdfInstance {
    set(options: any): Html2PdfInstance;
    from(element: HTMLElement | string): Html2PdfInstance;
    save(): Promise<void>;
    outputPdf(): Promise<string>;
  }

  function html2pdf(): Html2PdfInstance;
  export default html2pdf;
}
