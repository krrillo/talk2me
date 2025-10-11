import { useState } from "react";
import { Volume2, VolumeX, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTTSPlayer, TTSVoice } from "@/hooks/useTTS";
import { toast } from "sonner";

interface TTSControlsProps {
  text: string;
  className?: string;
}

const voices: { value: TTSVoice; label: string }[] = [
  { value: "nova", label: "Nova (Femenina)" },
  { value: "alloy", label: "Alloy (Neutral)" },
  { value: "echo", label: "Echo (Masculina)" },
  { value: "fable", label: "Fable (Masculina)" },
  { value: "onyx", label: "Onyx (Masculina)" },
  { value: "shimmer", label: "Shimmer (Femenina)" },
];

export function TTSControls({ text, className = "" }: TTSControlsProps) {
  const [selectedVoice, setSelectedVoice] = useState<TTSVoice>("nova");
  const [speed, setSpeed] = useState<number>(1.0);
  const [isPlaying, setIsPlaying] = useState(false);
  const { play, isLoading } = useTTSPlayer();

  const handlePlay = async () => {
    if (!text || text.trim().length === 0) {
      toast.error("No hay texto para leer");
      return;
    }

    setIsPlaying(true);
    try {
      await play(text, { voice: selectedVoice, speed });
      toast.success("Audio completado");
    } catch (error) {
      console.error("TTS playback error:", error);
      toast.error("Error al reproducir audio");
    } finally {
      setIsPlaying(false);
    }
  };

  return (
    <div className={`flex flex-col gap-4 p-4 bg-white/90 rounded-lg shadow-md ${className}`}>
      <div className="flex items-center gap-3">
        <Button
          onClick={handlePlay}
          disabled={isLoading || isPlaying || !text}
          size="lg"
          className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
        >
          {isLoading || isPlaying ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Reproduciendo...</span>
            </>
          ) : (
            <>
              <Volume2 className="w-5 h-5" />
              <span>Escuchar</span>
            </>
          )}
        </Button>

        <Select
          value={selectedVoice}
          onValueChange={(value) => setSelectedVoice(value as TTSVoice)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Selecciona voz" />
          </SelectTrigger>
          <SelectContent>
            {voices.map((voice) => (
              <SelectItem key={voice.value} value={voice.value}>
                {voice.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-sm font-medium min-w-[120px]">
          Velocidad: {speed.toFixed(2)}x
        </span>
        <Slider
          value={[speed]}
          onValueChange={(values) => setSpeed(values[0])}
          min={0.25}
          max={2.0}
          step={0.25}
          className="flex-1"
        />
      </div>
    </div>
  );
}
