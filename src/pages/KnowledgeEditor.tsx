import { useState, useEffect } from 'react';
import { useKnowledgeEditor } from '../store/useKnowledgeEditor';

export default function KnowledgeEditor({ storeId }: { storeId: string }) {
  const { docs, loadAll, save, remove } = useKnowledgeEditor();

  const [docId, setDocId] = useState('');
  const [title, setTitle] = useState('');
  const [type, setType] = useState('');
  const [content, setContent] = useState('');
  const [items, setItems] = useState<string>('');

  useEffect(() => {
    loadAll(storeId);
  }, [storeId]);

  const onSave = async () => {
    const payload: any = { title, type };

    if (content) payload.content = content;

    if (items.trim()) {
      payload.items = items
        .split('\n')
        .map((line) => line.trim())
        .filter((l) => l.length > 0)
        .map((l) => {
          if (l.includes(',')) {
            const [name, price] = l.split(',').map((x) => x.trim());
            return { name, price: Number(price) };
          }
          return l;
        });
    }

    await save(storeId, docId, payload);

    setDocId('');
    setTitle('');
    setType('');
    setContent('');
    setItems('');
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Knowledge Editor</h1>

      {/* Form */}
      <div className="border p-4 rounded-lg bg-white shadow space-y-4">
        <input 
          placeholder="Document ID (เช่น menu, delivery, payment)" 
          value={docId} 
          onChange={(e) => setDocId(e.target.value)}
          className="w-full p-2 border rounded"
        />

        <input 
          placeholder="Title เช่น เมนูแนะนำ" 
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full p-2 border rounded"
        />

        <input
          placeholder="Type เช่น menu, delivery"
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="w-full p-2 border rounded"
        />

        <textarea
          placeholder="Content (ข้อความยาว) — optional"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full p-2 border rounded h-24"
        />

        <textarea
          placeholder="Items (format: ชื่อ,ราคา หรือข้อความทีละบรรทัด)"
          value={items}
          onChange={(e) => setItems(e.target.value)}
          className="w-full p-2 border rounded h-32"
        />

        <button 
          onClick={onSave}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          บันทึก / อัปเดต Knowledge
        </button>
      </div>

      {/* Knowledge List */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold">รายการ Knowledge ทั้งหมด</h2>

        {docs.map((doc) => (
          <div key={doc.id} className="p-4 border rounded bg-white shadow flex justify-between">
            <div>
              <div className="font-semibold text-lg">{doc.title || doc.type}</div>
              <div className="text-gray-500 text-sm">ID: {doc.id}</div>
            </div>

            <button
              onClick={() => remove(storeId, doc.id)}
              className="text-red-600"
            >
              ลบ
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
