import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import * as fabric from "fabric";
import {
  Type, Square, Circle as CircleIcon, Minus, Image as ImageIcon,
  Undo2, Redo2, Trash2, Save, Download, Plus, Copy, ArrowLeft,
  Bold, Italic, Underline as UnderlineIcon, Home,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  store, newPresentation, type Presentation, type Slide,
} from "@/lib/storage";
import { exportPDF, exportPPTX, exportImages, SLIDE_W, SLIDE_H } from "@/lib/export";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/create")({
  head: () => ({
    meta: [
      { title: "Create Slide — SBM Slides" },
      { name: "description", content: "Design beautiful presentation slides in the SBM Slides editor." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CreatePage,
});

const FOOTER_TEXT = "Satyabrat Mishra";
const FOOTER_MARK = "__sbm_footer__";

function addFooter(canvas: fabric.Canvas) {
  const footer = new fabric.Textbox(FOOTER_TEXT, {
    left: SLIDE_W / 2,
    top: SLIDE_H - 55,
    width: 800,
    fontSize: 22,
    fill: "#ffffff",
    fontFamily: "Inter",
    fontWeight: "500",
    textAlign: "center",
    originX: "center",
    selectable: false,
    evented: false,
    hasControls: false,
    editable: false,
  });
  (footer as any).data = { mark: FOOTER_MARK };
  canvas.add(footer);
  canvas.bringObjectToFront(footer);
}

function ensureFooter(canvas: fabric.Canvas) {
  const has = canvas.getObjects().some((o) => (o as any).data?.mark === FOOTER_MARK);
  if (!has) addFooter(canvas);
  else {
    canvas.getObjects().forEach((o) => {
      if ((o as any).data?.mark === FOOTER_MARK) canvas.bringObjectToFront(o);
    });
  }
}

function CreatePage() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasElRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);
  const historyRef = useRef<{ stack: string[]; index: number; suspend: boolean }>({
    stack: [], index: -1, suspend: false,
  });
  const [presentation, setPresentation] = useState<Presentation>(() => {
    if (typeof window !== "undefined") {
      const draft = store.getDraft();
      if (draft) return draft;
    }
    return newPresentation();
  });
  const [activeIdx, setActiveIdx] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [thumbs, setThumbs] = useState<Record<string, string>>({});
  const [saveOpen, setSaveOpen] = useState(false);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [format, setFormat] = useState("pdf");
  const [selection, setSelection] = useState<fabric.Object | null>(null);
  const [tick, setTick] = useState(0);

  // Init canvas
  useEffect(() => {
    if (!canvasElRef.current) return;
    const canvas = new fabric.Canvas(canvasElRef.current, {
      width: SLIDE_W,
      height: SLIDE_H,
      backgroundColor: "#000000",
      preserveObjectStacking: true,
    });
    fabricRef.current = canvas;

    const pushHistory = () => {
      const h = historyRef.current;
      if (h.suspend) return;
      const json = JSON.stringify(canvas.toObject(["data"]));
      h.stack = h.stack.slice(0, h.index + 1);
      h.stack.push(json);
      if (h.stack.length > 50) h.stack.shift();
      h.index = h.stack.length - 1;
    };

    canvas.on("object:added", () => { ensureFooter(canvas); pushHistory(); });
    canvas.on("object:modified", pushHistory);
    canvas.on("object:removed", pushHistory);
    canvas.on("selection:created", (e) => setSelection(e.selected?.[0] || null));
    canvas.on("selection:updated", (e) => setSelection(e.selected?.[0] || null));
    canvas.on("selection:cleared", () => setSelection(null));

    // Load first slide
    loadSlide(canvas, presentation.slides[0]);

    return () => {
      canvas.dispose();
      fabricRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fit-scale canvas
  useEffect(() => {
    const resize = () => {
      const el = containerRef.current;
      if (!el || !fabricRef.current) return;
      const availW = el.clientWidth - 40;
      const availH = el.clientHeight - 40;
      const fit = Math.min(availW / SLIDE_W, availH / SLIDE_H);
      const s = fit * zoom;
      const c = fabricRef.current;
      c.setDimensions({ width: SLIDE_W * s, height: SLIDE_H * s });
      c.setZoom(s);
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [zoom]);

  const loadSlide = useCallback(async (canvas: fabric.Canvas, slide: Slide) => {
    const h = historyRef.current;
    h.suspend = true;
    canvas.clear();
    canvas.backgroundColor = "#000000";
    if (slide.data) {
      await canvas.loadFromJSON(slide.data);
    }
    ensureFooter(canvas);
    canvas.renderAll();
    h.stack = [JSON.stringify(canvas.toObject(["data"]))];
    h.index = 0;
    h.suspend = false;
  }, []);

  // Switch slide
  const switchSlide = useCallback(async (idx: number) => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    // Save current
    const currentSlide = presentation.slides[activeIdx];
    if (currentSlide) {
      currentSlide.data = canvas.toObject(["data"]);
    }
    setActiveIdx(idx);
    await loadSlide(canvas, presentation.slides[idx]);
  }, [activeIdx, presentation, loadSlide]);

  // Autosave draft + thumbnails periodically
  useEffect(() => {
    const t = setInterval(() => {
      const canvas = fabricRef.current;
      if (!canvas) return;
      const p = { ...presentation };
      p.slides[activeIdx].data = canvas.toObject(["data"]);
      // Thumbnail for current slide
      const thumb = canvas.toDataURL({ format: "png", multiplier: 0.15 });
      setThumbs((prev) => ({ ...prev, [p.slides[activeIdx].id]: thumb }));
      p.slides[activeIdx].thumbnail = thumb;
      p.modifiedAt = Date.now();
      setPresentation(p);
      store.saveDraft(p);
    }, 3000);
    return () => clearInterval(t);
  }, [presentation, activeIdx]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const canvas = fabricRef.current;
      if (!canvas) return;
      const target = e.target as HTMLElement;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z" && !e.shiftKey) {
        e.preventDefault(); undo();
      } else if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === "y" || (e.shiftKey && e.key.toLowerCase() === "z"))) {
        e.preventDefault(); redo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "c") {
        const obj = canvas.getActiveObject();
        if (obj) obj.clone().then((c: any) => { (window as any).__clip = c; });
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "v") {
        const clip = (window as any).__clip;
        if (clip) clip.clone().then((c: any) => {
          c.set({ left: (c.left || 0) + 20, top: (c.top || 0) + 20 });
          canvas.add(c); canvas.setActiveObject(c); canvas.requestRenderAll();
        });
      } else if (e.key === "Delete" || e.key === "Backspace") {
        const obj = canvas.getActiveObject();
        if (obj && (obj as any).data?.mark !== FOOTER_MARK) {
          canvas.remove(obj);
          canvas.discardActiveObject();
          canvas.requestRenderAll();
        }
      } else if (e.key === "ArrowUp") {
        const obj = canvas.getActiveObject();
        if (obj) { e.preventDefault(); obj.set("top", (obj.top || 0) - (e.shiftKey ? 10 : 1)); obj.setCoords(); canvas.requestRenderAll(); canvas.fire("object:modified"); }
        else if (activeIdx > 0) { e.preventDefault(); switchSlide(activeIdx - 1); }
      } else if (e.key === "ArrowDown") {
        const obj = canvas.getActiveObject();
        if (obj) { e.preventDefault(); obj.set("top", (obj.top || 0) + (e.shiftKey ? 10 : 1)); obj.setCoords(); canvas.requestRenderAll(); canvas.fire("object:modified"); }
        else if (activeIdx < presentation.slides.length - 1) { e.preventDefault(); switchSlide(activeIdx + 1); }
      } else if (e.key === "ArrowLeft") {
        const obj = canvas.getActiveObject();
        if (obj) { e.preventDefault(); obj.set("left", (obj.left || 0) - (e.shiftKey ? 10 : 1)); obj.setCoords(); canvas.requestRenderAll(); canvas.fire("object:modified"); }
        else if (activeIdx > 0) { e.preventDefault(); switchSlide(activeIdx - 1); }
      } else if (e.key === "ArrowRight") {
        const obj = canvas.getActiveObject();
        if (obj) { e.preventDefault(); obj.set("left", (obj.left || 0) + (e.shiftKey ? 10 : 1)); obj.setCoords(); canvas.requestRenderAll(); canvas.fire("object:modified"); }
        else if (activeIdx < presentation.slides.length - 1) { e.preventDefault(); switchSlide(activeIdx + 1); }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIdx, presentation.slides.length, switchSlide]);

  const undo = async () => {
    const canvas = fabricRef.current;
    const h = historyRef.current;
    if (!canvas || h.index <= 0) return;
    h.index--;
    h.suspend = true;
    await canvas.loadFromJSON(JSON.parse(h.stack[h.index]));
    ensureFooter(canvas);
    canvas.renderAll();
    h.suspend = false;
  };

  const redo = async () => {
    const canvas = fabricRef.current;
    const h = historyRef.current;
    if (!canvas || h.index >= h.stack.length - 1) return;
    h.index++;
    h.suspend = true;
    await canvas.loadFromJSON(JSON.parse(h.stack[h.index]));
    ensureFooter(canvas);
    canvas.renderAll();
    h.suspend = false;
  };

  // Add helpers
  const add = (obj: fabric.Object) => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    canvas.add(obj);
    canvas.setActiveObject(obj);
    canvas.requestRenderAll();
  };

  const addHeading = () => add(new fabric.Textbox("Heading", {
    left: 200, top: 200, width: 800, fontSize: 120, fontWeight: "700",
    fill: "#ffffff", fontFamily: "Poppins",
  }));
  const addSubheading = () => add(new fabric.Textbox("Subheading", {
    left: 200, top: 350, width: 800, fontSize: 64, fontWeight: "600",
    fill: "#c8d2ff", fontFamily: "Poppins",
  }));
  const addParagraph = () => add(new fabric.Textbox("Add your text here. Click to edit.", {
    left: 200, top: 450, width: 1200, fontSize: 48, fill: "#e5e7eb", fontFamily: "Inter",
  }));
  const addBullets = () => add(new fabric.Textbox("• First point\n• Second point\n• Third point", {
    left: 200, top: 450, width: 1200, fontSize: 48, fill: "#ffffff", fontFamily: "Inter", lineHeight: 1.4,
  }));
  const addRect = () => add(new fabric.Rect({
    left: 300, top: 300, width: 300, height: 200, fill: "rgba(139,92,246,0.8)",
    rx: 16, ry: 16,
  }));
  const addCircle = () => add(new fabric.Circle({
    left: 400, top: 300, radius: 120, fill: "rgba(96,165,250,0.85)",
  }));
  const addLine = () => add(new fabric.Line([200, 450, 900, 450], {
    stroke: "#ffffff", strokeWidth: 4,
  }));
  const addImage = () => {
    const input = document.createElement("input");
    input.type = "file"; input.accept = "image/*";
    input.onchange = async () => {
      const f = input.files?.[0]; if (!f) return;
      const url = URL.createObjectURL(f);
      const img = await fabric.FabricImage.fromURL(url, { crossOrigin: "anonymous" });
      const scale = Math.min(800 / (img.width || 800), 500 / (img.height || 500));
      img.scale(scale);
      img.set({ left: 200, top: 200 });
      add(img);
    };
    input.click();
  };

  // Slide management
  const addSlide = async () => {
    const canvas = fabricRef.current; if (!canvas) return;
    presentation.slides[activeIdx].data = canvas.toObject(["data"]);
    const s: Slide = { id: crypto.randomUUID(), data: null };
    const p = { ...presentation, slides: [...presentation.slides, s] };
    setPresentation(p);
    setActiveIdx(p.slides.length - 1);
    await loadSlide(canvas, s);
  };
  const deleteSlide = async (idx: number) => {
    if (presentation.slides.length <= 1) { toast.error("At least one slide required"); return; }
    const slides = presentation.slides.filter((_, i) => i !== idx);
    const p = { ...presentation, slides };
    setPresentation(p);
    const newIdx = Math.max(0, Math.min(activeIdx, slides.length - 1));
    setActiveIdx(newIdx);
    await loadSlide(fabricRef.current!, slides[newIdx]);
  };
  const duplicateSlide = async (idx: number) => {
    const canvas = fabricRef.current; if (!canvas) return;
    if (idx === activeIdx) presentation.slides[idx].data = canvas.toObject(["data"]);
    const src = presentation.slides[idx];
    const copy: Slide = { id: crypto.randomUUID(), data: JSON.parse(JSON.stringify(src.data)) };
    const slides = [...presentation.slides];
    slides.splice(idx + 1, 0, copy);
    setPresentation({ ...presentation, slides });
    setActiveIdx(idx + 1);
    await loadSlide(canvas, copy);
  };

  const saveNow = () => {
    const canvas = fabricRef.current; if (!canvas) return;
    presentation.slides[activeIdx].data = canvas.toObject(["data"]);
    setSaveOpen(true);
  };
  const confirmSave = (name: string, description: string) => {
    const p = { ...presentation, name: name || presentation.name, description };
    store.save(p);
    store.clearDraft();
    setPresentation(p);
    setSaveOpen(false);
    toast.success("Presentation saved");
  };

  const doDownload = async () => {
    const canvas = fabricRef.current; if (!canvas) return;
    presentation.slides[activeIdx].data = canvas.toObject(["data"]);
    const p = presentation;
    setDownloadOpen(false);
    toast.loading("Preparing download...", { id: "dl" });
    try {
      if (format === "pdf") await exportPDF(p);
      else if (format === "pptx") await exportPPTX(p);
      else if (format === "png") await exportImages(p, "png");
      else if (format === "jpeg") await exportImages(p, "jpeg");
      toast.success("Downloaded", { id: "dl" });
    } catch (e: any) {
      toast.error("Download failed: " + e.message, { id: "dl" });
    }
  };

  // Selection style updater
  const updateSelection = (fn: (o: any) => void) => {
    const canvas = fabricRef.current; if (!canvas) return;
    const obj = canvas.getActiveObject(); if (!obj) return;
    fn(obj);
    canvas.requestRenderAll();
    setTick(t => t + 1);
    canvas.fire("object:modified");
  };

  const deleteSelected = () => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const obj = canvas.getActiveObject();
    if (obj && (obj as any).data?.mark !== FOOTER_MARK) {
      canvas.remove(obj);
      canvas.discardActiveObject();
      canvas.requestRenderAll();
    }
  };

  const isText = selection && ["textbox", "text", "i-text"].includes((selection as any).type);

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      {/* Top bar */}
      <header className="flex items-center justify-between border-b border-border px-4 py-3 glass">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-muted transition">
            <ArrowLeft className="h-4 w-4" />
            <Home className="h-4 w-4" />
          </Link>
          <div className="h-6 w-px bg-border" />
          <input
            className="bg-transparent text-sm font-semibold outline-none focus:ring-1 focus:ring-primary rounded px-2 py-1"
            value={presentation.name}
            onChange={(e) => setPresentation({ ...presentation, name: e.target.value })}
          />
        </div>
        <div className="flex items-center gap-2">
          <button onClick={undo} className="rounded-lg p-2 hover:bg-muted transition" title="Undo (Ctrl+Z)">
            <Undo2 className="h-4 w-4" />
          </button>
          <button onClick={redo} className="rounded-lg p-2 hover:bg-muted transition" title="Redo (Ctrl+Y)">
            <Redo2 className="h-4 w-4" />
          </button>
          <div className="h-6 w-px bg-border mx-1" />
          <Select value={String(zoom)} onValueChange={(v) => setZoom(Number(v))}>
            <SelectTrigger className="h-8 w-24 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[0.25, 0.5, 0.75, 1, 1.25, 1.5].map((z) => (
                <SelectItem key={z} value={String(z)}>{Math.round(z * 100)}%</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <button onClick={saveNow} className="ml-2 inline-flex items-center gap-2 rounded-lg bg-secondary px-3 py-2 text-sm font-medium hover:bg-muted transition">
            <Save className="h-4 w-4" /> Save
          </button>
          <button onClick={() => setDownloadOpen(true)} className="inline-flex items-center gap-2 rounded-lg btn-brand px-4 py-2 text-sm font-semibold">
            <Download className="h-4 w-4" /> Download
          </button>
        </div>
      </header>

      <div className="flex flex-1 flex-col md:flex-row overflow-hidden">
        {/* Left: slides panel */}
        <aside className="flex w-full md:w-52 h-36 md:h-auto flex-col border-b md:border-b-0 md:border-r border-border bg-sidebar flex-shrink-0">
          <div className="flex items-center justify-between px-3 py-2 text-xs uppercase tracking-wider text-muted-foreground">
            <span>Slides</span>
            <button onClick={addSlide} className="rounded-md p-1 hover:bg-muted" title="Add slide">
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <div className="flex-1 overflow-x-auto md:overflow-y-auto overflow-y-hidden md:overflow-x-hidden px-2 pb-2 md:pb-4 flex flex-row md:flex-col space-x-2 md:space-x-0 md:space-y-2">
            {presentation.slides.map((s, i) => (
              <div key={s.id}
                onClick={() => switchSlide(i)}
                className={`flex-shrink-0 w-32 md:w-full group relative cursor-pointer overflow-hidden rounded-xl border-2 transition ${
                  i === activeIdx ? "border-primary shadow-[var(--shadow-glow)]" : "border-border hover:border-muted-foreground/50"
                }`}
              >
                <div className="flex items-center gap-2 px-2 pt-1">
                  <span className="text-[10px] text-muted-foreground">{i + 1}</span>
                </div>
                <div className="aspect-video w-full bg-black">
                  {thumbs[s.id] || s.thumbnail ? (
                    <img src={thumbs[s.id] || s.thumbnail} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-end justify-center pb-1 text-[8px] text-white/60">
                      Satyabrat Mishra
                    </div>
                  )}
                </div>
                <div className="absolute right-1 top-1 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                  <button onClick={(e) => { e.stopPropagation(); duplicateSlide(i); }} className="rounded bg-black/70 p-1" title="Duplicate">
                    <Copy className="h-3 w-3" />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); deleteSlide(i); }} className="rounded bg-black/70 p-1" title="Delete">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Center: canvas */}
        <main className="flex flex-1 flex-col overflow-hidden">
          {/* Toolbar */}
          <div className="flex flex-nowrap md:flex-wrap items-center gap-1 border-b border-border px-3 py-2 glass overflow-x-auto">
            <ToolBtn icon={<Type className="h-4 w-4" />} label="Heading" onClick={addHeading} />
            <ToolBtn icon={<Type className="h-3.5 w-3.5" />} label="Sub" onClick={addSubheading} />
            <ToolBtn icon={<Type className="h-3 w-3" />} label="Text" onClick={addParagraph} />
            <ToolBtn icon={<span className="text-xs">•</span>} label="Bullets" onClick={addBullets} />
            <div className="h-6 w-px bg-border mx-1" />
            <ToolBtn icon={<Square className="h-4 w-4" />} label="Rect" onClick={addRect} />
            <ToolBtn icon={<CircleIcon className="h-4 w-4" />} label="Circle" onClick={addCircle} />
            <ToolBtn icon={<Minus className="h-4 w-4" />} label="Line" onClick={addLine} />
            <div className="h-6 w-px bg-border mx-1" />
            <ToolBtn icon={<ImageIcon className="h-4 w-4" />} label="Image" onClick={addImage} />

            {selection && (
              <>
                <div className="h-6 w-px bg-border mx-1" />
                <div className="flex items-center gap-2 pl-1">
                {isText && (
                  <div className="flex items-center gap-2">
                    <select
                      value={(selection as any).fontFamily || "Inter"}
                      onChange={(e) => updateSelection((o) => o.set("fontFamily", e.target.value))}
                      className="h-8 rounded bg-muted px-2 py-1 text-xs outline-none border border-transparent focus:border-primary"
                    >
                      <option value="Inter">Inter</option>
                      <option value="Poppins">Poppins</option>
                      <option value="Roboto">Roboto</option>
                      <option value="Arial">Arial</option>
                      <option value="Times New Roman">Times</option>
                      <option value="Courier New">Courier</option>
                    </select>

                    <div className="flex items-center gap-1 rounded bg-muted px-2 h-8 border border-transparent focus-within:border-primary transition">
                      <input type="number" min={8} max={200} defaultValue={(selection as any).fontSize}
                        onChange={(e) => updateSelection((o) => o.set("fontSize", Number(e.target.value)))}
                        className="w-10 bg-transparent text-xs outline-none" title="Font size" />
                      <span className="text-[10px] text-muted-foreground">pt</span>
                    </div>

                    <div className="h-6 w-px bg-border mx-1" />

                    <div className="flex items-center gap-1">
                      <button onClick={() => updateSelection((o) => o.set("fontWeight", o.fontWeight === "700" ? "400" : "700"))}
                        className="rounded p-1.5 hover:bg-muted" title="Bold"><Bold className="h-4 w-4" /></button>
                      <button onClick={() => updateSelection((o) => o.set("fontStyle", o.fontStyle === "italic" ? "normal" : "italic"))}
                        className="rounded p-1.5 hover:bg-muted" title="Italic"><Italic className="h-4 w-4" /></button>
                      <button onClick={() => updateSelection((o) => o.set("underline", !o.underline))}
                        className="rounded p-1.5 hover:bg-muted" title="Underline"><UnderlineIcon className="h-4 w-4" /></button>
                      <input type="color" defaultValue={(selection as any).fill}
                        onChange={(e) => updateSelection((o) => o.set("fill", e.target.value))}
                        className="h-7 w-7 rounded border border-border bg-transparent ml-1" title="Text Color" />
                    </div>
                  </div>
                )}
                {!isText && (
                  <div className="flex items-center gap-1">
                    <label className="text-xs text-muted-foreground">Fill</label>
                    <input type="color" defaultValue={(selection as any).fill}
                      onChange={(e) => updateSelection((o) => o.set("fill", e.target.value))}
                      className="h-7 w-7 rounded border border-border bg-transparent" />
                    <label className="text-xs text-muted-foreground ml-2">Opacity</label>
                    <input type="range" min={0.1} max={1} step={0.05} defaultValue={(selection as any).opacity ?? 1}
                      onChange={(e) => updateSelection((o) => o.set("opacity", Number(e.target.value)))}
                      className="w-24" />
                  </div>
                )}
                <div className="h-6 w-px bg-border mx-1" />
                <button onClick={deleteSelected} className="rounded p-1.5 hover:bg-red-500/20 text-red-500 transition flex items-center gap-1.5 px-2" title="Delete selected object">
                  <Trash2 className="h-4 w-4" /> <span className="text-xs font-medium">Delete</span>
                </button>
              </div>
              </>
            )}
          </div>

          <div ref={containerRef} className="flex-1 overflow-auto flex items-center justify-center p-6"
            style={{ backgroundImage: "radial-gradient(oklch(0.2 0 0) 1px, transparent 1px)", backgroundSize: "24px 24px" }}>
            <div className="rounded-2xl border border-white/20 shadow-2xl">
              <canvas ref={canvasElRef} className="rounded-2xl" />
            </div>
          </div>
        </main>
      </div>

      {/* Save dialog */}
      <SaveDialog
        open={saveOpen} onOpenChange={setSaveOpen}
        initialName={presentation.name}
        initialDescription={presentation.description || ""}
        onConfirm={confirmSave}
      />

      {/* Download dialog */}
      <Dialog open={downloadOpen} onOpenChange={setDownloadOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Download Presentation</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <label className="text-sm text-muted-foreground">Choose format</label>
            <Select value={format} onValueChange={setFormat}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">PDF Document</SelectItem>
                <SelectItem value="pptx">PowerPoint (.pptx)</SelectItem>
                <SelectItem value="png">PNG Images</SelectItem>
                <SelectItem value="jpeg">JPEG Images</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDownloadOpen(false)}>Cancel</Button>
            <Button onClick={doDownload} className="btn-brand">Download</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ToolBtn({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium hover:bg-muted transition">
      {icon}<span>{label}</span>
    </button>
  );
}

function SaveDialog({ open, onOpenChange, initialName, initialDescription, onConfirm }: {
  open: boolean; onOpenChange: (v: boolean) => void;
  initialName: string; initialDescription: string;
  onConfirm: (name: string, description: string) => void;
}) {
  const [name, setName] = useState(initialName);
  const [desc, setDesc] = useState(initialDescription);
  useEffect(() => { setName(initialName); setDesc(initialDescription); }, [initialName, initialDescription, open]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save Presentation?</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Presentation name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Description (optional)</label>
            <Textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={3} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>No</Button>
          <Button onClick={() => onConfirm(name, desc)} className="btn-brand">Yes, save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
