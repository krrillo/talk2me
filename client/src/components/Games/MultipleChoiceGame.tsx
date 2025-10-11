import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { GameSpec } from "@/lib/types";
import gsap from "gsap";
import { StoryContext } from "./StoryContext";

interface MultipleChoiceGameProps {
  spec: GameSpec;
  onComplete: (result: { correct: boolean; score: number }) => void;
}

interface ChoiceButtonProps {
  choice: string;
  index: number;
  isSelected: boolean;
  isRevealed: boolean;
  isCorrect: boolean;
  onClick: () => void;
}

function ChoiceButton({ choice, index, isSelected, isRevealed, isCorrect, onClick }: ChoiceButtonProps) {
  const ref = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isRevealed && ref.current) {
      if (isCorrect && isSelected) {
        // Correct answer animation
        gsap.fromTo(ref.current, 
          { scale: 1 },
          { 
            scale: 1.1, 
            duration: 0.3, 
            yoyo: true, 
            repeat: 1,
            ease: "back.out(1.7)"
          }
        );
      } else if (!isCorrect && isSelected) {
        // Wrong answer animation
        gsap.to(ref.current, {
          x: -5,
          duration: 0.1,
          yoyo: true,
          repeat: 5,
          ease: "power2.inOut"
        });
      }
    }
  }, [isRevealed, isCorrect, isSelected]);

  const getButtonStyle = () => {
    if (!isRevealed) {
      if (isSelected) {
        return "bg-gradient-to-r from-blue-500 to-purple-600 text-white border-blue-500";
      }
      return "bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:bg-blue-50";
    }
    
    if (isCorrect) {
      return "bg-gradient-to-r from-green-500 to-emerald-600 text-white border-green-500";
    } else if (isSelected) {
      return "bg-gradient-to-r from-red-500 to-pink-600 text-white border-red-500";
    }
    return "bg-gray-100 text-gray-500 border-gray-300";
  };

  const getIcon = () => {
    if (!isRevealed) return null;
    if (isCorrect) return "✓";
    if (isSelected) return "✗";
    return null;
  };

  return (
    <button
      ref={ref}
      onClick={onClick}
      disabled={isRevealed}
      className={`
        w-full p-4 rounded-xl border-2 font-semibold text-lg
        transition-all duration-200 text-left
        ${getButtonStyle()}
        ${!isRevealed ? 'hover:scale-105 active:scale-95' : ''}
        disabled:cursor-not-allowed
      `}
    >
      <div className="flex items-center justify-between">
        <span className="flex items-center">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-black/10 text-sm font-bold mr-3">
            {String.fromCharCode(65 + index)}
          </span>
          {choice}
        </span>
        {getIcon() && (
          <span className="text-2xl font-bold">{getIcon()}</span>
        )}
      </div>
    </button>
  );
}

