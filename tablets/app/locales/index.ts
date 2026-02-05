export const translations = {
  en: {
    languageName: 'English',
    welcome: 'Welcome',
    studentIdPlaceholder: 'Enter Student ID',
    submit: 'Submit',
    owedAmount: 'Owed Amount',
    theme: {
      toggle: 'Toggle theme',
    },
  },
  ja: {
    languageName: '日本語',
    welcome: 'ようこそ',
    studentIdPlaceholder: '学生証番号を入力',
    submit: '送信',
    owedAmount: '未払い金額',
    theme: {
      toggle: 'テーマ切り替え',
    },
  },
};

export type Language = keyof typeof translations;
export type TranslationKey = keyof typeof translations.en;
