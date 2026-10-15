import { useState, useEffect } from "react";
import { FacilitatorInterface } from "./components/FacilitatorInterface";
import { Eye, EyeOff, LogOut, AlertCircle } from "lucide-react";

// Designated prototype credentials (or accept any valid @apc.edu.ph institutional email)
const VALID_FACILITATOR_EMAIL = "facilitator@organization.edu";
const VALID_PASSWORD = "password123";

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Check saved session or prefill saved email on load
  useEffect(() => {
    const savedSession = localStorage.getItem("notified_facilitator_logged_in");
    const savedEmail = localStorage.getItem("notified_facilitator_remembered_email");

    if (savedSession === "true") {
      setIsLoggedIn(true);
    }
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();

    // 1. Validation checks
    if (!trimmedEmail || !trimmedPassword) {
      setErrorMessage("Please enter both email and password.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    // 2. Prototype Credential Verification
    const isValid =
      (trimmedEmail === VALID_FACILITATOR_EMAIL && trimmedPassword === VALID_PASSWORD) ||
      (trimmedEmail.endsWith("@student.apc.edu.ph") && trimmedPassword.length >= 6) ||
      (trimmedEmail.endsWith("@apc.edu.ph") && trimmedPassword.length >= 6);

    if (!isValid) {
      setErrorMessage("Invalid email or password");
      return;
    }

    // 3. Handle Remember Me & Session storage
    if (rememberMe) {
      localStorage.setItem("notified_facilitator_remembered_email", trimmedEmail);
      localStorage.setItem("notified_facilitator_logged_in", "true");
    } else {
      localStorage.removeItem("notified_facilitator_remembered_email");
      localStorage.removeItem("notified_facilitator_logged_in");
    }

    setIsLoggedIn(true);
    setPassword("");
  };

  const handleLogout = () => {
    localStorage.removeItem("notified_facilitator_logged_in");
    setIsLoggedIn(false);
    setPassword("");
    setErrorMessage("");
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen w-full bg-[#080E21] flex flex-col items-center justify-center p-4 md:p-8 font-sans text-white">
        {/* Top Floating Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/80 text-xs font-semibold mb-6 shadow-sm">
          <span className="size-2 rounded-full bg-blue-500"></span>
          NOTIFIED: FACILITATOR PORTAL
        </div>

        {/* Main Split-Screen Container Card */}
        <div className="w-full max-w-5xl bg-[#0D152D] rounded-3xl overflow-hidden shadow-2xl border border-white/5 grid grid-cols-1 lg:grid-cols-12 min-h-[620px]">
          
          {/* ── LEFT COLUMN: Login Form (5 cols) ── */}
          <div className="lg:col-span-5 p-8 md:p-10 flex flex-col justify-between bg-[#0B132B]">
            <div>
              {/* Brand Logo & Title with Yellow N */}
              <div className="flex items-center gap-2.5 mb-8">
                <span className="text-3xl font-black text-[#FFD000] tracking-tight">N</span>
                <span className="text-2xl font-black text-[#FFD000] tracking-tight">NotifiED</span>
              </div>

              {/* Form Heading Retaining Original Text */}
              <div className="mb-6 text-left">
                <h1 className="text-2xl font-bold text-white mb-1">Facilitator Login</h1>
                <p className="text-xs text-[#8D99AE]">
                  Welcome back! Submit and track your event proposals.
                </p>
              </div>

              {/* Error Message */}
              {errorMessage && (
                <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-start gap-2">
                  <AlertCircle className="size-4 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Input Form */}
              <form onSubmit={handleLogin} className="space-y-4 text-left">
                <div>
                  <label className="text-xs font-semibold text-[#8D99AE] block mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="facilitator@organization.edu"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0E1733] border border-white/10 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-[#FFD000] transition"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#8D99AE] block mb-1">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#0E1733] border border-white/10 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-[#FFD000] transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>

                {/* Remember Me & Forgot Password */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="flex items-center gap-2 text-[#8D99AE] hover:text-white cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded bg-[#0E1733] border-white/20 text-[#FFD000] focus:ring-0 cursor-pointer"
                    />
                    Remember Me
                  </label>
                  <span className="text-blue-400 hover:text-blue-300 hover:underline cursor-pointer">
                    Forgot Password
                  </span>
                </div>

                {/* Sign In as Facilitator Button */}
                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-[#0E1733] hover:bg-[#16203D] border border-white/10 text-white font-bold text-xs tracking-wide transition shadow-md hover:shadow-lg cursor-pointer mt-3"
                >
                  Sign In as Facilitator
                </button>
              </form>
            </div>

            {/* Footer Tag */}
            <div className="mt-8 text-[11px] text-[#8D99AE]/50">
              © 2026 Asia Pacific College • All rights reserved.
            </div>
          </div>

          {/* ── RIGHT COLUMN: Branded Canvas (7 cols) ── */}
          <div className="lg:col-span-7 bg-gradient-to-br from-[#1C2574] via-[#161F55] to-[#0E1538] p-8 md:p-12 flex flex-col justify-between relative overflow-hidden">
            {/* Background Organic Shapes */}
            <div className="absolute -top-16 -right-16 size-72 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 right-0 size-80 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

            {/* Header Content */}
            <div className="relative z-10 text-left max-w-md">
              <h2 className="text-3xl md:text-4xl font-extrabold text-white leading-tight mb-2">
                Welcome to the <br /> Facilitator Workspace
              </h2>
              <p className="text-xs md:text-sm text-blue-200/80 leading-relaxed">
                Draft, pre-audit, and submit campus event proposals for clearance.
              </p>
            </div>

            {/* Dual Actor Illustration Area */}
            <div className="relative z-10 flex items-center justify-center mt-6">
              <img
                src="/assets/auth-illustration.png"
                alt="Facilitator Workspace Illustration"
                className="w-full max-h-[340px] object-contain drop-shadow-2xl"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            </div>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-[#0B132B] overflow-hidden">
      {/* Subheader bar with Exit to Login */}
      <header className="h-10 bg-[#0E1733] border-b border-white/10 px-6 flex items-center justify-between text-xs text-white shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-slate-400">Portal:</span>
          <span className="font-bold text-blue-400">Facilitator View</span>
        </div>
        <button
          onClick={handleLogout}
          className="px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-white flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <LogOut className="size-3" />
          Exit to Login
        </button>
      </header>

      {/* Main Facilitator Dashboard */}
      <main className="flex-1 flex overflow-hidden">
        <FacilitatorInterface onLogout={handleLogout} />
      </main>
    </div>
  );
}
