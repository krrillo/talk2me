import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { ArrowLeft, Play, Pause, Settings } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Story, GameSpec } from "@/lib/types";
import gsap from "gsap";
import { TTSControls } from "@/components/TTS/TTSControls";
import { apiRequest } from "@/lib/api";
import { VocabularyPreview } from "./VocabularyPreview";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type ReadingSpeed = 'slow' | 'normal' | 'fast';

const READING_SPEEDS = {
  slow: { label: '🐢 Lento', duration: 15000 },
  normal: { label: '👤 Normal', duration: 10000 },
  fast: { label: '🐇 Rápido', duration: 6000 },
};

export default function StoryViewer() {
  const { storyId } = useParams<{ storyId: string }>();
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(0);
  const [showVocabulary, setShowVocabulary] = useState(true);
  const [readingSpeed, setReadingSpeed] = useState<ReadingSpeed>('normal');
  const [autoAdvance, setAutoAdvance] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const startTimeRef = useRef<number>(0);
  const animationRef = useRef<number | null>(null);

  // Fetch story data
  const { data: storyData, isLoading, error } = useQuery({
    queryKey: [`/api/stories/${storyId}`],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/stories/${storyId}`);
      const result = await response.json();
      return result.data;
    },
    enabled: !!storyId,
  });

  const story = storyData as Story | undefined;

  // Fetch associated game
  const { data: gameData } = useQuery({
    queryKey: [`/api/stories/${storyId}/game`],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/stories/${storyId}/game`);
      const result = await response.json();
      return result.data;
    },
    enabled: !!storyId,
  });

  const gameSpec = gameData as GameSpec | undefined;

  useEffect(() => {
    // Animate page entrance
    gsap.fromTo('.story-content', 
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.6, ease: "back.out(1.7)" }
    );
  }, [currentPage]);

  // Auto-advance logic with requestAnimationFrame for smooth, deterministic timing
  useEffect(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    if (!autoAdvance || !story || currentPage >= story.pages.length - 1) {
      setTimeLeft(0);
      startTimeRef.current = 0;
      return;
    }

    const duration = READING_SPEEDS[readingSpeed].duration;
    startTimeRef.current = Date.now();
    setTimeLeft(duration);

    const updateTimer = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const remaining = Math.max(0, duration - elapsed);
      
      setTimeLeft(remaining);

      if (remaining <= 0) {
        // Time's up, advance to next page
        if (story && currentPage < story.pages.length - 1) {
          setCurrentPage(prev => prev + 1);
        }
      } else {
        // Continue animation
        animationRef.current = requestAnimationFrame(updateTimer);
      }
    };

    animationRef.current = requestAnimationFrame(updateTimer);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [autoAdvance, currentPage, readingSpeed, story]);

  const handleGoBack = () => {
    navigate('/dashboard');
  };

  const handleStartGame = () => {
    if (gameSpec) {
      navigate(`/game/${gameSpec.id}`);
    } else {
      toast.error("No hay juego disponible para esta historia");
    }
  };

  const handleNextPage = () => {
    if (story && currentPage < story.pages.length - 1) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1);
    }
  };


  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Cargando historia...</p>
        </div>
      </div>
    );
  }

  if (error || !story) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center p-6">
          <div className="text-red-500 text-6xl mb-4">📚</div>
          <h2 className="text-xl font-bold mb-2">Historia no encontrada</h2>
          <p className="text-gray-600 mb-4">
            No pudimos cargar esta historia. Por favor intenta de nuevo.
          </p>
          <Button onClick={handleGoBack} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al inicio
          </Button>
        </Card>
      </div>
    );
  }

  const currentStoryPage = story.pages[currentPage];
  const totalPages = story.pages.length;

  // Show vocabulary first if available
  const hasVocabulary = story.vocabulary && Array.isArray(story.vocabulary) && story.vocabulary.length > 0;
  
  if (hasVocabulary && showVocabulary && story.vocabulary) {
    return (
      <VocabularyPreview
        vocabulary={story.vocabulary}
        onContinue={() => setShowVocabulary(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <Button onClick={handleGoBack} variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
            
            <div className="text-center flex-1">
              <h1 className="text-xl font-bold text-gray-800">{story.title}</h1>
              <p className="text-sm text-gray-600">
                Página {currentPage + 1} de {totalPages}
              </p>
            </div>

            {/* Reading Controls */}
            <div className="flex items-center gap-2">
              {/* Auto-advance toggle */}
              <Button
                onClick={() => setAutoAdvance(!autoAdvance)}
                variant={autoAdvance ? "default" : "outline"}
                size="sm"
                className="relative"
                disabled={currentPage >= totalPages - 1}
              >
                {autoAdvance ? (
                  <>
                    <Pause className="w-4 h-4 mr-2" />
                    Pausar
                    {timeLeft > 0 && (
                      <svg className="absolute -right-2 -top-2 w-8 h-8 transform -rotate-90">
                        <circle
                          cx="16"
                          cy="16"
                          r="12"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeDasharray={`${2 * Math.PI * 12}`}
                          strokeDashoffset={`${2 * Math.PI * 12 * (1 - timeLeft / READING_SPEEDS[readingSpeed].duration)}`}
                          className="text-blue-400"
                        />
                      </svg>
                    )}
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Auto
                  </>
                )}
              </Button>

              {/* Speed selector */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Settings className="w-4 h-4 mr-2" />
                    {READING_SPEEDS[readingSpeed].label}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-white">
                  {(Object.keys(READING_SPEEDS) as ReadingSpeed[]).map((speed) => (
                    <DropdownMenuItem
                      key={speed}
                      onClick={() => setReadingSpeed(speed)}
                      className={`cursor-pointer ${
                        speed === readingSpeed ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                      }`}
                    >
                      {READING_SPEEDS[speed].label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      {/* Story Content */}
      <div className="max-w-4xl mx-auto p-4">
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="story-content">
              {/* Story Image - Generated by DALL-E 3 */}
              {(currentStoryPage.imageUrl || currentStoryPage.image) && (
                <div className="relative h-64 md:h-80 bg-gradient-to-r from-blue-100 to-purple-100">
                  <img
                    src={currentStoryPage.imageUrl || currentStoryPage.image}
                    alt={`Ilustración de ${story.title}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback to gradient background if image fails
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                </div>
              )}

              {/* Story Text */}
              <div className="p-6 md:p-8">
                <div className="prose prose-lg max-w-none">
                  <p className="text-xl md:text-2xl leading-relaxed text-gray-800 font-medium">
                    {currentStoryPage.text}
                  </p>
                </div>

                {/* TTS Controls */}
                <div className="mt-6">
                  <TTSControls text={currentStoryPage.text} />
                </div>

                {/* Page Navigation */}
                <div className="flex justify-between items-center mt-8 pt-6 border-t">
                  <Button
                    onClick={handlePrevPage}
                    disabled={currentPage === 0}
                    variant="outline"
                    size="lg"
                  >
                    ← Anterior
                  </Button>

                  {/* Page Indicators */}
                  <div className="flex space-x-2">
                    {Array.from({ length: totalPages }, (_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentPage(i)}
                        className={`w-3 h-3 rounded-full transition-all duration-200 ${
                          i === currentPage 
                            ? 'bg-blue-500 scale-125' 
                            : 'bg-gray-300 hover:bg-gray-400'
                        }`}
                      />
                    ))}
                  </div>

                  <Button
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages - 1}
                    variant="outline"
                    size="lg"
                  >
                    Siguiente →
                  </Button>
                </div>

                {/* Game Button (shown on last page) */}
                {currentPage === totalPages - 1 && gameSpec && (
                  <div className="mt-8 text-center">
                    <div className="p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border border-green-200">
                      <h3 className="text-xl font-bold text-gray-800 mb-2">
                        ¡Historia completada! 🎉
                      </h3>
                      <p className="text-gray-600 mb-4">
                        Ahora pon a prueba tu comprensión con un juego divertido
                      </p>
                      <Button
                        onClick={handleStartGame}
                        variant="game"
                        size="xl"
                        className="animate-pulse hover:animate-none"
                      >
                        <Play className="w-5 h-5 mr-2" />
                        ¡Jugar ahora!
                      </Button>
                    </div>
                  </div>
                )}

                {/* Enhanced Reading Progress */}
                <div className="mt-6">
                  {(() => {
                    const totalWords = story.pages.reduce((acc, page) => acc + page.text.split(' ').length, 0);
                    const wordsRead = story.pages.slice(0, currentPage + 1).reduce((acc, page) => acc + page.text.split(' ').length, 0);
                    const wordsPerMinute = 100;
                    const estimatedMinutes = Math.ceil(totalWords / wordsPerMinute);
                    const minutesRemaining = Math.ceil((totalWords - wordsRead) / wordsPerMinute);
                    const progressPercent = Math.round(((currentPage + 1) / totalPages) * 100);
                    
                    return (
                      <>
                        {/* Progress Bar */}
                        <div className="bg-gray-200 rounded-full h-3 mb-3 relative">
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-300"
                            style={{ width: `${progressPercent}%` }}
                          />
                          <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs font-bold text-gray-900">
                            {progressPercent}%
                          </span>
                        </div>
                        
                        {/* Stats Grid */}
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className="p-2 bg-blue-50 rounded-lg">
                            <div className="text-2xl font-bold text-blue-700">{wordsRead}</div>
                            <div className="text-xs text-gray-900 font-semibold">Palabras leídas</div>
                          </div>
                          <div className="p-2 bg-purple-50 rounded-lg">
                            <div className="text-2xl font-bold text-purple-700">{totalWords}</div>
                            <div className="text-xs text-gray-900 font-semibold">Palabras totales</div>
                          </div>
                          <div className="p-2 bg-green-50 rounded-lg">
                            <div className="text-2xl font-bold text-green-700">~{minutesRemaining}</div>
                            <div className="text-xs text-gray-900 font-semibold">min restantes</div>
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-900 font-medium mt-2 text-center">
                          📖 Tiempo estimado total: ~{estimatedMinutes} {estimatedMinutes === 1 ? 'minuto' : 'minutos'}
                        </p>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
