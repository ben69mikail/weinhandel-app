import { useState, useEffect } from "react";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PwaInstallPrompt() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  useEffect(() => {
    if (prompt && !shown) {
      const timer = setTimeout(() => setShown(true), 3000);
      return () => clearTimeout(timer);
    }
  }, [prompt, shown]);

  if (!prompt || !shown) return null;

  const install = async () => {
    await prompt.prompt();
    const result = await prompt.userChoice;
    if (result.outcome === "accepted") setPrompt(null);
    setShown(false);
  };

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 bg-[#8B1A1A] text-white rounded-2xl p-4 shadow-2xl flex items-center gap-3">
      <Download size={20} className="flex-shrink-0"/>
      <div className="flex-1">
        <p className="text-sm font-semibold">App installieren</p>
        <p className="text-xs opacity-80">Für schnellen Zugriff auf dem Homescreen</p>
      </div>
      <button onClick={install} className="px-3 py-1.5 bg-white text-[#8B1A1A] text-sm font-semibold rounded-lg">Installieren</button>
      <button onClick={() => setShown(false)} className="p-1 opacity-70 hover:opacity-100"><X size={16}/></button>
    </div>
  );
}