import { CreditCard, Wallet } from "lucide-react";

interface PaymentMethodSelectorProps {
  onSelect: (method: 'visa' | 'wallet') => void;
  selectedMethod?: 'visa' | 'wallet';
}

export const PaymentMethodSelector = ({ onSelect, selectedMethod }: PaymentMethodSelectorProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6" dir="rtl">
      <button
        onClick={() => onSelect('visa')}
        className={`p-6 rounded-xl border-2 transition-all flex flex-col items-center gap-3 ${
          selectedMethod === 'visa' ? 'border-blue-600 bg-blue-50' : 'border-slate-200 hover:border-blue-300'
        }`}
      >
        <CreditCard className={`w-8 h-8 ${selectedMethod === 'visa' ? 'text-blue-600' : 'text-slate-400'}`} />
        <span className="font-bold text-slate-700">دفع بالفيزا</span>
      </button>

      <button
        onClick={() => onSelect('wallet')}
        className={`p-6 rounded-xl border-2 transition-all flex flex-col items-center gap-3 ${
          selectedMethod === 'wallet' ? 'border-blue-600 bg-blue-50' : 'border-slate-200 hover:border-blue-300'
        }`}
      >
        <Wallet className={`w-8 h-8 ${selectedMethod === 'wallet' ? 'text-blue-600' : 'text-slate-400'}`} />
        <span className="font-bold text-slate-700">محفظة إلكترونية</span>
      </button>
    </div>
  );
};