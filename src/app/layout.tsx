// src/app/layout.tsx
import './globals.css';

export const metadata = {
  title: 'Magic Hate Ball',
  description: 'Ask me anything',
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
