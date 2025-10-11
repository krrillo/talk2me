import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { GameSpec } from "@/lib/types";
import { useDrag, useDrop } from "react-dnd";
import gsap from "gsap";
import { StoryContext } from "./StoryContext";

interface OrderSentenceGameProps {
  spec: GameSpec;
  onComplete: (result: { correct: boolean; score: number }) => void;
}

interface DraggableWordProps {
  word: string;
  index: number;
  moveWord: (dragIndex: number, dropIndex: number) => void;
}

function DraggableWord({ word, index, moveWord }: DraggableWordProps) {
  const ref = useRef<HTMLDivElement>(null);
  
  const [{ isDragging }, drag] = useDrag(() => ({
    type: "word",
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }), [index]);

  const [, drop] = useDrop(() => ({
    accept: "word",
    hover: (item: { index: number }) => {
      if (item.index !== index) {
        console.log(`Moving word from ${item.index} to ${index}`);
        moveWord(item.index, index);
        item.index = index;
      }
    },
  }), [index, moveWord]);

  drag(drop(ref));

  useEffect(() => {
    if (ref.current) {
      gsap.set(ref.current, {
        scale: isDragging ? 1.1 : 1,
        opacity: isDragging ? 0.8 : 1,
        rotation: isDragging ? 2 : 0,
      });
    }
  }, [isDragging]);

  return (
    <div
      ref={ref}
      className={`
        px-4 py-3 bg-gradient-to-r from-green-400 to-blue-500 text-white
        rounded-lg font-semibold cursor-move shadow-md border-2 border-white/20
        hover:shadow-lg transition-all duration-200 text-center
        ${isDragging ? 'z-50' : ''}
      `}
    >
      {word}
    </div>
  );
}

function OrderSentenceGame({ spec, onComplete }: OrderSentenceGameProps) {
  const [words, setWords] = useState<string[]>([]);
  const [attempts, setAttempts] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const gameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (spec.exercise?.payload?.words) {
      // Shuffle the words for the initial state
      const shuffled = [...spec.exercise.payload.words].sort(() => Math.random() - 0.5);
      setWords(shuffled);
    }
  }, [spec]);

  const moveWord = (dragIndex: number, dropIndex: number) => {
    const dragWord = words[dragIndex];
    const newWords = [...words];
    newWords.splice(dragIndex, 1);
    newWords.splice(dropIndex, 0, dragWord);
    setWords(newWords);
  };

  const handleCheck = () => {
    const currentAttempt = attempts; // Capturar el valor antes de incrementar
    setAttempts(prev => prev + 1);
    const userSentence = words.join(' ');
    const correctSentence = spec.exercise?.payload?.correct || '';
    const isCorrect = userSentence.toLowerCase() === correctSentence.toLowerCase();
    
    if (gameRef.current) {
      if (isCorrect) {
        gsap.to(gameRef.current, {
          scale: 1.02,
          duration: 0.3,
          yoyo: true,
          repeat: 1,
          ease: "back.out(1.7)"
        });
        toast.success("¡Perfecto! ¡Oración correcta!");
        
        setTimeout(() => {
          setShowResult(true);
          onComplete({ correct: true, score: Math.max(100 - (currentAttempt * 20), 20) });
        }, 1500);
      } else {
        gsap.to(gameRef.current, {
          x: -8,
          duration: 0.1,
          yoyo: true,
          repeat: 6,
          ease: "power2.inOut"
        });
        
        // Retroalimentación progresiva según intentos (usando currentAttempt)
        const hints = spec.exercise?.payload?.hints || [];
        const explanation = spec.exercise?.payload?.explanation;
        
        if (currentAttempt === 0 && hints[0]) {
          // Primer intento: pista sutil
          setFeedbackMessage(`💡 Pista: ${hints[0]}`);
          toast.info("¡Inténtalo de nuevo!");
        } else if (currentAttempt === 1 && hints[1]) {
          // Segundo intento: pista más específica
          setFeedbackMessage(`💡 Pista: ${hints[1]}`);
          toast.info("¡Casi! Piensa un poco más...");
        } else if (currentAttempt >= 2) {
          // Tercer intento: mostrar explicación completa
          setFeedbackMessage(
            explanation 
              ? `✨ ${explanation}\n\n✅ La oración correcta es: "${correctSentence}"`
              : `✅ La oración correcta es: "${correctSentence}"`
          );
          toast.warning("Te mostramos la respuesta");
          
          // Después de 3 intentos, completar con puntuación mínima
          setTimeout(() => {
            setShowResult(true);
            onComplete({ correct: false, score: 40 });
          }, 4000);
        }
        
        setShowFeedback(true);
      }
    }
  };

  const handleShuffle = () => {
    const shuffled = [...words].sort(() => Math.random() - 0.5);
    setWords(shuffled);
    
    if (gameRef.current) {
      gsap.fromTo(gameRef.current.querySelectorAll('.word-item'), 
        { scale: 0.8, opacity: 0.5 },
        { scale: 1, opacity: 1, duration: 0.3, stagger: 0.1 }
      );
    }
  };

  const getCurrentSentence = () => words.join(' ');

  return (
    <div ref={gameRef} className="max-w-4xl mx-auto">
      <Card className="overflow-hidden">
        <CardContent className="p-8">
            {/* Instructions */}
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">Ordena las palabras</h2>
              <p className="text-gray-600">
                Arrastra las palabras para formar la oración correcta
              </p>
            </div>

            {/* Story Context */}
            {spec.story && (
              <StoryContext story={spec.story} storyId={spec.storyId} colorScheme="green" />
            )}

            {/* Current Sentence Preview */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3 text-center">Tu oración:</h3>
              <div className="p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 min-h-[60px] flex items-center justify-center">
                <p className="text-xl text-gray-700 font-medium text-center">
                  {getCurrentSentence() || "Arrastra las palabras aquí..."}
                </p>
              </div>
            </div>

            {/* Draggable Words */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4 text-center">
                Palabras para ordenar:
              </h3>
              <div className="flex flex-wrap justify-center gap-3">
                {words.map((word, index) => (
                  <div key={`${word}-${index}`} className="word-item">
                    <DraggableWord
                      word={word}
                      index={index}
                      moveWord={moveWord}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Controls */}
            <div className="flex justify-center gap-4 mb-4">
              <Button
                onClick={handleShuffle}
                variant="outline"
                size="lg"
                disabled={showResult}
              >
                Mezclar palabras
              </Button>
              <Button
                onClick={handleCheck}
                variant="game"
                size="lg"
                disabled={words.length === 0 || showResult}
              >
                Comprobar oración
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

export default OrderSentenceGame;
