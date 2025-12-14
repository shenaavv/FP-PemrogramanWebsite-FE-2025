import React from "react";

interface FeedbackDialogProps {
  feedback: string;
  explanation?: string;
  isCorrect: boolean;
  onNext: () => void;
  isLast: boolean;
}

const FeedbackDialog: React.FC<FeedbackDialogProps> = ({
  feedback,
  explanation,
  isCorrect,
  onNext,
  isLast,
}) => {
  return (
    <div className="flex flex-col items-center gap-2 mt-2">
      <div
        className={`text-center text-xl font-bold ${isCorrect ? "text-green-700" : "text-red-600"}`}
      >
        {feedback}
      </div>
      {explanation && (
        <div className="mt-2 p-3 rounded-xl bg-white text-[#E2852E] text-base shadow-inner border border-[#F5C857]">
          {explanation}
        </div>
      )}
      <button
        className="w-full mt-4 py-2 rounded-full text-lg font-bold bg-white text-[#E2852E] border-2 border-[#E2852E] hover:bg-[#F5C857] transition-colors duration-150"
        onClick={onNext}
      >
        {isLast ? "Selesai" : "Soal Selanjutnya"}
      </button>
    </div>
  );
};

export default FeedbackDialog;
