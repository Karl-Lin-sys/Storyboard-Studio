import { ChangeEvent, useRef } from "react";
import { UploadCloud, FileText } from "lucide-react";

interface ScriptInputProps {
  script: string;
  setScript: (s: string) => void;
  onGenerateFrames: () => void;
  isExtracting: boolean;
}

export function ScriptInput({
  script,
  setScript,
  onGenerateFrames,
  isExtracting,
}: ScriptInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        if (evt.target?.result) {
          setScript(evt.target.result as string);
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
        <h2 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Script Input
        </h2>
        <div>
          <input
            type="file"
            accept=".txt,.md,.pdf"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileUpload}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="text-xs flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 rounded hover:bg-gray-50 text-gray-600 transition-colors"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            Upload File
          </button>
        </div>
      </div>
      <div className="flex-1 p-4 flex flex-col">
        <textarea
          className="flex-1 w-full bg-transparent border border-gray-300 rounded-md p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono text-gray-700 placeholder:text-gray-400"
          placeholder="Paste your scene script or dialogue here...&#10;&#10;e.g. INT. COFFEE SHOP - DAY&#10;Alice looks out the window, rain pouring down..."
          value={script}
          onChange={(e) => setScript(e.target.value)}
        />
        <div className="mt-4 flex justify-end">
          <button
            onClick={onGenerateFrames}
            disabled={!script.trim() || isExtracting}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-sm font-medium rounded shadow-sm transition-colors"
          >
            {isExtracting ? "Analyzing Script..." : "Extract Frames"}
          </button>
        </div>
      </div>
    </div>
  );
}
