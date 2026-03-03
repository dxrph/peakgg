import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Crosshair, Mail, Lock, User, Eye, EyeOff } from "lucide-react";

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <div className="hidden lg:flex flex-1 gradient-hero items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 scanline pointer-events-none" />
        <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] rounded-full bg-accent/[0.05] blur-[120px]" />
        <div className="relative z-10 text-center px-12">
          <div className="w-16 h-16 rounded-xl gradient-primary flex items-center justify-center mx-auto mb-6">
            <Crosshair className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-5xl font-display font-bold mb-4">RIFTARENA</h1>
          <p className="text-muted-foreground text-lg font-body">Join the competitive community</p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded gradient-primary flex items-center justify-center">
              <Crosshair className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-xl">RIFTARENA</span>
          </div>

          <h2 className="text-3xl font-display font-bold mb-2">Create Account</h2>
          <p className="text-muted-foreground mb-8 font-body">Start your competitive journey</p>

          <form onSubmit={(e) => e.preventDefault()} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="username" className="font-body">Username</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="username" placeholder="Your gamer tag" className="pl-10 bg-card border-border" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="font-body">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="email" type="email" placeholder="player@example.com" className="pl-10 bg-card border-border" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="font-body">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="password" type={showPassword ? "text" : "password"} placeholder="Min 8 characters"
                  className="pl-10 pr-10 bg-card border-border" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button variant="neon" className="w-full" size="lg">Create Account</Button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
              <div className="relative flex justify-center text-xs"><span className="bg-background px-2 text-muted-foreground font-body">or</span></div>
            </div>

            <Button variant="outline" className="w-full" size="lg">
              Sign up with Discord
            </Button>
          </form>

          <p className="text-sm text-muted-foreground text-center mt-4 font-body">
            By signing up you agree to our <Link to="/terms" className="text-primary hover:underline">Terms</Link> and <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
          </p>

          <p className="text-center text-sm text-muted-foreground mt-6 font-body">
            Already have an account? <Link to="/login" className="text-primary hover:underline font-medium">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
