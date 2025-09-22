'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { buildPresets } from '@/lib/build/presets';
import type { BuildPreset } from '@/types/build';

interface PresetSelectorProps {
  selectedPreset: BuildPreset | null;
  onSelectPreset: (preset: BuildPreset) => void;
  disabled?: boolean;
}

export function PresetSelector({ selectedPreset, onSelectPreset, disabled = false }: PresetSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (preset: BuildPreset) => {
    onSelectPreset(preset);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-left flex items-center justify-between transition-colors ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/10'
        }`}
      >
        <div className="flex items-center gap-3">
          {selectedPreset ? (
            <>
              <span className="text-2xl">{selectedPreset.icon}</span>
              <div>
                <div className="text-white font-medium">
                  {selectedPreset.name}
                </div>
                <div className="text-gray-400 text-sm">
                  {selectedPreset.description}
                </div>
              </div>
            </>
          ) : (
            <span className="text-gray-400">
              Selecciona un tipo de build...
            </span>
          )}
        </div>
        <ChevronDown 
          className={`h-4 w-4 text-gray-400 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`} 
        />
      </button>

      {isOpen && !disabled && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-20 max-h-80 overflow-y-auto">
            {buildPresets.map((preset) => (
              <button
                key={preset.id}
                onClick={() => handleSelect(preset)}
                className="w-full px-4 py-3 text-left hover:bg-gray-700 transition-colors border-b border-gray-700 last:border-b-0"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{preset.icon}</span>
                  <div>
                    <div className="text-white font-medium">
                      {preset.name}
                    </div>
                    <div className="text-gray-400 text-sm">
                      {preset.description}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}