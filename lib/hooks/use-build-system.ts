'use client';

import { useState, useCallback } from 'react';
import type { BuildConfig, BuildResult, BuildStep, BuildStatus } from '@/types/build';

interface UseBuildSystemReturn {
  isBuilding: boolean;
  currentStep: BuildStep | null;
  progress: number;
  status: BuildStatus;
  result: BuildResult | null;
  startBuild: (config: BuildConfig) => Promise<void>;
  cancelBuild: () => void;
  resetBuild: () => void;
}

export function useBuildSystem(): UseBuildSystemReturn {
  const [isBuilding, setIsBuilding] = useState(false);
  const [currentStep, setCurrentStep] = useState<BuildStep | null>(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<BuildStatus>('idle');
  const [result, setResult] = useState<BuildResult | null>(null);

  const resetBuild = useCallback(() => {
    setIsBuilding(false);
    setCurrentStep(null);
    setProgress(0);
    setStatus('idle');
    setResult(null);
  }, []);

  const cancelBuild = useCallback(() => {
    setIsBuilding(false);
    setStatus('cancelled');
    setCurrentStep(null);
  }, []);

  const executeStep = async (step: BuildStep): Promise<void> => {
    setCurrentStep(step);
    setStatus('running');
    
    try {
      await step.execute();
      setProgress(prev => prev + step.weight);
    } catch (error) {
      setStatus('error');
      throw error;
    }
  };

  const startBuild = useCallback(async (config: BuildConfig) => {
    resetBuild();
    setIsBuilding(true);
    setStatus('running');

    try {
      const totalWeight = config.steps.reduce((sum, step) => sum + step.weight, 0);
      let currentProgress = 0;

      for (const step of config.steps) {
        if (status === 'cancelled') break;
        
        setCurrentStep(step);
        
        await step.execute();
        currentProgress += step.weight;
        setProgress((currentProgress / totalWeight) * 100);
      }

      if (status !== 'cancelled') {
        setStatus('completed');
        setResult({
          success: true,
          duration: Date.now(),
          artifacts: config.outputPath ? [config.outputPath] : []
        });
      }

    } catch (error) {
      setStatus('error');
      setResult({
        success: false,
        duration: Date.now(),
        error: error instanceof Error ? error.message : 'Unknown error',
        artifacts: []
      });
    } finally {
      setIsBuilding(false);
      setCurrentStep(null);
    }
  }, [status, resetBuild]);

  return {
    isBuilding,
    currentStep,
    progress,
    status,
    result,
    startBuild,
    cancelBuild,
    resetBuild
  };
}