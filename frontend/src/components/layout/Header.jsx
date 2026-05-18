import React from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useLanguage } from "../../context/LanguageContext";
import { CalendarDays, Menu } from "lucide-react";
import { Button } from "../ui/button";
import { cn } from "../../lib/utils";

const pageKeyByPath = {
  dashboard: "dashboard",
  students: "students",
  teachers: "teachers",
  halaqas: "halaqas",
  evaluations: "evaluations",
  sessions: "sessions",
  reports: "reports",
  users: "users",
  "error-types": "errorTypes",
};

const Header = ({ onMenuClick }) => {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const location = useLocation();
  const section = location.pathname.split("/").filter(Boolean)[0] || "dashboard";

  return (
    <header
      className={cn(
        "fixed top-0 z-30 flex h-24 items-center justify-between px-3 md:px-5 lg:px-7",
        isRTL() ? "left-0 md:right-80" : "right-0 left-0 md:left-80",
      )}
    >
      <div className="flex items-center gap-3 rounded-lg border border-white/80 bg-white/[0.82] px-3 py-2 shadow-[0_20px_52px_-44px_rgba(15,23,42,0.75)] backdrop-blur-2xl md:px-4">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onMenuClick}
          data-testid="menu-toggle-btn"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div>
          <p className="text-xs font-bold uppercase text-primary">{t("appName")}</p>
          <h2 className="text-lg font-bold text-foreground md:text-xl">
            {t(pageKeyByPath[section] || "dashboard")}
          </h2>
        </div>
      </div>

      <div className="hidden items-center gap-2 rounded-lg border border-white/80 bg-white/[0.82] px-4 py-3 text-sm font-bold text-slate-600 shadow-[0_20px_52px_-44px_rgba(15,23,42,0.75)] backdrop-blur-2xl md:flex">
        <CalendarDays className="h-4 w-4 text-primary" />
        <span>{new Date().toLocaleDateString()}</span>
      </div>
    </header>
  );
};

export default Header;
