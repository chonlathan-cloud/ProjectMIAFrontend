import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, DrawerClose } from "@/components/ui/drawer";
import { Loader2, ShoppingBag, Search, Home, User, Plus, ShoppingCart, Star, MapPin, Phone } from "lucide-react";
import { toast } from "sonner";
import { generateSiteConfig, BusinessType } from "@/lib/siteTemplates";
import { trackEvent } from "@/lib/tracker"; // อย่าลืมสร้างไฟล์ tracker.ts ด้วยนะครับ

// Interface สำหรับสินค้า
interface Product {
    id: number;
    name: string;
    price: number;
    image: string;
    category: string;
}

export default function PublicSite() {
  const { storeSlug } = useParams();
  const [loading, setLoading] = useState(true);
  const [siteData, setSiteData] = useState<any>(null);
  
  // State สำหรับ E-commerce
  const [cart, setCart] = useState<{id: number, qty: number, price: number, name: string}[]>([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [isScrolled, setIsScrolled] = useState(false);
  
  // State สำหรับ PDPA & Conversion
  const [isPdpaOpen, setIsPdpaOpen] = useState(false);
  const [consentGiven, setConsentGiven] = useState(false);

  useEffect(() => {
    // จำลองการดึงข้อมูลเว็บไซต์ (ในอนาคตใช้ API จริง)
    setTimeout(() => {
        // Logic จำลอง: ตรวจสอบ Slug เพื่อเลือกประเภทธุรกิจ
        let type: BusinessType = 'clinic'; 
        if (storeSlug?.includes('shop') || storeSlug?.includes('store') || storeSlug?.includes('fashion')) type = 'retail';
        if (storeSlug?.includes('cafe')) type = 'cafe';
        
        // สร้าง Config จาก Template Engine
        const config = generateSiteConfig(storeSlug || "Demo Store", type);
        setSiteData(config);
        setLoading(false);

        // --- TRACKING STEP 1: Page View ---
        // ส่งข้อมูลเข้าสู่ระบบ AI
        if (config) {
            trackEvent(config.slug, 'page_view', { 
                layout: config.layout,
                title: config.heroHeadline 
            });
        }

    }, 800);

    const handleScroll = () => {
        setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [storeSlug]);

  // --- Cart Logic (สำหรับ Retail Mode) ---
  const addToCart = (product: Product) => {
    setCart(prev => {
        const existing = prev.find(p => p.id === product.id);
        if (existing) {
            return prev.map(p => p.id === product.id ? {...p, qty: p.qty + 1} : p);
        }
        return [...prev, { id: product.id, qty: 1, price: product.price, name: product.name }];
    });
    
    // --- TRACKING STEP 2: Add To Cart ---
    trackEvent(siteData.slug, 'add_to_cart', {
        productId: product.id,
        productName: product.name,
        price: product.price
    });

    toast.success("เพิ่มลงตะกร้าเรียบร้อย", { position: 'bottom-center', duration: 1500 });
  };

  const cartTotal = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
  const cartCount = cart.reduce((acc, item) => acc + item.qty, 0);

  // --- Conversion Logic ---
  const handleActionClick = () => {
    // ถ้าเป็นร้านค้าแต่ตะกร้าว่าง ให้ไม่ทำอะไร (หรือจะแจ้งเตือนก็ได้)
    if (siteData.layout === 'ecommerce' && cart.length === 0) {
        toast.error("กรุณาเลือกสินค้าก่อนชำระเงิน");
        return;
    }
    
    // --- TRACKING STEP 3: Initiate Checkout/Connect ---
    trackEvent(siteData.slug, 'checkout_init', {
        cartTotal: cartTotal,
        items: cartCount
    });

    setIsPdpaOpen(true); // เปิด Popup PDPA
  };

  const handleConfirmConnect = () => {
    if (!consentGiven) return;

    // --- TRACKING STEP 4: Conversion Success ---
    trackEvent(siteData.slug, 'conversion_pdpa_accept', {
        provider: 'LINE'
    });

    // Mock Redirect ไปยัง LINE Login
    toast.success("กำลังพาไปหน้า LINE Login...", { duration: 2000 });
    setIsPdpaOpen(false);
    
    // TODO: ใส่ URL ของ LINE Login จริงที่นี่
    // window.location.href = `https://access.line.me/oauth2/v2.1/authorize...`
  };

  if (loading) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-white">
            <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
        </div>
    );
  }

  const isEcommerce = siteData.layout === 'ecommerce';

  return (
    <div className="min-h-screen bg-slate-50 pb-24 font-sans selection:bg-green-100">
      
      {/* ================= RETAIL LAYOUT (Shopee/Lazada Style) ================= */}
      {isEcommerce && (
        <>
            {/* 1. Header (Sticky & Glassmorphism) */}
            <header className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${isScrolled ? 'bg-white/90 backdrop-blur-md shadow-sm py-2' : 'bg-transparent py-4'}`}>
                <div className="px-4 flex items-center justify-between gap-3">
                    {/* Search Bar */}
                    <div className={`flex-1 transition-all duration-300 ${isScrolled ? 'bg-slate-100' : 'bg-white/90 shadow-lg'} h-10 rounded-full flex items-center px-4 gap-2`}>
                        <Search className="w-4 h-4 text-slate-400" />
                        <span className="text-sm text-slate-400 font-light truncate">ค้นหาใน {siteData.storeName}...</span>
                    </div>
                    
                    {/* Cart Icon */}
                    <div className="relative cursor-pointer" onClick={handleActionClick}>
                        <div className={`p-2 rounded-full ${isScrolled ? 'bg-slate-100 text-slate-800' : 'bg-white/20 backdrop-blur-md text-white'}`}>
                            <ShoppingBag className="w-5 h-5" />
                        </div>
                        {cartCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold ring-2 ring-white">
                                {cartCount}
                            </span>
                        )}
                    </div>
                </div>
            </header>

            {/* 2. Hero & Banner */}
            <div className="relative h-[40vh] w-full bg-slate-200">
                <img src={siteData.heroImageUrl} className="w-full h-full object-cover" alt="Cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-transparent to-black/10 flex flex-col justify-end p-6 pb-8">
                     <Badge variant="secondary" className="w-fit mb-2 bg-white/20 text-white border-0 backdrop-blur-md hover:bg-white/30">
                        Official Store
                     </Badge>
                     <h2 className="text-2xl font-bold text-white mb-1 leading-tight">{siteData.heroHeadline}</h2>
                     <p className="text-slate-300 text-xs font-light line-clamp-2">{siteData.heroSubheadline}</p>
                </div>
            </div>

            {/* 3. Categories (Sticky Horizontal) */}
            <div className={`sticky ${isScrolled ? 'top-[56px]' : 'top-0'} z-30 bg-white py-3 border-b border-slate-50 transition-all duration-300`}>
                <div className="flex overflow-x-auto px-4 gap-2 scrollbar-hide">
                    {siteData.categories?.map((cat: any) => (
                        <button 
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.id)}
                            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap
                                ${activeCategory === cat.id 
                                    ? `bg-slate-900 text-white shadow-md` 
                                    : 'bg-slate-100 text-slate-600'}`}
                        >
                            {cat.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* 4. Product Grid */}
            <div className="p-3 grid grid-cols-2 gap-3 min-h-[500px]">
                {siteData.products?.map((product: any) => (
                    <div key={product.id} className="group bg-white rounded-xl p-2 pb-3 shadow-sm border border-slate-100/50">
                        <div className="aspect-[1/1] rounded-lg bg-slate-50 overflow-hidden relative mb-2">
                            <img src={product.image} className="w-full h-full object-cover" alt={product.name} />
                            <button 
                                onClick={() => addToCart(product)}
                                className="absolute bottom-2 right-2 w-8 h-8 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-transform text-slate-900"
                            >
                                <Plus className="w-5 h-5" />
                            </button>
                        </div>
                        <h3 className="text-xs font-medium text-slate-700 line-clamp-2 h-8 leading-relaxed px-1">{product.name}</h3>
                        <div className="flex items-center justify-between mt-2 px-1">
                            <span className="font-bold text-sm text-slate-900">฿{product.price}</span>
                            <div className="flex items-center gap-0.5 text-[9px] text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">
                                <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" /> 4.9
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </>
      )}

      {/* ================= SERVICE LAYOUT (Clean & Premium) ================= */}
      {!isEcommerce && (
          <div className="flex flex-col min-h-screen bg-white">
               {/* Full Screen Hero */}
               <div className="relative h-[60vh] w-full overflow-hidden">
                    <img src={siteData.heroImageUrl} className="w-full h-full object-cover scale-105" alt="Hero" />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-white" />
                    
                    {/* Top Nav */}
                    <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center">
                         <span className="bg-white/80 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm">
                             {siteData.storeName}
                         </span>
                    </div>
               </div>
               
               {/* Content Card */}
               <div className="flex-1 -mt-20 relative z-10 px-6">
                    <div className="bg-white rounded-[2.5rem] shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] p-8 pb-10 flex flex-col items-center text-center border border-slate-50">
                        <div className="w-12 h-1.5 bg-slate-100 rounded-full mb-8"></div>
                        
                        <h1 className="text-3xl font-bold text-slate-900 mb-4 leading-tight">
                            {siteData.heroHeadline}
                        </h1>
                        <p className="text-slate-500 text-base font-light leading-relaxed mb-8">
                            {siteData.heroSubheadline}
                        </p>
                        
                        <div className="w-full space-y-4 mt-auto">
                            <Button 
                                onClick={handleActionClick}
                                className="w-full h-14 text-lg rounded-2xl shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all duration-300 font-bold"
                                style={{ backgroundColor: siteData.primaryColor }}
                            >
                                {siteData.buttonText}
                            </Button>
                            
                            {/* Trust Badges */}
                            <div className="flex justify-center gap-4 py-4 opacity-60 grayscale">
                                <div className="flex items-center gap-1 text-[10px] text-slate-400">
                                    <MapPin className="w-3 h-3" /> สาขาใกล้คุณ
                                </div>
                                <div className="flex items-center gap-1 text-[10px] text-slate-400">
                                    <Phone className="w-3 h-3" /> ติดต่อง่าย
                                </div>
                            </div>
                        </div>
                    </div>
               </div>
          </div>
      )}

      {/* ================= FLOATING CHECKOUT BAR (Retail Only) ================= */}
      {isEcommerce && cartCount > 0 && (
        <div className="fixed bottom-20 left-4 right-4 z-40 animate-in slide-in-from-bottom-10 duration-500">
             <div className="bg-slate-900/95 backdrop-blur text-white p-3 pr-4 rounded-2xl shadow-2xl flex items-center justify-between ring-1 ring-white/10">
                 <div className="flex items-center gap-3">
                     <div className="bg-white text-slate-900 w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg shadow-inner">
                         {cartCount}
                     </div>
                     <div className="flex flex-col">
                         <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Total</span>
                         <span className="font-bold text-lg leading-none">฿{cartTotal.toLocaleString()}</span>
                     </div>
                 </div>
                 <Button 
                    onClick={handleActionClick}
                    className="bg-white text-slate-900 hover:bg-slate-100 rounded-xl px-6 h-10 font-bold"
                 >
                    ชำระเงิน
                 </Button>
             </div>
        </div>
      )}

      {/* ================= BOTTOM NAV (App Style) ================= */}
      {isEcommerce && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 h-[70px] pb-safe-bottom z-50 flex justify-around items-center text-[10px] font-medium text-slate-400 shadow-[0_-5px_20px_rgba(0,0,0,0.02)]">
            <button className="flex flex-col items-center gap-1.5 p-2 text-slate-900">
                <Home className="w-5 h-5" />
                หน้าหลัก
            </button>
            <button className="flex flex-col items-center gap-1.5 p-2 hover:text-slate-600">
                <Search className="w-5 h-5" />
                ค้นหา
            </button>
            <button className="flex flex-col items-center gap-1.5 p-2 hover:text-slate-600 relative" onClick={handleActionClick}>
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>}
                ตะกร้า
            </button>
            <button className="flex flex-col items-center gap-1.5 p-2 hover:text-slate-600">
                <User className="w-5 h-5" />
                สมาชิก
            </button>
        </nav>
      )}

      {/* ================= PDPA DRAWER (The Hook) ================= */}
      <Drawer open={isPdpaOpen} onOpenChange={setIsPdpaOpen}>
        <DrawerContent className="rounded-t-[2rem] max-h-[90vh]">
            <div className="mx-auto w-full max-w-sm">
                <DrawerHeader className="text-center pt-8 pb-4">
                    <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <User className="w-6 h-6" />
                    </div>
                    <DrawerTitle className="text-2xl font-bold mb-2 text-slate-900">เชื่อมต่อสมาชิก</DrawerTitle>
                    <DrawerDescription className="text-slate-500">
                        เพื่อรับสิทธิพิเศษและติดตามสถานะ {isEcommerce ? 'การสั่งซื้อ' : 'การจอง'} ผ่าน LINE
                    </DrawerDescription>
                </DrawerHeader>
                
                <div className="p-4 px-6 space-y-6">
                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                         <p className="text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">PDPA Consent</p>
                         <p className="text-sm text-slate-600 leading-relaxed font-light">
                            "{siteData?.pdpaText}"
                         </p>
                    </div>
                    
                    <div className="flex items-start space-x-3 p-2 animate-pulse-once">
                        <Checkbox 
                            id="terms" 
                            checked={consentGiven}
                            onCheckedChange={(c) => setConsentGiven(c === true)}
                            className="w-5 h-5 border-2 mt-0.5 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                        />
                        <div className="grid gap-1.5 leading-none">
                            <label
                                htmlFor="terms"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-slate-900"
                            >
                                ฉันยอมรับข้อกำหนดและเงื่อนไข
                            </label>
                            <p className="text-xs text-slate-400">
                                การกดดำเนินการต่อ ถือว่าท่านยอมรับนโยบายความเป็นส่วนตัว
                            </p>
                        </div>
                    </div>
                </div>

                <DrawerFooter className="pb-8 px-6 pt-2">
                    <Button 
                        onClick={handleConfirmConnect}
                        disabled={!consentGiven}
                        className="w-full h-14 text-lg rounded-xl font-bold shadow-lg transition-all"
                        style={{ backgroundColor: consentGiven ? '#00B900' : '#E2E8F0', color: consentGiven ? 'white' : '#94A3B8' }}
                    >
                        ยืนยันด้วย LINE
                    </Button>
                    <DrawerClose asChild>
                        <Button variant="ghost" className="rounded-xl h-12 text-slate-400 hover:text-slate-600">ยกเลิก</Button>
                    </DrawerClose>
                </DrawerFooter>
            </div>
        </DrawerContent>
      </Drawer>

    </div>
  );
}