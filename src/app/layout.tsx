// src/app/layout.tsx
import './globals.css';

export const metadata = {
  title: 'Tawind Test',
  description: 'A Next.js project with Tailwind CSS',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-blue-500">
        {children}
      </body>
    </html>
  );
}
