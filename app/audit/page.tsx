import { AuditForm } from "../../components/audit/AuditForm";

export const metadata = {
  title: "Audit Your AI Stack | AIStack Auditor",
  description:
    "Enter your AI tools and plans to discover savings opportunities and optimisation recommendations.",
};

export default function AuditPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        {/* Page heading */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Audit Your AI Stack
          </h1>
          <p className="mt-2 text-base text-gray-600">
            Add the AI tools your team uses and we&apos;ll identify savings and
            smarter alternatives.
          </p>
        </div>

        {/* Audit form */}
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200 sm:p-8">
          <AuditForm />
        </div>
      </div>
    </main>
  );
}
