import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { studentsAPI, halaqasAPI, exportAPI } from "../services/api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { SearchableMultiSelect } from "../components/ui/searchable-multi-select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Download,
  FileSpreadsheet,
  FileText,
  Users,
  Loader2,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";

const Students = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { canManage, isTeacher, isExamTeacher } = useAuth();
  const [students, setStudents] = useState([]);
  const [halaqas, setHalaqas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [examDialogOpen, setExamDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [examRange, setExamRange] = useState({ from_juz: "1", to_juz: "1" });
  const [formData, setFormData] = useState({
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
  });

  const fetchData = useCallback(async () => {
    try {
      const [studentsRes, halaqasRes] = await Promise.all([
        studentsAPI.getAll(),
        halaqasAPI.getAll(),
      ]);
      setStudents(studentsRes.data);
      setHalaqas(halaqasRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error(t("error"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        age: parseInt(formData.age) || 0,
        halaqa_ids: formData.halaqa_ids || [],
        halaqa_id: formData.halaqa_ids?.[0] || null,
        password: formData.password || null,
      };

      if (selectedStudent) {
        await studentsAPI.update(selectedStudent.id, data);
        toast.success(t("studentUpdated"));
      } else {
        await studentsAPI.create(data);
        toast.success(t("studentCreated"));
      }
      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || t("error"));
    }
  };

  const handleDelete = async () => {
    try {
      await studentsAPI.delete(selectedStudent.id);
      toast.success(t("studentDeleted"));
      setDeleteDialogOpen(false);
      setSelectedStudent(null);
      fetchData();
    } catch (error) {
      toast.error(t("error"));
    }
  };

  const handleEdit = (student) => {
    setSelectedStudent(student);
    setFormData({
      full_name: student.full_name,
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
    setDialogOpen(true);
  };

  const resetForm = () => {
    setSelectedStudent(null);
    setFormData({
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
    });
  };

  const canRaiseForExam = () => canManage() || isTeacher();

  const openExamEvaluation = (student) => {
    navigate(`/evaluations/new?student_id=${student.id}`);
  };

  const openExamDialog = (student) => {
    setSelectedStudent(student);
    setExamRange({ from_juz: "1", to_juz: "1" });
    setExamDialogOpen(true);
  };

  const handleRaiseForExam = async (event) => {
    event.preventDefault();
    if (Number(examRange.from_juz) > Number(examRange.to_juz)) {
      toast.error(t("invalidJuzRange"));
      return;
    }
    try {
      await studentsAPI.raiseForExam(selectedStudent.id, examRange);
      toast.success(t("studentRaisedForExam"));
      setExamDialogOpen(false);
      setSelectedStudent(null);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || t("error"));
    }
  };

  const handleExportExcel = async () => {
    try {
      const response = await exportAPI.studentsExcel();
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "students.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success(t("success"));
    } catch (error) {
      toast.error(t("error"));
    }
  };

  const handleExportPdf = async () => {
    try {
      const response = await exportAPI.studentsPdf();
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "students.pdf");
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success(t("success"));
    } catch (error) {
      toast.error(t("error"));
    }
  };

  const filteredStudents = students.filter(
    (student) =>
      student.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.national_id?.includes(searchQuery),
  );

  const getHalaqaNames = (student) => {
    const ids = student.halaqa_ids || (student.halaqa_id ? [student.halaqa_id] : []);
    const names = ids
      .map((id) => halaqas.find((halaqa) => halaqa.id === id)?.name)
      .filter(Boolean);
    return names.length ? names.join(", ") : "-";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="students-page">
      {/* Header */}
      <div className="page-hero rounded-lg p-5 md:p-7">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-white/80 text-primary ring-1 ring-primary/15">
              <Users className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground md:text-4xl">
                {t("students")}
              </h1>
              <p className="mt-1 text-base font-medium text-slate-600">
                {students.length} {t("students")}
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
          {canManage() && (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="gap-2 bg-white/85"
                    data-testid="export-btn"
                  >
                    <Download className="h-4 w-4" />
                    {t("export")}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={handleExportExcel}
                    data-testid="export-excel-btn"
                  >
                    <FileSpreadsheet className="h-4 w-4 me-2" />
                    {t("exportExcel")}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleExportPdf}
                    data-testid="export-pdf-btn"
                  >
                    <FileText className="h-4 w-4 me-2" />
                    {t("exportPdf")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                onClick={() => navigate("/students/new")}
                className="gap-2 bg-primary hover:bg-primary/90"
                data-testid="add-student-btn"
              >
                <UserPlus className="h-4 w-4" />
                {t("addStudent")}
              </Button>
            </>
          )}
          </div>
        </div>
      </div>

      {/* Search */}
      <Card className="action-strip rounded-lg">
        <CardContent className="p-4 md:p-5">
          <div className="relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("search")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-12 ps-10"
              data-testid="search-students-input"
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="soft-panel overflow-hidden rounded-lg">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("fullName")}</TableHead>
                  <TableHead>{t("age")}</TableHead>
                  <TableHead className="hidden md:table-cell">
                    {t("phone")}
                  </TableHead>
                  <TableHead className="hidden md:table-cell">
                    {t("halaqas")}
                  </TableHead>
                  <TableHead>{t("status")}</TableHead>
                  {(canManage() || canRaiseForExam() || isExamTeacher()) && (
                    <TableHead className="w-12">{t("actions")}</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-8 text-muted-foreground"
                    >
                      {t("noData")}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStudents.map((student) => (
                    <TableRow
                      key={student.id}
                      data-testid={`student-row-${student.id}`}
                    >
                      <TableCell className="font-medium">
                        <button
                          type="button"
                          className="text-start font-semibold text-primary hover:underline"
                          onClick={() => navigate(`/students/${student.id}`)}
                        >
                          {student.full_name}
                        </button>
                      </TableCell>
                      <TableCell>{student.age}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        {student.phone || "-"}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {getHalaqaNames(student)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            student.status === "active"
                              ? "default"
                              : "secondary"
                          }
                          className={
                            student.status === "active"
                              ? "bg-green-100 text-green-700"
                              : ""
                          }
                        >
                          {t(student.status)}
                        </Badge>
                      </TableCell>
                      {(canManage() || canRaiseForExam() || isExamTeacher()) && (
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                data-testid={`student-actions-${student.id}`}
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {isExamTeacher() && (
                                <DropdownMenuItem onClick={() => openExamEvaluation(student)}>
                                  <FileText className="h-4 w-4 me-2" />
                                  {t("addExamEvaluation")}
                                </DropdownMenuItem>
                              )}
                              {canRaiseForExam() && (
                                <DropdownMenuItem onClick={() => openExamDialog(student)}>
                                  <FileText className="h-4 w-4 me-2" />
                                  {t("raiseNameForExam")}
                                </DropdownMenuItem>
                              )}
                              {canManage() && (
                                <>
                                  <DropdownMenuItem
                                    onClick={() => navigate(`/students/${student.id}/edit`)}
                                  >
                                    <Edit className="h-4 w-4 me-2" />
                                    {t("edit")}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSelectedStudent(student);
                                      setDeleteDialogOpen(true);
                                    }}
                                    className="text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4 me-2" />
                                    {t("delete")}
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedStudent ? t("editStudent") : t("addStudent")}
            </DialogTitle>
            <DialogDescription>
              {selectedStudent
                ? t("updateStudentInformation")
                : t("addStudentDescription")}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">{t("fullName")} *</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) =>
                    setFormData({ ...formData, full_name: e.target.value })
                  }
                  required
                  data-testid="student-name-input"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="age">{t("age")} *</Label>
                  <Input
                    id="age"
                    type="number"
                    value={formData.age}
                    onChange={(e) =>
                      setFormData({ ...formData, age: e.target.value })
                    }
                    required
                    min="1"
                    data-testid="student-age-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">{t("status")}</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) =>
                      setFormData({ ...formData, status: value })
                    }
                  >
                    <SelectTrigger data-testid="student-status-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">{t("active")}</SelectItem>
                      <SelectItem value="inactive">{t("inactive")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="national_id">{t("nationalId")}</Label>
                <Input
                  id="national_id"
                  value={formData.national_id}
                  onChange={(e) =>
                    setFormData({ ...formData, national_id: e.target.value })
                  }
                  data-testid="student-national-id-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">{t("phone")}</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  data-testid="student-phone-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="parent_phone">{t("parentPhone")}</Label>
                <Input
                  id="parent_phone"
                  value={formData.parent_phone}
                  onChange={(e) =>
                    setFormData({ ...formData, parent_phone: e.target.value })
                  }
                  data-testid="student-parent-phone-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">{t("email")}</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  data-testid="student-email-input"
                />
              </div>
              {!selectedStudent && (
                <div className="space-y-2">
                  <Label htmlFor="password">{t("password")}</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    placeholder={t("studentPasswordPlaceholder")}
                    data-testid="student-password-input"
                  />
                  <p className="text-xs text-muted-foreground">
                    {t("loginAccountHint")}
                  </p>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="halaqa">{t("assignToHalaqa")}</Label>
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
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                {t("cancel")}
              </Button>
              <Button
                type="submit"
                className="bg-primary hover:bg-primary/90"
                data-testid="save-student-btn"
              >
                {t("save")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={examDialogOpen} onOpenChange={setExamDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("raiseNameForExam")}</DialogTitle>
            <DialogDescription>
              {t("raiseNameForExamDescription", { name: selectedStudent?.full_name })}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRaiseForExam} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("fromJuz")}</Label>
                <Input
                  type="number"
                  min="1"
                  max="30"
                  value={examRange.from_juz}
                  onChange={(event) =>
                    setExamRange((current) => ({ ...current, from_juz: event.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>{t("toJuz")}</Label>
                <Input
                  type="number"
                  min="1"
                  max="30"
                  value={examRange.to_juz}
                  onChange={(event) =>
                    setExamRange((current) => ({ ...current, to_juz: event.target.value }))
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setExamDialogOpen(false)}>
                {t("cancel")}
              </Button>
              <Button type="submit" className="bg-primary hover:bg-primary/90">
                {t("save")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("confirm")}</DialogTitle>
            <DialogDescription>
              {t("deleteStudentConfirmation", {
                name: selectedStudent?.full_name,
              })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              {t("cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              data-testid="confirm-delete-btn"
            >
              {t("delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Students;
