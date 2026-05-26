import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  ArrowLeft,
  BriefcaseBusiness,
  GraduationCap,
  KeyRound,
  Loader2,
  Phone,
  Save,
} from "lucide-react";
import { teachersAPI } from "../services/api";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";

const emptyForm = {
  full_name: "",
  qualification: "",
  experience_years: "",
  phone: "",
  email: "",
  password: "",
};

const TeacherForm = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const editing = Boolean(id);
  const [loading, setLoading] = useState(editing);
  const [formData, setFormData] = useState(emptyForm);

  const fetchData = useCallback(async () => {
    if (!editing) return;
    try {
      const response = await teachersAPI.getOne(id);
      const teacher = response.data;
      setFormData({
        full_name: teacher.full_name || "",
        qualification: teacher.qualification || "",
        experience_years: teacher.experience_years?.toString() || "",
        phone: teacher.phone || "",
        email: teacher.email || "",
        password: "",
      });
    } catch (error) {
      toast.error(error.response?.data?.detail || t("error"));
    } finally {
      setLoading(false);
    }
  }, [editing, id, t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const submit = async (event) => {
    event.preventDefault();
    try {
      const payload = {
        ...formData,
        experience_years: parseInt(formData.experience_years) || 0,
        password: formData.password || null,
      };
      if (editing) {
        await teachersAPI.update(id, payload);
        toast.success(t("teacherUpdated"));
      } else {
        await teachersAPI.create(payload);
        toast.success(t("teacherCreated"));
      }
      navigate("/teachers");
    } catch (error) {
      toast.error(error.response?.data?.detail || t("error"));
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="space-y-6"
      data-testid="teacher-form-page">
      <div className="page-hero rounded-lg p-5 md:p-7">
        <Button
          variant="ghost"
          className="mb-4 gap-2 bg-white/60 px-3"
          onClick={() => navigate("/teachers")}>
          <ArrowLeft className="h-4 w-4" />
          {t("teachers")}
        </Button>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-white/85 text-primary ring-1 ring-primary/15">
              <GraduationCap className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground md:text-4xl">
                {editing ? t("editTeacher") : t("addTeacher")}
              </h1>
              <p className="mt-1 text-base font-medium text-slate-600">
                {formData.full_name || t("teacherName")}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="bg-white/85"
              onClick={() => navigate("/teachers")}>
              {t("cancel")}
            </Button>
            <Button
              type="submit"
              className="gap-2 bg-primary hover:bg-primary/90">
              <Save className="h-4 w-4" />
              {t("save")}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <Card className="soft-panel rounded-lg">
            <CardHeader className="border-b border-border/70">
              <CardTitle className="flex items-center gap-2 text-lg">
                <GraduationCap className="h-5 w-5 text-primary" />
                {t("teacherName")}
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 p-5 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label>{t("fullName")} *</Label>
                <Input
                  value={formData.full_name}
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      full_name: event.target.value,
                    }))
                  }
                  required
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>{t("qualification")} *</Label>
                <Input
                  value={formData.qualification}
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      qualification: event.target.value,
                    }))
                  }
                  required
                  placeholder={t("teacherQualificationPlaceholder")}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("experienceYears")}</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.experience_years}
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      experience_years: event.target.value,
                    }))
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card className="soft-panel rounded-lg">
            <CardHeader className="border-b border-border/70">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Phone className="h-5 w-5 text-primary" />
                {t("phone")}
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 p-5 md:grid-cols-2">
              <div className="space-y-2">
                <Label>{t("phone")}</Label>
                <Input
                  value={formData.phone}
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      phone: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>{t("email")}</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      email: event.target.value,
                    }))
                  }
                />
              </div>
            </CardContent>
          </Card>

          {!editing && (
            <Card className="soft-panel rounded-lg">
              <CardHeader className="border-b border-border/70">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <KeyRound className="h-5 w-5 text-primary" />
                  {t("login")}
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 p-5">
                <div className="space-y-2">
                  <Label>{t("password")}</Label>
                  <Input
                    type="password"
                    value={formData.password}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        password: event.target.value,
                      }))
                    }
                    placeholder={t("teacherPasswordPlaceholder")}
                  />
                  <p className="text-xs text-muted-foreground">
                    {t("loginAccountHint")}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <Card className="soft-panel h-fit rounded-lg">
          <CardHeader className="border-b border-border/70">
            <CardTitle className="flex items-center gap-2 text-lg">
              <BriefcaseBusiness className="h-5 w-5 text-primary" />
              {t("summary")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-5">
            <div className="rounded-lg border bg-white/70 p-4">
              <p className="text-sm text-muted-foreground">{t("fullName")}</p>
              <p className="mt-1 font-bold">{formData.full_name || "-"}</p>
            </div>
            <div className="rounded-lg border bg-white/70 p-4">
              <p className="text-sm text-muted-foreground">
                {t("qualification")}
              </p>
              <p className="mt-1 font-bold">{formData.qualification || "-"}</p>
            </div>
            <div className="rounded-lg border bg-white/70 p-4">
              <p className="text-sm text-muted-foreground">
                {t("experienceYears")}
              </p>
              <p className="mt-1 font-bold">
                {formData.experience_years || 0} {t("years")}
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => navigate("/teachers")}>
                {t("cancel")}
              </Button>
              <Button
                type="submit"
                className="flex-1 gap-2 bg-primary hover:bg-primary/90">
                <Save className="h-4 w-4" />
                {t("save")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </form>
  );
};

export default TeacherForm;
