import { create } from 'zustand';

interface KnowledgeDoc {
  id: string;
  type?: string;
  title?: string;
  items?: any[];
  content?: string;
  updatedAt?: string;
}

interface KnowledgeEditorState {
  docs: KnowledgeDoc[];
  current: KnowledgeDoc | null;

  loadAll: (storeId: string) => Promise<void>;
  loadOne: (storeId: string, docId: string) => Promise<void>;
  save: (storeId: string, docId: string, payload: Partial<KnowledgeDoc>) => Promise<void>;
  remove: (storeId: string, docId: string) => Promise<void>;
}

export const useKnowledgeEditor = create<KnowledgeEditorState>((set, get) => ({
  docs: [],
  current: null,

  loadAll: async (storeId) => {
    const res = await fetch(`/api/knowledge/${storeId}`);
    const json = await res.json();
    if (json.success) set({ docs: json.data });
  },

  loadOne: async (storeId, docId) => {
    const res = await fetch(`/api/knowledge/${storeId}/${docId}`);
    const json = await res.json();
    if (json.success) set({ current: json.data });
  },

  save: async (storeId, docId, payload) => {
    await fetch(`/api/knowledge/${storeId}/${docId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    await get().loadAll(storeId);
  },

  remove: async (storeId, docId) => {
    await fetch(`/api/knowledge/${storeId}/${docId}`, {
      method: 'DELETE',
    });
    await get().loadAll(storeId);
  },
}));
