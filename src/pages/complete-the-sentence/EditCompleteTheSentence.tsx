import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useGetCompleteTheSentenceGame } from "@/api/complete-the-sentence/useGetCompleteTheSentenceGame";
import type { CompleteTheSentenceQuestion } from "@/api/complete-the-sentence/useGetCompleteTheSentenceGame";
import api from "@/api/axios";
import { FormField } from "@/components/ui/form-field";
import { TextareaField } from "@/components/ui/textarea-field";

const EditCompleteTheSentence: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: gameData, loading } = useGetCompleteTheSentenceGame(id || "");
  const [questions, setQuestions] = React.useState<
    CompleteTheSentenceQuestion[]
  >([]);
  const [name, setName] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (gameData) {
      setName(gameData.name || "");
      setQuestions(gameData.questions || []);
    }
  }, [gameData]);

  const handleQuestionChange = <K extends keyof CompleteTheSentenceQuestion>(
    idx: number,
    field: K,
    value: CompleteTheSentenceQuestion[K],
  ) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === idx ? { ...q, [field]: value } : q)),
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put(`/api/game/game-type/complete-the-sentence/${id}`, {
        name,
        questions,
      });
      navigate("/my-projects");
    } catch (err) {
      console.error("Failed to update game:", err);
      alert("Gagal menyimpan perubahan.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Edit Complete the Sentence</h1>
      <FormField label="Judul Game">
        <input
          className="w-full border rounded px-3 py-2 mb-4"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </FormField>
      {questions.map((q, idx) => (
        <div key={idx} className="mb-6 border p-4 rounded-lg bg-gray-50">
          <div className="font-semibold mb-2">Soal {idx + 1}</div>
          <TextareaField
            label="Klausa Kiri"
            value={q.left_clause}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              handleQuestionChange(idx, "left_clause", e.target.value)
            }
          />
          <TextareaField
            label="Klausa Kanan"
            value={q.right_clause}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              handleQuestionChange(idx, "right_clause", e.target.value)
            }
          />
          <FormField label="Konjungsi (benar)">
            <input
              className="w-full border rounded px-3 py-2"
              value={q.conjunctions[0] || ""}
              onChange={(e) =>
                handleQuestionChange(idx, "conjunctions", [e.target.value])
              }
            />
          </FormField>
          <TextareaField
            label="Penjelasan"
            value={q.explanation || ""}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              handleQuestionChange(idx, "explanation", e.target.value)
            }
          />
        </div>
      ))}
      <button
        className="px-6 py-2 rounded bg-blue-600 text-white font-bold mt-4"
        onClick={handleSave}
        disabled={saving}
      >
        {saving ? "Menyimpan..." : "Simpan Perubahan"}
      </button>
    </div>
  );
};

export default EditCompleteTheSentence;
