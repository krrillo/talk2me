import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { getAuthHeaders } from "@/lib/auth";

interface StoryContextProps {
  story: string;
  storyId?: string;
  colorScheme?: "blue" | "green" | "purple" | "indigo" | "orange";
}

const COLOR_SCHEMES = {
  blue: {
    bg: "from-blue-400/20 to-cyan-400/20",
    border: "border-blue-400",
    button: "bg-blue-500 hover:bg-blue-600",
    dot: "bg-blue-500",
  },
  green: {
    bg: "from-green-400/20 to-emerald-400/20",
    border: "border-green-400",
    button: "bg-green-500 hover:bg-green-600",
    dot: "bg-green-500",
  },
  purple: {
    bg: "from-purple-400/20 to-pink-400/20",
    border: "border-purple-400",
    button: "bg-purple-500 hover:bg-purple-600",
    dot: "bg-purple-500",
  },
  indigo: {
    bg: "from-indigo-400/20 to-blue-400/20",
    border: "border-indigo-400",
    button: "bg-indigo-500 hover:bg-indigo-600",
    dot: "bg-indigo-500",
  },
  orange: {
    bg: "from-orange-400/20 to-yellow-400/20",
    border: "border-orange-400",
    button: "bg-orange-500 hover:bg-orange-600",
    dot: "bg-orange-500",
  },
};

export function StoryContext({ story, storyId, colorScheme = "blue" }: StoryContextProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [isFlipping, setIsFlipping] = useState(false);
  const [storyImage, setStoryImage] = useState<string | null>(null);
  
  const colors = COLOR_SCHEMES[colorScheme];

  // Fetch story image if storyId is provided
  useEffect(() => {
    // Reset image when storyId changes
    setStoryImage(null);
    
    if (storyId) {
      fetch(`/api/stories/${storyId}`, {
        headers: getAuthHeaders()
      })
        .then(res => {
          if (!res.ok) {
            console.error('Failed to fetch story:', res.status);
            return null;
          }
          return res.json();
        })
        .then(data => {
          if (data?.success && data.data?.pages?.[0]?.imageUrl) {
            setStoryImage(data.data.pages[0].imageUrl);
          }
        })
        .catch(err => {
          console.error('Error fetching story image:', err);
          setStoryImage(null);
        });
    }
  }, [storyId]);

  // Split text into pages for flipbook
  const splitTextIntoPages = (text: string) => {
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    const pages: string[] = [];
    
    let currentPageText = "";
    for (const sentence of sentences) {
      if (currentPageText.length + sentence.length > 250) {
        if (currentPageText) pages.push(currentPageText.trim());
        currentPageText = sentence;
      } else {
        currentPageText += sentence;
      }
    }
    if (currentPageText) pages.push(currentPageText.trim());
    
    return pages.length > 0 ? pages : [text];
  };

  const pages = splitTextIntoPages(story);
  const totalPages = pages.length;

  const handleNextPage = () => {
    if (currentPage < totalPages - 1 && !isFlipping) {
      setIsFlipping(true);
      setTimeout(() => {
        setCurrentPage(prev => prev + 1);
        setTimeout(() => setIsFlipping(false), 600);
      }, 100);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 0 && !isFlipping) {
      setIsFlipping(true);
      setTimeout(() => {
        setCurrentPage(prev => prev - 1);
        setTimeout(() => setIsFlipping(false), 600);
      }, 100);
    }
  };

  return (
    <div className="mb-8 relative">
      {/* Flipbook Container */}
      <div className="relative mx-auto max-w-2xl">
        {/* Page */}
        <div 
          className={`
            relative overflow-hidden rounded-3xl 
            border-4 ${colors.border} 
            shadow-2xl
            transition-all duration-500
            ${isFlipping ? 'animate-flip' : ''}
          `}
          style={{
            background: storyImage 
              ? `linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.92) 100%), url(${storyImage})`
              : 'linear-gradient(135deg, #fff 0%, #f8f9fa 100%)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            minHeight: '320px',
          }}
        >
          {/* Decorative overlay pattern */}
          <div 
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />

          {/* Gradient overlay for better text visibility */}
          <div className={`absolute inset-0 bg-gradient-to-br ${colors.bg}`} />

          {/* Page content */}
          <div className="relative z-10 p-8 md:p-12">
            {/* Header with sparkles */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-yellow-500" />
                <h3 className="text-lg font-bold text-gray-800 uppercase tracking-wider">
                  Historia
                </h3>
              </div>
              <div className="text-sm font-semibold text-gray-500">
                Página {currentPage + 1} de {totalPages}
              </div>
            </div>

            {/* Story text */}
            <div className="prose prose-lg max-w-none">
              <p className="text-gray-800 text-lg md:text-xl leading-relaxed font-medium whitespace-pre-wrap">
                {pages[currentPage]}
              </p>
            </div>

            {/* Decorative corner elements */}
            <div className="absolute top-4 right-4 text-3xl opacity-20">⭐</div>
            <div className="absolute bottom-4 left-4 text-3xl opacity-20">✨</div>
          </div>

          {/* Page curl effect (bottom-right corner) */}
          <div 
            className="absolute bottom-0 right-0 w-16 h-16 opacity-20"
            style={{
              background: 'linear-gradient(225deg, transparent 50%, rgba(0,0,0,0.1) 50%)',
              borderRadius: '0 0 1.5rem 0',
            }}
          />
        </div>

        {/* Navigation Buttons */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-6">
            {/* Previous Button */}
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 0 || isFlipping}
              className={`
                ${colors.button} text-white p-4 rounded-full shadow-lg
                transition-all duration-300 hover:scale-110 active:scale-95
                disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100
              `}
              aria-label="Página anterior"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            {/* Page Dots */}
            <div className="flex gap-2">
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => {
                    if (!isFlipping && i !== currentPage) {
                      setIsFlipping(true);
                      setTimeout(() => {
                        setCurrentPage(i);
                        setTimeout(() => setIsFlipping(false), 600);
                      }, 100);
                    }
                  }}
                  className={`
                    w-3 h-3 rounded-full transition-all duration-300
                    ${i === currentPage 
                      ? `${colors.dot} scale-125` 
                      : 'bg-gray-300 hover:bg-gray-400'
                    }
                  `}
                  aria-label={`Ir a página ${i + 1}`}
                />
              ))}
            </div>

            {/* Next Button */}
            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages - 1 || isFlipping}
              className={`
                ${colors.button} text-white p-4 rounded-full shadow-lg
                transition-all duration-300 hover:scale-110 active:scale-95
                disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100
              `}
              aria-label="Página siguiente"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes flip {
          0% {
            transform: perspective(1000px) rotateY(0deg);
          }
          50% {
            transform: perspective(1000px) rotateY(90deg);
            opacity: 0.5;
          }
          100% {
            transform: perspective(1000px) rotateY(0deg);
          }
        }

        .animate-flip {
          animation: flip 0.6s ease-in-out;
        }
      `}</style>
    </div>
  );
}
