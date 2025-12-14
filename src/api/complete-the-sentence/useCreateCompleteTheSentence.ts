import api from "@/api/axios";

export interface CompleteTheSentenceQuestionPayload {
  left_clause: string;
  right_clause: string;
  conjunctions: string[];
  explanation?: string;
}

export interface CompleteTheSentencePayload {
  title: string;
  description?: string;
  thumbnail: File;
  questions: CompleteTheSentenceQuestionPayload[];
  is_published: boolean;
}

export const useCreateCompleteTheSentence = async (
  payload: CompleteTheSentencePayload,
) => {
  const formData = new FormData();
  formData.append("title", payload.title);
  if (payload.description) formData.append("description", payload.description);
  formData.append("thumbnail", payload.thumbnail);
  formData.append("is_published", String(payload.is_published));
  formData.append("questions", JSON.stringify(payload.questions));

  const response = await api.post(
    "/api/game/game-type/complete-the-sentence",
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    },
  );
  return response.data;
};
