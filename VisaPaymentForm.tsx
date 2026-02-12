export const VisaPaymentForm = () => {
  return (
    <div className="space-y-4 animate-in fade-in duration-500" dir="rtl">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">اسم صاحب الكارت</label>
        <input type="text" className="w-full p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="الاسم كما هو مكتوب على الكارت" />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">رقم الكارت</label>
        <input type="text" className="w-full p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="0000 0000 0000 0000" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <input type="text" className="p-3 rounded-lg border border-slate-300 outline-none" placeholder="MM/YY" />
        <input type="text" className="p-3 rounded-lg border border-slate-300 outline-none" placeholder="CVV" />
      </div>
    </div>
  );
};