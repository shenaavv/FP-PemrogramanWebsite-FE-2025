import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { TextareaField } from "@/components/ui/textarea-field";
import { FormField } from "@/components/ui/form-field";
import { Button } from "@/components/ui/button";
import Dropzone from "@/components/ui/dropzone";
import toast from "react-hot-toast";
import api from "@/api/axios";
import { useGetCompleteTheSentenceGameDetail } from "@/api/complete-the-sentence/useGetCompleteTheSentenceGameDetail";

const EditCompleteTheSentence: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: gameData, loading } = useGetCompleteTheSentenceGameDetail(
    id || "",
  );
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [questions, setQuestions] = useState([
    { left_clause: "", right_clause: "", conjunctions: [""], explanation: "" },
  ]);
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    if (gameData) {
      setTitle(gameData.name || "");
      setDescription(gameData.description || "");
      if (gameData.thumbnail_image) {
        const baseURL = import.meta.env.VITE_API_URL || "";
        const thumbnailUrl = gameData.thumbnail_image.startsWith("http")
          ? gameData.thumbnail_image
          : `${baseURL}/${gameData.thumbnail_image}`;
        setThumbnailPreview(thumbnailUrl);
      } else setThumbnailPreview(null);
      setThumbnail(null);
      // Map API fields (leftClause, rightClause, availableConjunctions) to frontend fields
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mappedQuestions = (gameData.questions || []).map((q: any) => ({
        left_clause: String(q.leftClause ?? q.left_clause ?? ""),
        right_clause: String(q.rightClause ?? q.right_clause ?? ""),
        conjunctions: (q.availableConjunctions ??
          q.conjunctions ?? [""]) as string[],
        explanation: String(q.explanation || ""),
      }));
      // Only set if there are questions, else keep default empty question
      if (mappedQuestions.length > 0) {
        setQuestions(mappedQuestions);
      }
    }
  }, [gameData]);

  const handleQuestionChange = (
    idx: number,
    field: keyof (typeof questions)[0],
    value: string | string[],
  ) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === idx ? { ...q, [field]: value } : q)),
    );
  };

  const addQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      {
        left_clause: "",
        right_clause: "",
        conjunctions: [""],
        explanation: "",
      },
    ]);
  };

  const removeQuestion = (idx: number) => {
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    if (
      !title ||
      !thumbnailPreview ||
      questions.some(
        (q) => !q.left_clause || !q.right_clause || !q.conjunctions[0],
      )
    ) {
      toast.error("Please fill all required fields.");
      return;
    }
    setSaving(true);
    try {
      await api.put(`/api/game/game-type/complete-the-sentence/${id}`, {
        name: title,
        description,
        thumbnail,
        questions,
        is_published: true,
      });
      toast.success("Game updated successfully!");
      navigate("/my-projects");
    } catch {
      toast.error("Failed to update game.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="w-full bg-slate-50 min-h-screen flex flex-col">
      <div className="bg-white h-fit w-full flex justify-between items-center px-8 py-4">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => navigate("/my-projects")}
        >
          Back
        </Button>
      </div>
      <div className="w-full h-full p-8 justify-center items-center flex flex-col">
        <div className="max-w-3xl w-full space-y-6">
          <h2 className="text-2xl font-bold text-[#E2852E]">
            Edit Complete the Sentence Game
          </h2>
          <div className="bg-white w-full h-full p-6 space-y-6 rounded-xl border">
            <FormField
              required
              label="Game Title"
              placeholder="Title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <TextareaField
              label="Description"
              placeholder="Describe your game"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <Dropzone
              required
              label="Thumbnail Image"
              allowedTypes={["image/png", "image/jpeg"]}
              maxSize={2 * 1024 * 1024}
              onChange={setThumbnail}
              defaultValue={thumbnailPreview}
            />
          </div>
          <div className="flex justify-between items-center">
            <span className="font-semibold">
              Questions ({questions.length})
            </span>
            <Button variant="outline" onClick={addQuestion}>
              Add Question
            </Button>
          </div>
          {questions.map((q, idx) => (
            <div
              key={idx}
              className="bg-white w-full h-full p-6 space-y-6 rounded-xl border"
            >
              <div className="flex justify-between">
                <span className="font-semibold">Question {idx + 1}</span>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => removeQuestion(idx)}
                  disabled={questions.length === 1}
                >
                  Remove
                </Button>
              </div>
              <FormField
                required
                label="Left Clause"
                placeholder="e.g. I wanted to go outside"
                type="text"
                value={q.left_clause}
                onChange={(e) =>
                  handleQuestionChange(idx, "left_clause", e.target.value)
                }
              />
              <FormField
                required
                label="Right Clause"
                placeholder="e.g. it was raining"
                type="text"
                value={q.right_clause}
                onChange={(e) =>
                  handleQuestionChange(idx, "right_clause", e.target.value)
                }
              />
              <FormField
                required
                label="Conjunction (answer)"
                placeholder="e.g. but"
                type="text"
                value={q.conjunctions[0]}
                onChange={(e) =>
                  handleQuestionChange(idx, "conjunctions", [e.target.value])
                }
              />
              <TextareaField
                label="Explanation"
                placeholder="Explain the answer (optional)"
                rows={2}
                value={q.explanation || ""}
                onChange={(e) =>
                  handleQuestionChange(idx, "explanation", e.target.value)
                }
              />
            </div>
          ))}
          <div className="flex gap-4 justify-end w-full">
            <Button
              size="sm"
              variant="outline"
              onClick={handleSubmit}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save & Publish"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditCompleteTheSentence;
