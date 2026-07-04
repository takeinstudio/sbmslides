import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { store, type Presentation } from "@/lib/storage";
import { exportPDF, exportPPTX, exportImages } from "@/lib/export";
import { FolderOpen, Trash2, Copy, Download, Pencil, ArrowLeft, Plus, FileText } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/saved")({
  head: () => ({
    meta: [
      { title: "Saved Slides — SBM Slides" },
      { name: "description", content: "Open, rename, duplicate, or download your saved SBM Slides presentations." },
    ],
  }),
  component: SavedPage,
});

function SavedPage() {
  const [items, setItems] = useState<Presentation[]>([]);
  const [renameTarget, setRenameTarget] = useState<Presentation | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [downloadTarget, setDownloadTarget] = useState<Presentation | null>(null);
  const [format, setFormat] = useState("pdf");
  const router = useRouter();

  const refresh = () => setItems(store.list());
  useEffect(() => { refresh(); }, []);

  const open = (p: Presentation) => {
    store.saveDraft(p);
    router.navigate({ to: "/create" });
  };

  const doDownload = async () => {
    if (!downloadTarget) return;
    const p = downloadTarget;
    setDownloadTarget(null);
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

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between border-b border-border px-6 py-5 glass">
        <div className="flex items-center gap-3">
          <Link to="/" className="rounded-lg p-2 hover:bg-muted transition">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="font-display text-xl font-bold">Saved Slides</h1>
            <p className="text-xs text-muted-foreground">{items.length} presentation{items.length === 1 ? "" : "s"}</p>
          </div>
        </div>
        <Link to="/create" className="inline-flex items-center gap-2 rounded-xl btn-brand px-4 py-2 text-sm font-semibold">
          <Plus className="h-4 w-4" /> New
        </Link>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl glass">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="font-display text-2xl font-semibold">No presentations yet</h2>
            <p className="mt-2 text-sm text-muted-foreground">Create your first slide to get started.</p>
            <Link to="/create" className="mt-6 inline-flex items-center gap-2 rounded-xl btn-brand px-6 py-3 text-sm font-semibold">
              <Plus className="h-4 w-4" /> Create Slide
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((p) => (
              <div key={p.id} className="group overflow-hidden rounded-2xl bg-card border border-border transition hover:border-primary/50 hover:shadow-[var(--shadow-glow)]">
                <div className="aspect-video w-full bg-black relative">
                  {p.slides[0]?.thumbnail ? (
                    <img src={p.slides[0].thumbnail} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-end justify-center pb-3 text-xs text-white/60">
                      Satyabrat Mishra
                    </div>
                  )}
                  <div className="absolute right-2 top-2 rounded-full bg-black/70 px-2 py-1 text-[10px] text-white">
                    {p.slides.length} slide{p.slides.length === 1 ? "" : "s"}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-display font-semibold truncate">{p.name}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Modified {new Date(p.modifiedAt).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Created {new Date(p.createdAt).toLocaleDateString()}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button onClick={() => open(p)} className="inline-flex items-center gap-1 rounded-lg btn-brand px-3 py-1.5 text-xs font-semibold">
                      <FolderOpen className="h-3.5 w-3.5" /> Open
                    </button>
                    <button onClick={() => { setRenameTarget(p); setRenameValue(p.name); }}
                      className="inline-flex items-center gap-1 rounded-lg bg-secondary px-3 py-1.5 text-xs hover:bg-muted">
                      <Pencil className="h-3.5 w-3.5" /> Rename
                    </button>
                    <button onClick={() => { store.duplicate(p.id); refresh(); toast.success("Duplicated"); }}
                      className="inline-flex items-center gap-1 rounded-lg bg-secondary px-3 py-1.5 text-xs hover:bg-muted">
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => { setDownloadTarget(p); }}
                      className="inline-flex items-center gap-1 rounded-lg bg-secondary px-3 py-1.5 text-xs hover:bg-muted">
                      <Download className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => {
                      if (confirm(`Delete "${p.name}"?`)) { store.delete(p.id); refresh(); toast.success("Deleted"); }
                    }} className="ml-auto inline-flex items-center gap-1 rounded-lg bg-destructive/20 text-destructive px-3 py-1.5 text-xs hover:bg-destructive/30">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Dialog open={!!renameTarget} onOpenChange={(o) => !o && setRenameTarget(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Rename presentation</DialogTitle></DialogHeader>
          <Input value={renameValue} onChange={(e) => setRenameValue(e.target.value)} />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRenameTarget(null)}>Cancel</Button>
            <Button className="btn-brand" onClick={() => {
              if (renameTarget) { store.rename(renameTarget.id, renameValue); refresh(); setRenameTarget(null); toast.success("Renamed"); }
            }}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!downloadTarget} onOpenChange={(o) => !o && setDownloadTarget(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Download "{downloadTarget?.name}"</DialogTitle></DialogHeader>
          <div className="space-y-2 py-2">
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
            <Button variant="ghost" onClick={() => setDownloadTarget(null)}>Cancel</Button>
            <Button className="btn-brand" onClick={doDownload}>Download</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
