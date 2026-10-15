import { useState, useEffect } from "react";
import { FacilitatorInterface } from "./components/FacilitatorInterface";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import facilitatorBg from "../assets/facilitator-bg.svg";

const VALID_FACILITATOR_EMAIL = "facilitator@organization.edu";
const VALID_PASSWORD = "password123";

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

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

    if (!trimmedEmail || !trimmedPassword) {
      setErrorMessage("Please enter both email and password.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    const isValid =
      (trimmedEmail === VALID_FACILITATOR_EMAIL && trimmedPassword === VALID_PASSWORD) ||
      (trimmedEmail.endsWith("@student.apc.edu.ph") && trimmedPassword.length >= 6) ||
      (trimmedEmail.endsWith("@apc.edu.ph") && trimmedPassword.length >= 6);

    if (!isValid) {
      setErrorMessage("Invalid email or password");
      return;
    }

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
      <div
        className="min-h-screen w-full relative flex flex-col items-center justify-center p-4 md:p-8 font-sans text-white bg-[#0B132B] bg-cover bg-center overflow-x-hidden"
        style={{ backgroundImage: `url(${facilitatorBg})` }}
      >
        {/* Top Status Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#0B132B]/90 border border-white/15 text-white/90 text-xs font-semibold mb-6 shadow-md z-10">
          <span className="size-2 bg-blue-500"></span>
          NOTIFIED: FACILITATOR PORTAL
        </div>

        {/* Split Screen Container (Sharp 90-Degree Corners) */}
        <div className="w-full max-w-5xl bg-[#0D152D]/95 border border-white/10 shadow-2xl grid grid-cols-1 lg:grid-cols-12 min-h-[620px] z-10 backdrop-blur-xs">
          
          {/* ── LEFT COLUMN: Facilitator Login Terminal (5 cols) ── */}
          <div className="lg:col-span-5 p-8 md:p-10 flex flex-col justify-between bg-[#0B132B] border-r border-white/10">
            <div>
              {/* Brand Header */}
              <div className="flex items-center gap-2.5 mb-8">
                <span className="text-3xl font-black text-[#FFD000] tracking-tight">N</span>
                <span className="text-2xl font-black text-[#FFD000] tracking-tight">otifiED</span>
              </div>

              {/* Title & Subtitle */}
              <div className="mb-6 text-left">
                <h1 className="text-2xl font-bold text-white mb-1">Facilitator Login</h1>
                <p className="text-xs text-[#8D99AE]">
                  Welcome back! Submit and track your event proposals.
                </p>
              </div>

              {/* Error Alert */}
              {errorMessage && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-start gap-2">
                  <AlertCircle className="size-4 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Form Controls */}
              <form onSubmit={handleLogin} className="space-y-4 text-left">
                <div>
                  <label className="text-xs font-semibold text-[#8D99AE] block mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="facilitator@organization.edu"
                    className="w-full px-3.5 py-2.5 bg-[#0E1733] border border-white/10 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-[#FFD000] transition"
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
                      className="w-full px-3.5 py-2.5 bg-[#0E1733] border border-white/10 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-[#FFD000] transition"
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

                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="flex items-center gap-2 text-[#8D99AE] hover:text-white cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="bg-[#0E1733] border-white/20 text-[#FFD000] focus:ring-0 cursor-pointer"
                    />
                    Remember Me
                  </label>
                  <span className="text-blue-400 hover:text-blue-300 hover:underline cursor-pointer">
                    Forgot Password
                  </span>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-[#0E1733] hover:bg-[#16203D] border border-white/15 text-white font-bold text-xs tracking-wide transition shadow-md hover:shadow-lg cursor-pointer mt-3"
                >
                  Sign In as Facilitator
                </button>
              </form>
            </div>

            <div className="mt-8 text-[11px] text-[#8D99AE]/50">
              © 2026 Asia Pacific College • All rights reserved.
            </div>
          </div>

          {/* ── RIGHT COLUMN: Content Stage (7 cols) ── */}
          <div className="lg:col-span-7 p-8 md:p-12 flex flex-col justify-between text-left relative overflow-hidden bg-[#0A1024]/60">
            {/* Header Content */}
            <div className="relative z-10 max-w-md">
              <span className="inline-block px-2.5 py-1 bg-white/5 border border-white/10 text-[#FFD000] text-[10px] font-mono uppercase tracking-wider mb-3">
                Clearance Workspace
              </span>
              <h2 className="text-3xl md:text-4xl font-extrabold text-white leading-tight mb-2">
                Welcome to the <br /> Facilitator Workspace
              </h2>
              <p className="text-xs md:text-sm text-slate-300 leading-relaxed font-normal">
                Draft, pre-audit, and submit campus event proposals for clearance approvals.
              </p>
            </div>

            {/* Bottom Capability Badges */}
            <div className="relative z-10 grid grid-cols-2 gap-3 max-w-sm mt-8">
              <div className="p-3 bg-[#0B132B]/90 border border-white/10 text-white shadow-lg">
                <div className="text-[10px] font-mono text-[#FFD000] uppercase font-bold tracking-wider">
                  AI Pre-Audit
                </div>
                <div className="text-xs font-semibold text-slate-200 mt-0.5">
                  Optical Document Check
                </div>
              </div>
              <div className="p-3 bg-[#0B132B]/90 border border-white/10 text-white shadow-lg">
                <div className="text-[10px] font-mono text-emerald-400 uppercase font-bold tracking-wider">
                  Live Queue Sync
                </div>
                <div className="text-xs font-semibold text-slate-200 mt-0.5">
                  Real-Time Clearance
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    );
  }

  // Render the portal directly with only its own subheader exit button
  return (
    <div className="h-screen w-screen flex flex-col bg-[#0B132B] overflow-hidden">
      <main className="flex-1 flex overflow-hidden">
        <FacilitatorInterface onLogout={handleLogout} />
      </main>
    </div>
  );
}
