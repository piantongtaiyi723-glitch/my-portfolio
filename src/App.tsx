/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, AnimatePresence } from "motion/react";
import { 
  ShoppingBag, 
  Plus, 
  Minus, 
  ChevronRight, 
  Clock, 
  MapPin, 
  Phone,
  Utensils,
  X,
  CheckCircle2,
  Info,
  MessageCircle,
  Send,
  Loader2,
  Leaf,
  Heart,
  ShieldCheck,
  Star
} from "lucide-react";
import { useState, useMemo, useRef, useEffect } from "react";
import { GoogleGenAI } from "@google/genai";

// Initialize Gemini AI
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const CHAT_MODEL = "gemini-3-flash-preview";

// Mock Data
const CATEGORIES = ["人氣精選", "阿爸私房菜", "單點小菜", "飲品"];

const PRODUCTS = [
  { id: 1, name: "招牌烤肉便當", price: 120, category: "人氣精選", image: "https://picsum.photos/seed/bbq/400/300", description: "特選梅花豬肉，搭配阿爸秘製醬汁火烤而成。", nutrition: { cal: 650, protein: 35, carbs: 70, fat: 22 } },
  { id: 2, name: "醬燒雞腿便當", price: 135, category: "人氣精選", image: "https://picsum.photos/seed/chicken/400/300", description: "整隻去骨大雞腿，慢火醬燒至入味。", nutrition: { cal: 580, protein: 42, carbs: 65, fat: 18 } },
  { id: 3, name: "酥炸排骨便當", price: 115, category: "阿爸私房菜", image: "https://picsum.photos/seed/pork/400/300", description: "經典台式炸排骨，外酥內嫩，厚實多汁。", nutrition: { cal: 720, protein: 30, carbs: 85, fat: 28 } },
  { id: 4, name: "古早味滷肉飯", price: 45, category: "阿爸私房菜", image: "https://picsum.photos/seed/minced/400/300", description: "肥而不膩的手切滷肉，淋在香噴噴的白飯上。", nutrition: { cal: 450, protein: 15, carbs: 60, fat: 18 } },
  { id: 5, name: "燙青菜", price: 40, category: "單點小菜", image: "https://picsum.photos/seed/veg/400/300", description: "時令鮮蔬，淋上特製蔥油。", nutrition: { cal: 80, protein: 3, carbs: 8, fat: 4 } },
  { id: 6, name: "阿爸特製滷蛋", price: 15, category: "單點小菜", image: "https://picsum.photos/seed/egg/400/300", description: "入味十足的古早味滷蛋。", nutrition: { cal: 75, protein: 7, carbs: 1, fat: 5 } },
  { id: 7, name: "古早味紅茶", price: 25, category: "飲品", image: "https://picsum.photos/seed/tea/400/300", description: "決明子香氣，微甜解膩。", nutrition: { cal: 120, protein: 0, carbs: 30, fat: 0 } },
  { id: 8, name: "冷泡烏龍茶", price: 35, category: "飲品", image: "https://picsum.photos/seed/oolong/400/300", description: "無糖清爽，回甘不澀。", nutrition: { cal: 0, protein: 0, carbs: 0, fat: 0 } },
];

