import { useState, useEffect } from "react";
import { FacilitatorInterface, FacilitatorUser } from "./components/FacilitatorInterface";
import { Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react";
import { supabase } from "../lib/supabase";
import facilitatorBg from "../assets/facilitator-bg.jpeg";

const VALID_FACILITATOR_EMAIL = "facilitator@organization.edu";
const VALID_PASSWORD = "password123";

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [currentUser, setCurrentUser] = useState<FacilitatorUser | null>(null);

  // Auth form fields
  const [fullName, setFullName] = useState("");
  const [organization, setOrganization] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // UI feedback states
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    const savedSession = localStorage.getItem("campussync_facilitator_logged_in");
    const savedEmail = localStorage.getItem("campussync_facilitator_remembered_email");
    const savedProfile = localStorage.getItem("campussync_facilitator_profile");

    if (savedSession === "true") {
      setIsLoggedIn(true);
      if (savedProfile) {
        try {
          setCurrentUser(JSON.parse(savedProfile));
        } catch {
          // Ignore malformed JSON
        }
      }
    }
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    const trimmedName = fullName.trim();
    const trimmedOrg = organization.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();

    if (!trimmedName || !trimmedOrg || !trimmedEmail || !trimmedPassword) {
      setErrorMessage("Please complete all required registration fields.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setErrorMessage("Please enter a valid institutional email address.");
      return;
    }

    if (!trimmedEmail.endsWith("@student.apc.edu.ph") && !trimmedEmail.endsWith("@apc.edu.ph")) {
      setErrorMessage("Registration requires an institutional @student.apc.edu.ph or @apc.edu.ph email.");
      return;
    }

    if (trimmedPassword.length < 6) {
      setErrorMessage("Password must be at least 6 characters long.");
      return;
    }

    setAuthLoading(true);

    // Check if account already exists in public.users
    const { data: existingUser } = await supabase
      .from("users")
      .select("user_id")
      .eq("email", trimmedEmail)
      .maybeSingle();

    if (existingUser) {
      setAuthLoading(false);
      setErrorMessage("An account with this email already exists. Please sign in instead.");
      return;
    }

    // Insert permanent facilitator record into Supabase (role_id: 1 = Activity Facilitator)
    const { data: insertedUser, error } = await supabase
      .from("users")
      .insert([
        {
          role_id: 1,
          full_name: trimmedName,
          email: trimmedEmail,
          organization: trimmedOrg,
          password_hash: trimmedPassword,
        },
      ])
      .select()
      .single();

    setAuthLoading(false);

    if (error) {
      setErrorMessage(`Registration failed: ${error.message}`);
      return;
    }

    const profile: FacilitatorUser = {
      user_id: insertedUser?.user_id,
      full_name: trimmedName,
      email: trimmedEmail,
      organization: trimmedOrg,
    };

    localStorage.setItem("campussync_facilitator_profile", JSON.stringify(profile));
    if (rememberMe) {
      localStorage.setItem("campussync_facilitator_remembered_email", trimmedEmail);
      localStorage.setItem("campussync_facilitator_logged_in", "true");
    }

    setCurrentUser(profile);
    setIsLoggedIn(true);
    setPassword("");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

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

    setAuthLoading(true);

    // 1. Check permanent registered accounts in Supabase public.users
    const { data: dbUser } = await supabase
      .from("users")
      .select("*")
      .eq("email", trimmedEmail)
      .maybeSingle();

    if (dbUser) {
      if (dbUser.password_hash !== trimmedPassword) {
        setAuthLoading(false);
        setErrorMessage("Incorrect password for this facilitator account.");
        return;
      }

      const profile: FacilitatorUser = {
        user_id: dbUser.user_id,
        full_name: dbUser.full_name,
        email: dbUser.email,
        organization: dbUser.organization || "Student Organization",
      };

      localStorage.setItem("campussync_facilitator_profile", JSON.stringify(profile));
      if (rememberMe) {
        localStorage.setItem("campussync_facilitator_remembered_email", trimmedEmail);
        localStorage.setItem("campussync_facilitator_logged_in", "true");
      } else {
        localStorage.removeItem("campussync_facilitator_remembered_email");
        localStorage.removeItem("campussync_facilitator_logged_in");
      }

      setCurrentUser(profile);
      setIsLoggedIn(true);
      setPassword("");
      setAuthLoading(false);
      return;
    }

    // 2. Fallback institutional domain login (auto-registers into public.users so Admin Account Management sees it)
    const isInstitutionalFallback =
      (trimmedEmail === VALID_FACILITATOR_EMAIL && trimmedPassword === VALID_PASSWORD) ||
      (trimmedEmail.endsWith("@student.apc.edu.ph") && trimmedPassword.length >= 6) ||
      (trimmedEmail.endsWith("@apc.edu.ph") && trimmedPassword.length >= 6);

    if (!isInstitutionalFallback) {
      setAuthLoading(false);
      setErrorMessage("Invalid email or password. Use your APC email or Sign Up below.");
      return;
    }

    const derivedName = trimmedEmail
      .split("@")[0]
      .replace(/[._]/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase());

    const { data: autoCreated } = await supabase
      .from("users")
      .insert([
        {
          role_id: 1,
          full_name: derivedName,
          email: trimmedEmail,
          organization: "CS Society",
          password_hash: trimmedPassword,
        },
      ])
      .select()
      .maybeSingle();

    const fallbackProfile: FacilitatorUser = {
      user_id: autoCreated?.user_id,
      full_name: derivedName,
      email: trimmedEmail,
      organization: "CS Society",
    };

    localStorage.setItem("campussync_facilitator_profile", JSON.stringify(fallbackProfile));
    if (rememberMe) {
      localStorage.setItem("campussync_facilitator_remembered_email", trimmedEmail);
      localStorage.setItem("campussync_facilitator_logged_in", "true");
    } else {
      localStorage.removeItem("campussync_facilitator_remembered_email");
      localStorage.removeItem("campussync_facilitator_logged_in");
    }

    setCurrentUser(fallbackProfile);
    setIsLoggedIn(true);
    setPassword("");
    setAuthLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("campussync_facilitator_logged_in");
    localStorage.removeItem("campussync_facilitator_profile");
    setCurrentUser(null);
    setIsLoggedIn(false);
    setPassword("");
    setErrorMessage("");
    setSuccessMessage("");
  };

  if (!isLoggedIn) {
    return (
      <div
        className="min-h-screen w-full relative flex flex-col justify-between p-6 md:p-10 font-sans text-white bg-[#0B132B] bg-cover bg-center overflow-x-hidden"
        style={{ backgroundImage: `url(${facilitatorBg})` }}
      >
        {/* ── Top Header Navigation ── */}
        <header className="w-full flex items-center justify-between z-10 shrink-0">
          {/* Brand Mark with Accent C */}
          <div className="flex items-center gap-3">
            <div className="size-9 bg-[#0B132B] flex items-center justify-center font-black text-[#FFD000] text-lg border border-white/10 shadow-md">
              C
            </div>
            <div className="text-left">
              <div className="flex items-center gap-2">
                <span className="font-black text-lg text-white tracking-tight">CampusSync</span>
                <span className="bg-[#0B132B] text-[#FFD000] text-[10px] font-mono font-bold px-2 py-0.5 uppercase tracking-wider border border-white/10">
                  FACILITATOR
                </span>
              </div>
              <p className="text-[11px] text-white/80 font-medium">Asia Pacific College Enterprise System</p>
            </div>
          </div>

          {/* Institutional Telemetry Status Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#0B132B] border border-white/15 text-white text-xs font-semibold shadow-md">
            <span className="size-2 bg-blue-500"></span>
            CAMPUSSYNC: FACILITATOR PORTAL
          </div>
        </header>

        {/* ── Main Left-Weighted Auth Terminal ── */}
        <main className="w-full my-auto py-8 z-10 flex items-center justify-start lg:pl-16">
          <div className="w-full max-w-[440px] bg-[#0E1528] border border-white/10 shadow-2xl p-8 md:p-10 text-left">
            {/* Terminal Meta Header */}
            <div className="flex items-center justify-between text-[10px] font-mono tracking-widest text-[#FFD000] mb-3 uppercase">
              <span>AUTHORIZED PROPOSAL DRAFTING</span>
              <span className="text-white/40">v2.5 SECURE</span>
            </div>

            {/* Login / Sign Up Mode Switcher */}
            <div className="grid grid-cols-2 gap-1 p-1 bg-[#080D1A] border border-white/10 mb-5 text-xs">
              <button
                type="button"
                onClick={() => {
                  setAuthMode("login");
                  setErrorMessage("");
                  setSuccessMessage("");
                }}
                className={`py-2 font-bold uppercase tracking-wider transition cursor-pointer ${
                  authMode === "login"
                    ? "bg-[#FDB813] text-black"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode("signup");
                  setErrorMessage("");
                  setSuccessMessage("");
                }}
                className={`py-2 font-bold uppercase tracking-wider transition cursor-pointer ${
                  authMode === "signup"
                    ? "bg-[#FDB813] text-black"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Title & Description */}
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-1 tracking-tight">
              {authMode === "login" ? "Facilitator Login" : "Facilitator Sign Up"}
            </h1>
            <p className="text-xs text-[#8D99AE] mb-6">
              {authMode === "login"
                ? "Draft, pre-check, and submit campus event proposals."
                : "Register a permanent student organization account on CampusSync."}
            </p>

            {/* Error & Success Alerts */}
            {errorMessage && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-start gap-2">
                <AlertCircle className="size-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-start gap-2">
                <CheckCircle2 className="size-4 shrink-0 mt-0.5" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Form Controls */}
            <form onSubmit={authMode === "login" ? handleLogin : handleSignUp} className="space-y-4">
              {authMode === "signup" && (
                <>
                  <div>
                    <label className="text-[10px] font-mono tracking-wider text-slate-300 uppercase block mb-1.5">
                      FULL NAME *
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g., Andrei Antonio G. Villa"
                      className="w-full px-3.5 py-2.5 bg-[#080D1A] border border-white/15 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-[#FFD000] transition"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-mono tracking-wider text-slate-300 uppercase block mb-1.5">
                      STUDENT ORGANIZATION *
                    </label>
                    <input
                      type="text"
                      required
                      value={organization}
                      onChange={(e) => setOrganization(e.target.value)}
                      placeholder="e.g., CS Society / APC SOAR"
                      className="w-full px-3.5 py-2.5 bg-[#080D1A] border border-white/15 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-[#FFD000] transition"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="text-[10px] font-mono tracking-wider text-slate-300 uppercase block mb-1.5">
                  INSTITUTIONAL EMAIL *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="agvilla@student.apc.edu.ph"
                  className="w-full px-3.5 py-2.5 bg-[#080D1A] border border-white/15 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-[#FFD000] transition"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono tracking-wider text-slate-300 uppercase block mb-1.5">
                  PASSWORD *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full px-3.5 py-2.5 bg-[#080D1A] border border-white/15 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-[#FFD000] transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 text-slate-300 hover:text-white cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="bg-[#080D1A] border-white/20 text-[#FFD000] focus:ring-0 cursor-pointer"
                  />
                  Remember Me
                </label>
                {authMode === "login" && (
                  <span className="text-[#FFD000] hover:underline cursor-pointer text-xs">
                    Forgot Password?
                  </span>
                )}
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-3 bg-[#FDB813] hover:bg-[#e0a20f] text-black font-extrabold text-xs tracking-wider uppercase flex items-center justify-center gap-2 transition shadow-lg cursor-pointer mt-4 disabled:opacity-50"
              >
                {authLoading
                  ? "Processing..."
                  : authMode === "login"
                  ? "SIGN IN AS FACILITATOR →"
                  : "REGISTER & ENTER PORTAL →"}
              </button>
            </form>

            <div className="mt-8 pt-4 border-t border-white/10 flex items-center justify-between text-[10px] font-mono text-white/50">
              <span className="flex items-center gap-1.5">
                <span className="size-1.5 bg-[#FFD000]"></span>
                Campus Clearance Portal
              </span>
              <span>Asia Pacific College</span>
            </div>
          </div>
        </main>

        {/* Empty Footer Spacer */}
        <div className="h-4 z-10 shrink-0"></div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-[#0B132B] overflow-hidden">
      <main className="flex-1 flex overflow-hidden">
        <FacilitatorInterface onLogout={handleLogout} currentUser={currentUser} />
      </main>
    </div>
  );
}
