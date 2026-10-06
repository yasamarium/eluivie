import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Eluivie — Next-Generation Cloud Code & Artifact Platform',
  description:
    'High-performance standalone cloud repository forge, decentralized database engine and secure media vault.',
  icons: {
    icon: '/icon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark bg-black">
      <body className="min-h-screen bg-black text-neutral-100 antialiased overflow-x-hidden selection:bg-blue-600/30 selection:text-white">
        {children}
      </body>
    </html>
  );
}
