import { useEffect, useState } from 'react';

export default function KnowledgeView({ storeId }: { storeId: string }) {
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/knowledge/${storeId}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setDocs(json.data);
        setLoading(false);
      });
  }, [storeId]);

  if (loading) return <div className="p-4">กำลังโหลดข้อมูล...</div>;

  if (docs.length === 0)
    return <div className="p-4 text-gray-500">ยังไม่มี Knowledge สำหรับร้านนี้</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Knowledge Base</h1>

      <div className="space-y-4">
        {docs.map((doc) => (
          <div
            key={doc.id}
            className="border p-4 rounded-lg shadow bg-white space-y-2"
          >
            <h2 className="text-xl font-semibold">{doc.title || doc.type}</h2>

            {doc.content && <p>{doc.content}</p>}

            {Array.isArray(doc.items) && doc.items.length > 0 && (
              <ul className="list-disc ml-5">
                {doc.items.map((item: any, i: number) => (
                  <li key={i}>
                    {item.name
                      ? `${item.name} — ${item.price} บาท`
                      : JSON.stringify(item)}
                  </li>
                ))}
              </ul>
            )}

            <div className="text-sm text-gray-400">
              อัปเดตล่าสุด: {doc.updatedAt}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
