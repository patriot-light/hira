import React, { useCallback, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useLanguage } from "../../context/LanguageContext";
import { Bell, CalendarDays, Check, Menu, X } from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { cn } from "../../lib/utils";
import { useAuth } from "../../context/AuthContext";
import { notificationsAPI } from "../../services/api";

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
  configuration: "configuration",
};

const Header = ({ onMenuClick }) => {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const { user } = useAuth();
  const location = useLocation();
  const section =
    location.pathname.split("/").filter(Boolean)[0] || "dashboard";
  const [notifications, setNotifications] = useState([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const unreadCount = notifications.filter(
    (notification) => !notification.read,
  ).length;

  const fetchNotifications = useCallback(async () => {
    if (user?.role !== "admin") return;
    try {
      const response = await notificationsAPI.getAll();
      setNotifications(response.data || []);
    } catch (error) {
      setNotifications([]);
    }
  }, [user]);

  useEffect(() => {
    if (notificationsOpen) fetchNotifications();
  }, [fetchNotifications, notificationsOpen]);

  const dismissNotification = async (id) => {
    await notificationsAPI.dismiss(id);
    fetchNotifications();
  };

  const markRead = async (id) => {
    await notificationsAPI.markRead(id);
    fetchNotifications();
  };

  const markAllRead = async () => {
    await notificationsAPI.markAllRead();
    fetchNotifications();
  };

  return (
    <header
      className={cn(
        "fixed top-0 z-30 flex h-24 items-center justify-between px-3 md:px-5 lg:px-7",
        isRTL() ? "left-0 md:right-80" : "right-0 left-0 md:left-80",
      )}>
      <div className="flex items-center gap-3 rounded-lg border border-white/80 bg-white/[0.82] px-3 py-2 shadow-[0_20px_52px_-44px_rgba(15,23,42,0.75)] backdrop-blur-2xl md:px-4">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onMenuClick}
          data-testid="menu-toggle-btn">
          <Menu className="h-5 w-5" />
        </Button>
        <div>
          <p className="text-xs font-bold uppercase text-primary">
            {t("appName")}
          </p>
          <h2 className="text-lg font-bold text-foreground md:text-xl">
            {t(pageKeyByPath[section] || "dashboard")}
          </h2>
        </div>
      </div>

      <div className="hidden items-center gap-2 md:flex">
        {user?.role === "admin" && (
          <DropdownMenu
            open={notificationsOpen}
            onOpenChange={setNotificationsOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="relative bg-white/[0.82]">
                <Bell className="h-4 w-4 text-primary" />
                {unreadCount > 0 && (
                  <Badge className="absolute -end-2 -top-2 h-5 min-w-5 rounded-full px-1 text-[10px]">
                    {unreadCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-96 p-2">
              <div className="flex items-center justify-between px-2 py-1">
                <p className="text-sm font-bold">{t("notifications")}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8"
                  onClick={markAllRead}>
                  {t("markAllRead")}
                </Button>
              </div>
              <div className="max-h-[420px] space-y-2 overflow-y-auto pe-1">
                {notifications.length ? (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`rounded-md p-3 text-sm hover:bg-muted ${notification.read ? "opacity-70" : "bg-primary/[0.06]"}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-bold">
                            {notification.data?.student_name ||
                              notification.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {notification.created_at
                              ? new Date(
                                  notification.created_at,
                                ).toLocaleString()
                              : "-"}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => markRead(notification.id)}
                              aria-label={t("markAsRead")}>
                              <Check className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => dismissNotification(notification.id)}
                            aria-label={t("dismiss")}>
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-muted-foreground">
                        {notification.data?.halaqa_name
                          ? t("studentAbsentNotification", {
                              student: notification.data.student_name,
                              halaqa: notification.data.halaqa_name,
                            })
                          : notification.message}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="p-3 text-sm text-muted-foreground">
                    {t("noNotifications")}
                  </p>
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        <div className="flex items-center gap-2 rounded-lg border border-white/80 bg-white/[0.82] px-4 py-3 text-sm font-bold text-slate-600 shadow-[0_20px_52px_-44px_rgba(15,23,42,0.75)] backdrop-blur-2xl">
          <CalendarDays className="h-4 w-4 text-primary" />
          <span>{new Date().toLocaleDateString()}</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
