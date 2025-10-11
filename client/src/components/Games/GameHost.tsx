import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import DragWordsGame from "./DragWordsGame";
import OrderSentenceGame from "./OrderSentenceGame";
import CompleteWordsGame from "./CompleteWordsGame";
import MultipleChoiceGame from "./MultipleChoiceGame";
import { useGameSpec } from "@/hooks/useGameSpec";
import { GameSpec } from "@/lib/types";

export default function GameHost() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Parse game IDs and index from URL params
  const gameIds = searchParams.get('games')?.split(',').filter(Boolean) || (gameId ? [gameId] : []);
  const currentGameIndex = parseInt(searchParams.get('index') || '0', 10);
  
  // Use gameId from URL directly (React Router will update this when we navigate)
  const { data: gameSpec, isLoading, error } = useGameSpec(gameId!);
  const [currentGame, setCurrentGame] = useState<GameSpec | null>(null);

  useEffect(() => {
    if (gameSpec) {
      setCurrentGame(gameSpec);
    }
  }, [gameSpec]);

  const handleGameComplete = (result: { correct: boolean; score: number }) => {
    console.log("Game completed:", result);
    
    // Check if there are more games
    const nextIndex = currentGameIndex + 1;
    if (nextIndex < gameIds.length) {
      // Navigate to next game with updated params
      const nextGameId = gameIds[nextIndex];
      const gamesParam = gameIds.join(',');
      navigate(`/game/${nextGameId}?games=${gamesParam}&index=${nextIndex}`);
    } else {
      // All games completed, return to dashboard
      navigate("/dashboard");
    }
  };

  const handleGoBack = () => {
    navigate("/dashboard");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Cargando juego...</p>
        </div>
      </div>
    );
  }

  if (error || !currentGame) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center p-6">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold mb-2">Error al cargar el juego</h2>
          <p className="text-gray-600 mb-4">
            No pudimos cargar este juego. Por favor intenta de nuevo.
          </p>
          <Button onClick={handleGoBack} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al inicio
          </Button>
        </Card>
      </div>
    );
  }

  const renderGame = () => {
    switch (currentGame.gameType) {
      case "drag_words":
        return <DragWordsGame spec={currentGame} onComplete={handleGameComplete} />;
      case "order_sentence":
        return <OrderSentenceGame spec={currentGame} onComplete={handleGameComplete} />;
      case "complete_words":
        return <CompleteWordsGame spec={currentGame} onComplete={handleGameComplete} />;
      case "multi_choice":
        return <MultipleChoiceGame spec={currentGame} onComplete={handleGameComplete} />;
      default:
        return (
          <div className="text-center py-12">
            <p className="text-xl text-gray-600">
              Tipo de juego no soportado: {currentGame.gameType}
            </p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="p-4 bg-white/80 backdrop-blur-sm shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Button onClick={handleGoBack} variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          <div className="text-center">
            <h1 className="text-xl font-bold text-gray-800">{currentGame.title}</h1>
            <p className="text-sm text-gray-600">
              Nivel {currentGame.level} • Juego {currentGameIndex + 1} de {gameIds.length}
            </p>
          </div>
          <div className="w-20"></div> {/* Spacer for alignment */}
        </div>
      </div>

      {/* Game Content */}
      <div className="max-w-4xl mx-auto p-4">
        {renderGame()}
      </div>
    </div>
  );
}
