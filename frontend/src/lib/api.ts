import type { AnalysisResult, Highlight } from "@/lib/types";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";

export class ApiError extends Error {}

/** FastAPI returns `detail` as a string, or as a list for validation errors. */
async function readError(response: Response): Promise<string> {
  try {
    const body = await response.json();
    const detail = body?.detail;

    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) {
      return detail.map((d) => d?.msg ?? JSON.stringify(d)).join("; ");
    }
  } catch {
    // Fall through to the generic message below.
  }
  return `Request failed with status ${response.status}.`;
}

function friendlyNetworkError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  return new ApiError(
    "Could not reach the NoteKori backend. Make sure it is running on " +
      `${BASE_URL.replace("/api/v1", "")}.`,
  );
}

export async function checkHealth(): Promise<{
  status: string;
  model: string;
  api_key_configured: boolean;
}> {
  const response = await fetch(`${BASE_URL}/health`, { cache: "no-store" });
  if (!response.ok) throw new ApiError(await readError(response));
  return response.json();
}

export async function analyzeImage(file: File): Promise<AnalysisResult> {
  const formData = new FormData();
  formData.append("image", file);

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}/analyze`, {
      method: "POST",
      body: formData,
    });
  } catch (error) {
    throw friendlyNetworkError(error);
  }

  if (!response.ok) throw new ApiError(await readError(response));
  return response.json();
}

/** Streams the response straight to a download without holding it in state. */
async function downloadFile(
  path: string,
  payload: unknown,
  fallbackName: string,
): Promise<void> {
  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    throw friendlyNetworkError(error);
  }

  if (!response.ok) throw new ApiError(await readError(response));

  const disposition = response.headers.get("Content-Disposition") ?? "";
  const match = disposition.match(/filename="?([^"]+)"?/);
  const filename = match?.[1] ?? fallbackName;

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export async function exportMarkdown(
  result: AnalysisResult,
  highlights: Highlight[],
): Promise<void> {
  await downloadFile(
    "/export/markdown",
    { result, highlights },
    "NoteKori_Notes.md",
  );
}
