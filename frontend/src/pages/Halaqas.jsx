import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { halaqasAPI, halaqaTypesAPI, teachersAPI, studentsAPI } from "../services/api";
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
import { SearchableSelect } from "../components/ui/searchable-select";
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
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  BookOpen,
  Users,
  FileText,
  Calendar,
  Clock,
  Loader2,
  UserX,
} from "lucide-react";
import { toast } from "sonner";

const Halaqas = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { canManage, isTeacher } = useAuth();
  const [halaqas, setHalaqas] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [halaqaTypes, setHalaqaTypes] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [examDialogOpen, setExamDialogOpen] = useState(false);
  const [selectedHalaqa, setSelectedHalaqa] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [examRange, setExamRange] = useState({ from_juz: "1", to_juz: "1" });
  const [formName, setFormName] = useState("");
  const [formTypeId, setFormTypeId] = useState("");
  const [formGender, setFormGender] = useState("male");
  const [formAttendanceMode, setFormAttendanceMode] = useState("online");
  const [formTeacherIds, setFormTeacherIds] = useState([]);

  const fetchData = useCallback(async () => {
    try {
      const [h, tc, st, ht] = await Promise.all([
        halaqasAPI.getAll(),
        teachersAPI.getAll(),
        studentsAPI.getAll(),
        halaqaTypesAPI.getAll(),
      ]);
      setHalaqas(h.data);
      setTeachers(tc.data);
      setAllStudents(st.data);
      setHalaqaTypes(ht.data);
    } catch (error) {
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
    if (!formTypeId) {
      toast.error(t("pleaseSelectHalaqaType"));
      return;
    }
    try {
      const data = {
        name: formName,
        type_id: formTypeId,
        gender: formGender,
        attendance_mode: formAttendanceMode,
        teacher_ids: formTeacherIds,
        schedule: [],
      };
      if (selectedHalaqa) {
        await halaqasAPI.update(selectedHalaqa.id, data);
        toast.success(t("halaqaUpdated"));
      } else {
        await halaqasAPI.create(data);
        toast.success(t("halaqaCreated"));
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
      await halaqasAPI.delete(selectedHalaqa.id);
      toast.success(t("halaqaDeleted"));
      setDeleteDialogOpen(false);
      setSelectedHalaqa(null);
      fetchData();
    } catch (error) {
      toast.error(t("error"));
    }
  };

  const handleEdit = (halaqa) => {
    setSelectedHalaqa(halaqa);
    setFormName(halaqa.name);
    setFormTypeId(halaqa.type_id || "");
    setFormGender(halaqa.gender || "male");
    setFormAttendanceMode(halaqa.attendance_mode || "online");
    setFormTeacherIds(halaqa.teacher_ids || []);
    setDialogOpen(true);
  };

  const resetForm = () => {
    setSelectedHalaqa(null);
    setFormName("");
    setFormTypeId("");
    setFormGender("male");
    setFormAttendanceMode("online");
    setFormTeacherIds([]);
  };

  const handleMarkAbsent = async (halaqa, student) => {
    try {
      await halaqasAPI.markAbsent(halaqa.id, student.id, {
        reason: "absent_no_response",
      });
      toast.success(t("absenceRecorded"));
    } catch (error) {
      toast.error(error.response?.data?.detail || t("error"));
    }
  };

  const canRaiseForExam = () => canManage() || isTeacher();

  const getHalaqaStudents = (halaqaId) =>
    allStudents.filter((student) =>
      (student.halaqa_ids || (student.halaqa_id ? [student.halaqa_id] : [])).includes(halaqaId),
    );

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

  const getHalaqaTypeName = (id) =>
    halaqaTypes.find((type) => type.id === id)?.name || "-";

  const getTeacherName = (ids) => {
    if (!ids || ids.length === 0) return "-";
    const names = ids
      .map((id) => teachers.find((teacher) => teacher.id === id)?.full_name)
      .filter(Boolean);
    return names.length ? names.join(", ") : "-";
  };

  const getStudentCount = (halaqaId) => getHalaqaStudents(halaqaId).length;

  const filteredHalaqas = halaqas.filter((h) =>
    h.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );

  return (
    <div className="space-y-6" data-testid="halaqas-page">
      <div className="page-hero rounded-lg p-5 md:p-7">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-white/85 text-primary ring-1 ring-primary/15">
              <BookOpen className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground md:text-4xl">
                {t("halaqas")}
              </h1>
              <p className="mt-1 text-base font-medium text-slate-600">
                {halaqas.length} {t("halaqas")}
              </p>
            </div>
          </div>
        {canManage() && (
          <Button
            onClick={() => navigate("/halaqas/new")}
            className="gap-2 bg-primary hover:bg-primary/90"
            data-testid="add-halaqa-btn"
          >
            <Plus className="h-4 w-4" />
            {t("addHalaqa")}
          </Button>
        )}
        </div>
      </div>

      <Card className="action-strip rounded-lg">
        <CardContent className="p-4 md:p-5">
          <div className="relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("search")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-12 ps-10"
              data-testid="search-halaqas-input"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredHalaqas.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="p-8 text-center text-muted-foreground">
              {t("noData")}
            </CardContent>
          </Card>
        ) : (
          filteredHalaqas.map((halaqa) => (
            <Card
              key={halaqa.id}
              className="task-tile card-hover"
              data-testid={`halaqa-card-${halaqa.id}`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                      <BookOpen className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{halaqa.name}</CardTitle>
                      <Badge variant="outline">{getHalaqaTypeName(halaqa.type_id)}</Badge>
                    </div>
                  </div>
                  {canManage() && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          data-testid={`halaqa-actions-${halaqa.id}`}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate(`/halaqas/${halaqa.id}/edit`)}>
                          <Edit className="h-4 w-4 me-2" />
                          {t("edit")}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedHalaqa(halaqa);
                            setDeleteDialogOpen(true);
                          }}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 me-2" />
                          {t("delete")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {t("gender")}:
                  </span>
                  <span>{halaqa.gender ? t(halaqa.gender) : "-"}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {t("attendanceMode")}:
                  </span>
                  <span>{halaqa.attendance_mode ? t(halaqa.attendance_mode) : "-"}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {t("assignedTeachers")}:
                  </span>
                  <span className="truncate">
                    {getTeacherName(halaqa.teacher_ids)}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {t("studentsCount")}:
                  </span>
                  <Badge variant="outline">{getStudentCount(halaqa.id)}</Badge>
                </div>
                {canRaiseForExam() && (
                  <div className="space-y-2 border-t pt-3">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full gap-2"
                      onClick={() => navigate(`/halaqas/${halaqa.id}`)}
                    >
                      <FileText className="h-4 w-4" />
                      {t("viewDetails")}
                    </Button>
                  </div>
                )}
                {(canManage() || isTeacher()) && (
                  <div className="space-y-2 border-t pt-3">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full gap-2"
                      onClick={() => navigate(`/halaqas/${halaqa.id}`)}
                    >
                      <UserX className="h-4 w-4" />
                      {t("attendance")}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedHalaqa ? t("editHalaqa") : t("addHalaqa")}
            </DialogTitle>
            <DialogDescription>
              {selectedHalaqa
                ? t("updateHalaqaInformation")
                : t("createStudyCircle")}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t("halaqaName")} *</Label>
              <Input
                id="name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                required
                data-testid="halaqa-name-input"
              />
            </div>
            <div className="space-y-2">
              <Label>{t("halaqaType")} *</Label>
              <SearchableSelect
                options={halaqaTypes}
                value={formTypeId}
                onChange={setFormTypeId}
                placeholder={t("selectHalaqaType")}
                searchPlaceholder={t("searchHalaqaTypes")}
                emptyLabel={t("noData")}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t("gender")} *</Label>
                <Select value={formGender} onValueChange={setFormGender}>
                  <SelectTrigger data-testid="halaqa-gender-select">
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
                <Select value={formAttendanceMode} onValueChange={setFormAttendanceMode}>
                  <SelectTrigger data-testid="halaqa-attendance-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="online">{t("online")}</SelectItem>
                    <SelectItem value="in_person">{t("inPerson")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t("assignedTeachers")}</Label>
              <SearchableMultiSelect
                options={teachers}
                selectedValues={formTeacherIds}
                onChange={setFormTeacherIds}
                placeholder={t("selectTeachers")}
                searchPlaceholder={t("searchTeachers")}
                emptyLabel={t("noData")}
                getOptionLabel={(teacher) => teacher.full_name}
              />
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
                data-testid="save-halaqa-btn"
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

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("confirm")}</DialogTitle>
            <DialogDescription>
              {t("deleteHalaqaConfirmation", { name: selectedHalaqa?.name })}
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
              data-testid="confirm-delete-halaqa-btn"
            >
              {t("delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Halaqas;
