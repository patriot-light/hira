import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { errorTypesAPI, sessionsAPI, studentsAPI, teachersAPI } from "../services/api";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
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
import { FileText, Loader2, Mic2, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";

const resultLabel = {
  excellent: "Excellent",
  very_good: "Very Good",
  good: "Good",
  needs_review: "Needs Review",
};

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

const Sessions = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { canEvaluate, isTeacher, user } = useAuth();
  const [errors, setErrors] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [errorTypes, setErrorTypes] = useState([]);
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [studentId, setStudentId] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [duration, setDuration] = useState("");
  const [fromPage, setFromPage] = useState("");
  const [toPage, setToPage] = useState("");

  const teacherLocked = isTeacher();
  const loggedTeacher = useMemo(
    () => teachers.find((teacher) => teacher.user_id === user?.id),
    [teachers, user],
  );

  const fetchData = useCallback(async () => {
    try {
      const [sessionsRes, studentsRes, teachersRes, errorTypesRes] = await Promise.all([
        sessionsAPI.getAll(),
        studentsAPI.getAll(),
        teachersAPI.getAll(),
        errorTypesAPI.getAll(),
      ]);
      setSessions(sessionsRes.data);
      setStudents(studentsRes.data);
      setTeachers(teachersRes.data);
      setErrorTypes(errorTypesRes.data);
    } catch (error) {
      toast.error(t("error"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (teacherLocked && loggedTeacher) setTeacherId(loggedTeacher.id);
  }, [teacherLocked, loggedTeacher]);

  const totalPenalty = useMemo(
    () => errors.reduce((sum, error) => sum + Number(error.penalty || 0), 0),
    [errors],
  );
  const liveScore = Math.max(0, 100 - totalPenalty);
  const liveResult = getResult(liveScore);

  const resetForm = () => {
    setStudentId("");
    setTeacherId(teacherLocked && loggedTeacher ? loggedTeacher.id : "");
    setDuration("");
    setFromPage("");
    setToPage("");
    setErrors([]);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      await sessionsAPI.create({
        student_id: studentId,
        teacher_id: teacherId,
        duration_minutes: parseInt(duration),
        from_page: parseInt(fromPage),
        to_page: parseInt(toPage),
        errors: errors.map((error) => ({
          ...error,
          page_number: Number(error.page_number),
          penalty: Number(error.penalty),
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

  const addError = (errorType) => {
    setErrors((current) => [
      ...current,
      {
        error_type_id: errorType.id,
        category: errorType.name,
        description: errorType.description || errorType.name,
        name: errorType.name,
        page_number: fromPage || "",
        word: "",
        penalty: Number(errorType.deduction),
      },
    ]);
  };

  const updateError = (index, field, value) => {
    setErrors((current) =>
      current.map((error, errorIndex) =>
        errorIndex === index ? { ...error, [field]: value } : error,
      ),
    );
  };

  const removeError = (index) => {
    setErrors((current) => current.filter((_, errorIndex) => errorIndex !== index));
  };

  const getStudentName = (id) =>
    students.find((student) => student.id === id)?.full_name || "-";

  const getTeacherName = (id) =>
    teachers.find((teacher) => teacher.id === id)?.full_name || "-";

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="sessions-page">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
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
        <CardHeader>
          <CardTitle>Session Results</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("studentName")}</TableHead>
                  <TableHead className="hidden md:table-cell">{t("teacherName")}</TableHead>
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
                    <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                      {t("noData")}
                    </TableCell>
                  </TableRow>
                ) : (
                  sessions.map((session) => (
                    <TableRow key={session.id} data-testid={`session-row-${session.id}`}>
                      <TableCell className="font-medium">
                        {getStudentName(session.student_id)}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {getTeacherName(session.teacher_id)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{session.total_pages}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={session.total_errors ? "destructive" : "outline"}>
                          {session.total_errors}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getScoreColor(session.final_score)}>
                          {session.final_score?.toFixed(1)}%
                        </Badge>
                      </TableCell>
                      <TableCell>{resultLabel[session.result] || t(session.result)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(`/sessions/${session.id}`)}
                            data-testid={`view-session-${session.id}`}
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                          {canEvaluate() && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(session.id)}
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
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-5xl">
          <DialogHeader>
            <DialogTitle>{t("addSession")}</DialogTitle>
            <DialogDescription>Record a new Tasmee' session.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2 md:col-span-2">
                <Label>{t("studentName")} *</Label>
                <Select value={studentId} onValueChange={setStudentId}>
                  <SelectTrigger data-testid="session-student-select">
                    <SelectValue placeholder="Select student" />
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
              <div className="space-y-2 md:col-span-2">
                <Label>{t("teacherName")} *</Label>
                <Select
                  value={teacherId}
                  disabled={teacherLocked}
                  onValueChange={setTeacherId}
                >
                  <SelectTrigger data-testid="session-teacher-select">
                    <SelectValue placeholder="Select teacher" />
                  </SelectTrigger>
                  <SelectContent>
                    {teachers.map((teacher) => (
                      <SelectItem key={teacher.id} value={teacher.id}>
                        {teacher.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("duration")} *</Label>
                <Input
                  type="number"
                  value={duration}
                  onChange={(event) => setDuration(event.target.value)}
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
                  onChange={(event) => setFromPage(event.target.value)}
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
                  onChange={(event) => setToPage(event.target.value)}
                  required
                  min="1"
                  max="604"
                  data-testid="session-to-page-input"
                />
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
              <div className="space-y-3">
                <Label>Recitation Errors</Label>
                <div className="grid gap-3 sm:grid-cols-2">
                  {errorTypes.map((errorType) => (
                    <Button
                      key={errorType.id}
                      type="button"
                      variant="outline"
                      className="h-auto min-h-16 justify-between gap-3 whitespace-normal p-4 text-left"
                      onClick={() => addError(errorType)}
                    >
                      <span>
                        <span className="block font-semibold">{errorType.name}</span>
                        <span className="block text-sm text-muted-foreground">
                          -{errorType.deduction} marks
                        </span>
                      </span>
                      <Plus className="h-5 w-5 shrink-0" />
                    </Button>
                  ))}
                </div>
              </div>

              <div className="rounded-md border bg-muted/30 p-4">
                <p className="text-sm text-muted-foreground">{t("finalScore")}</p>
                <p className="mt-1 text-5xl font-bold text-primary">{liveScore}%</p>
                <Badge className={`${getScoreColor(liveScore)} mt-3`}>
                  {resultLabel[liveResult]}
                </Badge>
                <div className="mt-5 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{t("totalErrors")}</span>
                    <strong>{errors.length}</strong>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Total deduction</span>
                    <strong>{totalPenalty}</strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Label>Recorded Errors</Label>
              {errors.length === 0 ? (
                <div className="rounded-md border border-dashed p-5 text-center text-muted-foreground">
                  No errors recorded
                </div>
              ) : (
                <div className="grid gap-3">
                  {errors.map((error, index) => (
                    <div key={index} className="rounded-md border p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium">
                            {error.name || error.category}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Page {error.page_number || "-"} | -{error.penalty} mark
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeError(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="mt-3 grid gap-3 md:grid-cols-3">
                        <div className="space-y-1">
                          <Label>Page</Label>
                          <Input
                            type="number"
                            min="1"
                            max="604"
                            value={error.page_number}
                            onChange={(event) => updateError(index, "page_number", event.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label>{t("penalty")}</Label>
                          <Input
                            type="number"
                            step="0.5"
                            min="0"
                            value={error.penalty}
                            onChange={(event) => updateError(index, "penalty", event.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label>{t("word")}</Label>
                          <Input
                            value={error.word}
                            onChange={(event) => updateError(index, "word", event.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                {t("cancel")}
              </Button>
              <Button type="submit" className="gap-2 bg-primary hover:bg-primary/90">
                <Save className="h-4 w-4" />
                {t("save")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default Sessions;
