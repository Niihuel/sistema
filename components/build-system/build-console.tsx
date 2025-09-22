'use client';

import { useEffect, useRef } from 'react';
import { Terminal } from 'lucide-react';
import type { BuildStep } from '@/types/build';

interface BuildConsoleProps {
  currentStep: BuildStep | null;
  isBuilding: boolean;
  logs: string[];
}

export function BuildConsole({ currentStep, isBuilding, logs }: BuildConsoleProps) {
  const consoleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
      <div className="bg-gray-800 px-4 py-2 flex items-center gap-2 border-b border-gray-700">
        <Terminal className="h-4 w-4 text-gray-400" />
        <span className="text-sm font-medium text-gray-300">
          Build Console
        </span>
        {isBuilding && (
          <div className="ml-auto flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs text-gray-400">Running</span>
          </div>
        )}
      </div>
      
      <div 
        ref={consoleRef}
        className="h-64 overflow-y-auto p-4 bg-gray-950 font-mono text-sm"
      >
        {logs.length === 0 ? (
          <div className="text-gray-500 italic">
            Esperando inicio del build...
          </div>
        ) : (
          logs.map((log, index) => (
            <div 
              key={index} 
              className="text-gray-300 py-0.5 leading-relaxed"
            >
              <span className="text-gray-500 text-xs mr-2">
                {new Date().toLocaleTimeString()}
              </span>
              {log}
            </div>
          ))
        )}
        
        {currentStep && isBuilding && (
          <div className="text-green-400 py-0.5 leading-relaxed">
            <span className="text-gray-500 text-xs mr-2">
              {new Date().toLocaleTimeString()}
            </span>
            ► {currentStep.description}
          </div>
        )}
      </div>
    </div>
  );
}