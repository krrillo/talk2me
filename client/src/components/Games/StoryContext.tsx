import { useState } from "react";
import { Button } from "@/components/ui/button";
import { BookOpen, Bookmark } from "lucide-react";

interface StoryContextProps {
  story: string;
  colorScheme?: "blue" | "green" | "purple" | "indigo" | "orange";
}

const COLOR_SCHEMES = {
  blue: {
    page: "from-blue-50 to-blue-100",
    accent: "bg-blue-500",
    bookmark: "text-blue-600",
    glow: "shadow-blue-200",
  },
  green: {
    page: "from-green-50 to-green-100",
    accent: "bg-green-500",
    bookmark: "text-green-600",
    glow: "shadow-green-200",
  },
  purple: {
    page: "from-purple-50 to-purple-100",
    accent: "bg-purple-500",
    bookmark: "text-purple-600",
    glow: "shadow-purple-200",
  },
  indigo: {
    page: "from-indigo-50 to-indigo-100",
    accent: "bg-indigo-500",
    bookmark: "text-indigo-600",
    glow: "shadow-indigo-200",
  },
  orange: {
    page: "from-orange-50 to-orange-100",
    accent: "bg-orange-500",
    bookmark: "text-orange-600",
    glow: "shadow-orange-200",
  },
};

export function StoryContext({ story, colorScheme = "blue" }: StoryContextProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const colors = COLOR_SCHEMES[colorScheme];
  const isLongStory = story.length > 300;
  const displayText = isExpanded || !isLongStory ? story : story.substring(0, 300) + "...";

  // Split text by sentences to avoid cutting words
  const splitTextBySentences = (text: string) => {
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    const midPoint = Math.ceil(sentences.length / 2);
    const leftPage = sentences.slice(0, midPoint).join(' ');
    const rightPage = sentences.slice(midPoint).join(' ');
    return { leftPage, rightPage };
  };

  const { leftPage, rightPage } = splitTextBySentences(displayText);

  return (
    <div className="mb-8 relative">
      {/* Book Container */}
      <div 
        className={`relative bg-gradient-to-b from-amber-900 to-amber-950 rounded-xl p-1 shadow-2xl ${colors.glow} transition-all duration-500`}
      >
        {/* Book Pages */}
        <div className="flex gap-1 bg-amber-800 rounded-lg p-2 relative">
          {/* Left Page */}
          <div className={`flex-1 bg-gradient-to-br ${colors.page} rounded-l-xl p-6 relative shadow-lg border-r border-amber-200/50`}>
            {/* Page Lines Decoration */}
            <div className="absolute top-0 left-0 right-0 h-full pointer-events-none opacity-10">
              {[...Array(8)].map((_, i) => (
                <div 
                  key={i} 
                  className="w-full border-b border-gray-400"
                  style={{ marginTop: `${i * 12}%` }}
                />
              ))}
            </div>
            
            {/* Left Page Content */}
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <BookOpen className="w-5 h-5 text-amber-700" />
                <h3 className="text-sm font-bold text-amber-900 tracking-wide">
                  Historia
                </h3>
              </div>
              <p className="text-gray-800 text-base leading-relaxed font-medium whitespace-pre-wrap">
                {leftPage}
              </p>
            </div>

            {/* Corner Decoration - Bottom Left */}
            <div className="absolute bottom-2 left-2 text-xl opacity-30">✨</div>
          </div>

          {/* Spine Shadow */}
          <div className="w-1 bg-gradient-to-r from-amber-950 via-amber-900 to-amber-950 shadow-inner" />

          {/* Right Page */}
          <div className={`flex-1 bg-gradient-to-bl ${colors.page} rounded-r-xl p-6 relative shadow-lg border-l border-amber-200/50`}>
            {/* Page Lines Decoration */}
            <div className="absolute top-0 left-0 right-0 h-full pointer-events-none opacity-10">
              {[...Array(8)].map((_, i) => (
                <div 
                  key={i} 
                  className="w-full border-b border-gray-400"
                  style={{ marginTop: `${i * 12}%` }}
                />
              ))}
            </div>

            {/* Right Page Content */}
            <div className="relative z-10">
              <p className="text-gray-800 text-base leading-relaxed font-medium whitespace-pre-wrap">
                {rightPage}
              </p>
            </div>

            {/* Corner Decoration - Bottom Right */}
            <div className="absolute bottom-2 right-2 text-xl opacity-30">⭐</div>
          </div>
        </div>

        {/* Bookmark Toggle Button */}
        {isLongStory && (
          <div className="absolute -top-2 right-8 z-20">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className={`group relative ${colors.bookmark} hover:${colors.bookmark} transition-all duration-300`}
            >
              <div className={`absolute inset-0 ${colors.accent} rounded-t-lg -z-10 transform group-hover:scale-110 transition-transform`} 
                   style={{ 
                     clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% 85%, 0 100%)',
                     padding: '2px'
                   }}
              />
              <div className="relative px-3 py-2 bg-white rounded-t-lg flex items-center gap-1"
                   style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% 85%, 0 100%)' }}
              >
                <Bookmark className="w-4 h-4" />
                <span className="text-xs font-bold whitespace-nowrap">
                  {isExpanded ? "Cerrar" : "Ver más"}
                </span>
              </div>
            </Button>
          </div>
        )}

        {/* Decorative Stars */}
        <div className="absolute -top-3 left-6 text-2xl animate-pulse">✨</div>
        <div className="absolute -bottom-3 right-6 text-2xl animate-pulse" style={{ animationDelay: '0.5s' }}>🌟</div>
      </div>
    </div>
  );
}
