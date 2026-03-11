import React, { useState } from "react";

export default function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    
    // Client-side validation
    if (!username.trim() || !password.trim()) {
      setError("Please enter both username and password");
      return;
    }

    setIsLoading(true);

    try {
      console.log("Attempting login with username:", username);
      const payload = { username, password };
      console.log("📤 Sending payload:", payload);
      console.log("📤 Payload JSON stringified:", JSON.stringify(payload));
      
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      console.log("Login response status:", response.status);
      const text = await response.text();
      console.log("📥 Response text:", text);
      
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        console.error("Failed to parse response:", text);
        setError("Invalid response from server");
        return;
      }
      
      console.log("Login response data:", data);

      if (!response.ok) {
        const errorMsg = data.error || data.message || "Login failed";
        console.error("Login error:", errorMsg);
        setError(errorMsg);
        return;
      }

      console.log("Login successful, redirecting to spaces...");
      // Redirect to dashboard
      window.location.href = "/spaces";
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "An error occurred. Please try again.";
      console.error("Login exception:", err);
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="card bg-slate-800/80 p-6">
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-slate-300 mb-2"
            >
              Username
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-400 focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition"
              placeholder="your-username"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-slate-300 mb-2"
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-400 focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition"
              placeholder="••••••••"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full btn-primary mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Signing in..." : "Sign In"}
        </button>

        <p className="text-center text-slate-400 text-sm mt-4">
          Don't have an account?{" "}
          <a
            href="/create-account"
            className="text-cyan-400 hover:text-cyan-300"
          >
            Create one
          </a>
        </p>
      </div>
    </form>
  );
}
