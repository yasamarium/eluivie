import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Eluivie - iOS Themed Git & Cloud Storage Platform',
  description:
    'A minimalist, iOS-dark themed Git platform and serverless database engine powered by GitHub fine-grained token architecture.',
  icons: {
    icon: '/favicon.ico',
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
