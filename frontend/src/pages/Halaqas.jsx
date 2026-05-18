import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { halaqasAPI, teachersAPI, studentsAPI } from "../services/api";
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
} from "lucide-react";
import { toast } from "sonner";

const Halaqas = () => {
  const { t } = useTranslation();
  const { canManage, isTeacher } = useAuth();
  const [halaqas, setHalaqas] = useState([]);
  const [teachers, setTeachers] = useState([]);
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
  const [formLevel, setFormLevel] = useState("beginner");
  const [formTeacherIds, setFormTeacherIds] = useState([]);

  const fetchData = useCallback(async () => {
    try {
      const [h, tc, st] = await Promise.all([
        halaqasAPI.getAll(),
        teachersAPI.getAll(),
        studentsAPI.getAll(),
      ]);
      setHalaqas(h.data);
      setTeachers(tc.data);
      setAllStudents(st.data);
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
    try {
      const data = {
        name: formName,
        level: formLevel,
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
    setFormLevel(halaqa.level);
    setFormTeacherIds(halaqa.teacher_ids || []);
    setDialogOpen(true);
  };

  const resetForm = () => {
    setSelectedHalaqa(null);
    setFormName("");
    setFormLevel("beginner");
    setFormTeacherIds([]);
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

  const getLevelColor = (level) => {
    if (level === "beginner") return "bg-blue-100 text-blue-700";
    if (level === "intermediate") return "bg-yellow-100 text-yellow-700";
    if (level === "advanced") return "bg-green-100 text-green-700";
    return "bg-gray-100 text-gray-700";
  };

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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-primary" />
            {t("halaqas")}
          </h1>
          <p className="text-muted-foreground mt-1">
            {halaqas.length} {t("halaqas")}
          </p>
        </div>
        {canManage() && (
          <Button
            onClick={() => {
              resetForm();
              setDialogOpen(true);
            }}
            className="gap-2 bg-primary hover:bg-primary/90"
            data-testid="add-halaqa-btn"
          >
            <Plus className="h-4 w-4" />
            {t("addHalaqa")}
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("search")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="ps-10"
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
              className="card-hover"
              data-testid={`halaqa-card-${halaqa.id}`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                      <BookOpen className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{halaqa.name}</CardTitle>
                      <Badge className={getLevelColor(halaqa.level)}>
                        {t(halaqa.level)}
                      </Badge>
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
                        <DropdownMenuItem onClick={() => handleEdit(halaqa)}>
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
                    {getHalaqaStudents(halaqa.id).slice(0, 4).map((student) => (
                      <div
                        key={student.id}
                        className="flex items-center justify-between gap-2 rounded-md bg-muted/40 px-2 py-1.5 text-sm"
                      >
                        <span className="truncate">{student.full_name}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 gap-1 px-2"
                          onClick={() => openExamDialog(student)}
                        >
                          <FileText className="h-3.5 w-3.5" />
                          {t("raise")}
                        </Button>
                      </div>
                    ))}
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
              <Label>{t("level")} *</Label>
              <Select value={formLevel} onValueChange={setFormLevel}>
                <SelectTrigger data-testid="halaqa-level-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">{t("beginner")}</SelectItem>
                  <SelectItem value="intermediate">
                    {t("intermediate")}
                  </SelectItem>
                  <SelectItem value="advanced">{t("advanced")}</SelectItem>
                </SelectContent>
              </Select>
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
