import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { ArrowLeft, BookOpen, Loader2, Save } from "lucide-react";
import { halaqasAPI, halaqaTypesAPI, teachersAPI } from "../services/api";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { SearchableMultiSelect } from "../components/ui/searchable-multi-select";
import { SearchableSelect } from "../components/ui/searchable-select";

const HalaqaForm = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const editing = Boolean(id);
  const [loading, setLoading] = useState(true);
  const [teachers, setTeachers] = useState([]);
  const [halaqaTypes, setHalaqaTypes] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    type_id: "",
    gender: "male",
    attendance_mode: "online",
    teacher_ids: [],
  });

  const fetchData = useCallback(async () => {
    try {
      const [teachersRes, typesRes, halaqaRes] = await Promise.all([
        teachersAPI.getAll(),
        halaqaTypesAPI.getAll(),
        editing ? halaqasAPI.getOne(id) : Promise.resolve({ data: null }),
      ]);
      setTeachers(teachersRes.data);
      setHalaqaTypes(typesRes.data);
      if (halaqaRes.data) {
        setFormData({
          name: halaqaRes.data.name || "",
          type_id: halaqaRes.data.type_id || "",
          gender: halaqaRes.data.gender || "male",
          attendance_mode: halaqaRes.data.attendance_mode || "online",
          teacher_ids: halaqaRes.data.teacher_ids || [],
        });
      }
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
    if (!formData.type_id) {
      toast.error(t("pleaseSelectHalaqaType"));
      return;
    }
    try {
      const payload = { ...formData, schedule: [] };
      if (editing) {
        await halaqasAPI.update(id, payload);
        toast.success(t("halaqaUpdated"));
      } else {
        await halaqasAPI.create(payload);
        toast.success(t("halaqaCreated"));
      }
      navigate("/halaqas");
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
    <form onSubmit={submit} className="space-y-6" data-testid="halaqa-form-page">
      <div>
        <Button variant="ghost" className="mb-2 gap-2 px-0" onClick={() => navigate("/halaqas")}>
          <ArrowLeft className="h-4 w-4" />
          {t("halaqas")}
        </Button>
        <h1 className="flex items-center gap-3 text-2xl font-bold md:text-3xl">
          <BookOpen className="h-8 w-8 text-primary" />
          {editing ? t("editHalaqa") : t("addHalaqa")}
        </h1>
      </div>

      <Card className="soft-panel rounded-lg">
        <CardHeader>
          <CardTitle>{t("halaqaName")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label>{t("halaqaName")} *</Label>
            <Input value={formData.name} onChange={(event) => setFormData((current) => ({ ...current, name: event.target.value }))} required />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>{t("halaqaType")} *</Label>
            <SearchableSelect
              options={halaqaTypes}
              value={formData.type_id}
              onChange={(value) => setFormData((current) => ({ ...current, type_id: value }))}
              placeholder={t("selectHalaqaType")}
              searchPlaceholder={t("searchHalaqaTypes")}
              emptyLabel={t("noData")}
            />
          </div>
          <div className="space-y-2">
            <Label>{t("gender")} *</Label>
            <Select value={formData.gender} onValueChange={(value) => setFormData((current) => ({ ...current, gender: value }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="male">{t("male")}</SelectItem>
                <SelectItem value="female">{t("female")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t("attendanceMode")} *</Label>
            <Select value={formData.attendance_mode} onValueChange={(value) => setFormData((current) => ({ ...current, attendance_mode: value }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="online">{t("online")}</SelectItem>
                <SelectItem value="in_person">{t("inPerson")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>{t("assignedTeachers")}</Label>
            <SearchableMultiSelect
              options={teachers}
              selectedValues={formData.teacher_ids || []}
              onChange={(teacher_ids) => setFormData((current) => ({ ...current, teacher_ids }))}
              placeholder={t("selectTeachers")}
              searchPlaceholder={t("searchTeachers")}
              emptyLabel={t("noData")}
              getOptionLabel={(teacher) => teacher.full_name}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => navigate("/halaqas")}>{t("cancel")}</Button>
        <Button type="submit" className="gap-2 bg-primary hover:bg-primary/90">
          <Save className="h-4 w-4" />
          {t("save")}
        </Button>
      </div>
    </form>
  );
};

export default HalaqaForm;
