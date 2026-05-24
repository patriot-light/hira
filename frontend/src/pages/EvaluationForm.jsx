import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import {
  certificatesAPI,
  errorTypesAPI,
  examEvaluationsAPI,
  studentsAPI,
  teachersAPI,
} from "../services/api";
import { JUZ_OPTIONS, getJuzPages } from "../constants/quran";
import { Badge } from "../components/ui/badge";
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
import { SearchableSelect } from "../components/ui/searchable-select";
import { Textarea } from "../components/ui/textarea";
import { ArrowLeft, Award, BookOpenCheck, Loader2, MinusCircle, Plus, Save } from "lucide-react";
import { toast } from "sonner";

const CORE_FIELD_KEYS = ["studentName", "degree", "issueDate", "certificateNumber"];

const getScoreColor = (score) => {
  if (score >= 90) return "bg-green-100 text-green-700";
  if (score >= 80) return "bg-blue-100 text-blue-700";
  if (score >= 70) return "bg-yellow-100 text-yellow-700";
  return "bg-red-100 text-red-700";
};

const getResult = (score) => {
  if (score >= 90) return "excellent";
  if (score >= 80) return "very_good";
  if (score >= 70) return "good";
  return "needs_review";
};

function downloadBlob(response, filename) {
  const url = window.URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

const EvaluationForm = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isTeacher, isExamTeacher, user } = useAuth();
  const [errorTypes, setErrorTypes] = useState([]);
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingMode, setSavingMode] = useState("exam");
  const [exam, setExam] = useState({
    student_id: "",
    teacher_id: "",
    from_juz: "1",
    to_juz: "1",
    page_number: "1",
    errors: [],
    notes: "",
  });
  const [certificateForm, setCertificateForm] = useState({
    template_id: "",
    degree: "",
    issue_date: new Date().toISOString().slice(0, 10),
    custom_fields: {},
  });
  const examTeacherLocked = isExamTeacher();
  const teacherLocked = isTeacher() || examTeacherLocked;

  const loggedTeacher = useMemo(
    () => teachers.find((teacher) => teacher.user_id === user?.id),
    [teachers, user],
  );
  const pageOptions = useMemo(() => getJuzPages(exam.from_juz), [exam.from_juz]);
  const selectedStudent = useMemo(
    () => students.find((student) => student.id === exam.student_id),
    [exam.student_id, students],
  );
  const selectedTemplate = useMemo(
    () => templates.find((template) => template.id === certificateForm.template_id),
    [certificateForm.template_id, templates],
  );
  const certificateCustomFields = useMemo(
    () => (selectedTemplate?.fields || []).filter((field) => !CORE_FIELD_KEYS.includes(field.key)),
    [selectedTemplate],
  );
  const totalDeduction = useMemo(
    () => exam.errors.reduce((sum, error) => sum + Number(error.deduction || 0), 0),
    [exam.errors],
  );
  const liveScore = Math.max(0, 100 - totalDeduction);
  const liveResult = getResult(liveScore);

  const fetchData = useCallback(async () => {
    try {
      const [errorRes, studentRes, teacherRes, templateRes] = await Promise.all([
        errorTypesAPI.getAll(),
        studentsAPI.getAll(),
        teachersAPI.getAll(),
        certificatesAPI.getTemplates(),
      ]);
      setErrorTypes(errorRes.data);
      setStudents(studentRes.data);
      setTeachers(teacherRes.data);
      setTemplates(templateRes.data || []);
      if (templateRes.data?.[0]) {
        setCertificateForm((current) => ({ ...current, template_id: current.template_id || templateRes.data[0].id }));
      }

      const studentId = searchParams.get("student_id");
      const selectedStudent = studentRes.data.find((student) => student.id === studentId);
      setExam((current) => ({
        ...current,
        student_id: selectedStudent?.id || current.student_id,
        from_juz: selectedStudent?.exam_request?.from_juz?.toString() || current.from_juz,
        to_juz: selectedStudent?.exam_request?.to_juz?.toString() || current.to_juz,
      }));
    } catch (error) {
      toast.error(t("error"));
    } finally {
      setLoading(false);
    }
  }, [searchParams, t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (teacherLocked && loggedTeacher) {
      setExam((current) => ({ ...current, teacher_id: loggedTeacher.id }));
    }
  }, [teacherLocked, loggedTeacher]);

  useEffect(() => {
    const pages = getJuzPages(exam.from_juz);
    setExam((current) => {
      if (pages.includes(Number(current.page_number))) return current;
      return { ...current, page_number: pages[0]?.toString() || "1" };
    });
  }, [exam.from_juz]);

  useEffect(() => {
    if (!examTeacherLocked || !exam.student_id) return;
    const selected = students.find((student) => student.id === exam.student_id);
    if (!selected?.exam_request) return;
    setExam((current) => ({
      ...current,
      from_juz: selected.exam_request.from_juz.toString(),
      to_juz: selected.exam_request.to_juz.toString(),
    }));
  }, [examTeacherLocked, exam.student_id, students]);

  const updateExam = (field, value) => {
    setExam((current) => ({ ...current, [field]: value }));
  };

  const updateCertificateCustomField = (key, value) => {
    setCertificateForm((current) => ({
      ...current,
      custom_fields: {
        ...(current.custom_fields || {}),
        [key]: value,
      },
    }));
  };

  const selectCertificateTemplate = (templateId) => {
    const template = templates.find((item) => item.id === templateId);
    const customFields = Object.fromEntries(
      (template?.fields || [])
        .filter((field) => !CORE_FIELD_KEYS.includes(field.key))
        .map((field) => [field.key, certificateForm.custom_fields?.[field.key] || ""]),
    );
    setCertificateForm((current) => ({
      ...current,
      template_id: templateId,
      custom_fields: customFields,
    }));
  };

  const addError = (errorType) => {
    setExam((current) => ({
      ...current,
      errors: [
        ...current.errors,
        {
          error_type_id: errorType.id,
          name: errorType.name,
          deduction: Number(errorType.deduction),
          page_number: current.page_number,
          word: "",
          note: "",
        },
      ],
    }));
  };

  const updateError = (index, field, value) => {
    setExam((current) => ({
      ...current,
      errors: current.errors.map((error, errorIndex) =>
        errorIndex === index ? { ...error, [field]: value } : error,
      ),
    }));
  };

  const removeError = (index) => {
    setExam((current) => ({
      ...current,
      errors: current.errors.filter((_, errorIndex) => errorIndex !== index),
    }));
  };

  const handleSaveExam = async (event) => {
    event.preventDefault();
    if (!exam.student_id) {
      toast.error(t("pleaseSelectStudent"));
      return;
    }
    if (Number(exam.from_juz) > Number(exam.to_juz)) {
      toast.error(t("invalidJuzRange"));
      return;
    }
    if (savingMode === "certificate" && (!certificateForm.template_id || !certificateForm.degree)) {
      toast.error(t("certificateFieldsRequired"));
      return;
    }

    try {
      const evaluationResponse = await examEvaluationsAPI.create({
        ...exam,
        from_juz: Number(exam.from_juz),
        to_juz: Number(exam.to_juz),
        teacher_id: exam.teacher_id || null,
        errors: exam.errors.map((error) => ({
          ...error,
          page_number: Number(error.page_number),
          deduction: Number(error.deduction),
        })),
      });
      if (savingMode === "certificate") {
        const certificateResponse = await certificatesAPI.issue({
          template_id: certificateForm.template_id,
          student_id: exam.student_id,
          student_name: selectedStudent?.full_name || "",
          degree: certificateForm.degree,
          issue_date: certificateForm.issue_date,
          custom_fields: certificateForm.custom_fields || {},
          evaluation_id: evaluationResponse.data.id,
        });
        const pdf = await certificatesAPI.downloadPdf(certificateResponse.data.id);
        downloadBlob(pdf, `${certificateResponse.data.certificate_number}.pdf`);
        toast.success(t("certificateIssued"));
      }
      toast.success(t("evaluationCreated"));
      navigate("/evaluations");
    } catch (error) {
      toast.error(error.response?.data?.detail || t("error"));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSaveExam} className="space-y-6" data-testid="evaluation-form-page">
      <div>
        <Button variant="ghost" className="mb-2 gap-2 px-0" onClick={() => navigate("/evaluations")}>
          <ArrowLeft className="h-4 w-4" />
          {t("backToEvaluations")}
        </Button>
        <h1 className="flex items-center gap-3 text-2xl font-bold text-foreground md:text-3xl">
          <BookOpenCheck className="h-8 w-8 text-primary" />
          {t("newExam")}
        </h1>
        <p className="mt-1 text-muted-foreground">{t("newExamDescription")}</p>
      </div>

      <Card className="soft-panel rounded-lg">
        <CardHeader>
          <CardTitle>{t("evaluationDetails")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4">
          <div className="space-y-2 md:col-span-2">
            <Label>{t("studentName")} *</Label>
            <SearchableSelect
              options={students}
              value={exam.student_id}
              disabled={examTeacherLocked}
              onChange={(value) => updateExam("student_id", value)}
              placeholder={t("selectStudent")}
              searchPlaceholder={t("searchStudents")}
              emptyLabel={t("noData")}
              getOptionLabel={(student) => student.full_name}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>{t("teacherName")}</Label>
            <SearchableSelect
              options={teachers}
              value={exam.teacher_id}
              disabled={teacherLocked}
              onChange={(value) => updateExam("teacher_id", value)}
              placeholder={t("selectTeacher")}
              searchPlaceholder={t("searchTeachers")}
              emptyLabel={t("noData")}
              getOptionLabel={(teacher) => teacher.full_name}
            />
          </div>
          <div className="space-y-2">
            <Label>{t("fromJuz")}</Label>
            <Select value={exam.from_juz} disabled={examTeacherLocked} onValueChange={(value) => updateExam("from_juz", value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {JUZ_OPTIONS.map((juz) => (
                  <SelectItem key={juz} value={juz.toString()}>
                    {t("juz")} {juz}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t("toJuz")}</Label>
            <Select value={exam.to_juz} disabled={examTeacherLocked} onValueChange={(value) => updateExam("to_juz", value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {JUZ_OPTIONS.map((juz) => (
                  <SelectItem key={juz} value={juz.toString()}>
                    {t("juz")} {juz}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>{t("page")}</Label>
            <Select value={exam.page_number} onValueChange={(value) => updateExam("page_number", value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageOptions.map((page) => (
                  <SelectItem key={page} value={page.toString()}>
                    {t("page")} {page}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <Card className="soft-panel rounded-lg">
          <CardHeader>
            <CardTitle>{t("errorTable")}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {errorTypes.map((errorType) => (
              <Button
                key={errorType.id}
                type="button"
                variant="outline"
                className="h-auto min-h-20 justify-between gap-3 whitespace-normal p-4 text-left"
                onClick={() => addError(errorType)}
              >
                <span>
                  <span className="block font-semibold">{errorType.name}</span>
                  <span className="block text-sm text-muted-foreground">
                    -{errorType.deduction} {t("marks")}
                  </span>
                </span>
                <Plus className="h-5 w-5 shrink-0" />
              </Button>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-lg border-primary/20 bg-primary/[0.07]">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">{t("finalScore")}</p>
            <p className="mt-1 text-5xl font-bold text-primary">{liveScore}%</p>
            <Badge className={`${getScoreColor(liveScore)} mt-3`}>{t(liveResult)}</Badge>
            <div className="mt-5 space-y-2">
              <div className="flex justify-between text-sm">
                <span>{t("totalErrors")}</span>
                <strong>{exam.errors.length}</strong>
              </div>
              <div className="flex justify-between text-sm">
                <span>{t("totalDeduction")}</span>
                <strong>{totalDeduction}</strong>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="soft-panel rounded-lg">
        <CardHeader>
          <CardTitle>{t("recordedErrors")}</CardTitle>
        </CardHeader>
        <CardContent>
          {exam.errors.length === 0 ? (
            <div className="rounded-md border border-dashed p-5 text-center text-muted-foreground">
              {t("noErrorsRecorded")}
            </div>
          ) : (
            <div className="grid gap-3">
              {exam.errors.map((error, index) => (
                <div key={`${error.error_type_id || error.name}-${index}`} className="rounded-md border p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{error.name}</p>
                      <p className="text-sm text-muted-foreground">-{error.deduction} {t("marks")}</p>
                    </div>
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeError(index)} aria-label={`${t("remove")} ${error.name}`}>
                      <MinusCircle className="h-5 w-5" />
                    </Button>
                  </div>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <div className="space-y-1">
                      <Label>{t("page")}</Label>
                      <Select value={error.page_number?.toString()} onValueChange={(value) => updateError(index, "page_number", value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {pageOptions.map((page) => (
                            <SelectItem key={page} value={page.toString()}>
                              {t("page")} {page}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label>{t("word")}</Label>
                      <Input value={error.word} onChange={(event) => updateError(index, "word", event.target.value)} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="soft-panel rounded-lg">
        <CardHeader>
          <CardTitle>{t("notes")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={exam.notes}
            onChange={(event) => updateExam("notes", event.target.value)}
            placeholder={t("optionalNotes")}
          />
        </CardContent>
      </Card>

      <Card className="soft-panel rounded-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            {t("generateCertificate")}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label>{t("template")}</Label>
            <Select value={certificateForm.template_id} onValueChange={selectCertificateTemplate}>
              <SelectTrigger>
                <SelectValue placeholder={t("selectTemplate")} />
              </SelectTrigger>
              <SelectContent>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t("degree")}</Label>
            <Input
              value={certificateForm.degree}
              onChange={(event) =>
                setCertificateForm((current) => ({ ...current, degree: event.target.value }))
              }
              placeholder={t("degree")}
            />
          </div>
          <div className="space-y-2">
            <Label>{t("issueDate")}</Label>
            <Input
              type="date"
              value={certificateForm.issue_date}
              onChange={(event) =>
                setCertificateForm((current) => ({ ...current, issue_date: event.target.value }))
              }
            />
          </div>
          {certificateCustomFields.map((field) => (
            <div key={field.key} className="space-y-2">
              <Label>{field.label}</Label>
              <Input
                value={certificateForm.custom_fields?.[field.key] || ""}
                onChange={(event) => updateCertificateCustomField(field.key, event.target.value)}
                dir="auto"
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => navigate("/evaluations")}>
          {t("cancel")}
        </Button>
        <Button
          type="submit"
          className="gap-2 bg-primary hover:bg-primary/90"
          onClick={() => setSavingMode("exam")}
        >
          <Save className="h-4 w-4" />
          {t("save")}
        </Button>
        <Button
          type="submit"
          className="gap-2"
          disabled={!templates.length}
          onClick={() => setSavingMode("certificate")}
        >
          <Award className="h-4 w-4" />
          {t("saveAndGenerateCertificate")}
        </Button>
      </div>
    </form>
  );
};

export default EvaluationForm;
