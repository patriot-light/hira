import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { ArrowLeft, ClipboardCheck, Loader2, Mic2, User } from "lucide-react";
import { examEvaluationsAPI, halaqasAPI, sessionsAPI, studentsAPI } from "../services/api";
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

const StudentDetails = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState(null);
  const [halaqas, setHalaqas] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [exams, setExams] = useState([]);
  const [attendance, setAttendance] = useState([]);

  const fetchData = useCallback(async () => {
    try {
      const [studentRes, halaqasRes, sessionsRes, examsRes, attendanceRes] = await Promise.all([
        studentsAPI.getOne(id),
        halaqasAPI.getAll(),
        sessionsAPI.getAll(id),
        examEvaluationsAPI.getAll(id),
        studentsAPI.getAttendance(id),
      ]);
      setStudent(studentRes.data);
      setHalaqas(halaqasRes.data);
      setSessions(sessionsRes.data);
      setExams(examsRes.data);
      setAttendance(attendanceRes.data);
    } catch (error) {
      toast.error(error.response?.data?.detail || t("error"));
    } finally {
      setLoading(false);
    }
  }, [id, t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getHalaqaNames = () => {
    const ids = student?.halaqa_ids || (student?.halaqa_id ? [student.halaqa_id] : []);
    const names = ids.map((halaqaId) => halaqas.find((halaqa) => halaqa.id === halaqaId)?.name).filter(Boolean);
    return names.length ? names.join(", ") : "-";
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!student) return <div className="text-muted-foreground">{t("noData")}</div>;

  return (
    <div className="space-y-6" data-testid="student-details-page">
      <div>
        <Button variant="ghost" className="mb-2 gap-2 px-0" onClick={() => navigate("/students")}>
          <ArrowLeft className="h-4 w-4" />
          {t("students")}
        </Button>
        <h1 className="flex items-center gap-3 text-2xl font-bold md:text-3xl">
          {student.photo ? (
            <img src={student.photo} alt={student.full_name} className="h-12 w-12 rounded-lg object-cover" />
          ) : (
            <User className="h-8 w-8 text-primary" />
          )}
          {student.full_name}
        </h1>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">{t("fatherName")}</p><p className="font-bold">{student.father_name || "-"}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">{t("motherName")}</p><p className="font-bold">{student.mother_name || "-"}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">{t("studentPhone")}</p><p className="font-bold">{student.phone || "-"}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">{t("address")}</p><p className="font-bold">{student.address || "-"}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">{t("halaqas")}</p><p className="font-bold">{getHalaqaNames()}</p></CardContent></Card>
      </div>

      <Card className="soft-panel rounded-lg">
        <CardHeader><CardTitle className="flex items-center gap-2"><Mic2 className="h-5 w-5 text-primary" />{t("sessions")}</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>{t("date")}</TableHead><TableHead>{t("pages")}</TableHead><TableHead>{t("finalScore")}</TableHead><TableHead>{t("result")}</TableHead></TableRow></TableHeader>
            <TableBody>
              {sessions.length ? sessions.map((session) => (
                <TableRow key={session.id}>
                  <TableCell>{session.date ? new Date(session.date).toLocaleString() : "-"}</TableCell>
                  <TableCell>{session.from_page}-{session.to_page}</TableCell>
                  <TableCell><Badge variant="outline">{session.final_score?.toFixed?.(1) || session.final_score}%</Badge></TableCell>
                  <TableCell>{session.result ? t(session.result) : "-"}</TableCell>
                </TableRow>
              )) : <TableRow><TableCell colSpan={4} className="py-8 text-center text-muted-foreground">{t("noData")}</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="soft-panel rounded-lg">
        <CardHeader><CardTitle className="flex items-center gap-2"><ClipboardCheck className="h-5 w-5 text-primary" />{t("evaluations")}</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>{t("date")}</TableHead><TableHead>{t("range")}</TableHead><TableHead>{t("finalScore")}</TableHead><TableHead>{t("result")}</TableHead></TableRow></TableHeader>
            <TableBody>
              {exams.length ? exams.map((exam) => (
                <TableRow key={exam.id}>
                  <TableCell>{exam.date ? new Date(exam.date).toLocaleString() : "-"}</TableCell>
                  <TableCell>{t("juz")} {exam.from_juz}-{exam.to_juz}</TableCell>
                  <TableCell><Badge variant="outline">{exam.final_score}%</Badge></TableCell>
                  <TableCell>{exam.result ? t(exam.result) : "-"}</TableCell>
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
            <TableHeader><TableRow><TableHead>{t("date")}</TableHead><TableHead>{t("status")}</TableHead><TableHead>{t("notes")}</TableHead></TableRow></TableHeader>
            <TableBody>
              {attendance.length ? attendance.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>{record.created_at ? new Date(record.created_at).toLocaleString() : record.day}</TableCell>
                  <TableCell><Badge variant="destructive">{t(record.reason || "absent_no_response")}</Badge></TableCell>
                  <TableCell>{record.notes || "-"}</TableCell>
                </TableRow>
              )) : <TableRow><TableCell colSpan={3} className="py-8 text-center text-muted-foreground">{t("noData")}</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentDetails;
