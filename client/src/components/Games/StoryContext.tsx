import { useState } from "react";
import { BookOpen, ChevronLeft, ChevronRight } from "lucide-react";

interface StoryContextProps {
  story: string;
  colorScheme?: "blue" | "green" | "purple" | "indigo" | "orange";
}

const COLOR_SCHEMES = {
  blue: {
    page: "from-blue-50 to-blue-100",
    pageText: "text-gray-800",
    accent: "bg-blue-500",
    accentHover: "hover:bg-blue-600",
  },
  green: {
    page: "from-green-50 to-green-100",
    pageText: "text-gray-800",
    accent: "bg-green-500",
    accentHover: "hover:bg-green-600",
  },
  purple: {
    page: "from-purple-50 to-purple-100",
    pageText: "text-gray-800",
    accent: "bg-purple-500",
    accentHover: "hover:bg-purple-600",
  },
  indigo: {
    page: "from-indigo-50 to-indigo-100",
    pageText: "text-gray-800",
    accent: "bg-indigo-500",
    accentHover: "hover:bg-indigo-600",
  },
  orange: {
    page: "from-orange-50 to-orange-100",
    pageText: "text-gray-800",
    accent: "bg-orange-500",
    accentHover: "hover:bg-orange-600",
  },
};

export function StoryContext({ story, colorScheme = "blue" }: StoryContextProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [isFlipping, setIsFlipping] = useState(false);
  
  const colors = COLOR_SCHEMES[colorScheme];

  // Split text into pages (sentences-based) - ensures all text is shown
  const splitTextIntoPages = (text: string) => {
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    const pages: string[][] = [];
    
    let i = 0;
    while (i < sentences.length) {
      const leftSentences = [];
      const rightSentences = [];
      
      // Take 1-2 sentences for left page
      if (i < sentences.length) {
        leftSentences.push(sentences[i]);
        i++;
      }
      if (i < sentences.length && leftSentences.join(' ').length < 200) {
        leftSentences.push(sentences[i]);
        i++;
      }
      
      // Take 1-2 sentences for right page
      if (i < sentences.length) {
        rightSentences.push(sentences[i]);
        i++;
      }
      if (i < sentences.length && rightSentences.join(' ').length < 200) {
        rightSentences.push(sentences[i]);
        i++;
      }
      
      pages.push([
        leftSentences.join(' '),
        rightSentences.join(' ')
      ]);
    }
    
    return pages;
  };

  const pages = splitTextIntoPages(story);
  const totalPagePairs = pages.length;

  const handleNextPage = () => {
    if (currentPage < totalPagePairs - 1 && !isFlipping) {
      setIsFlipping(true);
      setTimeout(() => {
        setCurrentPage(prev => prev + 1);
        setIsFlipping(false);
      }, 600);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 0 && !isFlipping) {
      setIsFlipping(true);
      setTimeout(() => {
        setCurrentPage(prev => prev - 1);
        setIsFlipping(false);
      }, 600);
    }
  };

  const [leftPageText, rightPageText] = pages[currentPage] || ["", ""];

  return (
    <div className="mb-8 relative">
      {/* Book Container with 3D Perspective */}
      <div 
        className="relative"
        style={{
          perspective: "2000px",
          perspectiveOrigin: "center",
        }}
      >
        {/* Open Book */}
        <div className="relative flex flex-col md:flex-row items-center justify-center gap-4 md:gap-0">
          {/* Book Spine/Center Shadow - Hidden on mobile */}
          <div 
            className="hidden md:block absolute top-0 bottom-0 left-1/2 w-6 -ml-3 z-10"
            style={{
              background: "linear-gradient(90deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0.3) 100%)",
              boxShadow: "inset 0 0 20px rgba(0,0,0,0.3)",
            }}
          />

          {/* Left Page */}
          <div 
            className={`page-left relative w-full md:w-1/2 transition-all duration-600 ease-out ${isFlipping ? 'animate-page-flip-left' : ''}`}
            data-page="left"
          >
            <div 
              className={`relative bg-gradient-to-br ${colors.page} rounded-2xl md:rounded-l-2xl md:rounded-r-none p-8 min-h-[280px]`}
              style={{
                boxShadow: `
                  -8px 0 20px rgba(0,0,0,0.15),
                  inset 4px 0 8px rgba(0,0,0,0.05),
                  inset -2px 0 4px rgba(255,255,255,0.5)
                `,
                borderRight: "1px solid rgba(139, 69, 19, 0.2)",
              }}
            >
              {/* Paper texture overlay */}
              <div 
                className="absolute inset-0 opacity-5 rounded-l-2xl pointer-events-none"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }}
              />
              
              {/* Header */}
              <div className="relative z-10 flex items-center gap-2 mb-4 pb-3 border-b-2 border-amber-300/30">
                <BookOpen className="w-5 h-5 text-amber-700" />
                <h3 className="text-sm font-bold text-amber-900 tracking-wide uppercase">
                  Historia
                </h3>
              </div>
              
              {/* Left Page Content */}
              <div className="relative z-10">
                <p className={`${colors.pageText} text-base leading-relaxed font-medium whitespace-pre-wrap`}>
                  {leftPageText}
                </p>
              </div>

              {/* Page number */}
              <div className="absolute bottom-4 left-8 text-xs text-gray-500 font-semibold">
                {currentPage * 2 + 1}
              </div>
            </div>
          </div>

          {/* Right Page */}
          <div 
            className={`page-right relative w-full md:w-1/2 transition-all duration-600 ease-out ${isFlipping ? 'animate-page-flip-right' : ''}`}
            data-page="right"
          >
            <div 
              className={`relative bg-gradient-to-bl ${colors.page} rounded-2xl md:rounded-r-2xl md:rounded-l-none p-8 min-h-[280px]`}
              style={{
                boxShadow: `
                  8px 0 20px rgba(0,0,0,0.15),
                  inset -4px 0 8px rgba(0,0,0,0.05),
                  inset 2px 0 4px rgba(255,255,255,0.5)
                `,
                borderLeft: "1px solid rgba(139, 69, 19, 0.2)",
              }}
            >
              {/* Paper texture overlay */}
              <div 
                className="absolute inset-0 opacity-5 rounded-r-2xl pointer-events-none"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }}
              />
              
              {/* Right Page Content */}
              <div className="relative z-10 pt-14">
                <p className={`${colors.pageText} text-base leading-relaxed font-medium whitespace-pre-wrap`}>
                  {rightPageText}
                </p>
              </div>

              {/* Page number */}
              <div className="absolute bottom-4 right-8 text-xs text-gray-500 font-semibold">
                {currentPage * 2 + 2}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Buttons */}
        {totalPagePairs > 1 && (
          <>
            {/* Previous Button */}
            {currentPage > 0 && (
              <button
                onClick={handlePrevPage}
                disabled={isFlipping}
                className={`absolute left-2 md:left-0 top-1/2 md:-translate-x-12 -translate-y-1/2 ${colors.accent} ${colors.accentHover} text-white p-3 rounded-full shadow-lg transition-all duration-300 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed z-20`}
                aria-label="Página anterior"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            {/* Next Button */}
            {currentPage < totalPagePairs - 1 && (
              <button
                onClick={handleNextPage}
                disabled={isFlipping}
                className={`absolute right-2 md:right-0 top-1/2 md:translate-x-12 -translate-y-1/2 ${colors.accent} ${colors.accentHover} text-white p-3 rounded-full shadow-lg transition-all duration-300 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed z-20`}
                aria-label="Página siguiente"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
          </>
        )}

        {/* Page indicator */}
        {totalPagePairs > 1 && (
          <div className="mt-4 text-center">
            <div className="inline-flex gap-2 bg-white/70 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm">
              {Array.from({ length: totalPagePairs }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => {
                    if (!isFlipping) {
                      setIsFlipping(true);
                      setTimeout(() => {
                        setCurrentPage(i);
                        setIsFlipping(false);
                      }, 600);
                    }
                  }}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    i === currentPage 
                      ? `${colors.accent} scale-125` 
                      : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                  aria-label={`Ir a página ${i + 1}`}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <style>{`
        /* 3D effects only on desktop */
        @media (min-width: 768px) {
          .page-left {
            transform-style: preserve-3d;
            transform: rotateY(5deg);
            transform-origin: right center;
          }

          .page-right {
            transform-style: preserve-3d;
            transform: rotateY(-5deg);
            transform-origin: left center;
          }

          @keyframes pageFlipLeft {
            0% {
              transform: rotateY(5deg);
            }
            50% {
              transform: rotateY(-10deg);
            }
            100% {
              transform: rotateY(5deg);
            }
          }

          @keyframes pageFlipRight {
            0% {
              transform: rotateY(-5deg);
            }
            50% {
              transform: rotateY(10deg);
            }
            100% {
              transform: rotateY(-5deg);
            }
          }

          .animate-page-flip-left {
            animation: pageFlipLeft 0.6s ease-in-out;
          }

          .animate-page-flip-right {
            animation: pageFlipRight 0.6s ease-in-out;
          }
        }
      `}</style>
    </div>
  );
}
