import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { GameSpec } from "@/lib/types";
import gsap from "gsap";

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
  const [isRevealed, setIsRevealed] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30); // 30 seconds timer
  const [timerActive, setTimerActive] = useState(false);
  const gameRef = useRef<HTMLDivElement>(null);

  const question = spec.exercise?.payload?.question || "";
  const choices = spec.exercise?.payload?.choices || [];
  const correctIndex = spec.exercise?.payload?.correctIndex || 0;

  useEffect(() => {
    // Start timer when component mounts
    setTimerActive(true);
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setTimerActive(false);
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleTimeUp = () => {
    if (!isRevealed) {
      toast.warning("¡Se acabó el tiempo!");
      setIsRevealed(true);
      setTimeout(() => {
        onComplete({ correct: false, score: 0 });
      }, 2000);
    }
  };

  const handleChoiceSelect = (index: number) => {
    if (isRevealed || !timerActive) return;
    setSelectedChoice(index);
  };

  const handleSubmit = () => {
    if (selectedChoice === null || isRevealed) return;
    
    setTimerActive(false);
    setIsRevealed(true);
    
    const isCorrect = selectedChoice === correctIndex;
    const timeBonus = Math.floor((timeLeft / 30) * 20); // Up to 20 bonus points for speed
    const baseScore = isCorrect ? 80 : 0;
    const finalScore = isCorrect ? baseScore + timeBonus : 0;
    
    if (isCorrect) {
      toast.success(`¡Correcto! +${finalScore} puntos`);
    } else {
      toast.error(`Incorrecto. La respuesta correcta era: ${choices[correctIndex]}`);
    }
    
    setTimeout(() => {
      onComplete({ correct: isCorrect, score: finalScore });
    }, 3000);
  };

  const getTimerColor = () => {
    if (timeLeft > 20) return "text-green-600";
    if (timeLeft > 10) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div ref={gameRef} className="max-w-4xl mx-auto">
      <Card className="overflow-hidden">
        <CardContent className="p-8">
          {/* Header with timer */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Selección múltiple</h2>
            <div className={`text-xl font-bold ${getTimerColor()}`}>
              ⏰ {timeLeft}s
            </div>
          </div>

          {/* Story Context */}
          {spec.story && (
            <div className="mb-6 p-4 bg-indigo-50 rounded-lg border-l-4 border-indigo-400">
              <p className="text-gray-700 text-lg leading-relaxed">
                {spec.story}
              </p>
            </div>
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
            <h3 className="text-lg font-semibold mb-4">Elige la respuesta correcta:</h3>
            {choices.map((choice: string, index: number) => (
              <ChoiceButton
                key={index}
                choice={choice}
                index={index}
                isSelected={selectedChoice === index}
                isRevealed={isRevealed}
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
              size="xl"
              disabled={selectedChoice === null || isRevealed || !timerActive}
            >
              {isRevealed ? "Respuesta enviada" : "Confirmar respuesta"}
            </Button>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="bg-gray-200 rounded-full h-3">
              <div 
                className={`h-3 rounded-full transition-all duration-1000 ${
                  timeLeft > 20 ? 'bg-green-500' : 
                  timeLeft > 10 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${(timeLeft / 30) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Explanation (shown after answer) */}
          {isRevealed && spec.exercise?.payload?.explanation && (
            <div className="p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
              <h3 className="font-semibold text-yellow-800 mb-2">💡 Explicación:</h3>
              <p className="text-yellow-700">
                {spec.exercise.payload.explanation}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default MultipleChoiceGame;