function MultipleChoiceGame({ spec, onComplete }: MultipleChoiceGameProps) {
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const gameRef = useRef<HTMLDivElement>(null);

  const question = spec.exercise?.payload?.question || "";
  const choices = spec.exercise?.payload?.choices || [];
  const correctIndex = spec.exercise?.payload?.correctIndex || 0;

  const handleChoiceSelect = (index: number) => {
    if (showResult) return;
    setSelectedChoice(index);
  };

  const handleSubmit = () => {
    if (selectedChoice === null || showResult) return;
    
    const currentAttempt = attempts;
    setAttempts(prev => prev + 1);
    
    const isCorrect = selectedChoice === correctIndex;
    
    if (isCorrect) {
      toast.success("¡Correcto!");
      
      if (gameRef.current) {
        gsap.to(gameRef.current, {
          scale: 1.02,
          duration: 0.3,
          yoyo: true,
          repeat: 1,
          ease: "back.out(1.7)"
        });
      }
      
      setTimeout(() => {
        setShowResult(true);
        onComplete({ correct: true, score: Math.max(100 - (currentAttempt * 20), 20) });
      }, 1500);
    } else {
      if (gameRef.current) {
        gsap.to(gameRef.current, {
          x: -8,
          duration: 0.1,
          yoyo: true,
          repeat: 6,
          ease: "power2.inOut"
        });
      }
      
      // Retroalimentación progresiva según intentos
      const hints = spec.exercise?.payload?.hints || [];
      const explanation = spec.exercise?.payload?.explanation;
      
      if (currentAttempt === 0 && hints[0]) {
        // Primer intento: pista sutil
        setFeedbackMessage(`💡 Pista: ${hints[0]}`);
        toast.info("¡Inténtalo de nuevo!");
        setSelectedChoice(null); // Permitir reseleccionar
      } else if (currentAttempt === 1 && hints[1]) {
        // Segundo intento: pista más específica
        setFeedbackMessage(`💡 Pista: ${hints[1]}`);
        toast.info("¡Casi! Piensa un poco más...");
        setSelectedChoice(null); // Permitir reseleccionar
      } else if (currentAttempt >= 2) {
        // Tercer intento: mostrar explicación completa
        setFeedbackMessage(
          explanation 
            ? `✨ ${explanation}\n\n✅ La respuesta correcta es: "${choices[correctIndex]}"`
            : `✅ La respuesta correcta es: "${choices[correctIndex]}"`
        );
        toast.warning("Te mostramos la respuesta");
        
        // Deshabilitar inmediatamente para evitar clics adicionales
        setShowResult(true);
        
        // Después de 3 intentos, completar con puntuación mínima
        setTimeout(() => {
          onComplete({ correct: false, score: 40 });
        }, 4000);
      }
      
      setShowFeedback(true);
      
      // Ocultar feedback después de 3 segundos para permitir reintento
      if (currentAttempt < 2) {
        setTimeout(() => {
          setShowFeedback(false);
        }, 3000);
      }
    }
  };

  return (
    <div ref={gameRef} className="max-w-4xl mx-auto">
      <Card className="overflow-hidden">
        <CardContent className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-2">Selección múltiple</h2>
            <p className="text-gray-600">Elige la respuesta correcta</p>
          </div>

          {/* Story Context */}
          {spec.story && (
            <StoryContext story={spec.story} colorScheme="indigo" />
          )}

          {/* Question */}
          <div className="mb-8">
            <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200">
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Pregunta:</h3>
              <p className="text-lg text-gray-700 leading-relaxed">
                {question}
              </p>
            </div>
          </div>

          {/* Choices */}
          <div className="mb-8 space-y-4">
            <h3 className="text-lg font-semibold mb-4">Opciones:</h3>
            {choices.map((choice: string, index: number) => (
              <ChoiceButton
                key={index}
                choice={choice}
                index={index}
                isSelected={selectedChoice === index}
                isRevealed={showResult}
                isCorrect={index === correctIndex}
                onClick={() => handleChoiceSelect(index)}
              />
            ))}
          </div>

          {/* Submit Button */}
          <div className="text-center mb-6">
            <Button
              onClick={handleSubmit}
              variant="game"
              size="lg"
              disabled={selectedChoice === null || showResult}
            >
              {showResult ? "Respuesta enviada" : "Confirmar respuesta"}
            </Button>
          </div>

          {/* Feedback Card */}
          {showFeedback && feedbackMessage && (
            <div className="mb-6 p-6 bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-xl animate-pulse">
              <div className="flex items-start gap-4">
                <div className="text-4xl">
                  {attempts === 1 ? "💡" : attempts === 2 ? "🤔" : "✨"}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    {attempts === 1 ? "Pista" : attempts === 2 ? "Otra pista" : "Explicación"}
                  </h3>
                  <p className="text-gray-800 text-base leading-relaxed whitespace-pre-line">
                    {feedbackMessage}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Attempts Counter */}
          <div className="text-center text-sm text-gray-500">
            Intento: {attempts + 1}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default MultipleChoiceGame;
