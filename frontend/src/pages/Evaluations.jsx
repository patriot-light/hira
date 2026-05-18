import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import {
  errorTypesAPI,
  examEvaluationsAPI,
  studentsAPI,
  teachersAPI,
} from "../services/api";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
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
import { Textarea } from "../components/ui/textarea";
import {
  BookOpenCheck,
  ClipboardCheck,
  Loader2,
  MinusCircle,
  Plus,
  Save,
  Trash2,
  FileText,
} from "lucide-react";
import { toast } from "sonner";

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

const Evaluations = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { canEvaluate, isTeacher, isExamTeacher, user } = useAuth();
  const [evaluations, setEvaluations] = useState([]);
  const [errorTypes, setErrorTypes] = useState([]);
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [examOpen, setExamOpen] = useState(false);
  const [exam, setExam] = useState({
    student_id: "",
    teacher_id: "",
    from_juz: "1",
    to_juz: "1",
    errors: [],
    notes: "",
  });
  const examTeacherLocked = isExamTeacher();
  const teacherLocked = isTeacher() || examTeacherLocked;
  const openedFromStudentList = useRef(false);

  const fetchData = useCallback(async () => {
    try {
      const [examRes, errorRes, studentRes, teacherRes] = await Promise.all([
        examEvaluationsAPI.getAll(),
        errorTypesAPI.getAll(),
        studentsAPI.getAll(),
        teachersAPI.getAll(),
      ]);
      setEvaluations(examRes.data);
      setErrorTypes(errorRes.data);
      setStudents(studentRes.data);
      setTeachers(teacherRes.data);
    } catch (error) {
      toast.error(t("error"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalDeduction = useMemo(
    () => exam.errors.reduce((sum, error) => sum + Number(error.deduction || 0), 0),
    [exam.errors],
  );
  const loggedTeacher = useMemo(
    () => teachers.find((teacher) => teacher.user_id === user?.id),
    [teachers, user],
  );
  const liveScore = Math.max(0, 100 - totalDeduction);
  const liveResult = getResult(liveScore);

  const resetExam = () => {
    const firstRaisedStudent = examTeacherLocked ? students[0] : null;
    setExam({
      student_id: firstRaisedStudent?.id || "",
      teacher_id: teacherLocked && loggedTeacher ? loggedTeacher.id : "",
      from_juz: firstRaisedStudent?.exam_request?.from_juz?.toString() || "1",
      to_juz: firstRaisedStudent?.exam_request?.to_juz?.toString() || "1",
      errors: [],
      notes: "",
    });
  };

  useEffect(() => {
    if (teacherLocked && loggedTeacher) {
      setExam((current) => ({ ...current, teacher_id: loggedTeacher.id }));
    }
  }, [teacherLocked, loggedTeacher]);

  useEffect(() => {
    if (
      !examTeacherLocked ||
      openedFromStudentList.current ||
      loading ||
      searchParams.get("exam") !== "1"
    ) {
      return;
    }

    const studentId = searchParams.get("student_id");
    const selectedStudent = students.find((student) => student.id === studentId);
    if (!selectedStudent) return;

    openedFromStudentList.current = true;
    setExam({
      student_id: selectedStudent.id,
      teacher_id: loggedTeacher?.id || "",
      from_juz: selectedStudent.exam_request?.from_juz?.toString() || "1",
      to_juz: selectedStudent.exam_request?.to_juz?.toString() || "1",
      errors: [],
      notes: "",
    });
    setExamOpen(true);
  }, [examTeacherLocked, loading, loggedTeacher, searchParams, students]);

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

  const addError = (errorType) => {
    setExam((current) => ({
      ...current,
      errors: [
        ...current.errors,
        {
          error_type_id: errorType.id,
          name: errorType.name,
          deduction: Number(errorType.deduction),
          page_number: "",
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

    try {
      await examEvaluationsAPI.create({
        ...exam,
        from_juz: Number(exam.from_juz),
        to_juz: Number(exam.to_juz),
        teacher_id: exam.teacher_id || null,
      });
      toast.success(t("evaluationCreated"));
      setExamOpen(false);
      resetExam();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || t("error"));
    }
  };

  const handleDeleteExam = async (id) => {
    try {
      await examEvaluationsAPI.delete(id);
      toast.success(t("evaluationDeleted"));
      fetchData();
    } catch (error) {
      toast.error(t("error"));
    }
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
    <div className="space-y-6" data-testid="evaluations-page">
      <div className="page-hero rounded-lg p-5 md:p-7">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-white/80 text-primary ring-1 ring-primary/15">
              <ClipboardCheck className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground md:text-4xl">
                {t("evaluations")}
              </h1>
              <p className="mt-1 text-base font-medium text-slate-600">
                {evaluations.length} {t("savedExams")}
              </p>
            </div>
          </div>
        {canEvaluate() && (
          <Button
            onClick={() => {
              resetExam();
              setExamOpen(true);
            }}
            className="gap-2 bg-primary hover:bg-primary/90"
            data-testid="start-exam-btn"
          >
            <BookOpenCheck className="h-4 w-4" />
            {t("startExam")}
          </Button>
        )}
        </div>
      </div>

      <Card className="soft-panel overflow-hidden rounded-lg">
        <CardHeader className="border-b border-border/70">
          <CardTitle className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FileText className="h-5 w-5" />
            </span>
            {t("examResults")}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("studentName")}</TableHead>
                  <TableHead className="hidden md:table-cell">
                    {t("teacherName")}
                  </TableHead>
                  <TableHead>{t("range")}</TableHead>
                  <TableHead>{t("totalErrors")}</TableHead>
                  <TableHead>{t("finalScore")}</TableHead>
                  <TableHead>{t("result")}</TableHead>
                  <TableHead className="w-24">{t("actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {evaluations.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="py-8 text-center text-muted-foreground"
                    >
                      {t("noData")}
                    </TableCell>
                  </TableRow>
                ) : (
                  evaluations.map((evaluation) => (
                    <TableRow key={evaluation.id}>
                      <TableCell className="font-medium">
                        {getStudentName(evaluation.student_id)}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {getTeacherName(evaluation.teacher_id)}
                      </TableCell>
                      <TableCell>
                        {t("juz")} {evaluation.from_juz}-{evaluation.to_juz}
                      </TableCell>
                      <TableCell>
                        <Badge variant={evaluation.total_errors ? "destructive" : "outline"}>
                          {evaluation.total_errors}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getScoreColor(evaluation.final_score)}>
                          {evaluation.final_score}%
                        </Badge>
                      </TableCell>
                      <TableCell>{evaluation.result ? t(evaluation.result) : "-"}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(`/evaluations/${evaluation.id}`)}
                            data-testid={`view-evaluation-${evaluation.id}`}
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                          {canEvaluate() && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDeleteExam(evaluation.id)}
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

      <Dialog open={examOpen} onOpenChange={setExamOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-5xl">
          <DialogHeader>
            <DialogTitle>{t("newExam")}</DialogTitle>
            <DialogDescription>
              {t("newExamDescription")}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveExam} className="space-y-5">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2 md:col-span-2">
                <Label>{t("studentName")} *</Label>
                <Select
                  value={exam.student_id}
                  disabled={examTeacherLocked}
                  onValueChange={(value) =>
                    setExam((current) => ({ ...current, student_id: value }))
                  }
                >
                  <SelectTrigger data-testid="exam-student-select">
                    <SelectValue placeholder={t("selectStudent")} />
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
                <Label>{t("teacherName")}</Label>
                <Select
                  value={exam.teacher_id}
                  disabled={teacherLocked}
                  onValueChange={(value) =>
                    setExam((current) => ({ ...current, teacher_id: value }))
                  }
                >
                  <SelectTrigger data-testid="exam-teacher-select">
                    <SelectValue placeholder={t("selectTeacher")} />
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
                <Label>{t("fromJuz")}</Label>
                <Select
                  value={exam.from_juz}
                  disabled={examTeacherLocked}
                  onValueChange={(value) =>
                    setExam((current) => ({ ...current, from_juz: value }))
                  }
                >
                  <SelectTrigger data-testid="exam-from-juz-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 30 }, (_, index) => index + 1).map((juz) => (
                      <SelectItem key={juz} value={juz.toString()}>
                        {t("juz")} {juz}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("toJuz")}</Label>
                <Select
                  value={exam.to_juz}
                  disabled={examTeacherLocked}
                  onValueChange={(value) =>
                    setExam((current) => ({ ...current, to_juz: value }))
                  }
                >
                  <SelectTrigger data-testid="exam-to-juz-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 30 }, (_, index) => index + 1).map((juz) => (
                      <SelectItem key={juz} value={juz.toString()}>
                        {t("juz")} {juz}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
              <div className="space-y-3">
                <Label>{t("errorTable")}</Label>
                <div className="grid gap-3 sm:grid-cols-2">
                  {errorTypes.map((errorType) => (
                    <Button
                      key={errorType.id}
                      type="button"
                      variant="outline"
                      className="h-auto min-h-20 justify-between gap-3 whitespace-normal p-4 text-left"
                      onClick={() => addError(errorType)}
                      data-testid={`exam-error-${errorType.id}`}
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
                </div>
              </div>

              <div className="rounded-lg border border-primary/20 bg-primary/[0.07] p-4">
                <p className="text-sm text-muted-foreground">{t("finalScore")}</p>
                <p className="mt-1 text-5xl font-bold text-primary">{liveScore}%</p>
                <Badge className={`${getScoreColor(liveScore)} mt-3`}>
                  {t(liveResult)}
                </Badge>
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
              </div>
            </div>

            <div className="space-y-3">
              <Label>{t("recordedErrors")}</Label>
              {exam.errors.length === 0 ? (
                <div className="rounded-md border border-dashed p-5 text-center text-muted-foreground">
                  {t("noErrorsRecorded")}
                </div>
              ) : (
                <div className="grid gap-3">
                  {exam.errors.map((error, index) => (
                    <div
                      key={`${error.error_type_id || error.name}-${index}`}
                      className="rounded-md border p-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium">{error.name}</p>
                          <p className="text-sm text-muted-foreground">
                            -{error.deduction} {t("marks")}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeError(index)}
                          aria-label={`${t("remove")} ${error.name}`}
                        >
                          <MinusCircle className="h-5 w-5" />
                        </Button>
                      </div>
                      <div className="mt-3 grid gap-3 md:grid-cols-2">
                        <div className="space-y-1">
                          <Label>{t("page")}</Label>
                          <Input
                            type="number"
                            min="1"
                            max="604"
                            value={error.page_number}
                            onChange={(event) =>
                              updateError(index, "page_number", event.target.value)
                            }
                          />
                        </div>
                        <div className="space-y-1">
                          <Label>{t("word")}</Label>
                          <Input
                            value={error.word}
                            onChange={(event) =>
                              updateError(index, "word", event.target.value)
                            }
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>{t("notes")}</Label>
              <Textarea
                value={exam.notes}
                onChange={(event) =>
                  setExam((current) => ({ ...current, notes: event.target.value }))
                }
                placeholder={t("optionalNotes")}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setExamOpen(false)}>
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

export default Evaluations;
