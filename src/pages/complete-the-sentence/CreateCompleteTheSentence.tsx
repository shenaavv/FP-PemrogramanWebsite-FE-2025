import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { TextareaField } from "@/components/ui/textarea-field";
import { FormField } from "@/components/ui/form-field";
import { Button } from "@/components/ui/button";
import Dropzone from "@/components/ui/dropzone";
import toast from "react-hot-toast";
import { useCreateCompleteTheSentence as createCompleteTheSentence } from "@/api/complete-the-sentence/useCreateCompleteTheSentence";

interface Question {
  left_clause: string;
  right_clause: string;
  conjunctions: string[];
  explanation?: string;
}

const CreateCompleteTheSentence: React.FC = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [questions, setQuestions] = useState<Question[]>([
    { left_clause: "", right_clause: "", conjunctions: [""], explanation: "" },
  ]);
  const [loading, setLoading] = useState(false);

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

  const handleQuestionChange = (
    idx: number,
    field: keyof Question,
    value: string | string[],
  ) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === idx ? { ...q, [field]: value } : q)),
    );
  };

  const handleSubmit = async () => {
    if (
      !title ||
      !thumbnail ||
      questions.some(
        (q) => !q.left_clause || !q.right_clause || !q.conjunctions[0],
      )
    ) {
      toast.error("Please fill all required fields.");
      return;
    }
    setLoading(true);
    try {
      await createCompleteTheSentence({
        title,
        description,
        thumbnail,
        questions,
        is_published: true,
      });
      toast.success("Game created successfully!");
      navigate("/create-projects");
    } catch {
      toast.error("Failed to create game.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-slate-50 min-h-screen flex flex-col">
      <div className="bg-white h-fit w-full flex justify-between items-center px-8 py-4">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => navigate("/create-projects")}
        >
          Back
        </Button>
      </div>
      <div className="w-full h-full p-8 justify-center items-center flex flex-col">
        <div className="max-w-3xl w-full space-y-6">
          <h2 className="text-2xl font-bold text-[#E2852E]">
            Create Complete the Sentence Game
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
              disabled={loading}
            >
              {loading ? "Saving..." : "Save & Publish"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateCompleteTheSentence;
