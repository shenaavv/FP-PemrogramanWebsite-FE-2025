import { useEffect, useState, type ChangeEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "@/api/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Trash2,
  Plus,
  Save,
  ArrowLeft,
  Image as ImageIcon,
  Upload,
  Eye,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import toast from "react-hot-toast";

interface QuestionItem {
  id: number;
  real_id?: number;
  word: string;
  imageFile: File | null;
  previewUrl: string | null;
}

interface ApiQuestion {
  id?: number;
  question_id?: number;
  correct_word?: string;
  image_url?: string | null;
}

const EditAnagram = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  const [gameInfo, setGameInfo] = useState({
    name: "",
    description: "",
    is_publish: false,
    is_question_randomized: false,
  });

  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);

  const [questions, setQuestions] = useState<QuestionItem[]>([
    { id: Date.now(), word: "", imageFile: null, previewUrl: null },
  ]);

  // FETCH EXISTING DATA
  useEffect(() => {
    if (!id) return;

    const fetchAnagram = async () => {
      setLoadingData(true);
      try {
        const res = await api.get(`/api/game/anagram/${id}`);
        const data = res.data.data;

        console.log("=== FULL DATA ===", data);

        // Set basic info
        setGameInfo({
          name: data.name || "",
          description: data.description || "",
          is_publish: !!data.is_published,
          is_question_randomized: !!data.is_question_randomized,
        });

        // Set thumbnail
        if (data.thumbnail_image) {
          setThumbnailPreview(
            `${import.meta.env.VITE_API_URL}/${data.thumbnail_image}`,
          );
        }

        // Questions ada di data.questions
        const questionsData = data.questions || [];

        console.log("=== QUESTIONS DATA ===", questionsData);

        const mappedQuestions: QuestionItem[] = questionsData.map(
          (q: ApiQuestion, idx: number) => {
            let imageUrl = null;
            if (q.image_url) {
              imageUrl = `${import.meta.env.VITE_API_URL}/${q.image_url}`;
            }

            console.log(`Question ${idx + 1}:`, {
              word: q.correct_word,
              imageUrl,
            });

            return {
              id: Date.now() + idx,
              real_id: q.question_id || q.id,
              word: q.correct_word || "",
              imageFile: null,
              previewUrl: imageUrl,
            };
          },
        );

        console.log("=== MAPPED QUESTIONS ===", mappedQuestions);

        setQuestions(
          mappedQuestions.length > 0
            ? mappedQuestions
            : [{ id: Date.now(), word: "", imageFile: null, previewUrl: null }],
        );
      } catch (error) {
        console.error(error);
        toast.error("Failed to load anagram data");
      } finally {
        setLoadingData(false);
      }
    };

    fetchAnagram();
  }, [id]);

  const handleThumbnailChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setThumbnail(file);
      setThumbnailPreview(URL.createObjectURL(file));
    }
  };

  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      { id: Date.now(), word: "", imageFile: null, previewUrl: null },
    ]);
  };

  const handleRemoveQuestion = (id: number) => {
    if (questions.length === 1) return;
    setQuestions(questions.filter((q) => q.id !== id));
  };

  const handleQuestionWordChange = (id: number, val: string) => {
    const updated = questions.map((q) =>
      q.id === id ? { ...q, word: val } : q,
    );
    setQuestions(updated);
  };

  const handleQuestionImageChange = (
    id: number,
    e: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const updated = questions.map((q) => {
        if (q.id === id) {
          return {
            ...q,
            imageFile: file,
            previewUrl: URL.createObjectURL(file),
          };
        }
        return q;
      });
      setQuestions(updated);
    }
  };

  const handleSubmit = async (publish = false) => {
    // 1. Validasi Input
    if (!gameInfo.name) {
      toast.error("Game Title is required!");
      return;
    }

    for (let i = 0; i < questions.length; i++) {
      if (!questions[i].word) {
        toast.error(`Question ${i + 1}: Correct Answer (Word) is required!`);
        return;
      }
      // Validasi gambar: Harus ada File baru ATAU URL preview lama
      if (!questions[i].imageFile && !questions[i].previewUrl) {
        toast.error(`Question ${i + 1}: Image Hint is required!`);
        return;
      }
    }

    setIsLoading(true);

    try {
      const formData = new FormData();

      // 2. Append Info Dasar
      formData.append("name", gameInfo.name);
      formData.append("description", gameInfo.description);
      formData.append(
        "is_publish",
        (publish || gameInfo.is_publish).toString(),
      );
      formData.append(
        "is_question_randomized",
        gameInfo.is_question_randomized.toString(),
      );

      if (thumbnail) {
        formData.append("thumbnail_image", thumbnail);
      }

      // 3. Logic Gambar Baru (FIXED)
      // Kita pisahkan file fisik dan logikanya biar gak error 422
      const filesToUpload: File[] = [];
      const questionFileMap: Record<number, number> = {}; // Map index soal -> index file

      questions.forEach((q, index) => {
        if (q.imageFile) {
          // Hanya jika user upload gambar baru, kita catat indexnya
          questionFileMap[index] = filesToUpload.length;
          filesToUpload.push(q.imageFile);
        }
        // Jika pakai gambar lama (previewUrl), skip aja. Jangan push string ke file array.
      });

      // Masukkan file fisik ke formData
      filesToUpload.forEach((f) => {
        formData.append("files_to_upload", f);
      });

      // 4. Buat Payload JSON (FIXED - Logic ID & Image di dalam Map)
      const questionsPayload = questions.map((q, idx) => {
        // Pakai 'any' biar aman nambah properti dinamis
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const payload: any = {
          correct_word: q.word.toUpperCase(),
        };

        // A. Masukkan ID Asli (PENTING BUAT EDIT/UPDATE)
        if (q.real_id) {
          // Note: Cek backend kamu mintanya 'question_id' atau 'id'.
          // Biasanya untuk update data nested pakai 'question_id' atau 'id'.
          payload.question_id = q.real_id;
        }

        // B. Masukkan Index Gambar (Hanya jika ada gambar BARU)
        if (questionFileMap[idx] !== undefined) {
          payload.question_image_array_index = questionFileMap[idx];
        }
        // Jika tidak ada gambar baru, field question_image_array_index TIDAK DIKIRIM.
        // Backend akan otomatis mempertahankan gambar lama.

        return payload;
      });

      formData.append("questions", JSON.stringify(questionsPayload));

      // Debugging: Cek console browser kalau masih error
      console.log("Payload Questions:", questionsPayload);

      await api.patch(`/api/game/anagram/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Anagram Game Updated Successfully!");
      navigate("/my-projects");
    } catch (error: unknown) {
      console.error(error);
      // @ts-expect-error: response property exists on AxiosError but not on generic Error
      const msg = error?.response?.data?.message || (error as Error).message;
      toast.error(`Error: ${msg}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="w-full h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-300 border-t-black"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 pb-32 relative">
      <div className="mb-6">
        <Button
          size="sm"
          variant="ghost"
          className="gap-2 pl-0 text-slate-500 hover:text-slate-900 hover:bg-transparent"
          onClick={() => navigate("/my-projects")}
        >
          <ArrowLeft className="w-5 h-5" /> Back to Projects
        </Button>
      </div>

      <div className="max-w-5xl mx-auto space-y-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">
            Edit Anagram Game
          </h1>
          <p className="text-slate-500 mt-1">
            Update your anagram game. Changes will be saved when you click Save
            or Publish.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>
                    Game Title <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    placeholder="Example: Guess the Animal Name"
                    value={gameInfo.name}
                    onChange={(e) =>
                      setGameInfo({ ...gameInfo, name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    placeholder="Brief description of this game..."
                    value={gameInfo.description}
                    onChange={(e) =>
                      setGameInfo({ ...gameInfo, description: e.target.value })
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Question List</h2>
                <span className="text-sm text-slate-500">
                  Total: {questions.length} Questions
                </span>
              </div>

              {questions.map((q, index) => {
                console.log(`Rendering Question ${index}:`, {
                  id: q.id,
                  word: q.word,
                  previewUrl: q.previewUrl,
                  hasPreview: !!q.previewUrl,
                });

                return (
                  <Card
                    key={q.id}
                    className="relative overflow-hidden border-l-4 border-l-blue-500 shadow-sm"
                  >
                    <CardContent className="pt-6 flex flex-col md:flex-row gap-6">
                      <div className="flex-shrink-0 w-full md:w-48 space-y-2">
                        <Label className="text-xs font-semibold uppercase text-slate-500">
                          Image Hint <span className="text-red-500">*</span>
                        </Label>
                        <div
                          className={`h-32 w-full border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors ${q.previewUrl ? "border-blue-500 bg-blue-50" : "border-slate-300 hover:bg-slate-50"}`}
                          onClick={() =>
                            document.getElementById(`q-img-${q.id}`)?.click()
                          }
                        >
                          {q.previewUrl ? (
                            <div className="relative w-full h-full">
                              <img
                                src={q.previewUrl}
                                alt={`Preview ${index + 1}`}
                                className="h-full w-full object-cover rounded-md"
                                onError={(e) => {
                                  console.error(
                                    `Image load error for question ${index}:`,
                                    q.previewUrl,
                                  );
                                  console.log(
                                    "Image element:",
                                    e.currentTarget,
                                  );
                                }}
                                onLoad={() => {
                                  console.log(
                                    `Image loaded successfully for question ${index}`,
                                  );
                                }}
                              />
                            </div>
                          ) : (
                            <div className="text-center p-2">
                              <ImageIcon className="w-8 h-8 mx-auto text-slate-400 mb-1" />
                              <span className="text-xs text-slate-500">
                                Upload Image
                              </span>
                            </div>
                          )}
                          <input
                            id={`q-img-${q.id}`}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleQuestionImageChange(q.id, e)}
                          />
                        </div>
                      </div>

                      <div className="flex-1 space-y-4">
                        <div className="flex justify-between items-start">
                          <div className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold">
                            Question #{index + 1}
                          </div>
                          {questions.length > 1 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:bg-red-50 hover:text-red-600"
                              onClick={() => handleRemoveQuestion(q.id)}
                            >
                              <Trash2 className="w-4 h-4 mr-1" /> Remove
                            </Button>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label>
                            Correct Answer (Word){" "}
                            <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            placeholder="Example: CAT"
                            value={q.word}
                            onChange={(e) =>
                              handleQuestionWordChange(q.id, e.target.value)
                            }
                            className="font-mono uppercase tracking-wider"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              <Button
                variant="outline"
                className="w-full py-8 border-dashed border-2 text-slate-500 hover:border-blue-500 hover:text-blue-500 hover:bg-blue-50"
                onClick={handleAddQuestion}
              >
                <Plus className="w-5 h-5 mr-2" /> Add New Question
              </Button>
            </div>
          </div>

          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Game Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Game Thumbnail</Label>
                  <div
                    className="aspect-video w-full border rounded-md bg-slate-100 flex items-center justify-center overflow-hidden cursor-pointer hover:opacity-80 transition"
                    onClick={() =>
                      document.getElementById("thumb-input")?.click()
                    }
                  >
                    {thumbnailPreview ? (
                      <img
                        src={thumbnailPreview}
                        alt="Thumbnail"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center text-slate-400">
                        <Upload className="w-8 h-8 mb-2" />
                        <span className="text-xs">Upload Cover</span>
                      </div>
                    )}
                  </div>
                  <input
                    id="thumb-input"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleThumbnailChange}
                  />
                </div>

                <hr />

                <div className="flex items-center justify-between">
                  <Label htmlFor="randomize" className="cursor-pointer">
                    Randomize Question Order?
                  </Label>
                  <Switch
                    id="randomize"
                    checked={gameInfo.is_question_randomized}
                    onCheckedChange={(checked) =>
                      setGameInfo({
                        ...gameInfo,
                        is_question_randomized: checked,
                      })
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 shadow-lg z-50">
        <div className="max-w-5xl mx-auto flex justify-between items-center gap-4">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant="destructive">
                Cancel
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Discard Changes?</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to cancel? All unsaved changes will be
                  lost.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep Editing</AlertDialogCancel>
                <AlertDialogAction onClick={() => navigate("/my-projects")}>
                  Discard
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <div className="flex gap-2">
            <Button
              size="lg"
              variant="outline"
              onClick={() => handleSubmit(false)}
              disabled={isLoading}
            >
              <Save className="w-5 h-5 mr-2" /> Save Draft
            </Button>
            <Button
              size="lg"
              onClick={() => handleSubmit(true)}
              disabled={isLoading}
              className="min-w-[150px]"
            >
              {isLoading ? (
                "Saving..."
              ) : (
                <>
                  <Eye className="w-5 h-5 mr-2" /> Publish
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditAnagram;
