import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  Award,
  Calendar,
  Download,
  FileText,
  Loader2,
  Move,
  Plus,
  Save,
  Trash2,
  Type,
  Upload,
} from "lucide-react";
import { certificatesAPI, studentsAPI } from "../services/api";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";

const FIELD_OPTIONS = [
  { key: "studentName", labelKey: "studentName", sample: "Aisha Rahman" },
  { key: "degree", labelKey: "degree", sample: "Certificate of Excellence" },
  { key: "issueDate", labelKey: "issueDate", sample: new Date().toISOString().slice(0, 10) },
  { key: "certificateNumber", labelKey: "certificateNumber", sample: "CERT-0001" },
];

const CORE_FIELD_KEYS = ["studentName", "degree", "issueDate", "certificateNumber"];

const DEFAULT_FIELDS = [
  { key: "studentName", label: "Student name", x: 0.5, y: 0.42, width: 0.48, fontSize: 44, color: "#111827", align: "center", fontWeight: "bold" },
  { key: "degree", label: "Degree", x: 0.5, y: 0.54, width: 0.52, fontSize: 28, color: "#334155", align: "center", fontWeight: "normal" },
  { key: "issueDate", label: "Issue date", x: 0.68, y: 0.78, width: 0.22, fontSize: 18, color: "#334155", align: "center", fontWeight: "normal" },
];

function createCustomField(label) {
  const cleanLabel = label.trim();
  return {
    key: `custom_${Date.now()}`,
    label: cleanLabel,
    x: 0.5,
    y: 0.5,
    width: 0.34,
    fontSize: 24,
    color: "#111827",
    align: "center",
    fontWeight: "normal",
  };
}

function readImageFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => resolve({ dataUrl: reader.result, width: image.naturalWidth, height: image.naturalHeight });
      image.onerror = reject;
      image.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

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

