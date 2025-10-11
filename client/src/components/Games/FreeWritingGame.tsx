import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { GameSpec } from "@/lib/types";
import gsap from "gsap";
import { StoryContext } from "./StoryContext";
import { BookOpen, CheckCircle, AlertCircle, Sparkles } from "lucide-react";
import { getAuthHeaders } from "@/lib/auth";

interface FreeWritingGameProps {
  spec: GameSpec;
  onComplete: (result: { correct: boolean; score: number }) => void;
}

interface GrammarFeedback {
  isValid: boolean;
  score: number;
  errors: {
    type: string;
    message: string;
    suggestion?: string;
  }[];
  strengths: string[];
  correctedText?: string;
}

function FreeWritingGame({ spec, onComplete }: FreeWritingGameProps) {
  const [userText, setUserText] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [isValidating, setIsValidating] = useState(false);
  const [feedback, setFeedback] = useState<GrammarFeedback | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [showCorrectedVersion, setShowCorrectedVersion] = useState(false);
  const gameRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const prompt = spec.exercise?.payload?.prompt || "Escribe sobre lo que aprendiste en la historia.";
  const minLength = spec.exercise?.payload?.minLength || 50;
  const maxLength = spec.exercise?.payload?.maxLength || 500;
  const rubric = spec.exercise?.payload?.rubric || [];

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  const validateWithAI = async (text: string): Promise<GrammarFeedback> => {
    try {
      const response = await fetch("/api/evaluation/validate-writing", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          text,
          level: spec.level,
          rubric,
        }),
      });

      if (!response.ok) {
        throw new Error("Validation failed");
      }

      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error("AI validation error:", error);
      return {
        isValid: true,
        score: 70,
        errors: [],
        strengths: ["¡Buen intento! Sigue practicando."],
      };
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedText = userText.trim();
    
    if (trimmedText.length < minLength) {
      toast.warning(`Tu respuesta es muy corta. Escribe al menos ${minLength} caracteres.`);
      return;
    }

    if (trimmedText.length > maxLength) {
      toast.warning(`Tu respuesta es muy larga. Máximo ${maxLength} caracteres.`);
      return;
    }

    setIsValidating(true);
    setAttempts(prev => prev + 1);

    try {
      const result = await validateWithAI(trimmedText);
      setFeedback(result);

      if (gameRef.current) {
        if (result.errors.length === 0) {
          gsap.to(gameRef.current, {
            scale: 1.05,
            duration: 0.4,
            yoyo: true,
            repeat: 1,
            ease: "back.out(1.7)"
          });
          toast.success("¡Excelente redacción!");
        } else if (result.errors.length <= 2) {
          toast.info("¡Buen trabajo! Hay algunos detalles por mejorar.");
        } else {
          gsap.to(gameRef.current, {
            x: -10,
            duration: 0.1,
            yoyo: true,
            repeat: 3,
            ease: "power2.inOut"
          });
          toast.warning("Revisa las sugerencias para mejorar tu texto.");
        }
      }

      if (result.errors.length > 0 && result.correctedText && result.correctedText !== trimmedText) {
        setShowCorrectedVersion(true);
      } else if (attempts >= 2 || result.errors.length === 0) {
        setTimeout(() => {
          setShowResult(true);
          onComplete({ 
            correct: result.errors.length === 0, 
            score: result.score 
          });
        }, 2000);
      }
    } finally {
      setIsValidating(false);
    }
  };

  const handleRetry = () => {
    setFeedback(null);
    setShowCorrectedVersion(false);
  };

  const handleAcknowledgeCorrection = () => {
    setShowResult(true);
    onComplete({ 
      correct: false, 
      score: feedback?.score || 70 
    });
  };

  const charCount = userText.length;
  const charPercentage = (charCount / maxLength) * 100;
  const charColor = 
    charCount < minLength ? "text-red-500" :
    charCount > maxLength * 0.9 ? "text-orange-500" :
    "text-green-600";

  if (showResult) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-pink-50 p-6 flex items-center justify-center">
        <Card className="w-full max-w-2xl shadow-2xl">
          <CardContent className="p-8 text-center">
            <div className="mb-6">
              {feedback && feedback.errors.length === 0 ? (
                <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
              ) : (
                <Sparkles className="w-20 h-20 text-orange-500 mx-auto mb-4" />
              )}
              <h2 className="text-3xl font-bold mb-2">
                {feedback && feedback.errors.length === 0 ? "¡Perfecto!" : "¡Buen intento!"}
              </h2>
              <p className="text-xl text-gray-600 mb-4">
                Puntuación: {feedback?.score || 70}/100
              </p>
            </div>

            {feedback && feedback.strengths.length > 0 && (
              <div className="mb-6 text-left">
                <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-yellow-500" />
                  Puntos fuertes:
                </h3>
                <ul className="list-disc list-inside space-y-1">
                  {feedback.strengths.map((strength, i) => (
                    <li key={i} className="text-gray-700">{strength}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-pink-50 p-6">
      <Card className="max-w-4xl mx-auto shadow-2xl" ref={gameRef}>
        <CardContent className="p-8">
          <div className="mb-6 text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <BookOpen className="w-8 h-8 text-orange-600" />
              <h2 className="text-2xl font-bold">Redacción libre</h2>
            </div>
            <p className="text-gray-600">Escribe tu respuesta con tus propias palabras</p>
          </div>

          {spec.story && (
            <StoryContext story={spec.story} colorScheme="orange" />
          )}

          <div className="mb-6">
            <div className="p-6 bg-orange-50 rounded-xl border-2 border-orange-200 mb-4">
              <p className="text-lg font-medium text-gray-800">{prompt}</p>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="relative">
                <textarea
                  ref={textareaRef}
                  value={userText}
                  onChange={(e) => setUserText(e.target.value)}
                  disabled={isValidating}
                  className="w-full min-h-[200px] p-4 text-lg border-2 border-gray-300 rounded-xl focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-200 resize-y"
                  placeholder="Escribe aquí tu respuesta..."
                />
                
                <div className="mt-2 flex justify-between items-center">
                  <span className={`text-sm font-medium ${charColor}`}>
                    {charCount} / {maxLength} caracteres
                    {charCount < minLength && ` (mínimo ${minLength})`}
                  </span>
                  
                  <div className="w-48 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 ${
                        charCount < minLength ? "bg-red-400" :
                        charCount > maxLength * 0.9 ? "bg-orange-400" :
                        "bg-green-400"
                      }`}
                      style={{ width: `${Math.min(charPercentage, 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <Button
                  type="submit"
                  disabled={isValidating || charCount < minLength || charCount > maxLength}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white text-lg py-6"
                >
                  {isValidating ? (
                    <>
                      <Sparkles className="w-5 h-5 mr-2 animate-spin" />
                      Revisando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Revisar mi texto
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>

          {feedback && !showResult && (
            <div className="mt-6 space-y-4 animate-in fade-in duration-500">
              {feedback.errors.length > 0 && (
                <div className="p-4 bg-yellow-50 rounded-xl border-l-4 border-yellow-400">
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-yellow-600" />
                    Sugerencias para mejorar:
                  </h3>
                  <ul className="space-y-3">
                    {feedback.errors.map((error, i) => (
                      <li key={i} className="pl-4 border-l-2 border-yellow-300">
                        <p className="font-medium text-gray-800">{error.type}:</p>
                        <p className="text-gray-700">{error.message}</p>
                        {error.suggestion && (
                          <p className="text-sm text-green-700 mt-1">
                            💡 {error.suggestion}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {showCorrectedVersion && feedback.correctedText && (
                <div className="p-6 bg-blue-50 rounded-xl border-2 border-blue-300">
                  <h3 className="font-bold text-xl mb-4 text-blue-900 flex items-center gap-2">
                    <Sparkles className="w-6 h-6 text-blue-600" />
                    Aprende de la versión corregida
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="p-4 bg-white rounded-lg border border-gray-300">
                      <p className="text-sm font-semibold text-gray-600 mb-2">Tu texto:</p>
                      <p className="text-gray-800 italic">{userText}</p>
                    </div>

                    <div className="p-4 bg-green-50 rounded-lg border-2 border-green-400">
                      <p className="text-sm font-semibold text-green-700 mb-2">✓ Versión corregida:</p>
                      <p className="text-gray-900 font-medium">{feedback.correctedText}</p>
                    </div>
                  </div>

                  <Button
                    onClick={handleAcknowledgeCorrection}
                    className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white text-lg py-6"
                  >
                    <CheckCircle className="w-5 h-5 mr-2" />
                    He entendido, continuar
                  </Button>
                </div>
              )}

              {feedback.strengths.length > 0 && !showCorrectedVersion && (
                <div className="p-4 bg-green-50 rounded-xl border-l-4 border-green-400">
                  <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-green-600" />
                    ¡Muy bien!
                  </h3>
                  <ul className="list-disc list-inside space-y-1">
                    {feedback.strengths.map((strength, i) => (
                      <li key={i} className="text-gray-700">{strength}</li>
                    ))}
                  </ul>
                </div>
              )}

              {attempts < 3 && feedback.errors.length > 0 && !showCorrectedVersion && (
                <Button
                  onClick={handleRetry}
                  variant="outline"
                  className="w-full"
                >
                  Corregir y volver a intentar
                </Button>
              )}
            </div>
          )}

          {rubric.length > 0 && !feedback && (
            <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
              <h3 className="font-semibold mb-2">Criterios de evaluación:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                {rubric.map((criterion: string, i: number) => (
                  <li key={i}>{criterion}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default FreeWritingGame;
