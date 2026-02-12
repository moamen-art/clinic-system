import { supabase } from './supabaseClient';
import { useState, useEffect } from "react";
import { 
 Stethoscope, 
  LayoutDashboard, 
  ArrowRight, 
  CheckCircle2, 
  LogOut, 
  CreditCard, 
  Camera, 
  ChevronRight, 
  Search, 
  Printer,
  UserCircle, 
  FileText 
} from "lucide-react";
import { PaymentMethodSelector } from "./components/PaymentMethodSelector";
import { doctors } from "./data/doctors";
import { users as initialUsers } from "./data/users";

const timeSlots = ["10:00 صباحاً", "12:00 ظهراً", "02:00 مساءً", "04:00 مساءً", "06:00 مساءً", "08:00 مساءً"];

export default function App() {
 // 1. تحديث الحالة لتشمل صفحة 
const [view, setView] = useState<'login' | 'signup' | 'home' | 'admin' | 'doctor'>('login');
const [allUsers, setAllUsers] = useState(initialUsers);
  const [appointments, setAppointments] = useState<any[]>([]);
  // جلب البيانات من Supabase عند تشغيل التطبيق
  useEffect(() => {
    const fetchAppointments = async () => {
      const { data, error } = await supabase
        .from('appointments') // اسم الجدول اللي عملناه في الموقع
        .select('*')
        .order('id', { ascending: true });
      
      if (error) {
        console.error('Error fetching:', error);
      } else if (data) {
        setAppointments(data);
      }
    };

    fetchAppointments();
  }, []);
// 2. دالة لتحديث بيانات المريض (التشخيص والروشتة) في السيرفر
  const updatePatientRecord = async (id: number, diagnosis: string, meds: string) => {
    // تحديث البيانات في قاعدة بيانات Supabase
    const { error } = await supabase
      .from('appointments')
      .update({ 
        diagnosis: diagnosis, 
        meds: meds, 
        status: "تم الكشف",
        deposit: 200, // <--- هو ده الجاني! غير الـ 200 دي لـ 100
      status: 'انتظار'
      })
      .eq('id', id); // الربط عن طريق رقم تعريف المريض

    if (error) {
      alert("❌ حدث خطأ أثناء الحفظ في السيرفر: " + error.message);
    } else {
      // تحديث الحالة في الواجهة الأمامية فوراً لضمان سرعة العرض
      setAppointments(prev => prev.map(app => 
        app.id === id ? { ...app, status: "تم الكشف", diagnosis, meds, deposit: 200 } : app
      ));
      alert("✅ تم حفظ الروشتة وتحديث الحسابات في قاعدة البيانات بنجاح");
    }
  };
  // States بيانات المريض
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState(""); 
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [selectedTime, setSelectedTime] = useState("");
  const [method, setMethod] = useState<'visa' | 'wallet' | null>(null);
  const [receiptUploaded, setReceiptUploaded] = useState(false);
  
  // State البحث للأدمن (تم إصلاح موقعه لمنع الشاشة البيضاء)
  const [searchTerm, setSearchTerm] = useState(""); 

  // States بيانات الفيزا
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCVC, setCardCVC] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const doctorSecretCode = "DOC2026";
    const form = e.currentTarget as HTMLFormElement;
   // تأكد أن الاسم هنا مطابق للاسم اللي حطيناه تحت
