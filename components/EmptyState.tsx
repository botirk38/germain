"use client";

import { Sparkles, MapPin, Briefcase, Plane, GraduationCap, Users } from "lucide-react";

interface EmptyStateProps {
  onSuggestion: (text: string) => void;
}

const SUGGESTIONS = [
  {
    icon: Plane,
    text: "Germany tourist visa from US",
    value: "I need a tourist visa for Germany. I'm a US citizen planning to visit Berlin for a week in January.",
  },
  {
    icon: Briefcase,
    text: "Business visa application",
    value: "I need a business visa for a conference in Frankfurt. I work for a tech company.",
  },
  {
    icon: GraduationCap,
    text: "Student visa guidance",
    value: "I'm applying for a student visa to study in Germany. What documents do I need?",
  },
  {
    icon: Users,
    text: "Family visit visa",
    value: "I want to visit my family in Germany. What type of visa should I apply for?",
  },
  {
    icon: MapPin,
    text: "Schengen visa help",
    value: "I need help with a Schengen visa application. Where do I start?",
  },
];

export function EmptyState({ onSuggestion }: EmptyStateProps) {
  const handleSuggestion = (value: string) => {
    onSuggestion(value);
  };

  return (
    <div className="h-full flex flex-col items-center justify-center px-4">
      <div className="empty-state max-w-xl">
        {/* Icon */}
        <div className="empty-state-icon">
          <Sparkles className="w-8 h-8 text-white" />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-semibold mb-3">
          Welcome to Germain
        </h1>

        {/* Description */}
        <p className="text-[#a3a3a3] text-lg mb-2">
          Your AI visa case agent
        </p>
        <p className="text-[#737373] text-base max-w-md">
          I&apos;ll guide you through the visa application process, review your documents, 
          and help maximize your approval chances with personalized recommendations.
        </p>

        {/* Suggestion Chips */}
        <div className="suggestion-chips">
          {SUGGESTIONS.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => handleSuggestion(suggestion.value)}
              className="suggestion-chip"
            >
              <suggestion.icon className="w-4 h-4 inline mr-1" />
              {suggestion.text}
            </button>
          ))}
        </div>

        {/* Quick Stats */}
        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          <div className="p-3 bg-[#141414] rounded-lg border border-[#262626]">
            <div className="text-xl font-bold text-green-500">12</div>
            <div className="text-xs text-[#737373]">Step Process</div>
          </div>
          <div className="p-3 bg-[#141414] rounded-lg border border-[#262626]">
            <div className="text-xl font-bold text-blue-500">AI</div>
            <div className="text-xs text-[#737373]">Powered Review</div>
          </div>
          <div className="p-3 bg-[#141414] rounded-lg border border-[#262626]">
            <div className="text-xl font-bold text-amber-500">+25%</div>
            <div className="text-xs text-[#737373]">Avg. Odds Boost</div>
          </div>
        </div>
      </div>
    </div>
  );
}
