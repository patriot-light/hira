import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  ArrowLeft,
  BookOpen,
  ClipboardList,
  Loader2,
  Save,
} from "lucide-react";
import { halaqasAPI, halaqaTypesAPI, teachersAPI } from "@/services/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SearchableMultiSelect } from "@/components/ui/searchable-multi-select";
import { SearchableSelect } from "@/components/ui/searchable-select";

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
    <form
      onSubmit={submit}
      className="space-y-6"
      data-testid="halaqa-form-page">
      <div className="page-hero rounded-lg p-5 md:p-7">
        <Button
          variant="ghost"
          className="mb-4 gap-2 bg-white/60 px-3"
          onClick={() => navigate("/halaqas")}>
          <ArrowLeft className="h-4 w-4" />
          {t("halaqas")}
        </Button>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-white/85 text-primary ring-1 ring-primary/15">
              <BookOpen className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground md:text-4xl">
                {editing ? t("editHalaqa") : t("addHalaqa")}
              </h1>
              <p className="mt-1 text-base font-medium text-slate-600">
                {formData.name || t("createStudyCircle")}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="bg-white/85"
              onClick={() => navigate("/halaqas")}>
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

      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <Card className="soft-panel rounded-lg">
          <CardHeader className="border-b border-border/70">
            <CardTitle className="flex items-center gap-2 text-lg">
              <ClipboardList className="h-5 w-5 text-primary" />
              {t("summary")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-5">
            <div>
              <p className="text-sm text-muted-foreground">{t("halaqaName")}</p>
              <p className="mt-1 font-bold">{formData.name || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t("gender")}</p>
              <p className="mt-1 font-bold">
                {formData.gender ? t(formData.gender) : "-"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                {t("attendanceMode")}
              </p>
              <p className="mt-1 font-bold">
                {formData.attendance_mode ? t(formData.attendance_mode) : "-"}
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="soft-panel rounded-lg">
            <CardHeader className="border-b border-border/70">
              <CardTitle className="flex items-center gap-2 text-lg">
                <BookOpen className="h-5 w-5 text-primary" />
                {t("halaqaName")}
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 p-5 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label>{t("halaqaName")} *</Label>
                <Input
                  value={formData.name}
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  required
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>{t("halaqaType")} *</Label>
                <SearchableSelect
                  options={halaqaTypes}
                  value={formData.type_id}
                  onChange={(value) =>
                    setFormData((current) => ({ ...current, type_id: value }))
                  }
                  placeholder={t("selectHalaqaType")}
                  searchPlaceholder={t("searchHalaqaTypes")}
                  emptyLabel={t("noData")}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("gender")} *</Label>
                <Select
                  value={formData.gender}
                  onValueChange={(value) =>
                    setFormData((current) => ({ ...current, gender: value }))
                  }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">{t("male")}</SelectItem>
                    <SelectItem value="female">{t("female")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("attendanceMode")} *</Label>
                <Select
                  value={formData.attendance_mode}
                  onValueChange={(value) =>
                    setFormData((current) => ({
                      ...current,
                      attendance_mode: value,
                    }))
                  }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
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
                  onChange={(teacher_ids) =>
                    setFormData((current) => ({ ...current, teacher_ids }))
                  }
                  placeholder={t("selectTeachers")}
                  searchPlaceholder={t("searchTeachers")}
                  emptyLabel={t("noData")}
                  getOptionLabel={(teacher) => teacher.full_name}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
};

export default HalaqaForm;
