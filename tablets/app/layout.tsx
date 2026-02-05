import type { Metadata } from 'next';
import { Poppins } from 'next/font/google';
import Provider from './provider';
import './globals.scss';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
});

export const metadata: Metadata = {
  title: 'Lab Shop Manager - Tablets',
  description: 'Manage your lab shop purchases and repayments with ease.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${poppins.variable}`} suppressHydrationWarning>
        <Provider>{children}</Provider>
      </body>
    </html>
  );
}
