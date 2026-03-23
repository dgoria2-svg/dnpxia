import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'DNPXIA',
  description: 'Base inicial para la plataforma SaaS multi-tenant de salud visual.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
