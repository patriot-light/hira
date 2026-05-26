import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { PhoneActions } from "@/components/ui/phone-actions";
import { TypedDeleteDialog } from "@/components/ui/typed-delete-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Plus,
  Search,
  GraduationCap,
  Loader2,
} from "lucide-react";
import { TeacherActions } from "../components/TeacherActions";
import useTeachers from "../hooks/useTeachers";

const Teachers = () => {
  const {
    t,
    navigate,
    canManage,
    teachers,
    loading,
    searchQuery,
    setSearchQuery,
    dialogOpen,
    setDialogOpen,
    deleteDialogOpen,
    setDeleteDialogOpen,
    selectedTeacher,
    setSelectedTeacher,
    formData,
    setFormData,
    handleSubmit,
    handleDelete,
    filteredTeachers,
    deleteImpact,
  } = useTeachers();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="teachers-page">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-3">
            <GraduationCap className="h-8 w-8 text-primary" />
            {t("teachers")}
          </h1>
          <p className="text-muted-foreground mt-1">
            {teachers.length} {t("teachers")}
          </p>
        </div>
        {canManage() && (
          <Button
            onClick={() => navigate("/teachers/new")}
            className="gap-2 bg-primary hover:bg-primary/90"
            data-testid="add-teacher-btn">
            <Plus className="h-4 w-4" />
            {t("addTeacher")}
          </Button>
        )}
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("search")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="ps-10"
              data-testid="search-teachers-input"
            />
          </div>
        </CardContent>
      </Card>

      {/* Teachers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTeachers.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="p-8 text-center text-muted-foreground">
              {t("noData")}
            </CardContent>
          </Card>
        ) : (
          filteredTeachers.map((teacher) => (
            <Card
              key={teacher.id}
              className="card-hover"
              data-testid={`teacher-card-${teacher.id}`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <GraduationCap className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <button
                        type="button"
                        className="text-start font-semibold text-lg hover:text-primary hover:underline"
                        onClick={() => navigate(`/teachers/${teacher.id}`)}>
                        {teacher.full_name}
                      </button>
                      <p className="text-sm text-muted-foreground">
                        {teacher.qualification}
                      </p>
                    </div>
                  </div>
                  {canManage() && (
                    <TeacherActions
                      teacher={teacher}
                      t={t}
                      onEdit={(item) => navigate(`/teachers/${item.id}/edit`)}
                      onDelete={(item) => {
                        setSelectedTeacher(item);
                        setDeleteDialogOpen(true);
                      }}
                    />
                  )}
                </div>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {t("experienceYears")}
                    </span>
                    <Badge variant="outline">
                      {teacher.experience_years} {t("years")}
                    </Badge>
                  </div>
                  {teacher.phone && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {t("phone")}
                      </span>
                      <PhoneActions phone={teacher.phone} />
                    </div>
                  )}
                  {teacher.email && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {t("email")}
                      </span>
                      <span className="truncate max-w-[150px]">
                        {teacher.email}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedTeacher ? t("editTeacher") : t("addTeacher")}
            </DialogTitle>
            <DialogDescription>
              {selectedTeacher
                ? t("updateTeacherInformation")
                : t("addTeacherDescription")}
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
                  data-testid="teacher-name-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="qualification">{t("qualification")} *</Label>
                <Input
                  id="qualification"
                  value={formData.qualification}
                  onChange={(e) =>
                    setFormData({ ...formData, qualification: e.target.value })
                  }
                  required
                  placeholder={t("teacherQualificationPlaceholder")}
                  data-testid="teacher-qualification-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="experience_years">{t("experienceYears")}</Label>
                <Input
                  id="experience_years"
                  type="number"
                  value={formData.experience_years}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      experience_years: e.target.value,
                    })
                  }
                  min="0"
                  data-testid="teacher-experience-input"
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
                  data-testid="teacher-phone-input"
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
                  data-testid="teacher-email-input"
                />
              </div>
              {!selectedTeacher && (
                <div className="space-y-2">
                  <Label htmlFor="password">{t("password")}</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    placeholder={t("teacherPasswordPlaceholder")}
                    data-testid="teacher-password-input"
                  />
                  <p className="text-xs text-muted-foreground">
                    {t("loginAccountHint")}
                  </p>
                </div>
              )}
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
                data-testid="save-teacher-btn">
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
        description={t("deleteTeacherConfirmation", {
          name: selectedTeacher?.full_name,
        })}
        name={selectedTeacher?.full_name || ""}
        impact={deleteImpact}
        inputLabel={t("typeNameToConfirm", {
          name: selectedTeacher?.full_name,
        })}
        cancelLabel={t("cancel")}
        confirmLabel={t("delete")}
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default Teachers;
