import { useState } from 'react';

export default function KnowledgeAIGenerator({ storeId }: { storeId: string }) {
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const onGenerate = async () => {
    setLoading(true);
    setResult(null);

    const res = await fetch('/api/knowledge-ai/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ storeId, request: prompt }),
    });

    const json = await res.json();
    setResult(json);
    setLoading(false);
  };

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">AI Knowledge Builder</h1>

      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="เช่น: สร้างเมนูอาหารตามสั่ง 10 รายการ พร้อมราคา"
        className="w-full p-3 border rounded h-32"
      />

      <button
        onClick={onGenerate}
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded shadow"
      >
        {loading ? 'AI กำลังสร้าง...' : 'ให้ AI สร้าง Knowledge'}
      </button>

      {result && (
        <div className="p-4 border rounded bg-white shadow">
          <h2 className="text-xl mb-2 font-semibold">ผลลัพธ์จาก AI</h2>

          {result.success ? (
            <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
{JSON.stringify(result.documents, null, 2)}
            </pre>
          ) : (
            <div className="text-red-600">
              Error: {result.message}
              <pre className="bg-gray-100 p-2 rounded text-xs">
{JSON.stringify(result.raw, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