export default function App() {
  const [cart, setCart] = useState<{ [key: number]: number }>({});
  const [activeCategory, setActiveCategory] = useState("人氣精選");
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutComplete, setIsCheckoutComplete] = useState(false);
  
  // AI Chat State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ role: "user" | "ai", text: string }[]>([
    { role: "ai", text: "您好！我是阿爸的家園 AI 助手，有什麼我可以幫您的嗎？您可以詢問菜單推薦或營業資訊喔！" }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleSendMessage = async () => {
    if (!chatInput.trim() || isChatLoading) return;

    const userMessage = chatInput.trim();
    setChatInput("");
    setChatMessages(prev => [...prev, { role: "user", text: userMessage }]);
    setIsChatLoading(true);

    try {
      const systemInstruction = `
        你是一位「阿爸的家園」便當店的親切 AI 客服。
        店名：阿爸的家園
        特色：家常口味、秘製醬汁、古早味。
        菜單資訊：
        - 招牌烤肉便當 ($120): 特選梅花豬，秘製醬汁。
        - 醬燒雞腿便當 ($135): 去骨大雞腿。
        - 酥炸排骨便當 ($115): 台式經典。
        - 古早味滷肉飯 ($45): 手切滷肉。
        - 燙青菜 ($40), 滷蛋 ($15), 紅茶 ($25), 烏龍茶 ($35)。
        營業時間：11:00 - 20:00
        地址：台北市中正區 (具體地址待定)
        請用繁體中文回答，口氣要像鄰家阿爸一樣親切、熱情。
        如果使用者問到訂單狀態，請告知目前系統僅支援線上點餐，請耐心等候取餐。
      `;

      const response = await ai.models.generateContent({
        model: CHAT_MODEL,
        contents: [...chatMessages.map(m => ({ role: m.role === "user" ? "user" : "model", parts: [{ text: m.text }] })), { role: "user", parts: [{ text: userMessage }] }],
        config: {
          systemInstruction,
          temperature: 0.7,
        }
      });

      const aiText = response.text || "抱歉，我現在有點忙，請稍後再問我。";
      setChatMessages(prev => [...prev, { role: "ai", text: aiText }]);
    } catch (error) {
      console.error("AI Chat Error:", error);
      setChatMessages(prev => [...prev, { role: "ai", text: "哎呀，網路好像有點卡住，請再試一次！" }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const cartItems = useMemo(() => {
    return Object.entries(cart).map(([id, quantity]) => {
      const product = PRODUCTS.find(p => p.id === Number(id));
      if (!product) return null;
      return { ...product, quantity };
    }).filter((item): item is (typeof PRODUCTS[0] & { quantity: number }) => item !== null);
  }, [cart]);

  const totalPrice = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0);
  }, [cartItems]);

  const totalQuantity = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0);
  }, [cartItems]);

  const updateCart = (id: number, delta: number) => {
    setCart(prev => ({
      ...prev,
      [id]: Math.max(0, (prev[id] || 0) + delta)
    }));
  };

  const handleCheckout = () => {
    setIsCheckoutComplete(true);
    setCart({});
    setTimeout(() => {
      setIsCheckoutComplete(false);
      setIsCartOpen(false);
    }, 3000);
  };

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-brand-primary rounded-2xl flex items-center justify-center text-white">
                <Utensils className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-2xl font-serif font-black text-brand-primary">阿爸的家園</h1>
                <p className="text-[10px] font-bold text-brand-secondary uppercase tracking-widest -mt-1">Healthy Nutrition Center</p>
                <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> 11:00 - 20:00</span>
                  <span className="w-1 h-1 bg-gray-300 rounded-full" />
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> 台北市中正區...</span>
                </div>
              </div>
            </div>
            <button className="p-2 text-gray-400 hover:text-brand-primary transition-colors">
              <Info className="w-6 h-6" />
            </button>
          </div>

          {/* Category Tabs */}
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide no-scrollbar">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-bold transition-all ${
                  activeCategory === cat 
                    ? "bg-brand-primary text-white shadow-md" 
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Product List */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Health Philosophy Banner */}
        <section className="mb-12 bg-brand-secondary/5 rounded-[32px] p-8 border border-brand-secondary/10 flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-secondary/10 text-brand-secondary text-[10px] font-bold uppercase tracking-widest">
              <Leaf className="w-3 h-3" />
              健康理念
            </div>
            <h2 className="text-3xl font-serif font-bold text-brand-secondary">吃得健康，<br />是我們對家人的承諾。</h2>
            <p className="text-gray-600 leading-relaxed">
              「阿爸的家園」不僅是便當店，更是您的健康營養中心。我們堅持低油、低鹽、無添加，選用在地小農食材，為您守護每一口的純粹。
            </p>
            <div className="flex gap-6 pt-2">
              <div className="flex items-center gap-2 text-sm font-bold text-gray-700">
                <ShieldCheck className="w-5 h-5 text-brand-secondary" />
                食安把關
              </div>
              <div className="flex items-center gap-2 text-sm font-bold text-gray-700">
                <Heart className="w-5 h-5 text-red-400" />
                營養均衡
              </div>
            </div>
          </div>
          <div className="w-full md:w-64 h-64 rounded-3xl overflow-hidden shadow-xl">
            <img src="https://picsum.photos/seed/healthy/500/500" alt="Healthy Food" className="w-full h-full object-cover" />
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {PRODUCTS.filter(p => p.category === activeCategory).map(product => (
            <motion.div
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              key={product.id}
              className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 flex flex-col"
            >
              <div className="relative h-48">
                <img 
                  src={product.image} 
                  alt={product.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-bold text-brand-primary shadow-sm">
                  ${product.price}
                </div>
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <h3 className="text-xl font-serif font-bold mb-2">{product.name}</h3>
                <p className="text-gray-500 text-sm mb-4 flex-1">{product.description}</p>
                
                {/* Nutritional Info */}
                {product.nutrition && (
                  <div className="flex gap-3 mb-6">
                    <div className="flex flex-col items-center bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">
                      <span className="text-[10px] text-gray-400 font-bold uppercase">熱量</span>
                      <span className="text-xs font-black text-brand-primary">{product.nutrition.cal}kcal</span>
                    </div>
                    <div className="flex flex-col items-center bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">
                      <span className="text-[10px] text-gray-400 font-bold uppercase">蛋白質</span>
                      <span className="text-xs font-black text-brand-secondary">{product.nutrition.protein}g</span>
                    </div>
                    <div className="flex flex-col items-center bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">
                      <span className="text-[10px] text-gray-400 font-bold uppercase">碳水</span>
                      <span className="text-xs font-black text-brand-accent">{product.nutrition.carbs}g</span>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center justify-between mt-auto">
                  {(cart[product.id] || 0) > 0 ? (
                    <div className="flex items-center gap-4 bg-gray-100 rounded-full px-2 py-1">
                      <button 
                        onClick={() => updateCart(product.id, -1)}
                        className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-brand-primary shadow-sm hover:bg-gray-50"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="font-bold w-4 text-center">{cart[product.id]}</span>
                      <button 
                        onClick={() => updateCart(product.id, 1)}
                        className="w-8 h-8 bg-brand-primary rounded-full flex items-center justify-center text-white shadow-sm hover:bg-brand-accent"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => updateCart(product.id, 1)}
                      className="w-full bg-brand-primary text-white py-3 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-brand-accent transition-all"
                    >
                      <Plus className="w-5 h-5" />
                      加入購物車
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Featured Ingredients */}
        <section className="mt-20 mb-12">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-serif font-bold mb-2">嚴選在地食材</h2>
            <p className="text-gray-500 text-sm">我們相信好的料理始於好的食材</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: "台東池上米", desc: "粒粒飽滿，香 Q 有勁", icon: "🌾" },
              { name: "在地小農時蔬", desc: "每日鮮採，產地直送", icon: "🥬" },
              { name: "溫體梅花豬", desc: "肉質鮮嫩，無腥味", icon: "🥩" },
              { name: "天然釀造醬油", desc: "古法釀造，甘醇回味", icon: "🍶" },
            ].map((item, i) => (
              <div key={i} className="bg-white p-6 rounded-3xl border border-gray-100 text-center space-y-3 hover:shadow-md transition-shadow">
                <div className="text-3xl">{item.icon}</div>
                <h4 className="font-bold text-brand-primary">{item.name}</h4>
                <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Testimonials */}
        <section className="mb-20">
          <div className="bg-brand-primary/5 rounded-[40px] p-10 border border-brand-primary/10">
            <div className="flex items-center gap-2 mb-6">
              {[1, 2, 3, 4, 5].map(i => <Star key={i} className="w-4 h-4 fill-brand-accent text-brand-accent" />)}
              <span className="text-xs font-bold text-brand-primary ml-2">超過 1,000+ 位顧客的好評</span>
            </div>
            <p className="text-xl font-serif italic text-gray-700 leading-relaxed mb-6">
              「自從開始吃阿爸的便當，身體感覺輕盈多了。不像一般的便當店那麼油膩，這裡的菜色很有家的感覺，營養標示也讓我吃得很安心。」
            </p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-brand-primary/20 flex items-center justify-center font-bold text-brand-primary">L</div>
              <div>
                <p className="text-sm font-bold">林小姐</p>
                <p className="text-xs text-gray-500">上班族 / 健身愛好者</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 pt-16 pb-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-16">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-brand-primary rounded-lg flex items-center justify-center text-white">
                  <Utensils className="w-5 h-5" />
                </div>
                <span className="text-xl font-serif font-black text-brand-primary">阿爸的家園</span>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed">
                致力於提供最健康、最溫馨的家常料理。我們相信良好的營養是幸福生活的基石。
              </p>
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:text-brand-primary transition-colors cursor-pointer">
                  <Phone className="w-4 h-4" />
                </div>
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:text-brand-primary transition-colors cursor-pointer">
                  <MapPin className="w-4 h-4" />
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-bold mb-6">快速連結</h4>
              <ul className="space-y-4 text-sm text-gray-500">
                <li className="hover:text-brand-primary cursor-pointer transition-colors">關於我們</li>
                <li className="hover:text-brand-primary cursor-pointer transition-colors">營養資訊</li>
                <li className="hover:text-brand-primary cursor-pointer transition-colors">食材來源</li>
                <li className="hover:text-brand-primary cursor-pointer transition-colors">常見問題</li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-6">營業資訊</h4>
              <ul className="space-y-4 text-sm text-gray-500">
                <li className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-brand-secondary" />
                  週一至週五: 11:00 - 20:00
                </li>
                <li className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-brand-secondary" />
                  週六至週日: 11:30 - 19:30
                </li>
                <li className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-brand-secondary mt-1" />
                  台北市中正區羅斯福路...
                </li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-gray-100 text-center text-xs text-gray-400">
            <p>© 2026 阿爸的家園 Healthy Nutrition Center. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Floating Cart Button */}
      <AnimatePresence>
        {totalQuantity > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-8 left-0 right-0 px-4 z-40"
          >
            <button 
              onClick={() => setIsCartOpen(true)}
              className="max-w-md mx-auto w-full bg-brand-primary text-white h-16 rounded-2xl shadow-2xl flex items-center justify-between px-6 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <ShoppingBag className="w-6 h-6" />
                  <span className="absolute -top-2 -right-2 bg-brand-accent text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-brand-primary">
                    {totalQuantity}
                  </span>
                </div>
                <span className="font-bold">查看購物車</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-serif font-black">${totalPrice}</span>
                <ChevronRight className="w-5 h-5 opacity-50" />
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cart Drawer */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[40px] z-50 max-h-[90vh] overflow-hidden flex flex-col"
            >
              <div className="p-8 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-2xl font-serif font-bold">您的訂單</h2>
                <button 
                  onClick={() => setIsCartOpen(false)}
                  className="p-2 bg-gray-100 rounded-full text-gray-500"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-6">
                {isCheckoutComplete ? (
                  <div className="text-center py-12 space-y-4">
                    <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-12 h-12" />
                    </div>
                    <h3 className="text-2xl font-serif font-bold">訂單已送出！</h3>
                    <p className="text-gray-500">請於預計時間前往門市取餐。</p>
                  </div>
                ) : (
                  <>
                    {cartItems.map(item => (
                      <div key={item.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gray-100">
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <h4 className="font-bold">{item.name}</h4>
                            <p className="text-sm text-gray-500">${item.price} x {item.quantity}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => updateCart(item.id!, -1)}
                            className="w-8 h-8 border border-gray-200 rounded-lg flex items-center justify-center text-gray-400"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="font-bold w-4 text-center">{item.quantity}</span>
                          <button 
                            onClick={() => updateCart(item.id!, 1)}
                            className="w-8 h-8 bg-brand-primary rounded-lg flex items-center justify-center text-white"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}

                    <div className="pt-6 border-t border-gray-100 space-y-4">
                      <div className="flex justify-between text-gray-500">
                        <span>小計</span>
                        <span>${totalPrice}</span>
                      </div>
                      <div className="flex justify-between text-gray-500">
                        <span>外送費 (自取)</span>
                        <span>$0</span>
                      </div>
                      <div className="flex justify-between text-2xl font-serif font-black text-brand-primary pt-2">
                        <span>總計</span>
                        <span>${totalPrice}</span>
                      </div>
                    </div>

                    <div className="space-y-4 pt-4">
                      <div className="bg-brand-bg p-4 rounded-2xl border border-brand-primary/10">
                        <label className="block text-xs font-bold text-brand-primary uppercase tracking-widest mb-2">取餐時間</label>
                        <select className="w-full bg-transparent font-bold outline-none">
                          <option>儘快取餐 (約 15-20 分鐘)</option>
                          <option>12:00</option>
                          <option>12:30</option>
                          <option>13:00</option>
                        </select>
                      </div>
                      <div className="bg-brand-bg p-4 rounded-2xl border border-brand-primary/10">
                        <label className="block text-xs font-bold text-brand-primary uppercase tracking-widest mb-2">聯絡電話</label>
                        <input type="tel" placeholder="請輸入您的電話" className="w-full bg-transparent font-bold outline-none" />
                      </div>
                    </div>
                  </>
                )}
              </div>

              {!isCheckoutComplete && (
                <div className="p-8 bg-gray-50">
                  <button 
                    onClick={handleCheckout}
                    className="w-full bg-brand-primary text-white py-5 rounded-2xl text-xl font-bold shadow-xl hover:bg-brand-accent transition-all"
                  >
                    確認下單
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* AI Chat Toggle */}
      <button 
        onClick={() => setIsChatOpen(true)}
        className="fixed bottom-8 right-8 w-14 h-14 bg-brand-secondary text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-40"
      >
        <MessageCircle className="w-7 h-7" />
      </button>

      {/* AI Chat Window */}
      <AnimatePresence>
        {isChatOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-24 right-8 w-[350px] h-[500px] bg-white rounded-3xl shadow-2xl z-50 flex flex-col border border-gray-100 overflow-hidden"
          >
            <div className="p-4 bg-brand-secondary text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <Utensils className="w-5 h-5" />
                </div>
                <span className="font-bold">阿爸的 AI 助手</span>
              </div>
              <button onClick={() => setIsChatOpen(false)} className="p-1 hover:bg-white/10 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {chatMessages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                    m.role === "user" 
                      ? "bg-brand-primary text-white rounded-tr-none" 
                      : "bg-white text-gray-800 shadow-sm border border-gray-100 rounded-tl-none"
                  }`}>
                    {m.text}
                  </div>
                </div>
              ))}
              {isChatLoading && (
                <div className="flex justify-start">
                  <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 rounded-tl-none">
                    <Loader2 className="w-4 h-4 animate-spin text-brand-secondary" />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="p-4 border-t border-gray-100 bg-white">
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  placeholder="想問什麼呢？"
                  className="flex-1 bg-gray-100 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-secondary/20"
                />
                <button 
                  onClick={handleSendMessage}
                  disabled={isChatLoading}
                  className="w-10 h-10 bg-brand-secondary text-white rounded-xl flex items-center justify-center disabled:opacity-50"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
