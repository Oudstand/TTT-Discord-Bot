// public/ts/i18n.ts - Internationalization system

import {translations, Language} from '../../i18n/translations';

class I18n {
    private currentLanguage: Language;

    constructor() {
        this.currentLanguage = this.detectLanguage();
    }

    private detectLanguage(): Language {
        // 1. Check URL parameter
        const urlParams = new URLSearchParams(window.location.search);
        const urlLang = urlParams.get('lang');
        if (urlLang === 'de' || urlLang === 'en') {
            return urlLang;
        }

        // 2. Check localStorage
        const storedLang = localStorage.getItem('language');
        if (storedLang === 'de' || storedLang === 'en') {
            return storedLang;
        }

        // 3. Default to English
        return 'en';
    }

    public setLanguage(lang: Language): void {
        this.currentLanguage = lang;
        localStorage.setItem('language', lang);
        this.updateDOM();

        // Update URL without reload
        const url = new URL(window.location.href);
        url.searchParams.set('lang', lang);
        window.history.replaceState({}, '', url.toString());
    }

    public getLanguage(): Language {
        return this.currentLanguage;
    }

    public t(key: string): string {
        return translations[this.currentLanguage][key] || key;
    }

    public updateDOM(): void {
        // Update all elements with data-i18n attribute
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            if (key) {
                element.textContent = this.t(key);
            }
        });

        // Update placeholders
        document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
            const key = element.getAttribute('data-i18n-placeholder');
            if (key && element instanceof HTMLInputElement) {
                element.placeholder = this.t(key);
            }
        });

        // Update titles
        document.querySelectorAll('[data-i18n-title]').forEach(element => {
            const key = element.getAttribute('data-i18n-title');
            if (key) {
                element.setAttribute('title', this.t(key));
            }
        });
    }

    public toggleLanguage(): void {
        const newLang: Language = this.currentLanguage === 'de' ? 'en' : 'de';
        this.setLanguage(newLang);

        // Trigger custom event so dashboard can reload content
        window.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: newLang } }));
    }
}

// Create global instance
const i18n = new I18n();

export default i18n;
export type { Language };
