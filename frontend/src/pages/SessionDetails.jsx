import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { sessionsAPI, studentsAPI, teachersAPI } from "../services/api";
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
import { ArrowLeft, Loader2, Mic2 } from "lucide-react";
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

const SessionDetails = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [sessionRes, studentsRes, teachersRes] = await Promise.all([
        sessionsAPI.getOne(id),
        studentsAPI.getAll(),
        teachersAPI.getAll(),
      ]);
      setSession(sessionRes.data);
      setStudents(studentsRes.data);
      setTeachers(teachersRes.data);
    } catch (error) {
      toast.error(error.response?.data?.detail || t("error"));
    } finally {
      setLoading(false);
    }
  }, [id, t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getStudentName = (studentId) =>
    students.find((student) => student.id === studentId)?.full_name || "-";

  const getTeacherName = (teacherId) =>
    teachers.find((teacher) => teacher.id === teacherId)?.full_name || "-";

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

  if (!session) {
    return <div className="text-muted-foreground">{t("noData")}</div>;
  }

  return (
    <div className="space-y-6" data-testid="session-details-page">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <Button
            variant="ghost"
            className="mb-2 gap-2 px-0"
            onClick={() => navigate("/sessions")}>
            <ArrowLeft className="h-4 w-4" />
            Back to sessions
          </Button>
          <h1 className="flex items-center gap-3 text-2xl font-bold text-foreground md:text-3xl">
            <Mic2 className="h-8 w-8 text-primary" />
            Session Details
          </h1>
          <p className="mt-1 text-muted-foreground">
            Pages {session.from_page}-{session.to_page}
          </p>
        </div>
        <div className="rounded-md border bg-muted/30 p-4 text-left md:min-w-56">
          <p className="text-sm text-muted-foreground">{t("finalScore")}</p>
          <p className="mt-1 text-4xl font-bold text-primary">
            {typeof session.final_score === "number"
              ? `${session.final_score.toFixed(1)}%`
              : "-"}
          </p>
          <Badge className={`${getScoreColor(session.final_score || 0)} mt-3`}>
            {resultLabel[session.result] || session.result || "-"}
          </Badge>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {renderDetailBox(t("studentName"), getStudentName(session.student_id))}
        {renderDetailBox(t("teacherName"), getTeacherName(session.teacher_id))}
        {renderDetailBox("Pages", `${session.from_page}-${session.to_page}`)}
        {renderDetailBox(
          "Date",
          session.date ? new Date(session.date).toLocaleString() : "-",
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {renderDetailBox(t("duration"), `${session.duration_minutes} min`)}
        {renderDetailBox(t("totalPages"), session.total_pages)}
        {renderDetailBox(t("totalErrors"), session.total_errors)}
        {renderDetailBox("Total deduction", session.total_penalty)}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recorded Errors</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Error</TableHead>
                  <TableHead>Page</TableHead>
                  <TableHead>Word</TableHead>
                  <TableHead>Penalty</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Description
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {session.errors?.length ? (
                  session.errors.map((error, index) => (
                    <TableRow key={error.id || index}>
                      <TableCell className="font-medium">
                        {error.name || error.category}
                      </TableCell>
                      <TableCell>{error.page_number || "-"}</TableCell>
                      <TableCell>{error.word || "-"}</TableCell>
                      <TableCell>
                        <Badge variant="outline">-{error.penalty} marks</Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {error.description || "-"}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="py-8 text-center text-muted-foreground">
                      No errors recorded
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SessionDetails;
