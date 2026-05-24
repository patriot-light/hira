import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Save, UserPlus } from "lucide-react";
import { halaqasAPI, studentsAPI } from "../services/api";
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

const emptyForm = {
  full_name: "",
  age: "",
  national_id: "",
  phone: "",
  parent_phone: "",
  email: "",
  password: "",
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
          age: student.age?.toString() || "",
          national_id: student.national_id || "",
          phone: student.phone || "",
          parent_phone: student.parent_phone || "",
          email: student.email || "",
          password: "",
          status: student.status || "active",
          halaqa_id: student.halaqa_id || "",
          halaqa_ids: student.halaqa_ids || (student.halaqa_id ? [student.halaqa_id] : []),
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
        age: parseInt(formData.age) || 0,
        halaqa_ids: formData.halaqa_ids || [],
        halaqa_id: formData.halaqa_ids?.[0] || null,
        password: formData.password || null,
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

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-6" data-testid="student-form-page">
      <div>
        <Button variant="ghost" className="mb-2 gap-2 px-0" onClick={() => navigate("/students")}>
          <ArrowLeft className="h-4 w-4" />
          {t("students")}
        </Button>
        <h1 className="flex items-center gap-3 text-2xl font-bold md:text-3xl">
          <UserPlus className="h-8 w-8 text-primary" />
          {editing ? t("editStudent") : t("addStudent")}
        </h1>
      </div>

      <Card className="soft-panel rounded-lg">
        <CardHeader>
          <CardTitle>{t("studentDetails")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label>{t("fullName")} *</Label>
            <Input value={formData.full_name} onChange={(event) => setFormData((current) => ({ ...current, full_name: event.target.value }))} required />
          </div>
          <div className="space-y-2">
            <Label>{t("age")} *</Label>
            <Input type="number" min="1" value={formData.age} onChange={(event) => setFormData((current) => ({ ...current, age: event.target.value }))} required />
          </div>
          <div className="space-y-2">
            <Label>{t("status")}</Label>
            <Select value={formData.status} onValueChange={(value) => setFormData((current) => ({ ...current, status: value }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">{t("active")}</SelectItem>
                <SelectItem value="inactive">{t("inactive")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t("nationalId")}</Label>
            <Input value={formData.national_id} onChange={(event) => setFormData((current) => ({ ...current, national_id: event.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>{t("phone")}</Label>
            <Input value={formData.phone} onChange={(event) => setFormData((current) => ({ ...current, phone: event.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>{t("parentPhone")}</Label>
            <Input value={formData.parent_phone} onChange={(event) => setFormData((current) => ({ ...current, parent_phone: event.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>{t("email")}</Label>
            <Input type="email" value={formData.email} onChange={(event) => setFormData((current) => ({ ...current, email: event.target.value }))} />
          </div>
          {!editing && (
            <div className="space-y-2 md:col-span-2">
              <Label>{t("password")}</Label>
              <Input type="password" value={formData.password} onChange={(event) => setFormData((current) => ({ ...current, password: event.target.value }))} placeholder={t("studentPasswordPlaceholder")} />
              <p className="text-xs text-muted-foreground">{t("loginAccountHint")}</p>
            </div>
          )}
          <div className="space-y-2 md:col-span-2">
            <Label>{t("assignToHalaqa")}</Label>
            <SearchableMultiSelect
              options={halaqas}
              selectedValues={formData.halaqa_ids || []}
              onChange={(halaqa_ids) => setFormData((current) => ({ ...current, halaqa_ids, halaqa_id: halaqa_ids[0] || "" }))}
              placeholder={t("selectHalaqas")}
              searchPlaceholder={t("searchHalaqas")}
              emptyLabel={t("noData")}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => navigate("/students")}>{t("cancel")}</Button>
        <Button type="submit" className="gap-2 bg-primary hover:bg-primary/90">
          <Save className="h-4 w-4" />
          {t("save")}
        </Button>
      </div>
    </form>
  );
};

export default StudentForm;
