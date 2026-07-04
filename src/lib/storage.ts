export type SlideObject = {
  type: string;
  [k: string]: any;
};

export type Slide = {
  id: string;
  // Fabric canvas JSON
  data: any;
  thumbnail?: string;
};

export type Presentation = {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
  modifiedAt: number;
  slides: Slide[];
};

const KEY = "sbm-slides-v1";
const DRAFT_KEY = "sbm-slides-draft-v1";

function read(): Presentation[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

function write(items: Presentation[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
}

export const store = {
  list(): Presentation[] {
    return read().sort((a, b) => b.modifiedAt - a.modifiedAt);
  },
  get(id: string): Presentation | undefined {
    return read().find((p) => p.id === id);
  },
  save(p: Presentation) {
    const items = read();
    const idx = items.findIndex((x) => x.id === p.id);
    p.modifiedAt = Date.now();
    if (idx >= 0) items[idx] = p;
    else items.push(p);
    write(items);
  },
  delete(id: string) {
    write(read().filter((p) => p.id !== id));
  },
  duplicate(id: string): Presentation | undefined {
    const p = read().find((x) => x.id === id);
    if (!p) return;
    const copy: Presentation = {
      ...p,
      id: crypto.randomUUID(),
      name: p.name + " (Copy)",
      createdAt: Date.now(),
      modifiedAt: Date.now(),
    };
    const items = read();
    items.push(copy);
    write(items);
    return copy;
  },
  rename(id: string, name: string) {
    const items = read();
    const p = items.find((x) => x.id === id);
    if (p) {
      p.name = name;
      p.modifiedAt = Date.now();
      write(items);
    }
  },
  saveDraft(p: Presentation) {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(p));
  },
  getDraft(): Presentation | null {
    try {
      return JSON.parse(localStorage.getItem(DRAFT_KEY) || "null");
    } catch {
      return null;
    }
  },
  clearDraft() {
    localStorage.removeItem(DRAFT_KEY);
  },
};

export function newPresentation(name = "Untitled Presentation"): Presentation {
  return {
    id: crypto.randomUUID(),
    name,
    createdAt: Date.now(),
    modifiedAt: Date.now(),
    slides: [{ id: crypto.randomUUID(), data: null }],
  };
}
