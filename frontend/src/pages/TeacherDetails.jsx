import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  ArrowLeft,
  BookOpen,
  GraduationCap,
  Loader2,
  Mail,
} from "lucide-react";
import {
  halaqasAPI,
  sessionsAPI,
  studentsAPI,
  teachersAPI,
} from "../services/api";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { PhoneActions } from "../components/ui/phone-actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { halaqaLabel, studentHalaqaIds } from "../lib/halaqa";

const TeacherDetails = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [teacher, setTeacher] = useState(null);
  const [halaqas, setHalaqas] = useState([]);
  const [students, setStudents] = useState([]);
  const [sessions, setSessions] = useState([]);

  const fetchData = useCallback(async () => {
    try {
      const [teacherRes, halaqasRes, studentsRes, sessionsRes] =
        await Promise.all([
          teachersAPI.getOne(id),
          halaqasAPI.getAll(),
          studentsAPI.getAll(),
          sessionsAPI.getAll(),
        ]);
      setTeacher(teacherRes.data);
      setHalaqas(halaqasRes.data);
      setStudents(studentsRes.data);
      setSessions(sessionsRes.data);
    } catch (error) {
      toast.error(error.response?.data?.detail || t("error"));
    } finally {
      setLoading(false);
    }
  }, [id, t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const assignedHalaqas = useMemo(
    () => halaqas.filter((halaqa) => (halaqa.teacher_ids || []).includes(id)),
    [halaqas, id],
  );

  const assignedHalaqaIds = useMemo(
    () => new Set(assignedHalaqas.map((halaqa) => halaqa.id)),
    [assignedHalaqas],
  );
  const assignedStudents = students.filter((student) =>
    studentHalaqaIds(student).some((halaqaId) =>
      assignedHalaqaIds.has(halaqaId),
    ),
  );
  const teacherSessions = sessions.filter(
    (session) => session.teacher_id === id,
  );

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!teacher)
    return <div className="text-muted-foreground">{t("noData")}</div>;

  return (
    <div className="space-y-6" data-testid="teacher-details-page">
      <div className="page-hero rounded-lg p-5 md:p-7">
        <Button
          variant="ghost"
          className="mb-4 gap-2 bg-white/60 px-3"
          onClick={() => navigate("/teachers")}>
          <ArrowLeft className="h-4 w-4" />
          {t("teachers")}
        </Button>
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-white/85 text-primary ring-1 ring-primary/15">
            <GraduationCap className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground md:text-4xl">
              {teacher.full_name}
            </h1>
            <p className="mt-1 text-base font-medium text-slate-600">
              {teacher.qualification || "-"}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">{t("phone")}</p>
            <div className="font-bold">
              <PhoneActions phone={teacher.phone} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">{t("email")}</p>
            <p className="flex items-center gap-2 font-bold">
              <Mail className="h-4 w-4 text-primary" />
              {teacher.email || "-"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">
              {t("experienceYears")}
            </p>
            <p className="font-bold">
              {teacher.experience_years || 0} {t("years")}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">{t("halaqas")}</p>
            <p className="font-bold">{assignedHalaqas.length}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="soft-panel rounded-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            {t("halaqas")}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("halaqaName")}</TableHead>
                <TableHead>{t("studentsCount")}</TableHead>
                <TableHead>{t("attendanceMode")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignedHalaqas.length ? (
                assignedHalaqas.map((halaqa) => (
                  <TableRow key={halaqa.id}>
                    <TableCell>
                      <button
                        type="button"
                        className="font-semibold text-primary hover:underline"
                        onClick={() => navigate(`/halaqas/${halaqa.id}`)}>
                        {halaqaLabel(halaqa, t)}
                      </button>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {
                          students.filter((student) =>
                            studentHalaqaIds(student).includes(halaqa.id),
                          ).length
                        }
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {halaqa.attendance_mode ? t(halaqa.attendance_mode) : "-"}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="py-8 text-center text-muted-foreground">
                    {t("noData")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="soft-panel rounded-lg">
        <CardHeader>
          <CardTitle>{t("students")}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("studentName")}</TableHead>
                <TableHead>{t("phone")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignedStudents.length ? (
                assignedStudents.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell>
                      <button
                        type="button"
                        className="font-semibold text-primary hover:underline"
                        onClick={() => navigate(`/students/${student.id}`)}>
                        {student.full_name}
                      </button>
                    </TableCell>
                    <TableCell>
                      <PhoneActions
                        phone={
                          student.phone ||
                          student.parent_phone ||
                          student.father_phone ||
                          student.mother_phone
                        }
                      />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={2}
                    className="py-8 text-center text-muted-foreground">
                    {t("noData")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="soft-panel rounded-lg">
        <CardHeader>
          <CardTitle>{t("sessions")}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("date")}</TableHead>
                <TableHead>{t("studentName")}</TableHead>
                <TableHead>{t("finalScore")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teacherSessions.length ? (
                teacherSessions.map((session) => {
                  const student = students.find(
                    (item) => item.id === session.student_id,
                  );
                  return (
                    <TableRow key={session.id}>
                      <TableCell>
                        {session.date
                          ? new Date(session.date).toLocaleString()
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {student ? (
                          <button
                            type="button"
                            className="font-medium text-primary hover:underline"
                            onClick={() => navigate(`/students/${student.id}`)}>
                            {student.full_name}
                          </button>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {session.final_score?.toFixed?.(1) ||
                            session.final_score}
                          %
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="py-8 text-center text-muted-foreground">
                    {t("noData")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default TeacherDetails;
