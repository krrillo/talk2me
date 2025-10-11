import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/components/ui/toast";
import ProgressChart from "./ProgressChart";
import { useAuthStore } from "@/lib/stores/useAuthStore";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import { useProgressSummary, useAdaptiveRecommendations } from "@/hooks/useAdaptiveProgress";
import { 
  BookOpen, 
  Trophy, 
  Star, 
  Play, 
  Settings, 
  User,
  Target,
  Award,
  TrendingUp
} from "lucide-react";

interface Story {
  id: string;
  title: string;
  level: number;
  theme: string;
  completed: boolean;
  score?: number;
}

interface UserProgress {
  totalGamesPlayed: number;
  averageScore: number;
  streakDays: number;
  level: number;
  experiencePoints: number;
  badges: string[];
}

export default function StudentDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const queryClient = useQueryClient();
  const [selectedLevel, setSelectedLevel] = useState(1);

  // Fetch user progress using new hooks
  const { data: progress, isLoading: progressLoading } = useProgressSummary();
  const { data: adaptiveRec } = useAdaptiveRecommendations();

  // Fetch available stories
  const { data: stories, isLoading: storiesLoading } = useQuery<Story[]>({
    queryKey: ['/api/stories', selectedLevel],
    staleTime: 60000,
  });

  // Generate new story mutation
  const generateStoryMutation = useMutation({
    mutationFn: async (params: { theme: string; level: number }) => {
      const response = await apiRequest('POST', '/api/stories/generate', params);
      const result = await response.json();
      return result.data || result;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/stories'] });
      const storyId = data.storyId || data.id;
      if (storyId) {
        navigate(`/story/${storyId}`);
      } else {
        console.error('No storyId in response:', data);
        toast.error("Error: Historia generada pero ID no encontrado");
      }
    },
    onError: (error) => {
      console.error('Story generation error:', error);
      toast.error("Error al generar historia. Inténtalo de nuevo.");
    },
  });

  const handleGenerateStory = (theme: string) => {
    if (generateStoryMutation.isPending) return;
    generateStoryMutation.mutate({ theme, level: selectedLevel });
  };

  const handlePlayStory = (storyId: string) => {
    navigate(`/story/${storyId}`);
  };

  const themes = [
    { id: "animals", name: "Animales", emoji: "🐾", color: "from-green-400 to-blue-500" },
    { id: "family", name: "Familia", emoji: "👨‍👩‍👧‍👦", color: "from-pink-400 to-purple-500" },
    { id: "nature", name: "Naturaleza", emoji: "🌳", color: "from-emerald-400 to-teal-500" },
    { id: "adventure", name: "Aventuras", emoji: "🏔️", color: "from-orange-400 to-red-500" },
    { id: "friendship", name: "Amistad", emoji: "🤝", color: "from-yellow-400 to-orange-500" },
    { id: "school", name: "Escuela", emoji: "📚", color: "from-blue-400 to-indigo-500" },
  ];

  const levels = [
    { level: 1, name: "Inicial", description: "Oraciones simples, 50-80 palabras" },
    { level: 2, name: "Básico", description: "Vocabulario amplio, 80-100 palabras" },
    { level: 3, name: "Intermedio", description: "Gramática media, 100-130 palabras" },
    { level: 4, name: "Avanzado", description: "Estructuras complejas, 130-160 palabras" },
    { level: 5, name: "Experto", description: "Subordinadas, 150-200 palabras" },
  ];

  const getBadgeEmoji = (badge: string) => {
    const badges: Record<string, string> = {
      "first_game": "🎮",
      "perfect_score": "💯",
      "speed_demon": "⚡",
      "persistent": "🔥",
      "grammar_master": "📝",
      "vocabulary_champion": "📚",
    };
    return badges[badge] || "🏆";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  ¡Hola, {user?.username}! 👋
                </h1>
                <p className="text-gray-600">¿Listos para aprender español?</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={logout}>
                <Settings className="w-4 h-4 mr-2" />
                Salir
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Progress Overview */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Trophy className="w-5 h-5 mr-2 text-yellow-500" />
                  Tu Progreso
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    Nivel {progress?.level || 1}
                  </div>
                  <p className="text-gray-600">
                    {progress?.experiencePoints || 0} XP
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Juegos jugados</span>
                    <span className="font-bold">{progress?.totalGamesPlayed || 0}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Puntuación promedio</span>
                    <span className="font-bold">{progress?.averageScore || 0}%</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Racha de días</span>
                    <span className="font-bold text-orange-600">
                      {progress?.streakDays || 0} 🔥
                    </span>
                  </div>
                </div>

                <Progress value={((progress?.experiencePoints || 0) % 100)} />
                <p className="text-xs text-center text-gray-500">
                  {100 - ((progress?.experiencePoints || 0) % 100)} XP para el siguiente nivel
                </p>
              </CardContent>
            </Card>

            {/* Badges */}
            {progress?.badges && progress.badges.length > 0 && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Award className="w-5 h-5 mr-2 text-purple-500" />
                    Logros
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-2">
                    {progress.badges.map((badge, index) => (
                      <div
                        key={index}
                        className="text-center p-2 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-lg"
                      >
                        <div className="text-2xl">{getBadgeEmoji(badge)}</div>
                        <p className="text-xs font-medium capitalize">
                          {badge.replace('_', ' ')}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Level Selector */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="w-5 h-5 mr-2 text-blue-500" />
                  Selecciona tu nivel
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {levels.map((levelInfo) => (
                    <button
                      key={levelInfo.level}
                      onClick={() => setSelectedLevel(levelInfo.level)}
                      className={`p-4 rounded-lg border-2 text-left transition-all duration-200 ${
                        selectedLevel === levelInfo.level
                          ? 'border-blue-500 bg-blue-50 shadow-md'
                          : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="font-bold text-lg">
                        Nivel {levelInfo.level}
                      </div>
                      <div className="text-sm font-medium text-blue-600">
                        {levelInfo.name}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        {levelInfo.description}
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Story Themes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BookOpen className="w-5 h-5 mr-2 text-green-500" />
                  Generar nueva historia
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Elige un tema y generaremos una historia personalizada para el nivel {selectedLevel}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {themes.map((theme) => (
                    <button
                      key={theme.id}
                      onClick={() => handleGenerateStory(theme.id)}
                      disabled={generateStoryMutation.isPending}
                      className={`p-4 rounded-xl border-2 border-transparent bg-gradient-to-r ${theme.color} 
                        text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 
                        hover:scale-105 disabled:opacity-50 disabled:hover:scale-100`}
                    >
                      <div className="text-2xl mb-2">{theme.emoji}</div>
                      <div className="text-sm">{theme.name}</div>
                    </button>
                  ))}
                </div>
                {generateStoryMutation.isPending && (
                  <div className="mt-4 text-center">
                    <div className="inline-flex items-center text-blue-600">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                      Generando historia personalizada...
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Stories */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Star className="w-5 h-5 mr-2 text-yellow-500" />
                  Historias disponibles (Nivel {selectedLevel})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {storiesLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-gray-600">Cargando historias...</p>
                  </div>
                ) : stories && stories.length > 0 ? (
                  <div className="grid gap-4">
                    {stories.map((story) => (
                      <div
                        key={story.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border hover:shadow-md transition-shadow"
                      >
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-800">
                            {story.title}
                          </h3>
                          <p className="text-sm text-gray-600 capitalize">
                            Tema: {story.theme} • Nivel {story.level}
                          </p>
                          {story.completed && story.score && (
                            <p className="text-xs text-green-600 font-medium">
                              ✓ Completada • Puntuación: {story.score}%
                            </p>
                          )}
                        </div>
                        <Button
                          onClick={() => handlePlayStory(story.id)}
                          variant="game"
                          size="sm"
                        >
                          <Play className="w-4 h-4 mr-1" />
                          {story.completed ? "Repetir" : "Jugar"}
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">
                      No hay historias disponibles para este nivel.
                    </p>
                    <p className="text-sm text-gray-500">
                      ¡Genera tu primera historia eligiendo un tema arriba!
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Progress Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-purple-500" />
                  Progreso de la semana
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ProgressChart />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
