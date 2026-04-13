import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-50 px-4">
      <h1 className="text-2xl font-semibold text-slate-900">
        404 — Page introuvable
      </h1>
      <p className="max-w-md text-center text-slate-600">
        Cette adresse n’existe pas ou a été déplacée.
      </p>
      <Link
        href="/events"
        className="mt-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
      >
        Retour au CRM
      </Link>
    </div>
  );
}
