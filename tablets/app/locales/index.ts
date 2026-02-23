export const translations = {
  en: {
    languageName: 'English',
    welcome: 'Welcome',
    studentIdPlaceholder: 'Enter Student ID',
    submit: 'Submit',
    owedAmount: 'Owed Amount',
    noData: 'No Data',
    theme: {
      toggle: 'Toggle theme',
    },
    payback: {
      title: 'Pay back amount',
      user: 'User',
      totalOwed: 'Total Owed',
      howMuch: 'How much do you want to pay back?',
      selectAmount: 'Select amount',
      otherAmount: 'Other Amount',
      enterAmount: 'Enter amount',
      confirmPayment: 'Confirm Payment',
      backToPresets: 'Back to presets',
      processing: 'Payment processing...',
      success: 'Payment Successful!',
    },
  },
  ja: {
    languageName: '日本語',
    welcome: 'ようこそ',
    studentIdPlaceholder: '学生証番号を入力',
    submit: '送信',
    owedAmount: '未払い金額',
    noData: 'データなし',
    theme: {
      toggle: 'テーマ切り替え',
    },
    payback: {
      title: '金額を支払う',
      user: 'ユーザー',
      totalOwed: '未払い合計',
      howMuch: 'いくら支払いますか？',
      selectAmount: '金額を選択',
      otherAmount: 'その他の金額',
      enterAmount: '金額を入力',
      confirmPayment: '支払いを確定',
      backToPresets: 'プリセットに戻る',
      processing: '支払い処理中...',
      success: '支払い完了！',
    },
  },
};

export type Language = keyof typeof translations;
export type TranslationKey = keyof typeof translations.en;
