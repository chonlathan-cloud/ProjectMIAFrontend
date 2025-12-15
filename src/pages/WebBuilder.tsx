// src/pages/WebBuilder.tsx
import React, { useState, useEffect } from 'react';
import { useStore } from "@/store/useStore"; // ดึง Store ID จริง
import { authedJson } from "@/lib/api"; // API Helper ที่เราทำไว้
import { Loader2, Wand2, CheckCircle, ShieldCheck, ChevronRight, Edit3, X, Save, Globe, Smartphone, RotateCcw } from 'lucide-react';
import { Button } from "@/components/ui/button";

// --- 1. TYPES DEFINITION ---
type ComponentType = 'HERO' | 'FEATURES' | 'CONTACT' | 'PRODUCTS';

interface Section {
  id: string;
  type: ComponentType;
  data: Record<string, string>;
}

interface SiteConfig {
  businessName: string;
  category: string;
  themeColor: string;
  sections: Section[];
}

interface UserInput {
  name: string;
  category: string | null;
  color: string;
}

const COLORS = [
  { name: 'Ocean Blue', hex: '#007AFF' },
  { name: 'Rose Gold', hex: '#E0A3A3' },
  { name: 'Emerald', hex: '#10B981' },
  { name: 'Midnight', hex: '#1F2937' },
  { name: 'Sunset', hex: '#F97316' },
];

const CATEGORIES = [
  { id: 'BEAUTY', label: 'คลินิกเสริมความงาม', icon: '✨' },
  { id: 'RESTAURANT', label: 'ร้านอาหาร / คาเฟ่', icon: '🍜' },
  { id: 'RETAIL', label: 'ร้านค้าปลีก', icon: '🛍️' },
];

// --- 2. MOCK AI SERVICE (สร้างโครงเว็บตามหมวดหมู่) ---
const generateSiteConfig = (name: string, category: string, color: string): SiteConfig => {
  const sections: Section[] = [];

  // 1. Hero Section (มีทุกเว็บ)
  sections.push({
    id: 'hero-1',
    type: 'HERO',
    data: {
      title: name || 'ยินดีต้อนรับ',
      subtitle: category === 'RESTAURANT' ? 'ความอร่อยที่คุณต้องลอง' : 'บริการระดับพรีเมียมเพื่อคุณ',
      buttonText: category === 'RESTAURANT' ? 'ดูเมนูอาหาร' : 'จองคิวบริการ'
    }
  });

  // 2. Specific Section
  if (category === 'BEAUTY') {
    sections.push({
      id: 'feat-1',
      type: 'FEATURES',
      data: {
        title: 'บริการยอดนิยม',
        item1: 'ดูแลผิวหน้า',
        item2: 'เลเซอร์กำจัดขน',
        item3: 'ปรับรูปหน้า'
      }
    });
  } else if (category === 'RESTAURANT') {
    sections.push({
      id: 'prod-1',
      type: 'PRODUCTS',
      data: {
        title: 'เมนูแนะนำ',
        item1: 'ต้มยำกุ้งน้ำข้น',
        item2: 'ผัดไทยกุ้งสด'
      }
    });
  }

  // 3. Contact Section
  sections.push({
    id: 'contact-1',
    type: 'CONTACT',
    data: {
      title: 'ติดต่อเรา',
      tel: '02-XXX-XXXX',
      line: name.replace(/\s+/g, '').toLowerCase()
    }
  });

  return {
    businessName: name,
    category: category,
    themeColor: color,
    sections
  };
};

