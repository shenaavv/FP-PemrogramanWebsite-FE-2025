import { useEffect, useState } from "react";
import api from "@/api/axios";

export interface CompleteTheSentenceQuestion {
  id: string;
  left_clause: string;
  right_clause: string;
  conjunctions: string[];
  explanation?: string;
}

export interface CompleteTheSentenceGameData {
  id: string;
  name: string;
  description: string;
  thumbnail_image: string;
  questions: CompleteTheSentenceQuestion[];
  is_published: boolean;
}

export interface CompleteTheSentenceGameResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: CompleteTheSentenceGameData;
}

export const useGetCompleteTheSentenceGame = (gameId: string) => {
  const [data, setData] = useState<CompleteTheSentenceGameData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchGame = async () => {
      try {
        setLoading(true);
        const response = await api.get<CompleteTheSentenceGameResponse>(
          `/api/game/game-type/complete-the-sentence/${gameId}/play/public`,
        );
        setData(response.data.data);
        setError(null);
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error("Failed to fetch game"),
        );
        setData(null);
      } finally {
        setLoading(false);
      }
    };
    if (gameId) {
      fetchGame();
    }
  }, [gameId]);

  return { data, loading, error };
};
