declare module 'jspdf-autotable' {
  import { jsPDF } from 'jspdf';

  interface CellDef {
    content?: string | number;
    rowSpan?: number;
    colSpan?: number;
    styles?: Partial<Styles>;
  }

  interface ColumnInput {
    header?: string;
    dataKey?: string | number;
  }

  interface Styles {
    font?: string;
    fontStyle?: 'normal' | 'bold' | 'italic' | 'bolditalic';
    overflow?: 'linebreak' | 'ellipsize' | 'visible' | 'hidden';
    fillColor?: number | [number, number, number] | false;
    textColor?: number | [number, number, number];
    cellPadding?: number | { top: number; right: number; bottom: number; left: number };
    fontSize?: number;
    lineColor?: number | [number, number, number];
    lineWidth?: number | { top: number; right: number; bottom: number; left: number };
    cellWidth?: 'auto' | 'wrap' | number;
    minCellHeight?: number;
    halign?: 'left' | 'center' | 'right';
    valign?: 'top' | 'middle' | 'bottom';
  }

  interface Config {
    includeHiddenHtml?: boolean;
    useCss?: boolean;
    theme?: 'striped' | 'grid' | 'plain';
    startY?: number;
    margin?: number | { top: number; right: number; bottom: number; left: number };
    pageBreak?: 'auto' | 'avoid' | 'always';
    rowPageBreak?: 'auto' | 'avoid';
    tableWidth?: 'auto' | 'wrap' | number;
    showHead?: 'everyPage' | 'firstPage' | 'never';
    showFoot?: 'everyPage' | 'lastPage' | 'never';
    tableLineColor?: number | [number, number, number];
    tableLineWidth?: number;
    head?: (string | number | CellDef)[][];
    body?: (string | number | CellDef)[][];
    foot?: (string | number | CellDef)[][];
    columns?: ColumnInput[];
    styles?: Partial<Styles>;
    headStyles?: Partial<Styles>;
    bodyStyles?: Partial<Styles>;
    footStyles?: Partial<Styles>;
    alternateRowStyles?: Partial<Styles>;
    columnStyles?: { [key: string]: Partial<Styles> };
    didDrawPage?: (data: any) => void;
    willDrawCell?: (data: any) => void;
    didDrawCell?: (data: any) => void;
  }

  export default function autoTable(doc: jsPDF, config: Config): jsPDF;
}