// --- 3. MAIN COMPONENT ---
export default function WebBuilder() {
  const { store } = useStore();
  
  // State Machine
  const [viewState, setViewState] = useState<'LOADING' | 'ONBOARDING' | 'GENERATING' | 'PREVIEW'>('LOADING');
  const [step, setStep] = useState(1);
  const [userInput, setUserInput] = useState<UserInput>({ name: '', category: null, color: COLORS[0].hex });
  const [siteConfig, setSiteConfig] = useState<SiteConfig | null>(null);
  
  // Actions State
  const [isSaving, setIsSaving] = useState(false);
  const [editorState, setEditorState] = useState<{ isOpen: boolean; componentId: string | null; field: string | null; value: string }>({ 
    isOpen: false, componentId: null, field: null, value: '' 
  });

  // 1. Load Existing Draft
  useEffect(() => {
    async function loadData() {
      if (!store?.id) return;
      try {
        // เรียก API ดึงข้อมูล
        const res: any = await authedJson(`/api/sites?storeId=${store.id}`);
        
        // ถ้ามี Draft ให้ใช้ Draft, ถ้าไม่มีให้ดู Published
        const existingData = res.draft?.config || res.published?.config;

        if (existingData) {
          setSiteConfig(existingData);
          setViewState('PREVIEW'); // ข้ามไปหน้า Preview เลย
        } else {
          // ถ้าไม่มีข้อมูลเลย ให้เริ่ม Onboarding
          setUserInput(prev => ({ ...prev, name: store.name || '' }));
          setViewState('ONBOARDING');
        }
      } catch (e) {
        console.error("Load failed", e);
        setViewState('ONBOARDING');
      }
    }
    loadData();
  }, [store?.id]);

  // 2. Generate New Site (AI)
  const handleGenerate = async () => {
    if (!userInput.name || !userInput.category) return;
    setViewState('GENERATING');
    
    // Simulate AI Delay
    await new Promise(r => setTimeout(r, 1500));
    
    const config = generateSiteConfig(userInput.name, userInput.category, userInput.color);
    setSiteConfig(config);
    
    // Auto Save Draft ทันที
    await saveToBackend(config);
    
    setViewState('PREVIEW');
  };

  // 3. Save Logic
  const saveToBackend = async (config: SiteConfig) => {
    if (!store?.id) return;
    try {
      setIsSaving(true);
      await authedJson('/api/sites/save', {
        method: 'POST',
        body: JSON.stringify({ storeId: store.id, config })
      });
    } catch (e) {
      console.error("Save failed", e);
      alert("บันทึกไม่สำเร็จ");
    } finally {
      setIsSaving(false);
    }
  };

  // 4. Update & Save (Manual Trigger)
  const handleManualSave = async () => {
    if (siteConfig) {
        await saveToBackend(siteConfig);
        alert("บันทึกฉบับร่างเรียบร้อย ✅");
    }
  };

  // 5. Publish Logic
  const handlePublish = async () => {
    if (!store?.id) return;
    if (!confirm("ต้องการเผยแพร่เว็บไซต์ให้ลูกค้าเห็นทันทีหรือไม่?")) return;

    try {
      setIsSaving(true);
      await authedJson('/api/sites/publish', {
        method: 'POST',
        body: JSON.stringify({ storeId: store.id })
      });
      alert("🎉 เผยแพร่เว็บไซต์สำเร็จ!");
    } catch (e) {
      alert("เผยแพร่ไม่สำเร็จ");
    } finally {
      setIsSaving(false);
    }
  };

  // 6. Editor Logic
  const handleComponentEdit = (id: string, field: string, value: string) => {
    setEditorState({ isOpen: true, componentId: id, field, value });
  };

  const saveEdit = () => {
    if (!siteConfig || !editorState.componentId || !editorState.field) return;

    const updatedSections = siteConfig.sections.map(section => {
      if (section.id === editorState.componentId) {
        return {
          ...section,
          data: {
            ...section.data,
            [editorState.field as string]: editorState.value
          }
        };
      }
      return section;
    });

    const newConfig = { ...siteConfig, sections: updatedSections };
    setSiteConfig(newConfig); // Optimistic Update
    setEditorState({ ...editorState, isOpen: false });
    
    // Auto Save (Optional: หรือจะให้กดปุ่ม Save เองก็ได้)
    // saveToBackend(newConfig); 
  };

  // --- RENDERERS ---

  const renderOnboarding = () => (
    <div className="min-h-[calc(100vh-100px)] flex items-center justify-center p-6 bg-slate-50">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden relative">
        <div className="p-8">
          <div className="flex items-center gap-2 mb-6 text-gray-400 text-xs font-semibold uppercase tracking-wider">
            <span className={`w-6 h-6 rounded-full flex items-center justify-center border ${step >= 1 ? 'bg-black text-white border-black' : 'border-gray-200'}`}>1</span>
            <div className={`h-px flex-1 ${step >= 2 ? 'bg-black' : 'bg-gray-200'}`}></div>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center border ${step >= 2 ? 'bg-black text-white border-black' : 'border-gray-200'}`}>2</span>
            <div className={`h-px flex-1 ${step >= 3 ? 'bg-black' : 'bg-gray-200'}`}></div>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center border ${step >= 3 ? 'bg-black text-white border-black' : 'border-gray-200'}`}>3</span>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">
            {step === 1 && "ชื่อธุรกิจของคุณ?"}
            {step === 2 && "เลือกประเภทธุรกิจ"}
            {step === 3 && "เลือกโทนสีแบรนด์"}
          </h1>

          <div className="min-h-[200px] py-4">
            {step === 1 && (
              <input
                autoFocus
                type="text"
                placeholder="เช่น สมศรีคลินิก"
                className="w-full text-2xl border-b-2 border-gray-200 py-2 outline-none focus:border-black transition-colors bg-transparent placeholder-gray-300"
                value={userInput.name}
                onChange={(e) => setUserInput({ ...userInput, name: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && userInput.name && setStep(2)}
              />
            )}

            {step === 2 && (
              <div className="space-y-3">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => { setUserInput({ ...userInput, category: cat.id }); setStep(3); }}
                    className="w-full p-4 rounded-xl border border-gray-100 bg-gray-50 hover:bg-white hover:shadow-md hover:border-blue-100 transition-all text-left flex items-center gap-3 group"
                  >
                    <span className="text-2xl group-hover:scale-110 transition-transform">{cat.icon}</span>
                    <span className="font-semibold text-gray-700 group-hover:text-blue-600">{cat.label}</span>
                    <ChevronRight className="ml-auto text-gray-300 group-hover:text-blue-500" size={20} />
                  </button>
                ))}
              </div>
            )}

            {step === 3 && (
              <div className="grid grid-cols-5 gap-3">
                {COLORS.map(c => (
                  <button
                    key={c.hex}
                    onClick={() => setUserInput({ ...userInput, color: c.hex })}
                    className={`h-14 rounded-full shadow-sm transition-transform active:scale-95 flex items-center justify-center ${userInput.color === c.hex ? 'ring-2 ring-offset-2 ring-black scale-110' : ''}`}
                    style={{ backgroundColor: c.hex }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-gray-50 p-6 flex justify-between items-center border-t border-gray-100">
          {step > 1 && (
            <button onClick={() => setStep(step - 1)} className="text-gray-500 font-medium hover:text-black transition">
              ย้อนกลับ
            </button>
          )}
          <div className="flex-1"></div>
          {step === 1 && (
            <button 
              disabled={!userInput.name}
              onClick={() => setStep(2)}
              className="bg-black text-white px-8 py-3 rounded-full font-semibold disabled:opacity-50 hover:bg-gray-800 transition shadow-lg"
            >
              ต่อไป
            </button>
          )}
          {step === 3 && (
            <button 
              onClick={handleGenerate}
              className="bg-black text-white px-8 py-3 rounded-full font-semibold flex items-center gap-2 hover:bg-gray-800 transition shadow-lg"
            >
              <Wand2 size={18} />
              สร้างเว็บไซต์
            </button>
          )}
        </div>
      </div>
    </div>
  );

  const renderPreview = () => {
    if (!siteConfig) return null;

    return (
      <div className="flex flex-col md:flex-row h-[calc(100vh-80px)] overflow-hidden">
        {/* Sidebar Controls */}
        <div className="w-full md:w-80 bg-white border-r border-gray-200 p-6 z-10 flex flex-col overflow-y-auto">
          <div className="mb-8">
            <h1 className="font-bold text-xl tracking-tight flex items-center gap-2">
              <span className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-serif italic">C</span>
              ConnectBridge
            </h1>
            <p className="text-xs text-gray-400 mt-1">AI Website Builder</p>
          </div>
          
          <div className="space-y-6 flex-1">
            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">สถานะ</h3>
              <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-2 rounded-lg">
                <CheckCircle size={16} />
                <span>ร่างแบบ (Draft)</span>
              </div>
            </div>

            <div className="space-y-2">
                <Button onClick={handleManualSave} disabled={isSaving} variant="outline" className="w-full justify-start">
                    <Save className="w-4 h-4 mr-2" /> บันทึกการแก้ไข
                </Button>
                <Button onClick={handlePublish} disabled={isSaving} className="w-full justify-start bg-emerald-600 hover:bg-emerald-700">
                    <Globe className="w-4 h-4 mr-2" /> เผยแพร่เว็บไซต์
                </Button>
                <Button onClick={() => setViewState('ONBOARDING')} variant="ghost" className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50">
                    <RotateCcw className="w-4 h-4 mr-2" /> เริ่มทำใหม่
                </Button>
            </div>

            <div className="pt-6 border-t">
                <p className="text-xs text-gray-400 mb-2">ลิงก์ร้านค้าของคุณ:</p>
                <code className="block bg-gray-100 p-2 rounded text-xs break-all">
                    {`https://lineboost.store/s/${store?.id}`}
                </code>
                <Button size="sm" variant="link" className="px-0 text-xs" onClick={() => window.open(`http://localhost:5173/s/${store?.id}`, '_blank')}>
                    <Smartphone className="w-3 h-3 mr-1" /> เปิดดูหน้าจริง
                </Button>
            </div>
          </div>
        </div>

        {/* Mobile Preview Area */}
        <div className="flex-1 bg-gray-100 flex items-center justify-center p-4 md:p-8 overflow-hidden relative">
           <div className="w-full max-w-[375px] h-full max-h-[750px] bg-white rounded-[40px] shadow-2xl border-[8px] border-gray-900 relative overflow-hidden flex flex-col">
              {/* Notch */}
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-40 h-6 bg-gray-900 rounded-b-xl z-20"></div>
              
              {/* Fake Header */}
              <div className="h-12 bg-white flex items-center justify-center border-b border-gray-100 pt-4 z-10 shrink-0" style={{backgroundColor: siteConfig.themeColor}}>
                <span className="text-xs font-medium text-white">{siteConfig.businessName}</span>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto hide-scrollbar bg-gray-50 relative pb-20">
                {siteConfig.sections.map(section => (
                  <SimpleComponentRenderer 
                    key={section.id} 
                    section={section} 
                    themeColor={siteConfig.themeColor} 
                    onEdit={handleComponentEdit}
                  />
                ))}
              </div>

              {/* PDPA Banner */}
              <div className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md p-3 border-t border-gray-200 z-30">
                <div className="flex items-start gap-2">
                  <ShieldCheck size={16} className="text-gray-400 shrink-0 mt-1" />
                  <div className="flex-1">
                    <p className="text-[10px] text-gray-500 leading-tight mb-2">
                      เว็บไซต์นี้ใช้คุกกี้เพื่อประสบการณ์ที่ดีที่สุด
                    </p>
                    <div className="flex gap-2">
                        <button className="flex-1 bg-black text-white text-[10px] py-1.5 rounded-lg">ยอมรับ</button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Edit Tooltip */}
              <div className="absolute top-16 right-4 bg-blue-600 text-white text-[10px] px-3 py-1 rounded-full shadow-lg animate-bounce z-40 pointer-events-none opacity-80">
                แตะข้อความเพื่อแก้ ✏️
              </div>
           </div>
        </div>

        {/* Editor Modal */}
        {editorState.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setEditorState({ ...editorState, isOpen: false })}></div>
            <div className="bg-white w-full max-w-sm p-6 rounded-2xl shadow-2xl z-50 animate-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold flex items-center gap-2">
                  <Edit3 size={16} /> แก้ไขเนื้อหา
                </h3>
                <button onClick={() => setEditorState({ ...editorState, isOpen: false })} className="p-1 hover:bg-gray-100 rounded-full">
                  <X size={20} />
                </button>
              </div>
              <div className="mb-4">
                <label className="text-xs font-semibold text-gray-500 uppercase mb-2 block">{editorState.field}</label>
                <textarea 
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 ring-black outline-none min-h-[100px]"
                  value={editorState.value}
                  onChange={(e) => setEditorState({ ...editorState, value: e.target.value })}
                />
              </div>
              <button 
                onClick={saveEdit}
                className="w-full bg-black text-white py-2.5 rounded-xl font-bold shadow-lg hover:bg-gray-800 transition"
              >
                บันทึก
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (viewState === 'LOADING') return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
  if (viewState === 'GENERATING') return <div className="h-screen flex flex-col items-center justify-center"><Loader2 className="animate-spin mb-4" /><p>AI กำลังสร้างเว็บไซต์...</p></div>;
  
  return viewState === 'ONBOARDING' ? renderOnboarding() : renderPreview();
}

// --- 4. SIMPLE COMPONENT RENDERER (Internal) ---
function SimpleComponentRenderer({ section, themeColor, onEdit }: { section: Section, themeColor: string, onEdit: any }) {
    
    // Helper to create editable span
    const Editable = ({ field, className = "" }: { field: string, className?: string }) => (
        <span 
            onClick={() => onEdit(section.id, field, section.data[field])}
            className={`cursor-pointer hover:bg-blue-100 hover:text-blue-800 transition-colors px-1 rounded decoration-dashed underline underline-offset-4 decoration-blue-300 ${className}`}
        >
            {section.data[field]}
        </span>
    );

    switch (section.type) {
        case 'HERO':
            return (
                <div className="p-8 text-center space-y-4 bg-white py-12">
                    <h2 className="text-2xl font-bold text-gray-900 leading-tight">
                        <Editable field="title" />
                    </h2>
                    <p className="text-gray-500 text-sm">
                        <Editable field="subtitle" />
                    </p>
                    <button style={{ backgroundColor: themeColor }} className="px-6 py-2 rounded-full text-white text-sm font-bold shadow-lg">
                        <Editable field="buttonText" />
                    </button>
                </div>
            );
        case 'FEATURES':
        case 'PRODUCTS':
            return (
                <div className="p-6 bg-white border-t border-gray-100">
                    <h3 className="font-bold text-lg mb-4 text-gray-800"><Editable field="title" /></h3>
                    <ul className="space-y-3">
                        {['item1', 'item2', 'item3'].map((key) => section.data[key] && (
                             <li key={key} className="flex items-center gap-3 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                                <span className="w-2 h-2 rounded-full" style={{backgroundColor: themeColor}}></span>
                                <Editable field={key} />
                             </li>
                        ))}
                    </ul>
                </div>
            );
        case 'CONTACT':
            return (
                <div className="p-6 bg-gray-900 text-white mt-4">
                    <h3 className="font-bold mb-4"><Editable field="title" /></h3>
                    <div className="space-y-2 text-sm text-gray-400">
                        <p>Tel: <Editable field="tel" /></p>
                        <p className="text-green-400">LINE: <Editable field="line" /></p>
                    </div>
                </div>
            );
        default:
            return null;
    }
}