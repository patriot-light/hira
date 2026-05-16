import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
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

const Evaluations = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { canEvaluate, isTeacher, user } = useAuth();
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
  const teacherLocked = isTeacher();

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
    setExam({
      student_id: "",
      teacher_id: teacherLocked && loggedTeacher ? loggedTeacher.id : "",
      from_juz: "1",
      to_juz: "1",
      errors: [],
      notes: "",
    });
  };

  useEffect(() => {
    if (teacherLocked && loggedTeacher) {
      setExam((current) => ({ ...current, teacher_id: loggedTeacher.id }));
    }
  }, [teacherLocked, loggedTeacher]);

  const addError = (errorType) => {
    setExam((current) => ({
      ...current,
      errors: [
        ...current.errors,
        {
          error_type_id: errorType.id,
          name: errorType.name,
          deduction: Number(errorType.deduction),
          note: "",
        },
      ],
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
      toast.error("Please select a student");
      return;
    }
    if (Number(exam.from_juz) > Number(exam.to_juz)) {
      toast.error("The starting Juz must be before the ending Juz");
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
      toast.success("Evaluation deleted");
      fetchData();
    } catch (error) {
      toast.error(t("error"));
    }
  };

  const getStudentName = (id) =>
    students.find((student) => student.id === id)?.full_name || "-";

  const getTeacherName = (id) =>
    teachers.find((teacher) => teacher.id === id)?.full_name || "-";

  const groupedErrors = exam.errors.reduce((groups, error, index) => {
    const key = error.error_type_id || error.name;
    if (!groups[key]) groups[key] = { ...error, count: 0, indexes: [] };
    groups[key].count += 1;
    groups[key].indexes.push(index);
    return groups;
  }, {});

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="evaluations-page">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-3">
            <ClipboardCheck className="h-8 w-8 text-primary" />
            {t("evaluations")}
          </h1>
          <p className="text-muted-foreground mt-1">
            {evaluations.length} saved exams
          </p>
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
            Start Exam
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Exam Results</CardTitle>
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
                  <TableHead>Range</TableHead>
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
                        Juz {evaluation.from_juz}-{evaluation.to_juz}
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
                      <TableCell>{resultLabel[evaluation.result]}</TableCell>
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
            <DialogTitle>New Exam</DialogTitle>
            <DialogDescription>
              Select the range, tap each error, then save the final grade.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveExam} className="space-y-5">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2 md:col-span-2">
                <Label>{t("studentName")} *</Label>
                <Select
                  value={exam.student_id}
                  onValueChange={(value) =>
                    setExam((current) => ({ ...current, student_id: value }))
                  }
                >
                  <SelectTrigger data-testid="exam-student-select">
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
                <Label>{t("teacherName")}</Label>
                <Select
                  value={exam.teacher_id}
                  disabled={teacherLocked}
                  onValueChange={(value) =>
                    setExam((current) => ({ ...current, teacher_id: value }))
                  }
                >
                  <SelectTrigger data-testid="exam-teacher-select">
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
                <Label>From Juz</Label>
                <Select
                  value={exam.from_juz}
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
                        Juz {juz}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>To Juz</Label>
                <Select
                  value={exam.to_juz}
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
                        Juz {juz}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
              <div className="space-y-3">
                <Label>Error Table</Label>
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
                    <strong>{exam.errors.length}</strong>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Total deduction</span>
                    <strong>{totalDeduction}</strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Label>Recorded Errors</Label>
              {exam.errors.length === 0 ? (
                <div className="rounded-md border border-dashed p-5 text-center text-muted-foreground">
                  No errors recorded
                </div>
              ) : (
                <div className="grid gap-2">
                  {Object.values(groupedErrors).map((error) => (
                    <div
                      key={error.error_type_id || error.name}
                      className="flex items-center justify-between gap-3 rounded-md border p-3"
                    >
                      <div>
                        <p className="font-medium">{error.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {error.count} x -{error.deduction} marks
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeError(error.indexes[error.indexes.length - 1])}
                        aria-label={`Remove ${error.name}`}
                      >
                        <MinusCircle className="h-5 w-5" />
                      </Button>
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
                placeholder="Optional notes"
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
