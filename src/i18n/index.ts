import { useMemo } from 'react';
import { AppLanguage } from '../types';
import { useProfile } from '../context/ProfileContext';
import fr from './locales/fr';
import en from './locales/en';
import pt from './locales/pt';
import es from './locales/es';
import ar from './locales/ar';

const locales: Record<AppLanguage, Record<string, string>> = { fr, en, pt, es, ar };

// ─── Nationality → Language mapping ─────────────────────────────────────────
export const NATIONALITY_TO_LANGUAGE: Record<string, AppLanguage> = {
  FR: 'fr',
  BR: 'pt', PT: 'pt',
  MA: 'fr', DZ: 'fr', TN: 'fr',
  ES: 'es', MX: 'es', CO: 'es',
  NG: 'en', PH: 'en', IN: 'en',
  SN: 'fr', ML: 'fr', CM: 'fr', CI: 'fr',
  CN: 'fr', TR: 'fr', RO: 'fr', PL: 'fr',
  OTHER: 'fr',
};

export function getLanguageForNationality(countryCode: string): AppLanguage {
  return NATIONALITY_TO_LANGUAGE[countryCode] || 'fr';
}

// ─── Translation hook ───────────────────────────────────────────────────────
type TFunction = (key: string, params?: Record<string, string | number>) => string;

export function useTranslation(): { t: TFunction; language: AppLanguage } {
  const { profile } = useProfile();
  const language: AppLanguage = profile?.language || 'fr';

  const t: TFunction = useMemo(() => {
    const dict = locales[language] || locales.fr;
    return (key: string, params?: Record<string, string | number>): string => {
      let text = dict[key] || locales.fr[key] || key;
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          text = text.replace(`{${k}}`, String(v));
        });
      }
      return text;
    };
  }, [language]);

  return { t, language };
}
