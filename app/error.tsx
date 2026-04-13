"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-50 px-4">
      <h1 className="text-2xl font-semibold text-slate-900">
        Une erreur est survenue
      </h1>
      <p className="max-w-md text-center text-sm text-slate-600">
        {error.message || "Erreur inattendue. Vous pouvez réessayer."}
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="mt-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
      >
        Réessayer
      </button>
    </div>
  );
}
