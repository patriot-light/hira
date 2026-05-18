import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Alert, AlertDescription } from "../components/ui/alert";
import { BookOpenCheck, Eye, EyeOff, Globe, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import logo from "@/img/logo.png";

const Login = () => {
  const { t } = useTranslation();
  const { login } = useAuth();
  const { language, toggleLanguage } = useLanguage();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await login(email, password);

    if (result.success) {
      toast.success(t("loginSuccess"));
      navigate("/dashboard");
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
        <div className="relative flex items-center justify-center overflow-hidden p-5 md:p-10">
          <div className="absolute inset-0 pattern-bg opacity-80" />
          <div className="relative z-10 w-full max-w-lg space-y-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-white shadow-[0_18px_35px_-24px_rgba(15,23,42,0.65)] ring-1 ring-primary/15">
                  <img src={logo} alt="Hira Logo" className="h-11 w-11 object-contain" />
                </div>
                <div className="min-w-0">
                  <h1 className="truncate text-2xl font-bold text-foreground">
                    {language === "ar" ? "معهد حراء" : "Hira Institute"}
                  </h1>
                  <p className="text-sm font-medium text-muted-foreground">
                    {language === "ar"
                      ? "نظام إدارة معهد القرآن الكريم"
                      : "Quran Institute Management System"}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={toggleLanguage}
                className="shrink-0 gap-2 bg-white/85"
                data-testid="login-language-toggle"
              >
                <Globe className="h-4 w-4" />
                {language === "en" ? "العربية" : "English"}
              </Button>
            </div>

            <div className="page-hero rounded-lg p-5 md:p-6">
              <p className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-xs font-bold text-primary">
                <ShieldCheck className="h-4 w-4" />
                {t("loginTitle")}
              </p>
              <h2 className="mt-4 text-3xl font-bold leading-tight text-foreground md:text-4xl">
                {language === "ar"
                  ? "ادخل إلى مساحة عمل أوضح وأسهل"
                  : "A clearer, easier workspace for every user"}
              </h2>
              <p className="mt-3 max-w-md text-base font-medium text-slate-600">
                {language === "ar"
                  ? "الشاشات المهمة أقرب، والإجراءات أكثر وضوحا."
                  : "Important screens are closer, actions are larger, and daily tasks are easier to follow."}
              </p>
            </div>

            <Card className="border-white/80 bg-white/[0.92] shadow-[0_28px_70px_-46px_rgba(15,23,42,0.7)]">
              <CardHeader className="pb-4">
                <CardTitle className="text-2xl">{t("loginTitle")}</CardTitle>
                <CardDescription>{t("loginSubtitle")}</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-5">
                  {error && (
                    <Alert variant="destructive" className="animate-fade-in">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-bold">
                      {t("email")}
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="admin@hira.edu"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="h-12"
                      data-testid="login-email-input"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-bold">
                      {t("password")}
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="********"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="h-12 pe-12"
                        data-testid="login-password-input"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute end-0 top-0 h-12 w-12"
                        onClick={() => setShowPassword(!showPassword)}
                        data-testid="toggle-password-btn"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="h-12 w-full gap-2 bg-primary text-base hover:bg-primary/90"
                    disabled={loading}
                    data-testid="login-submit-btn"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {t("loading")}
                      </>
                    ) : (
                      t("login")
                    )}
                  </Button>
                </form>

                <div className="mt-5 rounded-lg border border-dashed border-primary/25 bg-primary/[0.07] p-4">
                  <p className="text-center text-sm font-medium text-muted-foreground">
                    {language === "ar"
                      ? "للتجربة، يرجى التسجيل أولا"
                      : "For demo, please register first"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="relative hidden overflow-hidden lg:block">
          <img
            src="https://images.pexels.com/photos/28428589/pexels-photo-28428589.jpeg"
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.92] via-primary/[0.72] to-secondary/[0.86]" />
          <div className="relative z-10 flex h-full flex-col justify-between p-12 text-white">
            <div className="inline-flex w-fit items-center gap-2 rounded-full bg-white/16 px-4 py-2 text-sm font-bold backdrop-blur">
              <BookOpenCheck className="h-5 w-5" />
              {language === "ar" ? "إدارة الحلقات" : "Halaqa management"}
            </div>
            <div className="max-w-xl">
              <h2 className="text-5xl font-bold leading-tight">
                {language === "ar"
                  ? "تصميم جديد يقود المستخدم بوضوح"
                  : "A modern redesign that guides users clearly"}
              </h2>
              <p className="mt-5 text-xl font-medium text-white/[0.88]">
                {language === "ar"
                  ? "لوحات أكبر، أزرار أوضح، وتنقل أهدأ."
                  : "Bigger panels, clearer buttons, calmer navigation, and a much friendlier first step into the system."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
