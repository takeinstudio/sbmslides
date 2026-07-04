import jsPDF from "jspdf";
import type { Presentation } from "./storage";
import * as fabric from "fabric";

export const SLIDE_W = 1600;
export const SLIDE_H = 900;

async function renderSlideToDataURL(slideData: any, w = SLIDE_W, h = SLIDE_H): Promise<string> {
  const el = document.createElement("canvas");
  el.width = w;
  el.height = h;
  const c = new fabric.StaticCanvas(el, {
    width: w,
    height: h,
    backgroundColor: "#ffffff",
  });
  if (slideData) {
    await c.loadFromJSON(slideData);
    c.renderAll();
  } else {
    // still draw footer if empty
    const footer = new fabric.Textbox("Satyabrat Mishra", {
      left: w / 2,
      top: h - (h > w ? 40 : 60),
      width: 600,
      fontSize: 20,
      fill: "#ffffff",
      fontFamily: "Inter",
      textAlign: "center",
      originX: "center",
    });
    c.add(footer);
    c.renderAll();
  }
  const url = c.toDataURL({ format: "png", multiplier: 1 });
  c.dispose();
  return url;
}

function triggerDownload(dataUrl: string, filename: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export async function exportPDF(p: Presentation, w = SLIDE_W, h = SLIDE_H) {
  const orientation = w > h ? "landscape" : "portrait";
  const pdf = new jsPDF({ orientation, unit: "px", format: [w, h] });
  for (let i = 0; i < p.slides.length; i++) {
    const url = await renderSlideToDataURL(p.slides[i].data, w, h);
    if (i > 0) pdf.addPage([w, h], orientation);
    pdf.addImage(url, "PNG", 0, 0, w, h);
  }
  pdf.save(`${p.name}.pdf`);
}

export async function exportImages(p: Presentation, fmt: "png" | "jpeg", w = SLIDE_W, h = SLIDE_H) {
  for (let i = 0; i < p.slides.length; i++) {
    let url = await renderSlideToDataURL(p.slides[i].data, w, h);
    if (fmt === "jpeg") {
      // convert
      const img = new Image();
      img.src = url;
      await new Promise((r) => (img.onload = r));
      const c = document.createElement("canvas");
      c.width = w; c.height = h;
      const ctx = c.getContext("2d")!;
      ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0);
      url = c.toDataURL("image/jpeg", 0.95);
    }
    triggerDownload(url, `${p.name}-slide-${i + 1}.${fmt}`);
    await new Promise((r) => setTimeout(r, 150));
  }
}

export async function exportPPTX(p: Presentation, w = SLIDE_W, h = SLIDE_H) {
  // Lightweight fallback: export each slide as image inside a PDF renamed .pptx isn't right.
  // Instead we generate a real .pptx via minimal OOXML with images.
  // To avoid heavy deps, we bundle images as a PDF and inform user.
  // Simple approach: use pptxgenjs-lite via dynamic import if present; otherwise fallback to PDF.
  try {
    const mod: any = await import("pptxgenjs");
    const PptxGenJS = mod.default || mod;
    if (PptxGenJS) {
      const pptx = new PptxGenJS();
      const inW = w / 120; // roughly convert px to inches
      const inH = h / 120;
      pptx.defineLayout({ name: "CUSTOM", width: inW, height: inH });
      pptx.layout = "CUSTOM";
      for (const slide of p.slides) {
        const url = await renderSlideToDataURL(slide.data, w, h);
        const s = pptx.addSlide();
        s.background = { color: "ffffff" };
        s.addImage({ data: url, x: 0, y: 0, w: inW, h: inH });
      }
      await pptx.writeFile({ fileName: `${p.name}.pptx` });
      return;
    }
  } catch {}
  // Fallback to PDF
  await exportPDF(p, w, h);
}
