import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { ArrowLeft, GraduationCap, Loader2, Save } from "lucide-react";
import { teachersAPI } from "../services/api";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
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
    <form onSubmit={submit} className="space-y-6" data-testid="teacher-form-page">
      <div>
        <Button variant="ghost" className="mb-2 gap-2 px-0" onClick={() => navigate("/teachers")}>
          <ArrowLeft className="h-4 w-4" />
          {t("teachers")}
        </Button>
        <h1 className="flex items-center gap-3 text-2xl font-bold md:text-3xl">
          <GraduationCap className="h-8 w-8 text-primary" />
          {editing ? t("editTeacher") : t("addTeacher")}
        </h1>
      </div>

      <Card className="soft-panel rounded-lg">
        <CardHeader>
          <CardTitle>{t("teacherName")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label>{t("fullName")} *</Label>
            <Input value={formData.full_name} onChange={(event) => setFormData((current) => ({ ...current, full_name: event.target.value }))} required />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>{t("qualification")} *</Label>
            <Input value={formData.qualification} onChange={(event) => setFormData((current) => ({ ...current, qualification: event.target.value }))} required placeholder={t("teacherQualificationPlaceholder")} />
          </div>
          <div className="space-y-2">
            <Label>{t("experienceYears")}</Label>
            <Input type="number" min="0" value={formData.experience_years} onChange={(event) => setFormData((current) => ({ ...current, experience_years: event.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>{t("phone")}</Label>
            <Input value={formData.phone} onChange={(event) => setFormData((current) => ({ ...current, phone: event.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>{t("email")}</Label>
            <Input type="email" value={formData.email} onChange={(event) => setFormData((current) => ({ ...current, email: event.target.value }))} />
          </div>
          {!editing && (
            <div className="space-y-2">
              <Label>{t("password")}</Label>
              <Input type="password" value={formData.password} onChange={(event) => setFormData((current) => ({ ...current, password: event.target.value }))} placeholder={t("teacherPasswordPlaceholder")} />
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => navigate("/teachers")}>{t("cancel")}</Button>
        <Button type="submit" className="gap-2 bg-primary hover:bg-primary/90">
          <Save className="h-4 w-4" />
          {t("save")}
        </Button>
      </div>
    </form>
  );
};

export default TeacherForm;
