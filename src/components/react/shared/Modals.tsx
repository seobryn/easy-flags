import { useState } from "react";

interface ModalsProps {}

export default function Modals({}: ModalsProps) {
  const [activeModal, setActiveModal] = useState<string | null>(null);

  const closeModal = () => setActiveModal(null);

  return (
    <>
      {/* Create Environment Modal */}
      <Modal
        id="create-environment-modal"
        isOpen={activeModal === "environment"}
        onClose={closeModal}
        title="Create Environment"
      >
        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Environment Name
            </label>
            <input
              type="text"
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-400 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              placeholder="e.g., Development, Staging"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-700 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-cyan-500 text-white hover:bg-cyan-600 transition"
            >
              Create
            </button>
          </div>
        </form>
      </Modal>

      {/* Create Feature Modal */}
      <Modal
        id="create-feature-modal"
        isOpen={activeModal === "feature"}
        onClose={closeModal}
        title="Create Feature Flag"
      >
        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Feature Key
            </label>
            <input
              type="text"
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-400 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              placeholder="e.g., NEW_DASHBOARD"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Description
            </label>
            <textarea
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-400 focus:ring-2 focus:ring-cyan-500 focus:border-transparent h-24 resize-none"
              placeholder="Describe this feature flag..."
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-700 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-cyan-500 text-white hover:bg-cyan-600 transition"
            >
              Create
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}

function Modal({
  id,
  isOpen,
  onClose,
  title,
  children,
}: {
  id: string;
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-slate-800 border border-cyan-700/30 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-cyan-300">{title}</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
