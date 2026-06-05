import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ActionButton } from "@/components/ui/action-button";
import { PhoneActions } from "@/components/ui/phone-actions";
import { TypedDeleteDialog } from "@/components/ui/typed-delete-dialog";
import { SearchableMultiSelect } from "@/components/ui/searchable-multi-select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  Edit,
  Trash2,
  FileSpreadsheet,
  FileText,
  Users,
  Loader2,
  UserPlus,
} from "lucide-react";
import { halaqaLabel } from "@/lib/halaqa";
import { StudentHalaqaLinks } from "../components/StudentHalaqaLinks";
import useStudents from "../hooks/useStudents";

const Students = () => {
  const {
    t,
    navigate,
    canManage,
    isExamTeacher,
    loading,
    halaqas,
    searchQuery,
    setSearchQuery,
    dialogOpen,
    setDialogOpen,
    deleteDialogOpen,
    setDeleteDialogOpen,
    examDialogOpen,
    setExamDialogOpen,
    selectedStudent,
    setSelectedStudent,
    examRange,
    setExamRange,
    formData,
    setFormData,
    handleSubmit,
    handleDelete,
    canRaiseForExam,
    openExamEvaluation,
    openExamDialog,
    handleRaiseForExam,
    handleExportExcel,
    handleExportPdf,
    filteredStudents,
    getHalaqaNames,
    getDeleteImpact,
  } = useStudents();

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
                {filteredStudents?.length} {t("students")}
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            {canManage() && (
              <>
                <Button
                  variant="outline"
                  className="gap-2 bg-white/85"
                  onClick={handleExportExcel}
                  data-testid="export-excel-btn">
                  <FileSpreadsheet className="h-4 w-4" />
                  {t("exportExcel")}
                </Button>
                <Button
                  variant="outline"
                  className="gap-2 bg-white/85"
                  onClick={handleExportPdf}
                  data-testid="export-pdf-btn">
                  <FileText className="h-4 w-4" />
                  {t("exportPdf")}
                </Button>
                <Button
                  onClick={() => navigate("/students/new")}
                  className="gap-2 bg-primary hover:bg-primary/90"
                  data-testid="add-student-btn">
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
                  <TableHead className="hidden md:table-cell">
                    {t("fatherName")}
                  </TableHead>
                  <TableHead className="hidden md:table-cell">
                    {t("motherName")}
                  </TableHead>
                  <TableHead className="hidden md:table-cell">
                    {t("studentPhone")}
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
                {filteredStudents?.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-8 text-muted-foreground">
                      {t("noData")}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStudents?.map((student) => (
                    <TableRow
                      key={student.id}
                      data-testid={`student-row-${student.id}`}>
                      <TableCell className="font-medium">
                        <button
                          type="button"
                          className="text-start font-semibold text-primary hover:underline"
                          onClick={() => navigate(`/students/${student.id}`)}>
                          {student.full_name}
                        </button>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {student.father_name || "-"}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {student.mother_name || "-"}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <PhoneActions phone={student.phone} />
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <StudentHalaqaLinks
                          halaqas={getHalaqaNames(student)}
                          t={t}
                          onNavigate={(halaqaId) =>
                            navigate(`/halaqas/${halaqaId}`)
                          }
                        />
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
                          }>
                          {t(student.status)}
                        </Badge>
                      </TableCell>
                      {(canManage() ||
                        canRaiseForExam() ||
                        isExamTeacher()) && (
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {isExamTeacher() && (
                              <ActionButton
                                label={t("addExamEvaluation")}
                                icon={FileText}
                                onClick={() => openExamEvaluation(student)}
                              />
                            )}
                            {canRaiseForExam() && (
                              <ActionButton
                                label={t("raiseNameForExam")}
                                icon={FileText}
                                onClick={() => openExamDialog(student)}
                              />
                            )}
                            {canManage() && (
                              <>
                                <ActionButton
                                  label={t("edit")}
                                  icon={Edit}
                                  onClick={() =>
                                    navigate(`/students/${student.id}/edit`)
                                  }
                                />
                                <ActionButton
                                  label={t("delete")}
                                  icon={Trash2}
                                  className="text-destructive hover:text-destructive"
                                  onClick={() => {
                                    setSelectedStudent(student);
                                    setDeleteDialogOpen(true);
                                  }}
                                />
                              </>
                            )}
                          </div>
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
                    }>
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
                  getOptionLabel={(halaqa) => halaqaLabel(halaqa, t)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}>
                {t("cancel")}
              </Button>
              <Button
                type="submit"
                className="bg-primary hover:bg-primary/90"
                data-testid="save-student-btn">
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
              {t("raiseNameForExamDescription", {
                name: selectedStudent?.full_name,
              })}
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
                    setExamRange((current) => ({
                      ...current,
                      from_juz: event.target.value,
                    }))
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
                    setExamRange((current) => ({
                      ...current,
                      to_juz: event.target.value,
                    }))
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setExamDialogOpen(false)}>
                {t("cancel")}
              </Button>
              <Button type="submit" className="bg-primary hover:bg-primary/90">
                {t("save")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <TypedDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title={t("confirm")}
        description={t("deleteStudentConfirmation", {
          name: selectedStudent?.full_name,
        })}
        name={selectedStudent?.full_name || ""}
        impact={getDeleteImpact()}
        inputLabel={t("typeNameToConfirm", {
          name: selectedStudent?.full_name,
        })}
        cancelLabel={t("cancel")}
        confirmLabel={t("delete")}
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default Students;
