'use client';

import Header from '@/components/header';
import BuildSystem from '@/components/build-system/build-system';
import AnimatedContainer, { FadeInUp } from '@/components/animated-container';
import AdaptiveTransparency from '@/components/adaptive-transparency';
import ClientOnlyShader from '@/components/client-only-shader';

export default function CompilerPage() {
  return (
    <ClientOnlyShader>
      <Header />
      <div className="px-4 sm:px-6 pt-10 pb-16">
        <AnimatedContainer className="mx-auto w-full max-w-[1400px] text-white">
          <FadeInUp delay={0.1}>
            <AdaptiveTransparency className="rounded-xl border backdrop-blur-sm p-6">
              <BuildSystem />
            </AdaptiveTransparency>
          </FadeInUp>
        </AnimatedContainer>
      </div>
    </ClientOnlyShader>
  );
}