import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { GameSpec } from "@/lib/types";
import gsap from "gsap";
import { StoryContext } from "./StoryContext";

interface CompleteWordsGameProps {
  spec: GameSpec;
  onComplete: (result: { correct: boolean; score: number }) => void;
}

function CompleteWordsGame({ spec, onComplete }: CompleteWordsGameProps) {
  const [userInput, setUserInput] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [hints, setHints] = useState<string[]>([]);
  const [showHint, setShowHint] = useState(false);
  const gameRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const incompleteText = spec.exercise?.payload?.sentence || "";
  const correctAnswer = spec.exercise?.payload?.correct || "";
  const availableHints = spec.exercise?.payload?.hints || [];

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim()) {
      toast.warning("¡Escribe tu respuesta!");
      return;
    }

    setAttempts(prev => prev + 1);
    const isCorrect = userInput.trim().toLowerCase() === correctAnswer.toLowerCase();
    
    if (gameRef.current) {
      if (isCorrect) {
        gsap.to(gameRef.current, {
          scale: 1.05,
          duration: 0.4,
          yoyo: true,
          repeat: 1,
          ease: "back.out(1.7)"
        });
        toast.success("¡Excelente! ¡Palabra correcta!");
        
        setTimeout(() => {
          setShowResult(true);
          onComplete({ correct: true, score: Math.max(100 - (attempts * 10), 40) });
        }, 1500);
      } else {
        gsap.to(gameRef.current, {
          x: -10,
          duration: 0.1,
          yoyo: true,
          repeat: 5,
          ease: "power2.inOut"
        });
        toast.error("No es correcto, ¡sigue intentando!");
        
        // Show hint after second attempt
        if (attempts === 1 && availableHints.length > 0) {
          setShowHint(true);
          setHints([availableHints[0]]);
        } else if (attempts === 2 && availableHints.length > 1) {
          setHints(prev => [...prev, availableHints[1]]);
        }

        if (attempts >= 3) {
          toast.error(`La respuesta correcta era: ${correctAnswer}`);
          setTimeout(() => {
            setShowResult(true);
            onComplete({ correct: false, score: 10 });
          }, 2500);
        }
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserInput(e.target.value);
    
    // Auto-complete suggestions based on partial input
    if (e.target.value.length >= 2) {
      const partial = e.target.value.toLowerCase();
      const matches = correctAnswer.toLowerCase().startsWith(partial);
      
      if (matches && e.target.value.length < correctAnswer.length) {
        // Visual feedback for correct start
        if (inputRef.current) {
          inputRef.current.style.borderColor = "#10B981";
          inputRef.current.style.boxShadow = "0 0 0 2px rgb(16 185 129 / 0.2)";
        }
      } else {
        // Reset to default
        if (inputRef.current) {
          inputRef.current.style.borderColor = "";
          inputRef.current.style.boxShadow = "";
        }
      }
    }
  };

  const handleGiveHint = () => {
    if (!showHint && availableHints.length > 0) {
      setShowHint(true);
      setHints([availableHints[0]]);
    } else if (hints.length < availableHints.length) {
      setHints(prev => [...prev, availableHints[prev.length]]);
    }
  };

  const renderTextWithBlank = () => {
    const parts = incompleteText.split("___");
    if (parts.length !== 2) return incompleteText;
    
    return (
      <>
        {parts[0]}
        <span className="inline-block mx-2 px-3 py-1 bg-yellow-100 border-2 border-yellow-400 border-dashed rounded-md min-w-[120px] text-center font-bold">
          {userInput || "___"}
        </span>
        {parts[1]}
      </>
    );
  };

  return (
    <div ref={gameRef} className="max-w-4xl mx-auto">
      <Card className="overflow-hidden">
        <CardContent className="p-8">
          {/* Instructions */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-2">Completa la palabra</h2>
            <p className="text-gray-600">
              Escribe la palabra que falta en la oración
            </p>
          </div>

          {/* Story Context */}
          {spec.story && (
            <StoryContext story={spec.story} colorScheme="purple" />
          )}

          {/* Sentence with blank */}
          <div className="mb-8">
            <div className="p-6 bg-gray-50 rounded-xl border-2 border-gray-200">
              <p className="text-2xl text-gray-800 font-medium text-center leading-relaxed">
                {renderTextWithBlank()}
              </p>
            </div>
          </div>

          {/* Input form */}
          <form onSubmit={handleSubmit} className="mb-6">
            <div className="flex gap-4 max-w-md mx-auto">
              <Input
                ref={inputRef}
                type="text"
                value={userInput}
                onChange={handleInputChange}
                placeholder="Escribe aquí..."
                className="text-lg py-3 text-center font-semibold"
                disabled={showResult}
                maxLength={20}
              />
              <Button
                type="submit"
                variant="game"
                size="lg"
                disabled={!userInput.trim() || showResult}
              >
                Comprobar
              </Button>
            </div>
          </form>

          {/* Hints */}
          {showHint && hints.length > 0 && (
            <div className="mb-6">
              <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-400">
                <h3 className="font-semibold text-blue-800 mb-2">💡 Pistas:</h3>
                <ul className="text-blue-700 space-y-1">
                  {hints.map((hint, index) => (
                    <li key={index} className="flex items-center">
                      <span className="w-2 h-2 bg-blue-400 rounded-full mr-3"></span>
                      {hint}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="flex justify-center gap-4 mb-4">
            <Button
              onClick={handleGiveHint}
              variant="outline"
              size="lg"
              disabled={showResult || hints.length >= availableHints.length}
            >
              {!showHint ? "Mostrar pista" : "Más pistas"}
            </Button>
            <Button
              onClick={() => setUserInput("")}
              variant="outline"
              size="lg"
              disabled={!userInput || showResult}
            >
              Borrar
            </Button>
          </div>

          {/* Attempts Counter */}
          <div className="text-center text-sm text-gray-500">
            Intento: {attempts + 1} de 4
          </div>

          {/* Progress indicator */}
          {attempts > 0 && attempts < 4 && (
            <div className="mt-4">
              <div className="bg-gray-200 rounded-full h-2 max-w-xs mx-auto">
                <div 
                  className="bg-gradient-to-r from-blue-400 to-purple-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(attempts / 4) * 100}%` }}
                ></div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default CompleteWordsGame;
