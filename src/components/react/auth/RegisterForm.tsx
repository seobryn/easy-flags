import { useState } from "react";
import { Icon } from "@/components/react/shared/Icon";

export default function RegisterForm() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.currentTarget;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passphrase mismatch detected.");
      return;
    }

    if (
      !formData.username.trim() ||
      !formData.email.trim() ||
      !formData.password.trim()
    ) {
      setError("Incomplete data profile.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || data.message || "Enrollment failed.");
        return;
      }

      setIsSuccess(true);
    } catch (err) {
      setError("Network uplink failure.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="bg-white/[0.02] backdrop-blur-3xl border border-white/5 rounded-[40px] p-10 md:p-14 shadow-2xl relative overflow-hidden group text-center space-y-8 animate-in zoom-in duration-500">
        <div className="w-24 h-24 bg-linear-to-r from-purple-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-purple-500/20">
          <Icon name="Mail" size={40} className="text-white" />
        </div>
        <div>
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-4">Uplink Established</h2>
          <p className="text-slate-400 text-lg">We've sent a verification protocol to <span className="text-white font-bold">{formData.email}</span>. Please authorize your access via the secure link.</p>
        </div>
        <div className="pt-8 border-t border-white/5">
          <a
            href="/login"
            className="inline-flex items-center gap-3 bg-white/5 hover:bg-white/10 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-white transition-all border border-white/5"
          >
            Return to Login <Icon name="ArrowRight" size={16} />
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/[0.02] backdrop-blur-3xl border border-white/5 rounded-[40px] p-10 md:p-14 shadow-2xl relative overflow-hidden group">
      {/* Aurora glow effect inside card */}
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/5 blur-[80px] rounded-full translate-y-1/2 -translate-x-1/2 group-hover:bg-purple-500/10 transition-colors duration-1000"></div>

      <form onSubmit={handleSubmit} className="relative z-10 space-y-8">
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 animate-in slide-in-from-top-2">
            <div className="text-red-500 shrink-0">
               <Icon name="AlertTriangle" size={18} />
            </div>
            <p className="text-red-400 font-bold text-xs tracking-tight">
              {error}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="group/input col-span-1 md:col-span-2">
            <label
                htmlFor="email"
                className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.25em] mb-3 px-1 group-focus-within/input:text-purple-400 transition-colors"
            >
                Digital Mailbox
            </label>
            <div className="relative">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within/input:text-purple-400 transition-colors">
                    <Icon name="Mail" size={18} />
                </div>
                <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full bg-slate-950/40 border border-white/5 border-b-white/10 rounded-2xl pl-14 pr-6 py-4 text-white font-medium placeholder-slate-700 focus:outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500/50 transition-all shadow-inner"
                placeholder="operative@domain.com"
                />
            </div>
            </div>

            <div className="group/input col-span-1 md:col-span-2">
            <label
                htmlFor="username"
                className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.25em] mb-3 px-1 group-focus-within/input:text-cyan-400 transition-colors"
            >
                Unique Codename
            </label>
            <div className="relative">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within/input:text-cyan-400 transition-colors">
                    <Icon name="User" size={18} />
                </div>
                <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                className="w-full bg-slate-950/40 border border-white/5 border-b-white/10 rounded-2xl pl-14 pr-6 py-4 text-white font-medium placeholder-slate-700 focus:outline-none focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-500/50 transition-all shadow-inner"
                placeholder="ghost-protocol"
                />
            </div>
            </div>

            <div className="group/input">
            <label
                htmlFor="password"
                className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.25em] mb-3 px-1 group-focus-within/input:text-white transition-colors"
            >
                Security Key
            </label>
            <div className="relative">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within/input:text-white transition-colors">
                    <Icon name="Lock" size={18} />
                </div>
                <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full bg-slate-950/40 border border-white/5 border-b-white/10 rounded-2xl pl-14 pr-6 py-4 text-white font-medium placeholder-slate-700 focus:outline-none focus:ring-4 focus:ring-white/10 focus:border-white/30 transition-all shadow-inner"
                placeholder="••••••••"
                />
            </div>
            </div>

            <div className="group/input">
            <label
                htmlFor="confirmPassword"
                className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.25em] mb-3 px-1 group-focus-within/input:text-white transition-colors"
            >
                Verify Key
            </label>
            <div className="relative">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within/input:text-white transition-colors">
                    <Icon name="Shield" size={18} />
                </div>
                <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="w-full bg-slate-950/40 border border-white/5 border-b-white/10 rounded-2xl pl-14 pr-6 py-4 text-white font-medium placeholder-slate-700 focus:outline-none focus:ring-4 focus:ring-white/10 focus:border-white/30 transition-all shadow-inner"
                placeholder="••••••••"
                />
            </div>
            </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-linear-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 py-5 rounded-2xl flex items-center justify-center gap-3 shadow-2xl shadow-purple-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:grayscale"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
          ) : (
            <>
              <span className="font-black text-xs uppercase tracking-widest text-white">Initialize Account</span>
              <Icon name="Rocket" size={16} className="text-white" />
            </>
          )}
        </button>

        <div className="pt-8 border-t border-white/5 text-center">
          <p className="text-slate-500 text-xs font-medium">
            Existing operator?{" "}
            <a
              href="/login"
              className="text-white font-bold hover:text-cyan-400 transition-colors underline underline-offset-4 decoration-white/20"
            >
              Sign In
            </a>
          </p>
        </div>
      </form>
    </div>
  );
}
