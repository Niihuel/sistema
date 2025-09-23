'use client';

import Header from '@/components/header';
import AnimatedContainer, { FadeInUp } from '@/components/animated-container';
import AdaptiveTransparency from '@/components/adaptive-transparency';

export default function CompilerPage() {
  return (
    <div className="min-h-screen bg-gray-900">
      <Header />
      <div className="px-4 sm:px-6 pt-10 pb-16">
        <AnimatedContainer className="mx-auto w-full max-w-[1400px] text-white">
          <FadeInUp delay={0.1}>
            <AdaptiveTransparency className="rounded-xl border backdrop-blur-sm p-6">
              <div className="text-center py-8">
                <h1 className="text-2xl font-bold mb-4">Compilador del Sistema</h1>
                <p className="text-gray-400">Funcionalidad de compilación temporalmente deshabilitada en producción.</p>
              </div>
            </AdaptiveTransparency>
          </FadeInUp>
        </AnimatedContainer>
      </div>
    </div>
  );
}