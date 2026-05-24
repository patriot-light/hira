import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
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
import { FileText, Loader2, Mic2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

const getScoreColor = (score) => {
  if (score >= 90) return "bg-green-100 text-green-700";
  if (score >= 80) return "bg-blue-100 text-blue-700";
  if (score >= 70) return "bg-yellow-100 text-yellow-700";
  return "bg-red-100 text-red-700";
};

const Sessions = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { canEvaluate } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [sessionsRes, studentsRes, teachersRes] =
        await Promise.all([
          sessionsAPI.getAll(),
          studentsAPI.getAll(),
          teachersAPI.getAll(),
        ]);
      setSessions(sessionsRes.data);
      setStudents(studentsRes.data);
      setTeachers(teachersRes.data);
    } catch (error) {
      toast.error(t("error"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async (id) => {
    try {
      await sessionsAPI.delete(id);
      toast.success(t("sessionDeleted"));
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
    <div className="space-y-6" data-testid="sessions-page">
      <div className="page-hero rounded-lg p-5 md:p-7">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-white/85 text-primary ring-1 ring-primary/15">
              <Mic2 className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground md:text-4xl">
                {t("tasmee")} ({t("sessions")})
              </h1>
              <p className="mt-1 text-base font-medium text-slate-600">
                {sessions.length} {t("sessions")}
              </p>
            </div>
          </div>
        {canEvaluate() && (
          <Button
            onClick={() => navigate("/sessions/new")}
            className="gap-2 bg-primary hover:bg-primary/90"
            data-testid="add-session-btn">
            <Plus className="h-4 w-4" />
            {t("addSession")}
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
            {t("sessionResults")}
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
                  <TableHead>{t("totalPages")}</TableHead>
                  <TableHead>{t("pageRatings")}</TableHead>
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
                      className="py-8 text-center text-muted-foreground">
                      {t("noData")}
                    </TableCell>
                  </TableRow>
                ) : (
                  sessions.map((session) => (
                    <TableRow
                      key={session.id}
                      data-testid={`session-row-${session.id}`}>
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
                        <Badge variant="outline">{session.page_ratings?.length || 0}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getScoreColor(session.final_score)}>
                          {session.final_score?.toFixed(1)}%
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {session.result ? t(session.result) : "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(`/sessions/${session.id}`)}
                            data-testid={`view-session-${session.id}`}>
                            <FileText className="h-4 w-4" />
                          </Button>
                          {canEvaluate() && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(session.id)}
                              className="text-destructive hover:text-destructive">
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

    </div>
  );
};

export default Sessions;
