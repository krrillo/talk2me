import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { GameSpec } from "@/lib/types";
import { useDrag, useDrop } from "react-dnd";
import gsap from "gsap";
import { StoryContext } from "./StoryContext";

interface DragWordsGameProps {
  spec: GameSpec;
  onComplete: (result: { correct: boolean; score: number }) => void;
}

interface DraggableWordProps {
  word: string;
  index: number;
  onDrop: (word: string) => void;
}

interface DropZoneProps {
  onDrop: (word: string) => void;
  droppedWord: string | null;
  sentence: string;
}

function DraggableWord({ word, index, onDrop }: DraggableWordProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [{ isDragging }, drag] = useDrag(() => ({
    type: "word",
    item: { word, index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  drag(ref);

  useEffect(() => {
    if (ref.current) {
      gsap.set(ref.current, { 
        scale: 1,
        rotation: 0,
        opacity: isDragging ? 0.8 : 1
      });
      
      if (isDragging) {
        gsap.to(ref.current, {
          scale: 1.1,
          rotation: 5,
          duration: 0.2,
          ease: "back.out(1.7)"
        });
      }
    }
  }, [isDragging]);

  return (
    <div
      ref={ref}
      className={`
        drag-item px-6 py-3 bg-gradient-to-r from-blue-400 to-purple-500 text-white 
        rounded-xl font-bold text-lg cursor-grab shadow-lg border-2 border-white/20
        hover:shadow-xl transition-all duration-200
        ${isDragging ? 'dragging' : ''}
      `}
      style={{ opacity: isDragging ? 0.8 : 1 }}
    >
      {word}
    </div>
  );
}

function DropZone({ onDrop, droppedWord, sentence }: DropZoneProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [{ isOver }, drop] = useDrop(() => ({
    accept: "word",
    drop: (item: { word: string; index: number }) => {
      onDrop(item.word);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }));

  drop(ref);

  useEffect(() => {
    if (ref.current) {
      if (isOver) {
        gsap.to(ref.current, {
          scale: 1.05,
          backgroundColor: "#dbeafe",
          duration: 0.2,
        });
      } else {
        gsap.to(ref.current, {
          scale: 1,
          backgroundColor: "#f3f4f6",
          duration: 0.2,
        });
      }
    }
  }, [isOver]);

  const displaySentence = droppedWord 
    ? sentence.replace("___", droppedWord)
    : sentence;

  return (
    <div
      ref={ref}
      className={`
        drop-zone p-6 min-h-[120px] flex items-center justify-center
        text-xl font-semibold text-gray-700 text-center
        ${isOver ? 'drag-over' : ''}
        ${droppedWord ? 'bg-green-50 border-green-300' : 'bg-gray-100 border-gray-300'}
      `}
    >
      {displaySentence}
    </div>
  );
}

function DragWordsGame({ spec, onComplete }: DragWordsGameProps) {
  const [droppedWord, setDroppedWord] = useState<string | null>(null);
  const [availableWords, setAvailableWords] = useState<string[]>([]);
  const [attempts, setAttempts] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const gameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (spec.exercise?.payload?.options) {
      setAvailableWords([...spec.exercise.payload.options]);
    }
  }, [spec]);

  const handleDrop = (word: string) => {
    // Si ya hay una palabra en la zona de drop, la devolvemos a disponibles
    if (droppedWord && droppedWord !== word) {
      setAvailableWords(prev => [...prev, droppedWord]);
    }
    
    // Colocamos la nueva palabra
    setDroppedWord(word);
    
    // Removemos la palabra arrastrada de disponibles
    setAvailableWords(prev => prev.filter(w => w !== word));
  };

  const handleCheck = () => {
    if (!droppedWord) {
      toast.warning("¡Arrastra una palabra al espacio!");
      return;
    }

    setAttempts(prev => prev + 1);
    const isCorrect = droppedWord === spec.exercise?.payload?.correct;
    
    if (gameRef.current) {
      if (isCorrect) {
        gsap.to(gameRef.current, {
          scale: 1.05,
          duration: 0.3,
          yoyo: true,
          repeat: 1,
          ease: "back.out(1.7)"
        });
        toast.success("¡Excelente! ¡Respuesta correcta!");
        
        setTimeout(() => {
          setShowResult(true);
          onComplete({ correct: true, score: Math.max(100 - (attempts * 20), 20) });
        }, 1500);
      } else {
        gsap.to(gameRef.current, {
          x: -10,
          duration: 0.1,
          yoyo: true,
          repeat: 5,
          ease: "power2.inOut"
        });
        
        // Retroalimentación progresiva según intentos
        const hints = spec.exercise?.payload?.hints || [];
        const explanation = spec.exercise?.payload?.explanation;
        
        if (attempts === 0 && hints[0]) {
          // Primer intento: pista sutil
          setFeedbackMessage(`💡 Pista: ${hints[0]}`);
          toast.info("¡Inténtalo de nuevo!");
        } else if (attempts === 1 && hints[1]) {
          // Segundo intento: pista más específica
          setFeedbackMessage(`💡 Pista: ${hints[1]}`);
          toast.info("¡Casi! Piensa un poco más...");
        } else if (attempts >= 2) {
          // Tercer intento: mostrar explicación completa
          setFeedbackMessage(
            explanation 
              ? `✨ ${explanation}\n\n✅ La respuesta correcta es: "${spec.exercise?.payload?.correct}"`
              : `✅ La respuesta correcta es: "${spec.exercise?.payload?.correct}"`
          );
          toast.warning("Te mostramos la respuesta");
          
          // Después de 3 intentos, dar opción de completar con score mínimo de 40
          setTimeout(() => {
            setShowResult(true);
            onComplete({ correct: false, score: 40 });
          }, 4000);
        }
        
        setShowFeedback(true);
        
        // Devolver la palabra incorrecta a disponibles para que pueda intentar de nuevo
        setTimeout(() => {
          if (droppedWord) {
            setAvailableWords(prev => [...prev, droppedWord]);
            setDroppedWord(null);
          }
          setShowFeedback(false);
        }, 3000);
      }
    }
  };

  const handleReset = () => {
    if (droppedWord) {
      setAvailableWords(prev => [...prev, droppedWord]);
      setDroppedWord(null);
    }
  };

  return (
    <div ref={gameRef} className="max-w-4xl mx-auto">
      <Card className="overflow-hidden">
        <CardContent className="p-8">
          {/* Game Instructions */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-2">Completa la oración</h2>
            <p className="text-gray-600">
              Arrastra la palabra correcta al espacio en blanco
            </p>
          </div>

          {/* Story Context */}
          {spec.story && (
            <StoryContext story={spec.story} colorScheme="blue" />
          )}

          {/* Drop Zone */}
          <div className="mb-8">
            <DropZone 
              onDrop={handleDrop}
              droppedWord={droppedWord}
              sentence={spec.exercise?.payload?.sentence || ""}
            />
          </div>

          {/* Available Words */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4 text-center">
              Palabras disponibles:
            </h3>
            <div className="flex flex-wrap justify-center gap-4">
              {availableWords.map((word, index) => (
                <DraggableWord
                  key={`${word}-${index}`}
                  word={word}
                  index={index}
                  onDrop={handleDrop}
                />
              ))}
            </div>
          </div>

          {/* Feedback Card */}
          {showFeedback && feedbackMessage && (
            <div className="mb-6 p-6 bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-xl animate-pulse">
              <div className="flex items-start gap-4">
                <div className="text-4xl">
                  {attempts === 0 ? "💡" : attempts === 1 ? "🤔" : "✨"}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    {attempts === 0 ? "Pista" : attempts === 1 ? "Otra pista" : "Explicación"}
                  </h3>
                  <p className="text-gray-800 text-base leading-relaxed whitespace-pre-line">
                    {feedbackMessage}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="flex justify-center gap-4">
            <Button
              onClick={handleReset}
              variant="outline"
              size="lg"
              disabled={!droppedWord || showResult}
            >
              Reiniciar
            </Button>
            <Button
              onClick={handleCheck}
              variant="game"
              size="lg"
              disabled={!droppedWord || showResult || showFeedback}
            >
              Comprobar respuesta
            </Button>
          </div>

          {/* Attempts Counter */}
          <div className="mt-4 text-center text-sm text-gray-500">
            Intento: {attempts + 1}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default DragWordsGame;
