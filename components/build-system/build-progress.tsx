'use client';

import { CheckCircle, Clock, XCircle, Loader2 } from 'lucide-react';
import type { BuildStep, BuildStatus } from '@/types/build';

interface BuildProgressProps {
  currentStep: BuildStep | null;
  progress: number;
  status: BuildStatus;
  allSteps?: BuildStep[];
}

export function BuildProgress({ currentStep, progress, status, allSteps = [] }: BuildProgressProps) {
  const getStatusIcon = (stepStatus: 'pending' | 'active' | 'completed' | 'error') => {
    switch (stepStatus) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'active':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStepStatus = (step: BuildStep): 'pending' | 'active' | 'completed' | 'error' => {
    if (status === 'error' && currentStep?.id === step.id) return 'error';
    if (currentStep?.id === step.id && status === 'running') return 'active';
    
    // Si hay un currentStep, marcar los anteriores como completados
    if (currentStep) {
      const currentIndex = allSteps.findIndex(s => s.id === currentStep.id);
      const stepIndex = allSteps.findIndex(s => s.id === step.id);
      if (stepIndex < currentIndex) return 'completed';
    }
    
    // Si el build está completado, marcar todos como completados
    if (status === 'completed') return 'completed';
    
    return 'pending';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">
          Progreso del Build
        </h3>
        <span className="text-sm text-gray-400">
          {Math.round(progress)}%
        </span>
      </div>

      <div className="w-full bg-gray-700 rounded-full h-2">
        <div 
          className={`h-2 rounded-full transition-all duration-300 ${
            status === 'error' ? 'bg-red-500' : 
            status === 'completed' ? 'bg-green-500' : 
            'bg-blue-500'
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>

      {allSteps.length > 0 && (
        <div className="space-y-2">
          {allSteps.map((step, index) => {
            const stepStatus = getStepStatus(step);
            
            return (
              <div 
                key={step.id}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                  stepStatus === 'active' ? 'bg-blue-500/10 border-blue-500/20' :
                  stepStatus === 'completed' ? 'bg-green-500/10 border-green-500/20' :
                  stepStatus === 'error' ? 'bg-red-500/10 border-red-500/20' :
                  'bg-gray-500/10 border-gray-500/20'
                }`}
              >
                {getStatusIcon(stepStatus)}
                
                <div className="flex-1">
                  <div className="font-medium text-white text-sm">
                    {step.name}
                  </div>
                  {stepStatus === 'active' && (
                    <div className="text-xs text-gray-400 mt-1">
                      {step.description}
                    </div>
                  )}
                </div>

                <div className="text-xs text-gray-500">
                  Paso {index + 1}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}