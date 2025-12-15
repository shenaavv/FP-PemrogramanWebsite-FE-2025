import React, { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useGetCompleteTheSentenceGame } from "@/api/complete-the-sentence/useGetCompleteTheSentenceGame";
import type { CompleteTheSentenceQuestion } from "@/api/complete-the-sentence/useGetCompleteTheSentenceGame";
import api from "@/api/axios";

import FeedbackDialog from "./FeedbackDialog";

const PRIMARY_ORANGE = "#E2852E";
const SOFT_YELLOW = "#F5C857";
const PASTEL_YELLOW = "#FFEE91";
const SKY_BLUE = "#ABE0F0";

const getRandomQuestions = (
  questions: CompleteTheSentenceQuestion[],
  count: number,
) => {
  const shuffled = [...questions].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

const CompleteTheSentenceGame: React.FC = () => {
  const navigate = useNavigate();
  const [authChecked, setAuthChecked] = useState(false);
  const [selectedConjunction, setSelectedConjunction] = useState<string | null>(
    null,
  );
  const [feedback, setFeedback] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [sessionQuestions, setSessionQuestions] = useState<
    CompleteTheSentenceQuestion[]
  >([]);
  const [draggedConjunction, setDraggedConjunction] = useState<string | null>(
    null,
  );
  const { id: urlId } = useParams<{ id: string }>();
  const location = useLocation();
  // Determine play mode: public or private
  const isPreview =
    location.pathname.includes("/preview") ||
    location.pathname.includes("/private");
  const gameId = urlId || "";

  // Auth check
  useEffect(() => {
    api
      .get("/api/auth/me")
      .then(() => setAuthChecked(true))
      .catch(() => navigate("/login"));
  }, [navigate]);

  // Use the correct game type for API
  const { data: gameData, loading } = useGetCompleteTheSentenceGame(
    gameId,
    isPreview ? "private" : "public",
  );

  // Prepare 5 random questions for the session, mapping API fields
  useEffect(() => {
    if (gameData?.questions?.length) {
      // Map API fields to frontend fields
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mappedQuestions = gameData.questions.map((q: any) => ({
        left_clause: q.leftClause ?? q.left_clause ?? "",
        right_clause: q.rightClause ?? q.right_clause ?? "",
        conjunctions: q.availableConjunctions ?? q.conjunctions ?? [],
        explanation: q.explanation ?? "",
      }));
      const count = Math.min(5, mappedQuestions.length);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setSessionQuestions(getRandomQuestions(mappedQuestions as any, count));
    }
  }, [gameData]);

  const question = sessionQuestions[currentQuestionIdx];

  // All conjunctions for this question, plus random distractors (total 3 options)
  const getOptions = () => {
    if (!question) return [];
    const allConjunctions = ["and", "but", "so", "or"];
    // Filter out empty strings from question's conjunctions
    const validConjunctions = question.conjunctions.filter(
      (c) => c && c.trim() !== "",
    );
    const options = new Set(validConjunctions);
    // Add random distractors until we have 3 options
    while (options.size < 3) {
      const random =
        allConjunctions[Math.floor(Math.random() * allConjunctions.length)];
      options.add(random);
    }
    return Array.from(options).sort(() => 0.5 - Math.random());
  };

  const options = getOptions();

  const handleDrop = (cj: string) => {
    setSelectedConjunction(cj);
    setFeedback(null);
    setShowExplanation(false);
  };

  // Allow unselecting the answer by clicking the blank
  const handleUnselect = () => {
    setSelectedConjunction(null);
    setFeedback(null);
    setShowExplanation(false);
  };

  const handleSubmit = () => {
    if (!selectedConjunction || !question) return;
    const isCorrect = selectedConjunction === question.conjunctions[0];
    setFeedback(isCorrect ? "🎉 Benar!" : "Coba lagi, ya!");
    setShowExplanation(true);
  };

  const handleNext = () => {
    setSelectedConjunction(null);
    setFeedback(null);
    setShowExplanation(false);
    setDraggedConjunction(null);
    setCurrentQuestionIdx((idx) => idx + 1);
  };

  const handleExit = async () => {
    setShowExitDialog(false);
    try {
      await api.post("/game/play-count", { gameType: "complete-the-sentence" });
    } catch (err) {
      // Log error for debugging

      console.error("Failed to post play-count:", err);
    }
    navigate("/");
  };

  if (loading || !authChecked)
    return (
      <div
        className="flex justify-center items-center h-screen"
        style={{ background: PASTEL_YELLOW }}
      >
        <div
          className="text-2xl font-bold animate-bounce"
          style={{ color: PRIMARY_ORANGE }}
        >
          Loading...
        </div>
      </div>
    );
  if (!question && sessionQuestions.length > 0)
    return (
      <div
        className="flex flex-col items-center justify-center h-screen gap-6"
        style={{ background: PASTEL_YELLOW }}
      >
        <div className="text-2xl font-bold" style={{ color: PRIMARY_ORANGE }}>
          Selesai! 🎉
        </div>
        <button
          className="px-8 py-3 rounded-full text-white font-bold text-lg shadow hover:bg-orange-700"
          style={{ background: PRIMARY_ORANGE }}
          onClick={handleExit}
        >
          Kembali ke Beranda
        </button>
      </div>
    );
  if (!question && sessionQuestions.length === 0)
    return (
      <div
        className="flex flex-col items-center justify-center h-screen gap-6"
        style={{ background: PASTEL_YELLOW }}
      >
        <div className="text-2xl font-bold" style={{ color: PRIMARY_ORANGE }}>
          Tidak ada soal tersedia untuk game ini.
        </div>
        <button
          className="px-8 py-3 rounded-full text-white font-bold text-lg shadow hover:bg-orange-700"
          style={{ background: PRIMARY_ORANGE }}
          onClick={handleExit}
        >
          Kembali ke Beranda
        </button>
      </div>
    );

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-8"
      style={{ background: PASTEL_YELLOW }}
    >
      <div
        className="w-full max-w-lg rounded-3xl shadow-xl p-8 flex flex-col gap-6 border-4"
        style={{ background: SKY_BLUE, borderColor: SOFT_YELLOW }}
      >
        <div className="flex flex-col gap-2 items-center">
          <div
            className="text-xl font-bold mb-2 drop-shadow"
            style={{ color: PRIMARY_ORANGE }}
          >
            Soal {currentQuestionIdx + 1} dari 5
          </div>
          <div
            className="bg-white rounded-xl px-4 py-3 shadow flex flex-col gap-1 w-full text-center text-lg font-semibold"
            style={{ color: PRIMARY_ORANGE }}
          >
            {/* Show the question as a complete sentence with a blank */}
            {question && (
              <div className="flex flex-row items-center justify-center gap-2 flex-wrap">
                <span
                  className={question.left_clause ? "" : "text-gray-400 italic"}
                >
                  {question.left_clause || "[Left clause]"}
                </span>
                <span className="inline-block min-w-[60px] mx-2 align-middle">
                  <span
                    className="inline-block min-w-[60px] min-h-[36px] border-2 border-dashed rounded-lg text-center align-middle cursor-pointer bg-yellow-100"
                    style={{
                      borderColor: PRIMARY_ORANGE,
                      background: SOFT_YELLOW,
                    }}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (draggedConjunction) handleDrop(draggedConjunction);
                    }}
                  >
                    {selectedConjunction ? (
                      <span
                        className="font-bold cursor-pointer"
                        style={{ color: PRIMARY_ORANGE }}
                        onClick={handleUnselect}
                        title="Klik untuk hapus jawaban"
                      >
                        {selectedConjunction.toUpperCase()}
                        <span className="ml-1 text-gray-400">x</span>
                      </span>
                    ) : (
                      <span
                        className="text-gray-400 cursor-pointer"
                        onClick={handleUnselect}
                      >
                        ____
                      </span>
                    )}
                  </span>
                </span>
                <span
                  className={
                    question.right_clause ? "" : "text-gray-400 italic"
                  }
                >
                  {question.right_clause || "[Right clause]"}
                </span>
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-4 justify-center mt-2">
          {options.map((cj) => (
            <div
              key={cj}
              draggable={true}
              onDragStart={(e) => {
                e.dataTransfer.setData("text/plain", cj);
                setDraggedConjunction(cj);
              }}
              onDragEnd={() => setDraggedConjunction(null)}
              onClick={() => handleDrop(cj)}
              className={`px-4 py-2 rounded-full font-bold shadow cursor-grab select-none active:cursor-grabbing ${selectedConjunction === cj ? "bg-orange-400 text-white" : "bg-white text-orange-600 border-2 border-orange-400"}`}
              style={{
                minWidth: 60,
                textAlign: "center",
                userSelect: "none",
                WebkitUserSelect: "none",
              }}
            >
              {cj.toUpperCase()}
            </div>
          ))}
        </div>
        <button
          className={`w-full mt-2 py-3 rounded-full text-xl font-bold shadow transition-colors duration-150 ${selectedConjunction && !feedback ? "text-white" : "bg-gray-300 text-gray-500 cursor-not-allowed"}`}
          style={
            selectedConjunction && !feedback
              ? { background: PRIMARY_ORANGE }
              : {}
          }
          onClick={handleSubmit}
          disabled={!selectedConjunction || !!feedback}
        >
          Cek Jawaban
        </button>
        {feedback && (
          <FeedbackDialog
            feedback={feedback}
            explanation={showExplanation ? question.explanation : undefined}
            isCorrect={feedback.includes("Benar")}
            onNext={handleNext}
            isLast={currentQuestionIdx === 4}
          />
        )}
        <button
          className="w-full mt-2 py-2 rounded-full text-lg font-bold bg-white transition-colors duration-150"
          style={{
            color: PRIMARY_ORANGE,
            border: `2px solid ${PRIMARY_ORANGE}`,
          }}
          onClick={() => setShowExitDialog(true)}
        >
          Keluar
        </button>
        {showExitDialog && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-30">
            <div
              className="bg-white rounded-2xl p-6 shadow-xl flex flex-col gap-4 items-center border-4"
              style={{ borderColor: SOFT_YELLOW }}
            >
              <div
                className="text-xl font-bold"
                style={{ color: PRIMARY_ORANGE }}
              >
                Keluar dari Game?
              </div>
              <div className="text-base text-gray-700">
                Yakin ingin keluar? Progress tidak akan disimpan.
              </div>
              <div className="flex gap-4 mt-2">
                <button
                  className="px-6 py-2 rounded-full text-white font-bold shadow hover:bg-orange-700"
                  style={{ background: PRIMARY_ORANGE }}
                  onClick={handleExit}
                >
                  Ya, Keluar
                </button>
                <button
                  className="px-6 py-2 rounded-full bg-white font-bold shadow"
                  style={{
                    color: PRIMARY_ORANGE,
                    border: `2px solid ${PRIMARY_ORANGE}`,
                  }}
                  onClick={() => setShowExitDialog(false)}
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompleteTheSentenceGame;
