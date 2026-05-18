import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { examEvaluationsAPI, studentsAPI, teachersAPI } from "../services/api";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { ArrowLeft, ClipboardCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";

const getScoreColor = (score = 0) => {
  if (score >= 90) return "bg-green-100 text-green-700";
  if (score >= 80) return "bg-blue-100 text-blue-700";
  if (score >= 70) return "bg-yellow-100 text-yellow-700";
  return "bg-red-100 text-red-700";
};

const EvaluationDetails = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();

  const [evaluation, setEvaluation] = useState(null);
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const [evaluationRes, studentsRes, teachersRes] = await Promise.all([
          examEvaluationsAPI.getOne(id),
          studentsAPI.getAll(),
          teachersAPI.getAll(),
        ]);

        setEvaluation(evaluationRes.data);
        setStudents(studentsRes.data || []);
        setTeachers(teachersRes.data || []);
      } catch (error) {
        toast.error(error.response?.data?.detail || t("error"));
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchData();
  }, [id, t]);

  const getStudentName = (studentId) => {
    return (
      students.find((student) => student.id === studentId)?.full_name || "-"
    );
  };

  const getTeacherName = (teacherId) => {
    return (
      teachers.find((teacher) => teacher.id === teacherId)?.full_name || "-"
    );
  };

  const renderDetailBox = (label, value) => (
    <div className="rounded-md border bg-muted/30 p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 font-semibold text-foreground">{value || "-"}</p>
    </div>
  );

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!evaluation) {
    return <div className="text-muted-foreground">{t("noData")}</div>;
  }

  return (
    <div className="space-y-6" data-testid="evaluation-details-page">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <Button
            variant="ghost"
            className="mb-2 gap-2 px-0"
            onClick={() => navigate("/evaluations")}>
            <ArrowLeft className="h-4 w-4" />
            {t("backToEvaluations")}
          </Button>

          <h1 className="flex items-center gap-3 text-2xl font-bold text-foreground md:text-3xl">
            <ClipboardCheck className="h-8 w-8 text-primary" />
            {t("evaluationDetails")}
          </h1>

          <p className="mt-1 text-muted-foreground">
            {t("juz")} {evaluation.from_juz}-{evaluation.to_juz}
          </p>
        </div>

        <div className="rounded-md border bg-muted/30 p-4 text-left md:min-w-56">
          <p className="text-sm text-muted-foreground">{t("finalScore")}</p>

          <p className="mt-1 text-4xl font-bold text-primary">
            {typeof evaluation.final_score === "number"
              ? `${evaluation.final_score.toFixed(1)}%`
              : "-"}
          </p>

          <Badge className={`${getScoreColor(evaluation.final_score)} mt-3`}>
            {evaluation.result ? t(evaluation.result) : "-"}
          </Badge>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {renderDetailBox(
          t("studentName"),
          getStudentName(evaluation.student_id),
        )}
        {renderDetailBox(
          t("teacherName"),
          getTeacherName(evaluation.teacher_id),
        )}
        {renderDetailBox(
          t("range"),
          `${t("juz")} ${evaluation.from_juz}-${evaluation.to_juz}`,
        )}
        {renderDetailBox(
          t("date"),
          evaluation.date ? new Date(evaluation.date).toLocaleString() : "-",
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {renderDetailBox(t("totalErrors"), evaluation.total_errors)}
        {renderDetailBox(t("totalDeduction"), evaluation.total_deduction)}
        {renderDetailBox(
          t("result"),
          evaluation.result ? t(evaluation.result) : "-",
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("recordedErrors")}</CardTitle>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("errorName")}</TableHead>
                  <TableHead>{t("page")}</TableHead>
                  <TableHead>{t("word")}</TableHead>
                  <TableHead>{t("deduction")}</TableHead>
                  <TableHead className="hidden md:table-cell">{t("note")}</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {evaluation.errors?.length ? (
                  evaluation.errors.map((item, index) => (
                    <TableRow key={item.id || index}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.page_number || "-"}</TableCell>
                      <TableCell>{item.word || "-"}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          -{item.deduction} {t("marks")}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {item.note || "-"}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="py-8 text-center text-muted-foreground">
                      {t("noErrorsRecorded")}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("notes")}</CardTitle>
        </CardHeader>

        <CardContent>
          <p className="whitespace-pre-wrap text-sm text-foreground">
            {evaluation.notes || "-"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default EvaluationDetails;
