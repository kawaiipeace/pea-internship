import en from './public/locales/en.json';
import ae from './public/locales/ae.json';
import da from './public/locales/da.json';
import de from './public/locales/de.json';
import el from './public/locales/el.json';
import es from './public/locales/es.json';
import fr from './public/locales/fr.json';
import hu from './public/locales/hu.json';
import it from './public/locales/it.json';
import ja from './public/locales/ja.json';
import pl from './public/locales/pl.json';
import pt from './public/locales/pt.json';
import ru from './public/locales/ru.json';
import sv from './public/locales/sv.json';
import tr from './public/locales/tr.json';
import zh from './public/locales/zh.json';
const langObj: any = { en, ae, da, de, el, es, fr, hu, it, ja, pl, pt, ru, sv, tr, zh };

// Helper to get cookie value
const getCookie = (name: string) => {
    if (typeof document === 'undefined') return null;
    const nameEQ = name + '=';
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
        let cookie = cookies[i].trim();
        if (cookie.indexOf(nameEQ) === 0) {
            return cookie.substring(nameEQ.length);
        }
    }
    return null;
};

// Helper to set cookie value
const setCookie = (name: string, value: string) => {
    if (typeof document === 'undefined') return;
    const date = new Date();
    date.setTime(date.getTime() + 365 * 24 * 60 * 60 * 1000);
    const expires = 'expires=' + date.toUTCString();
    document.cookie = name + '=' + value + ';' + expires + ';path=/';
};

const getLang = () => {
    let lang = null;
    if (typeof window !== 'undefined') {
        lang = getCookie('i18nextLng') || localStorage.getItem('i18nextLng');
    } else {
        // For server-side, use a default since we can't access cookies synchronously
        lang = 'en';
    }
    return lang;
};

export const getTranslation = () => {
    const lang = getLang();
    const data: any = langObj[lang || 'en'];

    const t = (key: string) => {
        return data[key] ? data[key] : key;
    };

    const initLocale = (themeLocale: string) => {
        const currentLang = getLang();
        i18n.changeLanguage(currentLang || themeLocale);
    };

    const i18n = {
        language: lang,
        changeLanguage: (lang: string) => {
            if (typeof window !== 'undefined') {
                setCookie('i18nextLng', lang);
                localStorage.setItem('i18nextLng', lang);
            }
        },
    };

    return { t, i18n, initLocale };
};
