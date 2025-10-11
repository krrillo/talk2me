import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, BookOpen } from "lucide-react";

interface StoryContextProps {
  story: string;
  colorScheme?: "blue" | "green" | "purple" | "indigo" | "orange";
}

const COLOR_SCHEMES = {
  blue: {
    bg: "bg-blue-50",
    border: "border-blue-400",
    button: "text-blue-600 hover:text-blue-700",
  },
  green: {
    bg: "bg-green-50",
    border: "border-green-400",
    button: "text-green-600 hover:text-green-700",
  },
  purple: {
    bg: "bg-purple-50",
    border: "border-purple-400",
    button: "text-purple-600 hover:text-purple-700",
  },
  indigo: {
    bg: "bg-indigo-50",
    border: "border-indigo-400",
    button: "text-indigo-600 hover:text-indigo-700",
  },
  orange: {
    bg: "bg-orange-50",
    border: "border-orange-400",
    button: "text-orange-600 hover:text-orange-700",
  },
};

export function StoryContext({ story, colorScheme = "blue" }: StoryContextProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const colors = COLOR_SCHEMES[colorScheme];
  const isLongStory = story.length > 300;
  const displayText = isExpanded || !isLongStory ? story : story.substring(0, 300) + "...";

  return (
    <div className={`mb-6 p-4 ${colors.bg} rounded-lg border-l-4 ${colors.border}`}>
      <div className="flex items-start gap-3">
        <BookOpen className="w-5 h-5 text-gray-600 mt-1 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">
            Contexto de la historia:
          </h3>
          <p className="text-gray-800 text-base leading-relaxed font-medium whitespace-pre-wrap">
            {displayText}
          </p>
          {isLongStory && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className={`mt-3 ${colors.button} font-semibold`}
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="w-4 h-4 mr-1" />
                  Ver menos
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 mr-1" />
                  Ver historia completa
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
