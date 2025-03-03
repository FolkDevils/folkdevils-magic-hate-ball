// src/app/page.tsx
import type { NextPage } from 'next'
import Magic8Ball from '../components/Magic8Ball'


export default function HomePage() {
  return (
    <div className="min-h-screen  bg-gradient-to-b from-[#650049] to-[#29001d]">
      <Magic8Ball />
    </div>
  );
}
