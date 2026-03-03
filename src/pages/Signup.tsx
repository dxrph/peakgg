import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Crosshair, Mail, Lock, User, Eye, EyeOff } from "lucide-react";

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="dark min-h-screen bg-background text-foreground flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-1 gradient-hero items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/[0.03]" />
        <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] rounded-full bg-primary/5 blur-[100px]" />
        <div className="relative z-10 text-center px-12">
          <div className="w-16 h-16 rounded-xl gradient-primary flex items-center justify-center mx-auto mb-6">
            <Crosshair className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-5xl font-display font-bold mb-4">ARENA</h1>
          <p className="text-muted-foreground text-lg">Unisciti alla community competitiva</p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded gradient-primary flex items-center justify-center">
              <Crosshair className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-xl">ARENA</span>
          </div>

          <h2 className="text-3xl font-display font-bold mb-2">Crea Account</h2>
          <p className="text-muted-foreground mb-8">Inizia la tua carriera competitiva</p>

          <form onSubmit={(e) => e.preventDefault()} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="username" placeholder="Il tuo nickname" className="pl-10 bg-card border-border" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="email" type="email" placeholder="email@esempio.it" className="pl-10 bg-card border-border" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Minimo 8 caratteri"
                  className="pl-10 pr-10 bg-card border-border"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button variant="hero" className="w-full" size="lg">
              Crea Account
            </Button>
          </form>

          <p className="text-sm text-muted-foreground text-center mt-4">
            Registrandoti accetti i{" "}
            <Link to="/terms" className="text-primary hover:underline">Termini di Servizio</Link>
            {" "}e la{" "}
            <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
          </p>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Hai già un account?{" "}
            <Link to="/login" className="text-primary hover:underline font-medium">Accedi</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
