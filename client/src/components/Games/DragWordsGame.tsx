import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { GameSpec } from "@/lib/types";
import { useDrag, useDrop, DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import gsap from "gsap";

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
  const gameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (spec.exercise?.payload?.options) {
      setAvailableWords([...spec.exercise.payload.options]);
    }
  }, [spec]);

  const handleDrop = (word: string) => {
    setDroppedWord(word);
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
        toast.error(`No es correcto. La respuesta era: ${spec.exercise?.payload?.correct}`);
        
        setTimeout(() => {
          setShowResult(true);
          onComplete({ correct: false, score: 0 });
        }, 2000);
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
    <DndProvider backend={HTML5Backend}>
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
              <div className="mb-6 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                <p className="text-gray-700 text-lg leading-relaxed">
                  {spec.story}
                </p>
              </div>
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
                disabled={!droppedWord || showResult}
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
    </DndProvider>
  );
}

export default DragWordsGame;
