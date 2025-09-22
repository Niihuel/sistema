export type BuildStatus = 'idle' | 'running' | 'completed' | 'error' | 'cancelled';

export interface BuildStep {
  id: string;
  name: string;
  description: string;
  weight: number;
  execute: () => Promise<void>;
}

export interface BuildConfig {
  name: string;
  description: string;
  steps: BuildStep[];
  outputPath?: string;
  environment?: 'development' | 'production' | 'test';
}

export interface BuildResult {
  success: boolean;
  duration: number;
  error?: string;
  artifacts: string[];
  warnings?: string[];
}

export interface BuildPreset {
  id: string;
  name: string;
  description: string;
  icon: string;
  config: Omit<BuildConfig, 'steps'>;
  createSteps: () => BuildStep[];
}