const enteredCode = (form.elements.namedItem('loginDocCode') as HTMLInputElement)?.value;

    const user = allUsers.find(u => u.email === email && u.password === password);
    
    if (user) {
      setCurrentUser(user);
      // التوجيه الذكي: لو الكود صح أو الرتبة دكتور يدخل واجهة الدكتور
      if (user.role === 'admin') setView('admin');
      else if (user.role === 'doctor' || enteredCode === doctorSecretCode) setView('doctor');
      else setView('home');
    } else {
      alert("⚠️ بيانات الدخول غير صحيحة! تأكد من الإيميل والباسورد.");
    }
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    const newUser = { email, password, name, role: 'patient' as const };
    setAllUsers([...allUsers, newUser]);
    setCurrentUser(newUser);
    setView('home');
  };

  const processBooking = async () => {
    if (method === 'visa') {
      if (!cardNumber.trim() || !cardExpiry.trim() || !cardCVC.trim()) {
        alert("⚠️ يرجى إدخال بيانات الفيزا كاملة!");
        return; 
      }
    }
    if (method === 'wallet' && !receiptUploaded) {
      alert("⚠️ يرجى إرفاق صورة الإيصال أولاً!");
      return;
    }

   // 1. تجهيز بيانات المريض الجديد
    const newAppointmentData = {
      patientName: currentUser.name,
      doctorName: selectedDoctor.name,
      time: selectedTime,
      date: new Date().toLocaleDateString('ar-EG'),
      status: "انتظار",
      deposit: 100
    };

    // 2. إرسال البيانات للسيرفر (Supabase)
    const { data, error } = await supabase
      .from('appointments')
      .insert([newAppointmentData])
      .select();

    if (error) {
      alert("❌ عذراً، تعذر تسجيل الحجز في السيرفر: " + error.message);
    } else if (data) {
      // 3. تحديث الشاشة فوراً بالبيانات اللي رجعت من السيرفر (شاملة الـ ID)
      setAppointments([...appointments, data[0]]);
      setView('success');
      alert("✅ تم تسجيل حجزك بنجاح في قاعدة البيانات");
    }
  };

  // --- واجهة الأدمن (Admin View) ---
  if (view === 'admin') {
    const depositAmount = 100;
    const fullFee = 200;
   // 1. حساب إجمالي المبالغ المحصلة فعلياً (عربون + كشوفات كاملة)
  const totalDeposits = appointments.reduce((sum, app) => sum + (app.deposit || 0), 0);

  // 2. حساب إجمالي الإيراد المتوقع (عدد الحالات × 200 جنيه)
  const totalPotentialRevenue = appointments.length * 200;

  // 3. حساب المبلغ المتبقي (الفرق بين المتوقع والمحصل)
  const remaining = totalPotentialRevenue - totalDeposits;
    const collectionRate = totalPotentialRevenue > 0 ? Math.round((totalDeposits / totalPotentialRevenue) * 100) : 0;

    const filteredApps = appointments.filter(app => 
      app.patientName.includes(searchTerm) || app.doctorName.includes(searchTerm)
    );

    return (
      <div className="min-h-screen bg-slate-50 text-right font-sans" dir="rtl">
        <style>{`@media print { .no-print { display: none !important; } .print-only { display: block !important; } }`}</style>
        
        <nav className="bg-slate-900 text-white p-4 flex justify-between px-8 shadow-lg items-center no-print">
          <div className="font-bold flex items-center gap-2 text-xl">
            <LayoutDashboard className="text-blue-400" /> لوحة الإدارة
          </div>
          <button onClick={() => setView('login')} className="flex items-center gap-2 text-red-400 bg-white/10 px-4 py-2 rounded-xl border border-white/10">
            <LogOut className="w-4 h-4" /> خروج
          </button>
        </nav>

        <main className="p-8 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10 no-print">
            <div className="bg-white p-6 rounded-[2.5rem] shadow-sm flex flex-col items-center justify-center border-t-4 border-blue-600">
              <p className="text-slate-400 text-[10px] font-black mb-3">نسبة التحصيل</p>
              <div className="relative w-16 h-16">
                <svg className="w-full h-full" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#f1f5f9" strokeWidth="4" />
                  <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#2563eb" strokeWidth="4" strokeDasharray={`${collectionRate}, 100`} strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center font-black text-blue-700 text-xs">{collectionRate}%</div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-green-600 to-green-700 p-6 rounded-[2.5rem] text-white shadow-xl shadow-green-100">
              <p className="text-green-100 text-xs font-bold mb-1">المُحصل (عربون)</p>
              <h3 className="text-2xl font-black">{totalDeposits} ج.م</h3>
            </div>
            <div className="bg-white p-6 rounded-[2.5rem] border shadow-sm">
              <p className="text-slate-400 text-xs font-bold mb-1">متبقي كاش</p>
              <h3 className="text-2xl font-black text-orange-600">{remaining} ج.م</h3>
            </div>
            <div className="bg-slate-900 p-6 rounded-[2.5rem] text-white shadow-xl shadow-slate-700">
              <p className="text-blue-300 text-xs font-bold mb-1">إجمالي الدخل المتوقع</p>
              <h3 className="text-2xl font-black">{totalPotentialRevenue} ج.م</h3>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 no-print text-right">
            <div className="relative w-full md:w-1/3 text-right">
              <input 
                type="text" 
                placeholder="ابحث باسم المريض أو الدكتور..." 
                className="w-full p-4 pr-12 rounded-2xl border outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search className="absolute right-4 top-4 text-slate-400 w-5 h-5" />
            </div>
            <button onClick={() => window.print()} className="flex items-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-2xl font-black shadow-lg hover:bg-blue-700 transition-all">
              <Printer className="w-5 h-5" /> طباعة تقرير الحجوزات
            </button>
          </div>

          <div className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100">
            <table className="w-full text-right">
              <thead className="bg-slate-50 text-slate-500 border-b">
                <tr>
                  <th className="p-6 text-xs font-black text-right">اختيار</th>
                  <th className="p-6 text-xs font-black">المريض</th>
                  <th className="p-6 text-xs font-black text-center">الطبيب</th>
                  <th className="p-6 text-xs font-black text-center">الموعد</th>
                  <th className="p-6 text-xs font-black text-center">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredApps.map(app => (
                  <tr key={app.id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="p-6 text-center">
  <input type="checkbox" className="w-5 h-5 rounded-lg border-2 border-slate-200 text-blue-600 focus:ring-blue-500 transition-all cursor-pointer" />
</td>
                    <td className="p-6 font-bold text-slate-700">{app.patientName}</td>
                    <td className="p-6 text-center text-blue-600 font-bold">{app.doctorName}</td>
                    <td className="p-6 text-center text-slate-500 text-sm font-bold">{app.date} - {app.time}</td>
                    <td className="p-6 text-center">
                   <td className="p-6 text-center">
  <div className="flex flex-col items-center gap-2">
    <span className={`px-3 py-1 rounded-full text-[10px] font-black no-print ${
      app.status === 'تم الكشف' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
    }`}>
      {app.status}
    </span>

    {app.status === "تم الكشف" && (
      <div className="flex flex-col items-center gap-2">
        <button 
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-[10px] font-black hover:bg-blue-100 no-print"
        >
          <Printer size={12} />
          طباعة الروشتة الرسمية
        </button>

        {/* --- بداية الروشتة الرسمية الكاملة --- */}
        <div className="hidden print:block fixed inset-0 bg-white p-10 text-right dir-rtl z-[9999]">
         {/* هيدر العيادة المحدث */}
          <div className="border-b-4 border-blue-600 pb-4 mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-black text-blue-800">عيادتي</h1>
              <p className="text-lg font-bold text-slate-600">نظام إدارة العيادات المتكامل</p>
            </div>
            <div className="text-left">
              <p className="font-bold text-blue-600">التاريخ: {app.date}</p>
              <p className="font-bold text-blue-600">الموعد: {app.time}</p>
            </div>
          </div>

          {/* بيانات الدكتور المحدثة حسب تخصصاتهم */}
          <div className="grid grid-cols-2 gap-8 mb-10 bg-slate-50 p-6 rounded-2xl border-2 border-slate-100 text-right">
            <div>
              <p className="text-blue-600 font-black mb-2 text-sm">بيانات الطبيب المعالج:</p>
              <p className="text-xl font-bold text-slate-800 uppercase">د. {app.doctorName}</p>
              <p className="text-md font-bold text-slate-500 italic">
                {app.doctorName.includes("أحمد") ? "استشاري جراحة الأوعية الدموية" : 
                 app.doctorName.includes("سارة") ? "أخصائي تخاطب وتعديل سلوك أطفال" : 
                 "استشاري نظم المعلومات الطبية"}
              </p>
            </div>
            <div className="border-r-2 border-slate-200 pr-8">
              <p className="text-blue-600 font-black mb-2 text-sm">بيانات المريض:</p>
              <p className="text-xl font-bold text-slate-800">{app.patientName}</p>
              <p className="text-md font-bold text-slate-500">رقم السجل: #{app.id.toString().slice(-4)}</p>
            </div>
          </div>

          {/* التقرير الطبي والروشتة */}
          <div className="space-y-8 min-h-[400px]">
            <div className="bg-white border-2 border-blue-100 p-6 rounded-2xl relative">
              <span className="absolute -top-4 right-6 bg-blue-600 text-white px-4 py-1 rounded-full font-black text-sm">التشخيص الطبي</span>
              <p className="text-xl text-slate-700 leading-relaxed pt-2">{app.diagnosis || 'لم يتم تسجيل تشخيص'}</p>
            </div>

            <div className="bg-white border-2 border-emerald-100 p-6 rounded-2xl relative">
              <span className="absolute -top-4 right-6 bg-emerald-600 text-white px-4 py-1 rounded-full font-black text-sm">العلاج والروشتة (Rx)</span>
              <p className="text-xl font-bold text-slate-800 leading-relaxed pt-2 whitespace-pre-line">{app.meds || 'لم يتم تسجيل أدوية'}</p>
            </div>
          </div>

          {/* الفوتر */}
          <div className="mt-20 border-t-2 border-slate-100 pt-6 text-center text-slate-400 font-bold">
          </div>
        </div>
        {/* --- نهاية الروشتة الرسمية --- */}
      </div>
    )}
  </div>
</td>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    );
  }
// --- واجهة الدكتور الاحترافية (الخطوة الثالثة) ---
  if (view === 'doctor') {
    // تصفية المرضى الذين حجزوا مع هذا الطبيب فقط
    const myPatients = appointments.filter(a => 
  currentUser?.name && a.doctorName.includes(currentUser.name)
);
    const completed = myPatients.filter(p => p.status === "تم الكشف").length;
    const remaining = myPatients.length - completed;

    return (
      <div className="min-h-screen bg-slate-50 text-right font-sans" dir="rtl">
        {/* الهيدر العلوي */}
        <nav className="bg-slate-900 text-white p-5 flex justify-between px-10 shadow-xl items-center no-print">
          <div className="font-bold flex items-center gap-3 text-2xl italic underline decoration-blue-400">
            <UserCircle className="text-blue-400 w-8 h-8" /> دكتور/ {currentUser?.name}
          </div>
          <button onClick={() => setView('login')} className="bg-red-500/20 text-red-300 px-6 py-2 rounded-2xl border border-red-500/30">خروج</button>
        </nav>

        <main className="p-10 max-w-6xl mx-auto">
          {/* الإحصائيات العلوية */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10 no-print">
            <div className="bg-blue-600 text-white p-8 rounded-[3rem] shadow-xl text-center font-bold italic">
              <p className="text-sm opacity-80 mb-2">إجمالي حالات اليوم</p>
              <h3 className="text-4xl">{myPatients.length}</h3>
            </div>
            <div className="bg-orange-500 text-white p-8 rounded-[3rem] shadow-xl text-center font-bold italic">
              <p className="text-sm opacity-80 mb-2">الحالات المتبقية للكشف</p>
              <h3 className="text-4xl">{remaining}</h3>
            </div>
          </div>

          <h2 className="text-3xl font-black text-slate-800 border-r-8 border-blue-600 pr-5 mb-10 italic no-print">كشوفات المرضى اليومية</h2>
          
          <div className="grid gap-8 no-print">
            {myPatients.map(app => (
              <div key={app.id} className="bg-white p-8 rounded-[3rem] shadow-sm border-2 border-slate-50">
                <div className="flex justify-between items-center mb-8 bg-slate-50 p-6 rounded-[2.5rem]">
                  <div className="text-right italic">
                    <h3 className="font-black text-2xl text-blue-900 mb-1">{app.patientName}</h3>
                    <p className="text-slate-500 font-bold">{app.date} | {app.time}</p>
                  </div>
                  <span className={`px-6 py-2 rounded-full text-xs font-black italic ${app.status === "تم الكشف" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                    {app.status}
                  </span>
                </div>

                {/* خانات كتابة التشخيص والروشتة */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-right font-sans italic mb-8">
                  <div className="space-y-3">
                    <label className="font-black text-slate-700 mr-2 italic flex items-center gap-2 font-sans"><FileText className="w-4 h-4 text-blue-500"/> التشخيص الطبي:</label>
                    <textarea id={`diag-${app.id}`} placeholder="اكتب التشخيص هنا..." className="w-full h-40 p-6 bg-slate-50 border-2 rounded-[2rem] outline-none focus:border-blue-500 text-right font-sans" defaultValue={app.diagnosis} />
                  </div>
                  <div className="space-y-3">
                    <label className="font-black text-slate-700 mr-2 italic flex items-center gap-2 font-sans"><Stethoscope className="w-4 h-4 text-green-500"/> الروشتة (الأدوية):</label>
                    <textarea id={`meds-${app.id}`} placeholder="اكتب العلاج الموصوف هنا..." className="w-full h-40 p-6 bg-green-50/20 border-2 border-green-100 rounded-[2rem] outline-none focus:border-green-500 text-right font-sans" defaultValue={app.meds} />
                  </div>
                </div>

                <div className="flex gap-4">
                  <button 
                    onClick={() => {
                      const d = (document.getElementById(`diag-${app.id}`) as HTMLTextAreaElement).value;
                      const m = (document.getElementById(`meds-${app.id}`) as HTMLTextAreaElement).value;
                      updatePatientRecord(app.id, d, m);
                    }}
                    className="flex-1 bg-blue-600 text-white py-5 rounded-2xl font-black text-xl shadow-lg hover:bg-blue-700 transition-all active:scale-95 font-sans"
                  >
                    حفظ وتحديث حالة (تم الكشف)
                  </button>
                  <button onClick={() => window.print()} className="bg-slate-900 text-white px-10 py-5 rounded-2xl font-black shadow-xl">
                    <Printer className="w-6 h-6 inline ml-2"/> طباعة
                  </button>
                </div>
              </div>
            ))}
            {myPatients.length === 0 && <p className="text-center text-slate-400 py-20 italic font-black text-2xl">لا توجد حجوزات لهذا الدكتور حالياً.</p>}
          </div>
        </main>
      </div>
    );
  }
  // --- واجهات المريض ---
  if (view === 'login') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 text-right" dir="rtl">
        <div className="bg-white p-8 rounded-[2rem] shadow-2xl w-full max-w-md border border-slate-100">
          <div className="text-center mb-8"><Stethoscope className="text-blue-600 w-12 h-12 mx-auto mb-2" /><h1 className="text-2xl font-bold text-slate-800">عيادتي</h1></div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="email" placeholder="الإيميل" className="w-full p-3 border rounded-xl outline-none" onChange={(e) => setEmail(e.target.value)} required />
            <input type="password" placeholder="كلمة المرور" className="w-full p-3 border rounded-xl outline-none" onChange={(e) => setPassword(e.target.value)} required />
          {/* خانة كود التحقق للطبيب - تم منع الملء التلقائي */}
            <div className="pt-2 border-t mt-4 text-right">
              <label className="text-[10px] text-slate-400 font-black block mb-2 mr-2 italic font-sans">
                كود التحقق للطبيب (للدخول كدكتور):
              </label>
              <input 
                name="doctor_auth_code_2026" 
                type="text" 
                placeholder="ادخل الكود الوظيفي" 
                autoComplete="off"
                className="w-full p-4 border-2 border-dashed rounded-2xl outline-none focus:border-blue-500 bg-slate-50/50 font-black text-right font-sans" 
              />
            </div>
            <button className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold shadow-lg">دخول</button>
          </form>
          <button onClick={() => setView('signup')} className="mt-6 w-full text-blue-600 font-bold text-sm">إنشاء حساب جديد</button>
        </div>
      </div>
    );
  }

  if (view === 'signup') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 text-right" dir="rtl">
        <div className="bg-white p-8 rounded-[2rem] shadow-2xl w-full max-w-md border">
          <h1 className="text-2xl font-bold mb-8 text-center text-slate-800">إنشاء حساب مريض</h1>
          <form onSubmit={handleSignup} className="space-y-4">
            <input type="text" placeholder="الاسم" className="w-full p-3 border rounded-xl outline-none" onChange={(e) => setName(e.target.value)} required />
            <input type="email" placeholder="الإيميل" className="w-full p-3 border rounded-xl outline-none" onChange={(e) => setEmail(e.target.value)} required />
            <input type="password" placeholder="كلمة المرور" className="w-full p-3 border rounded-xl outline-none" onChange={(e) => setPassword(e.target.value)} required />
            <button className="w-full bg-green-600 text-white py-4 rounded-xl font-bold shadow-lg">تأكيد التسجيل</button>
          </form>
        </div>
      </div>
    );
  }

  if (view === 'home') {
    return (
      <div className="min-h-screen bg-slate-50 text-right" dir="rtl">
        <nav className="bg-white shadow-sm p-4 flex justify-between px-8 border-b items-center">
          <div className="text-blue-600 font-bold text-xl flex items-center gap-2"><Stethoscope /> عيادتي</div>
          <div className="flex items-center gap-4 font-bold text-slate-600">أهلاً، {currentUser?.name} <button onClick={() => setView('login')} className="text-red-400 text-sm font-medium mr-4">خروج</button></div>
        </nav>
        {!selectedDoctor ? (
          <main className="container mx-auto py-12 px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {doctors.map(doc => (
                <div key={doc.id} className="bg-white p-5 rounded-[2.5rem] shadow-sm border cursor-pointer hover:shadow-xl transition-all" onClick={() => setSelectedDoctor(doc)}>
                  <img src={doc.image} className="w-full h-64 object-cover rounded-[2rem] mb-4 shadow-inner" />
                  <h3 className="font-bold text-xl text-slate-800">{doc.name}</h3>
                  <p className="text-blue-600 font-bold text-sm mb-4 italic">{doc.specialty}</p>
                  <button className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold">احجز الآن</button>
                </div>
              ))}
            </div>
          </main>
        ) : (
          <div className="max-w-xl mx-auto py-12 px-4">
            <div className="bg-white p-10 rounded-[3rem] shadow-2xl text-center border border-blue-50">
              <button onClick={() => {setSelectedDoctor(null); setSelectedTime("");}} className="text-slate-400 mb-6 flex items-center gap-1 font-bold hover:text-blue-600 transition-all"><ArrowRight className="w-4 h-4"/> رجوع</button>
              <h2 className="text-2xl font-black text-slate-800 mb-8 italic">حجز موعد مع {selectedDoctor.name}</h2>
              <div className="grid grid-cols-2 gap-4 mb-10">
                {timeSlots.map(slot => (
                  <button key={slot} onClick={() => setSelectedTime(slot)} className={`p-4 rounded-2xl border-2 font-black transition-all ${selectedTime === slot ? 'border-blue-600 bg-blue-50 text-blue-700 scale-105 shadow-md' : 'border-slate-50 text-slate-400 hover:border-blue-100'}`}>{slot}</button>
                ))}
              </div>
              <button onClick={() => selectedTime ? setView('payment') : alert("يرجى تحديد الموعد")} className="w-full bg-blue-600 text-white py-5 rounded-2xl font-bold text-xl shadow-lg active:scale-95 transition-all">تأكيد الموعد</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (view === 'payment') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-right" dir="rtl">
        <div className="bg-white p-8 rounded-[3rem] shadow-2xl max-w-md w-full border border-blue-100 relative">
          <button onClick={() => setView('home')} className="absolute top-6 right-6 text-slate-400 hover:text-blue-600 flex items-center gap-1 font-bold transition-colors"><ChevronRight className="w-5 h-5" /> رجوع</button>
          <div className="text-center mb-10 mt-4 text-right">
             <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border shadow-sm"><CreditCard className="w-8 h-8 text-blue-600" /></div>
             <h2 className="text-2xl font-black text-slate-800">دفع العربون (100 ج)</h2>
             <p className="text-slate-400 text-xs mt-1 italic">باقي الحساب 100 ج بالعيادة</p>
          </div>
          <PaymentMethodSelector onSelect={setMethod} selectedMethod={method ?? undefined} />
          <div className="mt-8 min-h-[160px]">
            {method === 'visa' && (
              <div className="space-y-4 animate-in fade-in duration-500">
                <input type="text" placeholder="رقم الكارت (16 رقم)" maxLength={16} className="w-full p-3 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-mono text-right" value={cardNumber} onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, ''))} />
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <input type="text" placeholder="MM/YY" maxLength={5} className="p-3 bg-slate-50 border rounded-xl text-center outline-none focus:ring-2 focus:ring-blue-500 font-mono" value={cardExpiry} onChange={(e) => setCardExpiry(e.target.value)} />
                  <input type="text" placeholder="CVV" maxLength={3} className="p-3 bg-slate-50 border rounded-xl text-center outline-none focus:ring-2 focus:ring-blue-500 font-mono" value={cardCVC} onChange={(e) => setCardCVC(e.target.value.replace(/\D/g, ''))} />
                </div>
              </div>
            )}
            {method === 'wallet' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                <div className="p-6 bg-slate-900 text-white rounded-[2rem] text-center shadow-xl border-t-4 border-blue-500">
                  <p className="text-blue-300 text-xs font-bold mb-1 italic">رقم تحويل المحفظة:</p>
                  <p className="text-2xl font-black tracking-widest font-mono">01090712304</p>
                </div>
                <div className="p-6 border-2 border-dashed border-blue-200 rounded-[2rem] bg-blue-50/50 flex flex-col items-center justify-center min-h-[140px]">
                  {!receiptUploaded ? (
                    <>
                      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-3 shadow-sm border border-blue-100"><Camera className="w-6 h-6 text-blue-600" /></div>
                      <p className="text-blue-800 font-bold text-sm mb-2">إرفاق إيصال الدفع</p>
                      <label className="cursor-pointer bg-blue-600 text-white px-6 py-2 rounded-xl text-xs font-black hover:bg-blue-700 shadow-md transition-all"><input type="file" className="hidden" onChange={() => setReceiptUploaded(true)} />اختيار صورة</label>
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-green-600 font-bold animate-in zoom-in"><CheckCircle2 className="w-10 h-10" /><span className="text-sm font-black">تم إرفاق الإيصال بنجاح</span></div>
                  )}
                </div>
              </div>
            )}
          </div>
          <button onClick={processBooking} className="w-full bg-green-600 text-white py-5 mt-10 rounded-2xl font-black text-xl hover:bg-green-700 shadow-2xl transition-all active:scale-95">تأكيد الحجز النهائي</button>
        </div>
      </div>
    );
  }

  if (view === 'success') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 text-right" dir="rtl">
        <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl text-center max-w-md border-t-8 border-green-500">
          <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6"><CheckCircle2 className="w-14 h-14 text-green-600" /></div>
          <h1 className="text-3xl font-black text-slate-800 mb-4 font-sans">تم الحجز بنجاح!</h1>
          <p className="text-slate-500 mb-8 font-bold text-lg leading-relaxed px-4 italic text-right">تم إرسال طلبك وسيتصل بك السكرتير لتأكيد الموعد.</p>
          <button onClick={() => {setSelectedDoctor(null); setSelectedTime(""); setReceiptUploaded(false); setMethod(null); setCardNumber(""); setCardExpiry(""); setCardCVC(""); setView('home');}} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-xl hover:bg-blue-600 transition-all shadow-xl font-sans">العودة للرئيسية</button>
        </div>
      </div>
    );
  }

  return null;
}