const Certificates = () => {
  const { t, i18n } = useTranslation();
  const editorRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [issued, setIssued] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [activeFieldKey, setActiveFieldKey] = useState("studentName");
  const [draggingKey, setDraggingKey] = useState(null);
  const [resizingKey, setResizingKey] = useState(null);
  const [customFieldName, setCustomFieldName] = useState("");
  const [templateForm, setTemplateForm] = useState({
    id: null,
    name: "",
    background_image: "",
    width: 1200,
    height: 850,
    fields: DEFAULT_FIELDS,
  });
  const [issueForm, setIssueForm] = useState({
    template_id: "",
    student_id: "",
    student_name: "",
    degree: "",
    issue_date: new Date().toISOString().slice(0, 10),
    custom_fields: {},
  });

  const fetchData = useCallback(async () => {
    try {
      const [templateRes, issuedRes, studentRes] = await Promise.all([
        certificatesAPI.getTemplates(),
        certificatesAPI.getIssued(),
        studentsAPI.getAll(),
      ]);
      setTemplates(templateRes.data);
      setIssued(issuedRes.data);
      setStudents(studentRes.data);
      if (!issueForm.template_id && templateRes.data[0]) {
        const customFields = Object.fromEntries(
          (templateRes.data[0].fields || [])
            .filter((field) => !CORE_FIELD_KEYS.includes(field.key))
            .map((field) => [field.key, ""]),
        );
        setIssueForm((current) => ({ ...current, template_id: templateRes.data[0].id, custom_fields: customFields }));
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || t("couldNotLoadCertificates"));
    } finally {
      setLoading(false);
    }
  }, [issueForm.template_id, t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const activeField = useMemo(
    () => templateForm.fields.find((field) => field.key === activeFieldKey),
    [activeFieldKey, templateForm.fields],
  );

  const selectedTemplate = useMemo(
    () => templates.find((template) => template.id === selectedTemplateId),
    [selectedTemplateId, templates],
  );

  const issueTemplate = useMemo(
    () => templates.find((template) => template.id === issueForm.template_id),
    [issueForm.template_id, templates],
  );

  const issueCustomFields = useMemo(
    () => (issueTemplate?.fields || []).filter((field) => !CORE_FIELD_KEYS.includes(field.key)),
    [issueTemplate],
  );

  const fieldSamples = useMemo(
    () => ({
      ...Object.fromEntries(FIELD_OPTIONS.map((field) => [field.key, field.sample])),
      ...Object.fromEntries(templateForm.fields.map((field) => [field.key, field.label])),
    }),
    [templateForm.fields],
  );

  const updateField = (key, updates) => {
    setTemplateForm((current) => ({
      ...current,
      fields: current.fields.map((field) => (field.key === key ? { ...field, ...updates } : field)),
    }));
  };

  const handlePointerPosition = (event, key) => {
    const rect = editorRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));
    updateField(key, { x, y });
  };

  const handleResizeField = (event, key) => {
    const rect = editorRef.current?.getBoundingClientRect();
    const field = templateForm.fields.find((item) => item.key === key);
    if (!rect || !field) return;
    const pointerX = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
    const nextWidth = Math.max(0.05, Math.min(1, Math.abs(pointerX - field.x) * 2));
    updateField(key, { width: nextWidth });
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const image = await readImageFile(file);
      setTemplateForm((current) => ({
        ...current,
        background_image: image.dataUrl,
        width: image.width,
        height: image.height,
      }));
    } catch (error) {
      toast.error(t("validCertificateImageRequired"));
    }
  };

  const addField = (key) => {
    if (templateForm.fields.some((field) => field.key === key)) {
      setActiveFieldKey(key);
      return;
    }
    const option = FIELD_OPTIONS.find((field) => field.key === key);
    setTemplateForm((current) => ({
      ...current,
      fields: [
        ...current.fields,
        {
          key,
          label: option ? t(option.labelKey) : key,
          x: 0.5,
          y: 0.5,
          width: 0.34,
          fontSize: 24,
          color: "#111827",
          align: "center",
          fontWeight: "normal",
        },
      ],
    }));
    setActiveFieldKey(key);
  };

  const addCustomField = () => {
    if (!customFieldName.trim()) {
      toast.error(t("enterFieldNameFirst"));
      return;
    }
    const field = createCustomField(customFieldName);
    setTemplateForm((current) => ({
      ...current,
      fields: [...current.fields, field],
    }));
    setCustomFieldName("");
    setActiveFieldKey(field.key);
  };

  const removeField = (key) => {
    setTemplateForm((current) => {
      const fields = current.fields.filter((field) => field.key !== key);
      if (activeFieldKey === key) setActiveFieldKey(fields[0]?.key || "");
      return { ...current, fields };
    });
  };

  const resetTemplateForm = () => {
    setTemplateForm({
      id: null,
      name: "",
      background_image: "",
      width: 1200,
      height: 850,
      fields: DEFAULT_FIELDS,
    });
    setActiveFieldKey("studentName");
    setSelectedTemplateId("");
  };

  const editTemplate = (template) => {
    setSelectedTemplateId(template.id);
    setTemplateForm({
      id: template.id,
      name: template.name,
      background_image: template.background_image,
      width: template.width,
      height: template.height,
      fields: template.fields || DEFAULT_FIELDS,
    });
    setActiveFieldKey(template.fields?.[0]?.key || "studentName");
  };

  const saveTemplate = async () => {
    if (!templateForm.name || !templateForm.background_image || !templateForm.fields.length) {
      toast.error(t("certificateTemplateValidation"));
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: templateForm.name,
        background_image: templateForm.background_image,
        width: templateForm.width,
        height: templateForm.height,
        fields: templateForm.fields,
      };
      if (templateForm.id) {
        await certificatesAPI.updateTemplate(templateForm.id, payload);
        toast.success(t("certificateTemplateUpdated"));
      } else {
        await certificatesAPI.createTemplate(payload);
        toast.success(t("certificateTemplateSaved"));
      }
      resetTemplateForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || t("couldNotSaveTemplate"));
    } finally {
      setSaving(false);
    }
  };

  const deleteTemplate = async (template) => {
    try {
      await certificatesAPI.deleteTemplate(template.id);
      toast.success(t("certificateTemplateDeleted"));
      if (templateForm.id === template.id) resetTemplateForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || t("couldNotDeleteTemplate"));
    }
  };

  const selectStudent = (studentId) => {
    const student = students.find((item) => item.id === studentId);
    setIssueForm((current) => ({
      ...current,
      student_id: studentId,
      student_name: student?.full_name || current.student_name,
    }));
  };

  const selectIssueTemplate = (templateId) => {
    const template = templates.find((item) => item.id === templateId);
    const customFields = Object.fromEntries(
      (template?.fields || [])
        .filter((field) => !CORE_FIELD_KEYS.includes(field.key))
        .map((field) => [field.key, issueForm.custom_fields?.[field.key] || ""]),
    );
    setIssueForm((current) => ({
      ...current,
      template_id: templateId,
      custom_fields: customFields,
    }));
  };

  const updateIssueCustomField = (key, value) => {
    setIssueForm((current) => ({
      ...current,
      custom_fields: {
        ...(current.custom_fields || {}),
        [key]: value,
      },
    }));
  };

  const issueCertificate = async (event) => {
    event.preventDefault();
    try {
      const response = await certificatesAPI.issue(issueForm);
      toast.success(t("certificateIssued"));
      const pdf = await certificatesAPI.downloadPdf(response.data.id);
      downloadBlob(pdf, `${response.data.certificate_number}.pdf`);
      setIssueForm((current) => ({
        ...current,
        student_id: "",
        student_name: "",
        degree: "",
        issue_date: new Date().toISOString().slice(0, 10),
        custom_fields: {},
      }));
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || t("couldNotIssueCertificate"));
    }
  };

  const downloadIssued = async (certificate) => {
    try {
      const response = await certificatesAPI.downloadPdf(certificate.id);
      downloadBlob(response, `${certificate.certificate_number}.pdf`);
    } catch (error) {
      toast.error(t("couldNotDownloadCertificate"));
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
    <div className="space-y-6" dir={i18n.dir()} data-testid="certificates-page">
      <div className="page-hero rounded-lg p-5 md:p-7">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-white/80 text-primary ring-1 ring-primary/15">
              <Award className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground md:text-4xl">{t("certificates")}</h1>
              <p className="mt-1 text-base font-medium text-slate-600">{t("certificatesDescription")}</p>
            </div>
          </div>
          <Button variant="outline" className="gap-2 bg-white/85" onClick={resetTemplateForm}>
            <Plus className="h-4 w-4" />
            {t("newTemplate")}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="soft-panel rounded-lg">
          <CardHeader className="space-y-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-2">
                <CardTitle>{t("templateEditor")}</CardTitle>
                <Input
                  value={templateForm.name}
                  onChange={(event) => setTemplateForm((current) => ({ ...current, name: event.target.value }))}
                  placeholder={t("templateName")}
                  className="h-11 max-w-md"
                  data-testid="certificate-template-name"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg border bg-background px-4 text-sm font-bold">
                  <Upload className="h-4 w-4" />
                  {t("uploadImage")}
                  <Input className="hidden" type="file" accept="image/png,image/jpeg" onChange={handleImageUpload} />
                </Label>
                <Select value={activeFieldKey} onValueChange={addField}>
                  <SelectTrigger className="h-10 w-44">
                    <Type className="me-2 h-4 w-4" />
                    <SelectValue placeholder={t("addField")} />
                  </SelectTrigger>
                  <SelectContent>
                    {FIELD_OPTIONS.map((field) => (
                      <SelectItem key={field.key} value={field.key}>
                        {t(field.labelKey)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex gap-2">
                  <Input
                    value={customFieldName}
                    onChange={(event) => setCustomFieldName(event.target.value)}
                    placeholder={t("customField")}
                    className="h-10 w-40"
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        addCustomField();
                      }
                    }}
                  />
                  <Button type="button" variant="outline" className="h-10 gap-2" onClick={addCustomField}>
                    <Plus className="h-4 w-4" />
                    {t("field")}
                  </Button>
                </div>
                <Button className="gap-2" onClick={saveTemplate} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {t("save")}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div
              ref={editorRef}
              className="relative mx-auto w-full overflow-hidden rounded-lg border bg-slate-100 shadow-inner"
              style={{ aspectRatio: `${templateForm.width} / ${templateForm.height}` }}
              onPointerMove={(event) => {
                if (draggingKey) handlePointerPosition(event, draggingKey);
                if (resizingKey) handleResizeField(event, resizingKey);
              }}
              onPointerUp={() => {
                setDraggingKey(null);
                setResizingKey(null);
              }}
              onPointerLeave={() => {
                setDraggingKey(null);
                setResizingKey(null);
              }}
            >
              {templateForm.background_image ? (
                <img src={templateForm.background_image} alt="Certificate template" className="absolute inset-0 h-full w-full object-fill" />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-slate-500">
                  <Upload className="h-10 w-10" />
                  <span className="text-sm font-semibold">{t("uploadCertificateBackground")}</span>
                </div>
              )}
              {templateForm.background_image && templateForm.fields.map((field) => (
                <div
                  key={field.key}
                  role="button"
                  tabIndex={0}
                  onPointerDown={(event) => {
                    event.preventDefault();
                    setActiveFieldKey(field.key);
                    setDraggingKey(field.key);
                    handlePointerPosition(event, field.key);
                  }}
                  className={`absolute min-h-8 cursor-move rounded border px-2 py-1 text-center shadow-sm transition ${
                    activeFieldKey === field.key ? "border-primary bg-white/90 ring-2 ring-primary/30" : "border-dashed border-slate-500 bg-white/65"
                  }`}
                  style={{
                    left: `${field.x * 100}%`,
                    top: `${field.y * 100}%`,
                    width: `${field.width * 100}%`,
                    transform: "translateX(-50%)",
                    color: field.color,
                    fontSize: `clamp(10px, ${(field.fontSize / templateForm.width) * 100}vw, ${field.fontSize}px)`,
                    fontWeight: field.fontWeight === "bold" ? 700 : 500,
                    fontFamily: "Arial, Tahoma, sans-serif",
                    direction: "auto",
                  }}
                >
                  {fieldSamples[field.key] || field.label}
                  {activeFieldKey === field.key && (
                    <button
                      type="button"
                      aria-label={`Resize ${field.label}`}
                      className="absolute -end-2 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border border-primary bg-white shadow"
                      onPointerDown={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        setActiveFieldKey(field.key);
                        setResizingKey(field.key);
                      }}
                    />
                  )}
                </div>
              ))}
            </div>

            {activeField && (
              <div className="grid gap-4 rounded-lg border bg-background p-4 md:grid-cols-6">
                <div className="space-y-2">
                  <Label>{t("fieldLabel")}</Label>
                  <Input
                    value={CORE_FIELD_KEYS.includes(activeField.key) ? t(FIELD_OPTIONS.find((field) => field.key === activeField.key)?.labelKey || activeField.label) : activeField.label}
                    onChange={(event) => updateField(activeField.key, { label: event.target.value })}
                    disabled={CORE_FIELD_KEYS.includes(activeField.key)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("fontSize")}</Label>
                  <Input type="number" min="8" max="96" value={activeField.fontSize} onChange={(event) => updateField(activeField.key, { fontSize: Number(event.target.value) })} />
                </div>
                <div className="space-y-2">
                  <Label>{t("widthPercent")}</Label>
                  <Input type="number" min="5" max="100" value={Math.round(activeField.width * 100)} onChange={(event) => updateField(activeField.key, { width: Number(event.target.value) / 100 })} />
                </div>
                <div className="space-y-2">
                  <Label>{t("color")}</Label>
                  <Input type="color" value={activeField.color} onChange={(event) => updateField(activeField.key, { color: event.target.value })} />
                </div>
                <div className="flex items-end gap-2">
                  <Button type="button" variant="outline" size="icon" title={t("dragFieldOnCertificate")}>
                    <Move className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant={activeField.fontWeight === "bold" ? "default" : "outline"}
                    onClick={() => updateField(activeField.key, { fontWeight: activeField.fontWeight === "bold" ? "normal" : "bold" })}
                  >
                    B
                  </Button>
                  <Button type="button" variant="destructive" size="icon" onClick={() => removeField(activeField.key)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="rounded-lg">
            <CardHeader>
              <CardTitle>{t("issueCertificate")}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={issueCertificate} className="space-y-4">
                <div className="space-y-2">
                  <Label>{t("template")}</Label>
                  <Select value={issueForm.template_id} onValueChange={selectIssueTemplate}>
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
                  <Label>{t("student")}</Label>
                  <Select value={issueForm.student_id} onValueChange={selectStudent}>
                    <SelectTrigger>
                      <SelectValue placeholder={t("selectOrTypeBelow")} />
                    </SelectTrigger>
                    <SelectContent>
                      {students.map((student) => (
                        <SelectItem key={student.id} value={student.id}>
                          {student.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t("studentName")}</Label>
                  <Input required dir="auto" value={issueForm.student_name} onChange={(event) => setIssueForm((current) => ({ ...current, student_name: event.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>{t("degree")}</Label>
                  <Input required dir="auto" value={issueForm.degree} onChange={(event) => setIssueForm((current) => ({ ...current, degree: event.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>{t("date")}</Label>
                  <Input type="date" required value={issueForm.issue_date} onChange={(event) => setIssueForm((current) => ({ ...current, issue_date: event.target.value }))} />
                </div>
                {issueCustomFields.map((field) => (
                  <div key={field.key} className="space-y-2">
                    <Label>{field.label}</Label>
                    <Input
                      value={issueForm.custom_fields?.[field.key] || ""}
                      onChange={(event) => updateIssueCustomField(field.key, event.target.value)}
                      dir="auto"
                    />
                  </div>
                ))}
                <Button type="submit" className="w-full gap-2" disabled={!templates.length}>
                  <FileText className="h-4 w-4" />
                  {t("issueAndDownload")}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="rounded-lg">
            <CardHeader>
              <CardTitle>{t("savedTemplates")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {templates.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("noCertificateTemplates")}</p>
              ) : (
                templates.map((template) => (
                  <div key={template.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                    <button type="button" className="min-w-0 text-start" onClick={() => editTemplate(template)}>
                      <span className="block truncate text-sm font-bold">{template.name}</span>
                      <span className="text-xs text-muted-foreground">{t("fieldsCount", { count: template.fields?.length || 0 })}</span>
                    </button>
                    <Button variant="ghost" size="icon" onClick={() => deleteTemplate(template)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle>{t("issuedCertificates")}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("student")}</TableHead>
                  <TableHead>{t("degree")}</TableHead>
                  <TableHead>{t("date")}</TableHead>
                  <TableHead>{t("number")}</TableHead>
                  <TableHead className="w-12">{t("pdf")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {issued.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                      {t("noIssuedCertificates")}
                    </TableCell>
                  </TableRow>
                ) : (
                  issued.map((certificate) => (
                    <TableRow key={certificate.id}>
                      <TableCell className="font-medium">{certificate.student_name}</TableCell>
                      <TableCell>{certificate.degree}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {certificate.issue_date}
                        </span>
                      </TableCell>
                      <TableCell>{certificate.certificate_number}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => downloadIssued(certificate)}>
                          <Download className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Certificates;
