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

interface AvailableWordProps {
  word: string;
  index: number;
  onMoveToSentence: (word: string, index: number) => void;
}

function AvailableWord({ word, index, onMoveToSentence }: AvailableWordProps) {
  const ref = useRef<HTMLDivElement>(null);
  
  const [{ isDragging }, drag] = useDrag({
    type: "available_word",
    item: () => ({ word, index, source: "available" }),
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  drag(ref);

  useEffect(() => {
    if (ref.current) {
      gsap.set(ref.current, {
        scale: isDragging ? 1.1 : 1,
        opacity: isDragging ? 0.5 : 1,
      });
    }
  }, [isDragging]);

  return (
    <div
      ref={ref}
      onClick={() => onMoveToSentence(word, index)}
      className={`
        px-4 py-3 bg-gradient-to-r from-purple-400 to-pink-500 text-white
        rounded-lg font-semibold cursor-pointer shadow-md border-2 border-white/20
        hover:shadow-lg hover:scale-105 transition-all duration-200 text-center
        ${isDragging ? 'opacity-50' : ''}
      `}
    >
      {word}
    </div>
  );
}

interface SentenceWordProps {
  word: string;
  index: number;
  onMoveToAvailable: (word: string, index: number) => void;
  onReorder: (dragIndex: number, dropIndex: number) => void;
}

function SentenceWord({ word, index, onMoveToAvailable, onReorder }: SentenceWordProps) {
  const ref = useRef<HTMLDivElement>(null);
  
  const [{ isDragging }, drag] = useDrag({
    type: "sentence_word",
    item: () => ({ word, index, source: "sentence" }),
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: "sentence_word",
    hover: (item: { index: number; source: string }) => {
      if (item.source === "sentence" && item.index !== index) {
        onReorder(item.index, index);
        item.index = index;
      }
    },
  });

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
      onDoubleClick={() => onMoveToAvailable(word, index)}
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
  const [availableWords, setAvailableWords] = useState<string[]>([]);
  const [sentenceWords, setSentenceWords] = useState<string[]>([]);
  const [attempts, setAttempts] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const gameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (spec.exercise?.payload?.words) {
      // Shuffle the words and put them in the available area
      const shuffled = [...spec.exercise.payload.words].sort(() => Math.random() - 0.5);
      setAvailableWords(shuffled);
      setSentenceWords([]);
    }
  }, [spec]);

  const moveWordToSentence = (word: string, fromIndex: number) => {
    // Remove from available, add to sentence
    const newAvailable = availableWords.filter((_, i) => i !== fromIndex);
    setAvailableWords(newAvailable);
    setSentenceWords([...sentenceWords, word]);
  };

  const moveWordToAvailable = (word: string, fromIndex: number) => {
    // Remove from sentence, add back to available
    const newSentence = sentenceWords.filter((_, i) => i !== fromIndex);
    setSentenceWords(newSentence);
    setAvailableWords([...availableWords, word]);
  };

  const moveWithinSentence = (dragIndex: number, dropIndex: number) => {
    const dragWord = sentenceWords[dragIndex];
    const newWords = [...sentenceWords];
    newWords.splice(dragIndex, 1);
    newWords.splice(dropIndex, 0, dragWord);
    setSentenceWords(newWords);
  };

  const handleCheck = () => {
    if (sentenceWords.length === 0) {
      toast.warning("¡Arrastra palabras para formar la oración!");
      return;
    }
    
    const currentAttempt = attempts;
    setAttempts(prev => prev + 1);
    const userSentence = sentenceWords.join(' ');
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
    const allWords = [...availableWords, ...sentenceWords];
    const shuffled = [...allWords].sort(() => Math.random() - 0.5);
    setAvailableWords(shuffled);
    setSentenceWords([]);
    
    if (gameRef.current) {
      gsap.fromTo(gameRef.current.querySelectorAll('.word-item'), 
        { scale: 0.8, opacity: 0.5 },
        { scale: 1, opacity: 1, duration: 0.3, stagger: 0.1 }
      );
    }
  };

  const getCurrentSentence = () => sentenceWords.join(' ');

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

            {/* Palabras disponibles */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4 text-center text-purple-600">
                📦 Palabras disponibles (haz clic o arrastra):
              </h3>
              <div className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200 min-h-[100px]">
                <div className="flex flex-wrap justify-center gap-3">
                  {availableWords.map((word, index) => (
                    <div key={`available-${word}-${index}`} className="word-item">
                      <AvailableWord
                        word={word}
                        index={index}
                        onMoveToSentence={moveWordToSentence}
                      />
                    </div>
                  ))}
                  {availableWords.length === 0 && (
                    <p className="text-purple-400 text-center">
                      Todas las palabras están en uso
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Zona de construcción de oración */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3 text-center text-green-600">
                ✨ Tu oración (arrastra para reordenar, doble clic para quitar):
              </h3>
              <div className="p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border-2 border-dashed border-green-300 min-h-[120px]">
                {sentenceWords.length > 0 ? (
                  <div className="flex flex-wrap justify-center gap-3 mb-4">
                    {sentenceWords.map((word, index) => (
                      <div key={`sentence-${word}-${index}`} className="word-item">
                        <SentenceWord
                          word={word}
                          index={index}
                          onMoveToAvailable={moveWordToAvailable}
                          onReorder={moveWithinSentence}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-20">
                    <p className="text-gray-400 text-center">
                      Haz clic en las palabras de arriba para construir tu oración
                    </p>
                  </div>
                )}
                {sentenceWords.length > 0 && (
                  <div className="text-center mt-4 p-3 bg-white/50 rounded-lg">
                    <p className="text-xl text-gray-800 font-medium">
                      {getCurrentSentence()}
                    </p>
                  </div>
                )}
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
                disabled={sentenceWords.length === 0 || showResult}
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
