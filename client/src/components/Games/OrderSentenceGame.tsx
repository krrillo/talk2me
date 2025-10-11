import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { GameSpec } from "@/lib/types";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import gsap from "gsap";

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
  }));

  const [, drop] = useDrop(() => ({
    accept: "word",
    hover: (item: { index: number }) => {
      if (item.index !== index) {
        moveWord(item.index, index);
        item.index = index;
      }
    },
  }));

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
          onComplete({ correct: true, score: Math.max(100 - (attempts * 15), 30) });
        }, 1500);
      } else {
        gsap.to(gameRef.current, {
          x: -8,
          duration: 0.1,
          yoyo: true,
          repeat: 6,
          ease: "power2.inOut"
        });
        toast.error(`Intenta de nuevo. La oración correcta es: ${correctSentence}`);
        
        if (attempts >= 2) {
          setTimeout(() => {
            setShowResult(true);
            onComplete({ correct: false, score: 10 });
          }, 2500);
        }
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
    <DndProvider backend={HTML5Backend}>
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
              <div className="mb-6 p-4 bg-green-50 rounded-lg border-l-4 border-green-400">
                <p className="text-gray-700 text-lg leading-relaxed">
                  {spec.story}
                </p>
              </div>
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

            {/* Attempts Counter */}
            <div className="text-center text-sm text-gray-500">
              Intento: {attempts + 1} de 3
            </div>

            {/* Hint */}
            {attempts > 0 && attempts < 3 && (
              <div className="mt-4 p-3 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
                <p className="text-sm text-yellow-700">
                  💡 Pista: Recuerda el orden típico en español: sujeto + verbo + complemento
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DndProvider>
  );
}

export default OrderSentenceGame;
