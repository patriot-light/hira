import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  reportsAPI,
  studentsAPI,
  halaqasAPI,
  teachersAPI,
  exportAPI,
} from "@/services/api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  BarChart3,
  Users,
  BookOpen,
  GraduationCap,
  Download,
  FileText,
  Loader2,
  TrendingUp,
  Award,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { toast } from "sonner";
import { halaqaLabel } from "@/lib/halaqa";

const COLORS = [
  "#12a89d",
  "#2ab572",
  "#d97706",
  "#ef4444",
  "#3b82f6",
  "#8b5cf6",
];

const Reports = () => {
  const { t } = useTranslation();
  const [students, setStudents] = useState([]);
  const [halaqas, setHalaqas] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [selectedHalaqa, setSelectedHalaqa] = useState("");
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [studentReport, setStudentReport] = useState(null);
  const [halaqaReport, setHalaqaReport] = useState(null);
  const [teacherReport, setTeacherReport] = useState(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [studentsRes, halaqasRes, teachersRes] = await Promise.all([
        studentsAPI.getAll(),
        halaqasAPI.getAll(),
        teachersAPI.getAll(),
      ]);
      setStudents(studentsRes.data);
      setHalaqas(halaqasRes.data);
      setTeachers(teachersRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentReport = async (studentId) => {
    try {
      const response = await reportsAPI.getStudentReport(studentId);
      setStudentReport(response.data);
    } catch (error) {
      toast.error(t("error"));
    }
  };

  const fetchHalaqaReport = async (halaqaId) => {
    try {
      const response = await reportsAPI.getHalaqaReport(halaqaId);
      setHalaqaReport(response.data);
    } catch (error) {
      toast.error(t("error"));
    }
  };

  const fetchTeacherReport = async (teacherId) => {
    try {
      const response = await reportsAPI.getTeacherReport(teacherId);
      setTeacherReport(response.data);
    } catch (error) {
      toast.error(t("error"));
    }
  };

  const handleStudentSelect = (value) => {
    setSelectedStudent(value);
    if (value) {
      fetchStudentReport(value);
    } else {
      setStudentReport(null);
    }
  };

  const handleHalaqaSelect = (value) => {
    setSelectedHalaqa(value);
    if (value) {
      fetchHalaqaReport(value);
    } else {
      setHalaqaReport(null);
    }
  };

  const handleTeacherSelect = (value) => {
    setSelectedTeacher(value);
    if (value) {
      fetchTeacherReport(value);
    } else {
      setTeacherReport(null);
    }
  };

  const exportStudentPdf = async () => {
    if (!selectedStudent) return;
    try {
      const response = await exportAPI.studentReportPdf(selectedStudent);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `student_report_${selectedStudent}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success(t("success"));
    } catch (error) {
      toast.error(t("error"));
    }
  };

  const getResultColor = (result) => {
    switch (result) {
      case "excellent":
        return "bg-green-100 text-green-700";
      case "very_good":
        return "bg-blue-100 text-blue-700";
      case "good":
        return "bg-yellow-100 text-yellow-700";
      case "needs_review":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="reports-page">
      {/* Header */}
      <div className="page-hero rounded-lg p-5 md:p-7">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-white/85 text-primary ring-1 ring-primary/15">
            <BarChart3 className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground md:text-4xl">
              {t("reports")}
            </h1>
            <p className="mt-1 text-base font-medium text-slate-600">
              {t("reportsDescription")}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="student" className="w-full">
        <TabsList className="grid h-auto w-full max-w-2xl grid-cols-1 gap-2 bg-transparent p-0 sm:grid-cols-3">
          <TabsTrigger value="student" className="gap-2">
            <Users className="h-4 w-4" />
            {t("studentReport")}
          </TabsTrigger>
          <TabsTrigger value="halaqa" className="gap-2">
            <BookOpen className="h-4 w-4" />
            {t("halaqaReport")}
          </TabsTrigger>
          <TabsTrigger value="teacher" className="gap-2">
            <GraduationCap className="h-4 w-4" />
            {t("teacherReport")}
          </TabsTrigger>
        </TabsList>

        {/* Student Report Tab */}
        <TabsContent value="student" className="mt-6 space-y-6">
          <Card className="action-strip rounded-lg">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{t("studentReport")}</CardTitle>
              {studentReport && (
                <Button
                  variant="outline"
                  onClick={exportStudentPdf}
                  className="gap-2 bg-white/85">
                  <Download className="h-4 w-4" />
                  {t("exportPdf")}
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <Select
                value={selectedStudent}
                onValueChange={handleStudentSelect}>
                <SelectTrigger
                  className="max-w-md"
                  data-testid="student-report-select">
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
            </CardContent>
          </Card>

          {studentReport && (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="task-tile card-hover">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-primary/10">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">
                          {studentReport.total_sessions}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {t("totalSessions")}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="task-tile card-hover">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-secondary/10">
                        <BookOpen className="h-5 w-5 text-secondary" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">
                          {studentReport.total_pages_read}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {t("totalPages")}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="task-tile card-hover">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-accent/10">
                        <TrendingUp className="h-5 w-5 text-accent" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">
                          {studentReport.average_session_score}%
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {t("averageScore")}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="task-tile card-hover">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-blue-100">
                        <Award className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">
                          {studentReport.completed_juz?.length || 0}/30
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {t("juzCompleted")}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Progress */}
              <Card className="soft-panel">
                <CardHeader>
                  <CardTitle>{t("memorization_progress")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>
                        {studentReport.memorization_progress}% {t("complete")}
                      </span>
                      <span>
                        {studentReport.completed_juz?.length || 0} {t("of")} 30{" "}
                        {t("juz")}
                      </span>
                    </div>
                    <Progress
                      value={studentReport.memorization_progress}
                      className="h-3"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Error Breakdown */}
              {Object.keys(studentReport.error_breakdown || {}).length > 0 && (
                <Card className="soft-panel">
                  <CardHeader>
                    <CardTitle>{t("errorBreakdown")}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={Object.entries(
                              studentReport.error_breakdown,
                            ).map(([key, value]) => ({
                              name: t(key),
                              value,
                            }))}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                            label={({ name, value }) => `${name}: ${value}`}>
                            {Object.keys(studentReport.error_breakdown).map(
                              (_, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={COLORS[index % COLORS.length]}
                                />
                              ),
                            )}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        {/* Halaqa Report Tab */}
        <TabsContent value="halaqa" className="mt-6 space-y-6">
          <Card className="action-strip rounded-lg">
            <CardHeader>
              <CardTitle>{t("halaqaReport")}</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedHalaqa} onValueChange={handleHalaqaSelect}>
                <SelectTrigger
                  className="max-w-md"
                  data-testid="halaqa-report-select">
                  <SelectValue placeholder={t("selectHalaqa")} />
                </SelectTrigger>
                <SelectContent>
                  {halaqas.map((halaqa) => (
                    <SelectItem key={halaqa.id} value={halaqa.id}>
                      {halaqaLabel(halaqa, t)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {halaqaReport && (
            <>
              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="task-tile card-hover">
                  <CardContent className="p-4 text-center">
                    <p className="text-3xl font-bold text-primary">
                      {halaqaReport.total_students}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {t("students")}
                    </p>
                  </CardContent>
                </Card>
                <Card className="task-tile card-hover">
                  <CardContent className="p-4 text-center">
                    <p className="text-3xl font-bold text-secondary">
                      {halaqaReport.total_sessions}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {t("totalSessions")}
                    </p>
                  </CardContent>
                </Card>
                <Card className="task-tile card-hover">
                  <CardContent className="p-4 text-center">
                    <p className="text-3xl font-bold text-accent">
                      {halaqaReport.average_session_score}%
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {t("avgSessionScore")}
                    </p>
                  </CardContent>
                </Card>
                <Card className="task-tile card-hover">
                  <CardContent className="p-4 text-center">
                    <p className="text-3xl font-bold text-blue-600">
                      {halaqaReport.average_page_score}%
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {t("avgPageScore")}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Student Performance Chart */}
              {halaqaReport.student_performance &&
                halaqaReport.student_performance.length > 0 && (
                  <Card className="soft-panel">
                    <CardHeader>
                      <CardTitle>{t("studentPerformanceComparison")}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={halaqaReport.student_performance}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                              dataKey="student_name"
                              tick={{ fontSize: 12 }}
                            />
                            <YAxis />
                            <Tooltip />
                            <Bar
                              dataKey="average_score"
                              fill="#12a89d"
                              radius={[4, 4, 0, 0]}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                )}
            </>
          )}
        </TabsContent>

        {/* Teacher Report Tab */}
        <TabsContent value="teacher" className="mt-6 space-y-6">
          <Card className="action-strip rounded-lg">
            <CardHeader>
              <CardTitle>{t("teacherReport")}</CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={selectedTeacher}
                onValueChange={handleTeacherSelect}>
                <SelectTrigger
                  className="max-w-md"
                  data-testid="teacher-report-select">
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
            </CardContent>
          </Card>

          {teacherReport && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="task-tile card-hover">
                <CardContent className="p-6 text-center">
                  <BookOpen className="h-8 w-8 text-primary mx-auto mb-2" />
                  <p className="text-3xl font-bold">
                    {teacherReport.total_halaqas}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t("halaqas")}
                  </p>
                </CardContent>
              </Card>
              <Card className="task-tile card-hover">
                <CardContent className="p-6 text-center">
                  <Users className="h-8 w-8 text-secondary mx-auto mb-2" />
                  <p className="text-3xl font-bold">
                    {teacherReport.total_students}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t("students")}
                  </p>
                </CardContent>
              </Card>
              <Card className="task-tile card-hover">
                <CardContent className="p-6 text-center">
                  <FileText className="h-8 w-8 text-accent mx-auto mb-2" />
                  <p className="text-3xl font-bold">
                    {teacherReport.total_sessions}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t("totalSessions")}
                  </p>
                </CardContent>
              </Card>
              <Card className="task-tile card-hover">
                <CardContent className="p-6 text-center">
                  <TrendingUp className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-3xl font-bold">
                    {teacherReport.average_student_score}%
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t("avgStudentScore")}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reports;
