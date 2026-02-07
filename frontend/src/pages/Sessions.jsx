import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { sessionsAPI, studentsAPI, teachersAPI } from "../services/api";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Plus, Mic2, Loader2, Trash2, FileText } from "lucide-react";
import { toast } from "sonner";
import { ERROR_CATEGORIES } from "@/constants/constants";

const Sessions = () => {
  const { t } = useTranslation();
  const { canEvaluate } = useAuth();
  const [errors, setErrors] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [studentId, setStudentId] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [duration, setDuration] = useState("");
  const [fromPage, setFromPage] = useState("");
  const [toPage, setToPage] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [s, st, tc] = await Promise.all([
        sessionsAPI.getAll(),
        studentsAPI.getAll(),
        teachersAPI.getAll(),
      ]);
      setSessions(s.data);
      setStudents(st.data);
      setTeachers(tc.data);
    } catch (error) {
      toast.error(t("error"));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await sessionsAPI.create({
        student_id: studentId,
        teacher_id: teacherId,
        duration_minutes: parseInt(duration),
        from_page: parseInt(fromPage),
        to_page: parseInt(toPage),
        errors: errors.map((e) => ({
          ...e,
          page_number: Number(e.page_number),
          penalty: Number(e.penalty),
        })),
      });
      toast.success(t("sessionCreated"));
      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || t("error"));
    }
  };

  const handleDelete = async (id) => {
    try {
      await sessionsAPI.delete(id);
      toast.success("Session deleted");
      fetchData();
    } catch (error) {
      toast.error(t("error"));
    }
  };

  const resetForm = () => {
    setStudentId("");
    setTeacherId("");
    setDuration("");
    setFromPage("");
    setToPage("");
    setErrors([]);
  };

  const addError = () => {
    setErrors([
      ...errors,
      {
        category: "",
        description: "",
        page_number: "",
        word: "",
        penalty: 1,
      },
    ]);
  };

  const updateError = (index, field, value) => {
    const updated = [...errors];
    updated[index][field] = value;
    setErrors(updated);
  };

  const removeError = (index) => {
    setErrors(errors.filter((_, i) => i !== index));
  };

  const getStudentName = (id) => {
    const s = students.find((x) => x.id === id);
    return s ? s.full_name : "-";
  };

  const getTeacherName = (id) => {
    const tc = teachers.find((x) => x.id === id);
    return tc ? tc.full_name : "-";
  };

  const getResultColor = (result) => {
    if (result === "excellent") return "bg-green-100 text-green-700";
    if (result === "very_good") return "bg-blue-100 text-blue-700";
    if (result === "good") return "bg-yellow-100 text-yellow-700";
    return "bg-red-100 text-red-700";
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );

  return (
    <div className="space-y-6" data-testid="sessions-page">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-3">
            <Mic2 className="h-8 w-8 text-primary" />
            {t("tasmee")} ({t("sessions")})
          </h1>
          <p className="text-muted-foreground mt-1">
            {sessions.length} {t("sessions")}
          </p>
        </div>
        {canEvaluate() && (
          <Button
            onClick={() => {
              resetForm();
              setDialogOpen(true);
            }}
            className="gap-2 bg-primary hover:bg-primary/90"
            data-testid="add-session-btn"
          >
            <Plus className="h-4 w-4" />
            {t("addSession")}
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("studentName")}</TableHead>
                  <TableHead className="hidden md:table-cell">
                    {t("teacherName")}
                  </TableHead>
                  <TableHead>{t("totalPages")}</TableHead>
                  <TableHead>{t("totalErrors")}</TableHead>
                  <TableHead>{t("finalScore")}</TableHead>
                  <TableHead>{t("result")}</TableHead>
                  <TableHead className="w-24">{t("actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-8 text-muted-foreground"
                    >
                      {t("noData")}
                    </TableCell>
                  </TableRow>
                ) : (
                  sessions.map((s) => (
                    <TableRow
                      key={s.id}
                      data-testid={`session-row-${s.id} text-center`}
                    >
                      <TableCell className="font-medium">
                        {getStudentName(s.student_id)}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {getTeacherName(s.teacher_id)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{s.total_pages}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            s.total_errors > 0 ? "destructive" : "outline"
                          }
                        >
                          {s.total_errors}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-bold text-primary">
                          {s.final_score?.toFixed(1)}%
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge className={getResultColor(s.result)}>
                          {t(s.result)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedSession(s);
                              setDetailsOpen(true);
                            }}
                            data-testid={`view-session-${s.id}`}
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                          {canEvaluate() && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(s.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("addSession")}</DialogTitle>
            <DialogDescription>Record a new Tasmee' session</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>{t("studentName")} *</Label>
              <Select value={studentId} onValueChange={setStudentId}>
                <SelectTrigger data-testid="session-student-select">
                  <SelectValue placeholder="Select student" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((st) => (
                    <SelectItem key={st.id} value={st.id}>
                      {st.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t("teacherName")} *</Label>
              <Select value={teacherId} onValueChange={setTeacherId}>
                <SelectTrigger data-testid="session-teacher-select">
                  <SelectValue placeholder="Select teacher" />
                </SelectTrigger>
                <SelectContent>
                  {teachers.map((tc) => (
                    <SelectItem key={tc.id} value={tc.id}>
                      {tc.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>{t("duration")} *</Label>
                <Input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  required
                  min="1"
                  data-testid="session-duration-input"
                />
              </div>
              <div className="space-y-2">
                <Label>{t("fromPage")} *</Label>
                <Input
                  type="number"
                  value={fromPage}
                  onChange={(e) => setFromPage(e.target.value)}
                  required
                  min="1"
                  max="604"
                  data-testid="session-from-page-input"
                />
              </div>
              <div className="space-y-2">
                <Label>{t("toPage")} *</Label>
                <Input
                  type="number"
                  value={toPage}
                  onChange={(e) => setToPage(e.target.value)}
                  required
                  min="1"
                  max="604"
                  data-testid="session-to-page-input"
                />
              </div>
            </div>
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <Label>Recitation Errors</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addError}
                >
                  + Add Error
                </Button>
              </div>

              {errors.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No errors recorded
                </p>
              )}

              {errors.map((err, index) => (
                <div
                  key={index}
                  className="rounded-lg border p-3 space-y-3 bg-muted/30"
                >
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>Category *</Label>
                      <Select
                        value={err.category}
                        onValueChange={(v) => updateError(index, "category", v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {ERROR_CATEGORIES.map((c) => (
                            <SelectItem key={c.value} value={c.value}>
                              {c.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label>Page *</Label>
                      <Input
                        type="number"
                        min="1"
                        max="604"
                        value={err.page_number}
                        onChange={(e) =>
                          updateError(
                            index,
                            "page_number",
                            Number(e.target.value),
                          )
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>Word</Label>
                      <Input
                        value={err.word}
                        onChange={(e) =>
                          updateError(index, "word", e.target.value)
                        }
                      />
                    </div>

                    <div className="space-y-1">
                      <Label>Penalty</Label>
                      <Input
                        type="number"
                        step="0.5"
                        min="0"
                        value={err.penalty}
                        onChange={(e) =>
                          updateError(index, "penalty", Number(e.target.value))
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label>Description</Label>
                    <Input
                      value={err.description}
                      onChange={(e) =>
                        updateError(index, "description", e.target.value)
                      }
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removeError(index)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
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
                data-testid="save-session-btn"
              >
                {t("save")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("sessionDetails")}</DialogTitle>
          </DialogHeader>
          {selectedSession && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    {t("studentName")}
                  </p>
                  <p className="font-medium">
                    {getStudentName(selectedSession.student_id)}
                  </p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    {t("teacherName")}
                  </p>
                  <p className="font-medium">
                    {getTeacherName(selectedSession.teacher_id)}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-muted rounded-lg text-center">
                  <p className="text-sm text-muted-foreground">
                    {t("duration")}
                  </p>
                  <p className="font-bold">
                    {selectedSession.duration_minutes} min
                  </p>
                </div>
                <div className="p-3 bg-muted rounded-lg text-center">
                  <p className="text-sm text-muted-foreground">
                    {t("totalPages")}
                  </p>
                  <p className="font-bold">{selectedSession.total_pages}</p>
                </div>
                <div className="p-3 bg-muted rounded-lg text-center">
                  <p className="text-sm text-muted-foreground">
                    {t("totalErrors")}
                  </p>
                  <p className="font-bold">{selectedSession.total_errors}</p>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {t("finalScore")}
                  </p>
                  <p className="text-3xl font-bold text-primary">
                    {selectedSession.final_score?.toFixed(1)}%
                  </p>
                </div>
                <Badge
                  className={`${getResultColor(selectedSession.result)} text-lg px-4 py-2`}
                >
                  {t(selectedSession.result)}
                </Badge>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Sessions;
