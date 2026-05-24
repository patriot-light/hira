import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { ArrowLeft, BookOpen, Loader2, UserX } from "lucide-react";
import { halaqasAPI, halaqaTypesAPI, sessionsAPI, studentsAPI, teachersAPI } from "../services/api";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";

const HalaqaDetails = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [halaqa, setHalaqa] = useState(null);
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [types, setTypes] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [attendance, setAttendance] = useState([]);

  const fetchData = useCallback(async () => {
    try {
      const [halaqaRes, studentsRes, teachersRes, typesRes, sessionsRes, attendanceRes] = await Promise.all([
        halaqasAPI.getOne(id),
        halaqasAPI.getStudents(id),
        teachersAPI.getAll(),
        halaqaTypesAPI.getAll(),
        sessionsAPI.getAll(),
        halaqasAPI.getAttendance(id).catch(() => ({ data: [] })),
      ]);
      setHalaqa(halaqaRes.data);
      setStudents(studentsRes.data);
      setTeachers(teachersRes.data);
      setTypes(typesRes.data);
      setAttendance(attendanceRes.data);
      const studentIds = new Set(studentsRes.data.map((student) => student.id));
      setSessions(sessionsRes.data.filter((session) => studentIds.has(session.student_id)));
    } catch (error) {
      toast.error(error.response?.data?.detail || t("error"));
    } finally {
      setLoading(false);
    }
  }, [id, t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const teacherNames = useMemo(() => {
    if (!halaqa?.teacher_ids?.length) return "-";
    return halaqa.teacher_ids.map((teacherId) => teachers.find((teacher) => teacher.id === teacherId)?.full_name).filter(Boolean).join(", ") || "-";
  }, [halaqa, teachers]);

  const typeName = types.find((type) => type.id === halaqa?.type_id)?.name || "-";

  const markAbsent = async (student) => {
    try {
      await halaqasAPI.markAbsent(id, student.id, { reason: "absent_no_response" });
      toast.success(t("absenceRecorded"));
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || t("error"));
    }
  };

  const studentName = (studentId) => students.find((student) => student.id === studentId)?.full_name || "-";

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!halaqa) return <div className="text-muted-foreground">{t("noData")}</div>;

  return (
    <div className="space-y-6" data-testid="halaqa-details-page">
      <div>
        <Button variant="ghost" className="mb-2 gap-2 px-0" onClick={() => navigate("/halaqas")}>
          <ArrowLeft className="h-4 w-4" />
          {t("halaqas")}
        </Button>
        <h1 className="flex items-center gap-3 text-2xl font-bold md:text-3xl">
          <BookOpen className="h-8 w-8 text-primary" />
          {halaqa.name}
        </h1>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">{t("halaqaType")}</p><p className="font-bold">{typeName}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">{t("gender")}</p><p className="font-bold">{halaqa.gender ? t(halaqa.gender) : "-"}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">{t("attendanceMode")}</p><p className="font-bold">{halaqa.attendance_mode ? t(halaqa.attendance_mode) : "-"}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">{t("assignedTeachers")}</p><p className="font-bold">{teacherNames}</p></CardContent></Card>
      </div>

      <Card className="soft-panel rounded-lg">
        <CardHeader><CardTitle>{t("students")}</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>{t("studentName")}</TableHead><TableHead>{t("phone")}</TableHead><TableHead>{t("actions")}</TableHead></TableRow></TableHeader>
            <TableBody>
              {students.length ? students.map((student) => (
                <TableRow key={student.id}>
                  <TableCell>
                    <button type="button" className="font-semibold text-primary hover:underline" onClick={() => navigate(`/students/${student.id}`)}>
                      {student.full_name}
                    </button>
                  </TableCell>
                  <TableCell>{student.phone || student.parent_phone || "-"}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" className="gap-2 text-destructive hover:text-destructive" onClick={() => markAbsent(student)}>
                      <UserX className="h-4 w-4" />
                      {t("markAbsent")}
                    </Button>
                  </TableCell>
                </TableRow>
              )) : <TableRow><TableCell colSpan={3} className="py-8 text-center text-muted-foreground">{t("noData")}</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="soft-panel rounded-lg">
        <CardHeader><CardTitle>{t("sessions")}</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>{t("studentName")}</TableHead><TableHead>{t("date")}</TableHead><TableHead>{t("pages")}</TableHead><TableHead>{t("finalScore")}</TableHead></TableRow></TableHeader>
            <TableBody>
              {sessions.length ? sessions.map((session) => (
                <TableRow key={session.id}>
                  <TableCell>{studentName(session.student_id)}</TableCell>
                  <TableCell>{session.date ? new Date(session.date).toLocaleString() : "-"}</TableCell>
                  <TableCell>{session.from_page}-{session.to_page}</TableCell>
                  <TableCell><Badge variant="outline">{session.final_score?.toFixed?.(1) || session.final_score}%</Badge></TableCell>
                </TableRow>
              )) : <TableRow><TableCell colSpan={4} className="py-8 text-center text-muted-foreground">{t("noData")}</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="soft-panel rounded-lg">
        <CardHeader><CardTitle>{t("attendance")}</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>{t("studentName")}</TableHead><TableHead>{t("date")}</TableHead><TableHead>{t("status")}</TableHead></TableRow></TableHeader>
            <TableBody>
              {attendance.length ? attendance.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>{studentName(record.student_id)}</TableCell>
                  <TableCell>{record.created_at ? new Date(record.created_at).toLocaleString() : record.day}</TableCell>
                  <TableCell><Badge variant="destructive">{t(record.reason || "absent_no_response")}</Badge></TableCell>
                </TableRow>
              )) : <TableRow><TableCell colSpan={3} className="py-8 text-center text-muted-foreground">{t("noData")}</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default HalaqaDetails;
