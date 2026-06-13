/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { ScriptInput } from "./components/ScriptInput";
import { StoryboardGrid } from "./components/StoryboardGrid";
import { ChatAssistant } from "./components/ChatAssistant";
import { Frame } from "./types";
import { Film } from "lucide-react";

export default function App() {
  const [script, setScript] = useState("");
  const [frames, setFrames] = useState<Frame[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [imageSize, setImageSize] = useState("1K");

  const handleExtractFrames = async () => {
    if (!script.trim()) return;
    setIsExtracting(true);
    // Optimistically setup frames or clear previous (user expectation)
    setFrames([]);
    try {
      const res = await fetch("/api/storyboard/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ script }),
      });
      const data = await res.json();
      if (data.frames) {
        setFrames(data.frames);
      } else if (data.error) {
        alert(data.error);
      }
    } catch (e) {
      console.error(e);
      alert("Failed to extract script logic.");
    } finally {
      setIsExtracting(false);
    }
  };

  const generateImageForFrame = async (idx: number, promptOverride?: string) => {
    setFrames((prev) => {
      const copy = [...prev];
      if (copy[idx]) {
        copy[idx] = { ...copy[idx], isGenerating: true };
      }
      return copy;
    });

    try {
      const res = await fetch("/api/storyboard/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: promptOverride || frames[idx].prompt, size: imageSize }),
      });
      
      const data = await res.json();
      
      setFrames((prev) => {
        const copy = [...prev];
        if (copy[idx]) {
          copy[idx] = { 
            ...copy[idx], 
            isGenerating: false, 
            imageUrl: data.imageUrl || prev[idx].imageUrl 
          };
        }
        return copy;
      });
    } catch (e) {
      console.error(e);
      setFrames((prev) => {
        const copy = [...prev];
        if (copy[idx]) {
          copy[idx] = { ...copy[idx], isGenerating: false };
        }
        return copy;
      });
    }
  };

  const handleGenerateAll = async () => {
    // Generate them sequentially to avoid rate-limits or queueing issues
    for (let i = 0; i < frames.length; i++) {
        const currentFrame = frames[i];
        if (!currentFrame.imageUrl && !currentFrame.isGenerating) {
            await generateImageForFrame(i, currentFrame.prompt);
        }
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-100 text-gray-900 font-sans">
      <header className="h-14 bg-gray-900 text-white flex items-center px-4 shrink-0 shadow-md z-10 relative">
        <div className="flex items-center gap-2 font-semibold">
          <Film className="w-5 h-5 text-blue-400" />
          <span>Storyboard Studio</span>
        </div>
      </header>
      
      {/* 3-pane layout */}
      <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12 relative">
        {/* Left Column: Script */}
        <div className="hidden lg:block lg:col-span-3 h-full overflow-hidden z-10">
          <ScriptInput
            script={script}
            setScript={setScript}
            onGenerateFrames={handleExtractFrames}
            isExtracting={isExtracting}
          />
        </div>

        {/* Center Column: Storyboards */}
        <div className="col-span-1 border-b border-t lg:border-none lg:col-span-6 h-full overflow-hidden bg-[#f0f2f5] z-0">
          <StoryboardGrid
            frames={frames}
            imageSize={imageSize}
            setImageSize={setImageSize}
            onGenerateImage={(idx) => generateImageForFrame(idx)}
            onGenerateAll={handleGenerateAll}
            isExtracting={isExtracting}
          />
        </div>

        {/* Right Column: Chatbot */}
        <div className="hidden lg:block lg:col-span-3 h-full overflow-hidden z-10">
          <ChatAssistant />
        </div>
      </div>
      
      {/* 
        Mobile fallback (When viewed on small screens, we just stack them or show warnings). 
        A proper mobile app would use tabs, but doing stacking here for simpler MVP.
      */}
      <div className="lg:hidden flex-1 overflow-y-auto block h-full">
         <div className="h-[60vh] border-b">
           <ScriptInput
             script={script}
             setScript={setScript}
             onGenerateFrames={handleExtractFrames}
             isExtracting={isExtracting}
           />
         </div>
         <div className="h-[60vh] border-b">
           <ChatAssistant />
         </div>
      </div>
    </div>
  );
}
