import { TermsModal } from "./TermsModal";

export const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-200 py-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center items-center gap-5">
          <div>Buzzline @ 2025</div>

          <TermsModal
            trigger={
              <button className="text-sm text-gray-500 hover:text-gray-700 underline">
                User Terms
              </button>
            }
          />
        </div>
      </div>
    </footer>
  );
};
