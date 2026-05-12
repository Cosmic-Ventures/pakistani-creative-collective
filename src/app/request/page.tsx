import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hire Talent",
  description:
    "Submit a talent request to find vetted Pakistani creative professionals for your project.",
};

export default function RequestPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-3xl font-bold text-white mb-3">Hire Pakistani Talent</h1>
      <p className="text-stone-400 mb-10 leading-relaxed">
        Submit a request below and our team will match you with the right
        member. All requests are screened before we reach out to any member —
        privacy and accountability are core to how PCC operates.
      </p>

      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-8 mb-8">
        <h2 className="font-semibold text-white mb-6">Submit a Talent Request</h2>
        <form
          action={`mailto:hello@aneesatalks.com?subject=PCC Talent Request`}
          method="get"
          className="space-y-5"
        >
          <div>
            <label className="block text-sm text-stone-400 mb-1.5" htmlFor="org">
              Organization / Your Name *
            </label>
            <input
              id="org"
              name="body"
              type="text"
              required
              className="w-full bg-stone-800 border border-stone-700 rounded-lg px-4 py-2.5 text-white placeholder-stone-500 focus:outline-none focus:border-emerald-600 text-sm"
              placeholder="Production company, studio, or your name"
            />
          </div>

          <div>
            <label className="block text-sm text-stone-400 mb-1.5" htmlFor="role">
              Role / Profession Needed *
            </label>
            <input
              id="role"
              type="text"
              required
              className="w-full bg-stone-800 border border-stone-700 rounded-lg px-4 py-2.5 text-white placeholder-stone-500 focus:outline-none focus:border-emerald-600 text-sm"
              placeholder="e.g. Director of Photography, Composer, Editor"
            />
          </div>

          <div>
            <label className="block text-sm text-stone-400 mb-1.5" htmlFor="project">
              Project Description *
            </label>
            <textarea
              id="project"
              required
              rows={4}
              className="w-full bg-stone-800 border border-stone-700 rounded-lg px-4 py-2.5 text-white placeholder-stone-500 focus:outline-none focus:border-emerald-600 text-sm resize-none"
              placeholder="Brief description of your project, timeline, and budget range"
            />
          </div>

          <div>
            <label className="block text-sm text-stone-400 mb-1.5" htmlFor="contact">
              Contact Email *
            </label>
            <input
              id="contact"
              type="email"
              required
              className="w-full bg-stone-800 border border-stone-700 rounded-lg px-4 py-2.5 text-white placeholder-stone-500 focus:outline-none focus:border-emerald-600 text-sm"
              placeholder="your@email.com"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 rounded-full transition-colors"
          >
            Send Request
          </button>
        </form>
      </div>

      <div className="bg-stone-900/40 border border-stone-800 rounded-xl p-6 text-sm text-stone-400">
        <p className="mb-2 text-stone-300 font-medium">How matching works</p>
        <ol className="list-decimal list-inside space-y-1.5 leading-relaxed">
          <li>We review your request within 2–3 business days.</li>
          <li>If approved, we identify matching members from the database.</li>
          <li>We reach out to the member on your behalf — never sharing your contact directly.</li>
          <li>If they're interested, we facilitate the introduction.</li>
        </ol>
      </div>
    </div>
  );
}
