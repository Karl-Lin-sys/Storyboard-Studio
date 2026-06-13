import { useState } from "react";
import { Frame } from "../types";
import { Image as ImageIcon, Loader2, Play, LayoutGrid } from "lucide-react";

interface StoryboardGridProps {
  frames: Frame[];
  imageSize: string;
  setImageSize: (s: string) => void;
  onGenerateImage: (index: number) => void;
  onGenerateAll: () => void;
  isExtracting: boolean;
}

export function StoryboardGrid({
  frames,
  imageSize,
  setImageSize,
  onGenerateImage,
  onGenerateAll,
  isExtracting,
}: StoryboardGridProps) {
  const isGeneratingAny = frames.some((f) => f.isGenerating);
  const allImagesGenerated = frames.length > 0 && frames.every((f) => !!f.imageUrl);

  if (frames.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gray-50/50">
        <div className="w-16 h-16 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mb-4">
          <LayoutGrid className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-medium text-gray-800">No frames extracted</h3>
        <p className="text-sm text-gray-500 mt-2 max-w-sm">
          {isExtracting
            ? "Analyzing your script to determine key visual moments..."
            : "Enter a script and click 'Extract Frames' to generate storyboard prompts."}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="p-4 border-b border-gray-200 bg-white flex justify-between items-center shrink-0">
        <h2 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
          <ImageIcon className="w-4 h-4" />
          Storyboards
        </h2>
        <div className="flex items-center gap-3">
          <label className="text-xs text-gray-600 flex items-center gap-1.5 font-medium">
            Resolution:
            <select
              value={imageSize}
              onChange={(e) => setImageSize(e.target.value)}
              className="px-2 py-1 bg-gray-50 border border-gray-300 rounded text-xs focus:ring-blue-500"
            >
              <option value="1K">1K - Standard</option>
              <option value="2K">2K - High</option>
              <option value="4K">4K - Ultra Cinematic</option>
            </select>
          </label>
          <button
            onClick={onGenerateAll}
            disabled={isGeneratingAny || allImagesGenerated}
            className="text-xs flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white rounded shadow-sm hover:bg-gray-800 disabled:bg-gray-400 transition-colors"
          >
            {isGeneratingAny ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5" />
            )}
            Generate All
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {frames.map((frame, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col group">
              <div className="aspect-video bg-gray-100 flex items-center justify-center relative">
                {frame.imageUrl ? (
                  <img src={frame.imageUrl} alt={frame.description} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-gray-400 flex flex-col items-center">
                    {frame.isGenerating ? (
                      <>
                        <Loader2 className="w-8 h-8 animate-spin mb-2" />
                        <span className="text-xs font-medium uppercase tracking-wider">Generating...</span>
                      </>
                    ) : (
                      <ImageIcon className="w-8 h-8 opacity-40 mb-2" />
                    )}
                  </div>
                )}
                
                {!frame.imageUrl && !frame.isGenerating && (
                  <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <button
                      onClick={() => onGenerateImage(i)}
                      className="px-4 py-2 bg-white text-gray-800 text-sm font-medium rounded-full shadow-lg border border-gray-200 hover:bg-blue-50 transition-colors"
                    >
                      Generate Image
                    </button>
                  </div>
                )}
              </div>
              <div className="p-4 flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="inline-block px-2 py-1 bg-gray-100 text-gray-600 rounded text-[10px] font-bold uppercase tracking-wider">
                    Frame {i + 1}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-800 text-sm mb-1">{frame.description}</h3>
                <p className="text-xs text-gray-500 leading-relaxed font-mono line-clamp-3 group-hover:line-clamp-none transition-all">
                  {frame.prompt}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
