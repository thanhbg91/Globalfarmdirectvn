import React, { useState } from 'react';
import { useI18n, Locale, Currency, DisplayUnit, UNIT_CONVERSIONS } from '../lib/i18n';
import { Globe, Coins, Scale, ChevronDown } from 'lucide-react';

export default function GlobalI18nSelector() {
  const {
    locale,
    setLocale,
    currency,
    setCurrency,
    displayUnit,
    setDisplayUnit,
  } = useI18n();

  const [langOpen, setLangOpen] = useState(false);
  const [currOpen, setCurrOpen] = useState(false);
  const [unitOpen, setUnitOpen] = useState(false);

  const languages: { code: Locale; label: string; flag: string }[] = [
    { code: 'vi', label: 'Tiếng Việt', flag: '🇻🇳' },
    { code: 'en', label: 'English', flag: '🇺🇸' },
    { code: 'zh', label: '中文 (Chinese)', flag: '🇨🇳' },
    { code: 'ko', label: '한국어 (Korean)', flag: '🇰🇷' },
    { code: 'ja', label: '日本語 (Japanese)', flag: '🇯🇵' },
  ];

  const currencies: { code: Currency; symbol: string; label: string }[] = [
    { code: 'VND', symbol: 'đ', label: 'VND' },
    { code: 'USD', symbol: '$', label: 'USD' },
    { code: 'EUR', symbol: '€', label: 'EUR' },
    { code: 'CNY', symbol: '¥', label: 'CNY' },
  ];

  const units: { code: DisplayUnit; label: Record<Locale, string> }[] = [
    { code: 'kg', label: { vi: 'Kg (Kí)', en: 'Kilogram (kg)', zh: '公斤 (kg)', ko: '킬로그램 (kg)', ja: 'キログラム (kg)' } },
    { code: 'ton', label: { vi: 'Tấn (Tons)', en: 'Tons', zh: '公吨 (Tons)', ko: '톤 (Tons)', ja: 'トン (Tons)' } },
    { code: 'ta', label: { vi: 'Tạ (100kg)', en: 'Quintals (100kg)', zh: '担 (100kg)', ko: '백kg (100kg)', ja: '百kg (100kg)' } },
    { code: 'pound', label: { vi: 'Pound (Lbs)', en: 'Pounds (Lbs)', zh: '磅 (Lbs)', ko: '파운드 (Lbs)', ja: 'ポンド (Lbs)' } },
    { code: 'box', label: { vi: 'Thùng (15kg)', en: 'Boxes (15kg)', zh: '箱 (15kg)', ko: '상자 (15kg)', ja: '箱 (15kg)' } },
  ];

  const currentLang = languages.find((l) => l.code === locale) || languages[0];
  const currentCurr = currencies.find((c) => c.code === currency) || currencies[0];
  const currentUnit = units.find((u) => u.code === displayUnit) || units[0];

  return (
    <div className="flex items-center space-x-1 sm:space-x-2" id="global-i18n-selector">
      
      {/* 1. LANGUAGE SELECTOR */}
      <div className="relative">
        <button
          type="button"
          onClick={() => {
            setLangOpen(!langOpen);
            setCurrOpen(false);
            setUnitOpen(false);
          }}
          className="flex items-center space-x-1.5 px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-bold text-slate-700 transition-all cursor-pointer"
          title="Chọn ngôn ngữ hiển thị / Change language"
        >
          <span className="text-sm">{currentLang.flag}</span>
          <span className="hidden sm:inline uppercase">{currentLang.code}</span>
          <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${langOpen ? 'rotate-180' : ''}`} />
        </button>

        {langOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setLangOpen(false)} />
            <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50 animate-fade-in">
              <div className="px-3 py-1.5 text-[10px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-50 mb-1 flex items-center">
                <Globe className="w-3 h-3 mr-1 text-slate-400" />
                Ngôn ngữ / Language
              </div>
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setLocale(lang.code);
                    setLangOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors ${
                    locale === lang.code ? 'font-black text-emerald-700 bg-emerald-50/50' : 'font-medium text-slate-600'
                  }`}
                >
                  <span className="flex items-center space-x-2">
                    <span className="text-base">{lang.flag}</span>
                    <span>{lang.label}</span>
                  </span>
                  {locale === lang.code && <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full" />}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* 2. CURRENCY SELECTOR */}
      <div className="relative">
        <button
          type="button"
          onClick={() => {
            setCurrOpen(!currOpen);
            setLangOpen(false);
            setUnitOpen(false);
          }}
          className="flex items-center space-x-1.5 px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-bold text-slate-700 transition-all cursor-pointer"
          title="Chọn tiền tệ hiển thị / Display currency"
        >
          <Coins className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span className="uppercase text-slate-800">{currentCurr.code}</span>
          <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${currOpen ? 'rotate-180' : ''}`} />
        </button>

        {currOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setCurrOpen(false)} />
            <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50 animate-fade-in">
              <div className="px-3 py-1.5 text-[10px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-50 mb-1 flex items-center">
                <Coins className="w-3 h-3 mr-1 text-slate-400" />
                Tiền tệ / Currency
              </div>
              {currencies.map((curr) => (
                <button
                  key={curr.code}
                  onClick={() => {
                    setCurrency(curr.code);
                    setCurrOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors ${
                    currency === curr.code ? 'font-black text-emerald-700 bg-emerald-50/50' : 'font-medium text-slate-600'
                  }`}
                >
                  <span className="flex items-center space-x-2">
                    <span className="font-extrabold text-slate-400 text-sm w-5 text-center">{curr.symbol}</span>
                    <span>{curr.label}</span>
                  </span>
                  {currency === curr.code && <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full" />}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* 3. MEASUREMENT UNIT SELECTOR */}
      <div className="relative">
        <button
          type="button"
          onClick={() => {
            setUnitOpen(!unitOpen);
            setLangOpen(false);
            setCurrOpen(false);
          }}
          className="flex items-center space-x-1.5 px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-bold text-slate-700 transition-all cursor-pointer"
          title="Chọn đơn vị đo lường xuất khẩu / Export weight standards"
        >
          <Scale className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
          <span className="capitalize text-slate-800">
            {displayUnit === 'ton' ? 'Tấn' : displayUnit === 'ta' ? 'Tạ' : displayUnit === 'pound' ? 'Pound' : displayUnit === 'box' ? 'Thùng' : 'Kg'}
          </span>
          <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${unitOpen ? 'rotate-180' : ''}`} />
        </button>

        {unitOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setUnitOpen(false)} />
            <div className="absolute right-0 mt-2 w-52 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50 animate-fade-in">
              <div className="px-3 py-1.5 text-[10px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-50 mb-1 flex items-center">
                <Scale className="w-3 h-3 mr-1 text-slate-400" />
                Quy chuẩn / Measurements
              </div>
              {units.map((u) => (
                <button
                  key={u.code}
                  onClick={() => {
                    setDisplayUnit(u.code);
                    setUnitOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors ${
                    displayUnit === u.code ? 'font-black text-emerald-700 bg-emerald-50/50' : 'font-medium text-slate-600'
                  }`}
                >
                  <span>{u.label[locale] || u.label['vi']}</span>
                  {displayUnit === u.code && <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full" />}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

    </div>
  );
}
