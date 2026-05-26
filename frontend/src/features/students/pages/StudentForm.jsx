import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  ArrowLeft,
  AtSign,
  Camera,
  Home,
  Loader2,
  Phone,
  Save,
  UserPlus,
  Users,
} from "lucide-react";
import { halaqasAPI, studentsAPI } from "@/services/api";
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
import { halaqaLabel } from "@/lib/halaqa";

const emptyForm = {
  full_name: "",
  father_name: "",
  mother_name: "",
  phone: "",
  father_phone: "",
  mother_phone: "",
  email: "",
  address: "",
  photo: "",
  status: "active",
  halaqa_id: "",
  halaqa_ids: [],
};

const StudentForm = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const editing = Boolean(id);
  const [loading, setLoading] = useState(true);
  const [halaqas, setHalaqas] = useState([]);
  const [formData, setFormData] = useState(emptyForm);

  const fetchData = useCallback(async () => {
    try {
      const [halaqasRes, studentRes] = await Promise.all([
        halaqasAPI.getAll(),
        editing ? studentsAPI.getOne(id) : Promise.resolve({ data: null }),
      ]);
      setHalaqas(halaqasRes.data);
      if (studentRes.data) {
        const student = studentRes.data;
        setFormData({
          full_name: student.full_name || "",
          father_name: student.father_name || "",
          mother_name: student.mother_name || "",
          phone: student.phone || "",
          father_phone: student.father_phone || student.parent_phone || "",
          mother_phone: student.mother_phone || "",
          email: student.email || "",
          address: student.address || "",
          photo: student.photo || "",
          status: student.status || "active",
          halaqa_id: student.halaqa_id || "",
          halaqa_ids:
            student.halaqa_ids ||
            (student.halaqa_id ? [student.halaqa_id] : []),
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
    try {
      const payload = {
        ...formData,
        halaqa_ids: formData.halaqa_ids || [],
        halaqa_id: formData.halaqa_ids?.[0] || null,
      };
      if (editing) {
        await studentsAPI.update(id, payload);
        toast.success(t("studentUpdated"));
      } else {
        await studentsAPI.create(payload);
        toast.success(t("studentCreated"));
      }
      navigate("/students");
    } catch (error) {
      toast.error(error.response?.data?.detail || t("error"));
    }
  };

  const handlePhotoUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setFormData((current) => ({ ...current, photo: reader.result }));
    };
    reader.readAsDataURL(file);
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
      data-testid="student-form-page">
      <div className="page-hero rounded-lg p-5 md:p-7">
        <Button
          variant="ghost"
          className="mb-4 gap-2 bg-white/60 px-3"
          onClick={() => navigate("/students")}>
          <ArrowLeft className="h-4 w-4" />
          {t("students")}
        </Button>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-white/85 text-primary ring-1 ring-primary/15">
              <UserPlus className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground md:text-4xl">
                {editing ? t("editStudent") : t("addStudent")}
              </h1>
              <p className="mt-1 text-base font-medium text-slate-600">
                {formData.full_name || t("studentDetails")}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="bg-white/85"
              onClick={() => navigate("/students")}>
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
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Camera className="h-5 w-5 text-primary" />
              {t("photo")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="mx-auto flex h-44 w-44 items-center justify-center overflow-hidden rounded-lg border bg-muted/40">
              {formData.photo ? (
                <img
                  src={formData.photo}
                  alt={formData.full_name || t("studentName")}
                  className="h-full w-full object-cover"
                />
              ) : (
                <UserPlus className="h-14 w-14 text-muted-foreground" />
              )}
            </div>
            <Input type="file" accept="image/*" onChange={handlePhotoUpload} />
            <div className="space-y-2">
              <Label>{t("status")}</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData((current) => ({ ...current, status: value }))
                }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">{t("active")}</SelectItem>
                  <SelectItem value="inactive">{t("inactive")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="soft-panel rounded-lg">
            <CardHeader className="border-b border-border/70">
              <CardTitle className="flex items-center gap-2 text-lg">
                <UserPlus className="h-5 w-5 text-primary" />
                {t("studentDetails")}
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
              <div className="space-y-2">
                <Label>{t("fatherName")}</Label>
                <Input
                  value={formData.father_name}
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      father_name: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>{t("motherName")}</Label>
                <Input
                  value={formData.mother_name}
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      mother_name: event.target.value,
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
            <CardContent className="grid gap-4 p-5 md:grid-cols-3">
              <div className="space-y-2">
                <Label>{t("studentPhone")} *</Label>
                <Input
                  value={formData.phone}
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      phone: event.target.value,
                    }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>{t("fatherPhone")}</Label>
                <Input
                  value={formData.father_phone}
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      father_phone: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>{t("motherPhone")}</Label>
                <Input
                  value={formData.mother_phone}
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      mother_phone: event.target.value,
                    }))
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card className="soft-panel rounded-lg">
            <CardHeader className="border-b border-border/70">
              <CardTitle className="flex items-center gap-2 text-lg">
                <AtSign className="h-5 w-5 text-primary" />
                {t("email")}
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 p-5">
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

          <Card className="soft-panel rounded-lg">
            <CardHeader className="border-b border-border/70">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Home className="h-5 w-5 text-primary" />
                {t("address")}
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 p-5">
              <div className="space-y-2">
                <Label>{t("address")}</Label>
                <Input
                  value={formData.address}
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      address: event.target.value,
                    }))
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card className="soft-panel rounded-lg">
            <CardHeader className="border-b border-border/70">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-5 w-5 text-primary" />
                {t("assignToHalaqa")}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <SearchableMultiSelect
                options={halaqas}
                selectedValues={formData.halaqa_ids || []}
                onChange={(halaqa_ids) =>
                  setFormData((current) => ({
                    ...current,
                    halaqa_ids,
                    halaqa_id: halaqa_ids[0] || "",
                  }))
                }
                placeholder={t("selectHalaqas")}
                searchPlaceholder={t("searchHalaqas")}
                emptyLabel={t("noData")}
                getOptionLabel={(halaqa) => halaqaLabel(halaqa, t)}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
};

export default StudentForm;
