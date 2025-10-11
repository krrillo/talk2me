import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import gsap from "gsap";
import { ArrowRight, Volume2 } from "lucide-react";
import { VocabularyItem } from "@/lib/types";

interface VocabularyPreviewProps {
  vocabulary: VocabularyItem[];
  onContinue: () => void;
}

export function VocabularyPreview({ vocabulary, onContinue }: VocabularyPreviewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (cardRef.current) {
      gsap.fromTo(
        cardRef.current,
        { opacity: 0, y: 30, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: "back.out(1.7)" }
      );
    }
  }, [currentIndex]);

  const currentWord = vocabulary[currentIndex];
  const isLastWord = currentIndex === vocabulary.length - 1;

  const handleNext = () => {
    if (cardRef.current) {
      gsap.to(cardRef.current, {
        opacity: 0,
        x: -50,
        duration: 0.3,
        ease: "power2.in",
        onComplete: () => {
          if (isLastWord) {
            onContinue();
          } else {
            setCurrentIndex(prev => prev + 1);
          }
        },
      });
    }
  };

  if (!currentWord) {
    onContinue();
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            📚 Palabras Importantes
          </h1>
          <p className="text-xl text-gray-900 font-medium">
            Aprende estas palabras antes de leer la historia
          </p>
          <div className="mt-4 flex justify-center gap-2">
            {vocabulary.map((_, index) => (
              <div
                key={index}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? "w-8 bg-blue-500"
                    : index < currentIndex
                    ? "w-2 bg-green-500"
                    : "w-2 bg-gray-300"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Vocabulary Card */}
        <Card
          ref={cardRef}
          className="overflow-hidden shadow-2xl border-4 border-blue-200"
        >
          <CardContent className="p-0">
            <div className="grid md:grid-cols-2 gap-0">
              {/* Image Section */}
              <div className="bg-gradient-to-br from-blue-100 to-purple-100 p-8 flex items-center justify-center min-h-[300px]">
                {currentWord.imageUrl ? (
                  <img
                    src={currentWord.imageUrl}
                    alt={currentWord.word}
                    className="max-w-full max-h-[400px] object-contain rounded-lg shadow-lg"
                  />
                ) : (
                  <div className="text-9xl">📖</div>
                )}
              </div>

              {/* Text Section */}
              <div className="p-8 bg-white flex flex-col justify-center">
                <div className="mb-6">
                  <h2 className="text-5xl font-bold text-black mb-4">
                    {currentWord.word}
                  </h2>
                  <div className="h-1 w-20 bg-black rounded-full mb-4"></div>
                </div>

                <div className="space-y-6">
                  <div>
                    <p className="text-base font-bold text-gray-900 uppercase tracking-wide mb-3">
                      ¿Qué significa?
                    </p>
                    <p className="text-2xl text-black leading-relaxed font-semibold">
                      {currentWord.definition}
                    </p>
                  </div>

                  <div>
                    <p className="text-base font-bold text-gray-900 uppercase tracking-wide mb-3">
                      Ejemplo
                    </p>
                    <p className="text-xl text-black leading-relaxed font-medium italic">
                      "{currentWord.example}"
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Action Bar */}
            <div className="bg-gray-100 border-t-4 border-black p-6 flex justify-between items-center">
              <div className="text-black font-bold text-xl">
                Palabra {currentIndex + 1} de {vocabulary.length}
              </div>
              <Button
                onClick={handleNext}
                size="lg"
                className="bg-black text-white hover:bg-gray-900 font-bold text-xl px-8 py-6 shadow-lg"
              >
                {isLastWord ? (
                  <>
                    Leer historia <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                ) : (
                  <>
                    Siguiente <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Skip Button */}
        <div className="text-center mt-6">
          <button
            onClick={onContinue}
            className="text-gray-900 hover:text-black underline text-xl font-semibold"
          >
            Saltar vocabulario
          </button>
        </div>
      </div>
    </div>
  );
}
