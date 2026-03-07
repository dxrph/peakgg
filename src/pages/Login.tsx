import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mountain, Mail, Lock, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <div className="hidden lg:flex flex-1 gradient-hero items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 scanline pointer-events-none" />
        <div className="absolute top-1/3 left-1/3 w-[400px] h-[400px] rounded-full bg-primary/[0.06] blur-[120px]" />
        <div className="relative z-10 text-center px-12">
          <div className="w-16 h-16 rounded-xl gradient-primary flex items-center justify-center mx-auto mb-6">
            <Mountain className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-5xl font-display font-bold mb-4">PEAKGG</h1>
          <p className="text-muted-foreground text-lg font-body">Compete. Rise. Dominate.</p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded gradient-primary flex items-center justify-center">
              <Mountain className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-xl">PEAKGG</span>
          </div>

          <h2 className="text-3xl font-display font-bold mb-2">Welcome Back</h2>
          <p className="text-muted-foreground mb-8 font-body">Sign in to your account to continue</p>

          <form onSubmit={(e) => e.preventDefault()} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="font-body">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="email" type="email" placeholder="player@example.com" value={email}
                  onChange={(e) => setEmail(e.target.value)} className="pl-10 bg-card border-border" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="password" className="font-body">Password</Label>
                <Link to="/forgot-password" className="text-xs text-primary hover:underline font-body">Forgot password?</Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••"
                  value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 pr-10 bg-card border-border" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button variant="neon" className="w-full" size="lg">Sign In</Button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
              <div className="relative flex justify-center text-xs"><span className="bg-background px-2 text-muted-foreground font-body">or</span></div>
            </div>

            <Button variant="outline" className="w-full" size="lg">
              Continue with Discord
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6 font-body">
            Don't have an account? <Link to="/register" className="text-primary hover:underline font-medium">Register</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
