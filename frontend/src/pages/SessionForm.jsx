import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { sessionsAPI, studentsAPI, teachersAPI } from "../services/api";
import {
  JUZ_OPTIONS,
  SESSION_PAGE_RATINGS,
  getJuzPageRange,
  getJuzPages,
  getPagesInRange,
} from "../constants/quran";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { SearchableSelect } from "../components/ui/searchable-select";
import { ArrowLeft, Loader2, MinusCircle, Phone, Save, MessageCircle } from "lucide-react";
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

const formatElapsedTime = (totalSeconds) => {
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
};

const normalizePhone = (phone) => (phone || "").replace(/[^\d+]/g, "");

const SessionForm = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isTeacher, user } = useAuth();
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [studentId, setStudentId] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [juz, setJuz] = useState("1");
  const [fromPage, setFromPage] = useState("1");
  const [toPage, setToPage] = useState("1");
  const [pageRatings, setPageRatings] = useState({});
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const teacherLocked = isTeacher();
  const loggedTeacher = useMemo(
    () => teachers.find((teacher) => teacher.user_id === user?.id),
    [teachers, user],
  );
  const pageOptions = useMemo(() => getJuzPages(juz), [juz]);
  const selectedPages = useMemo(() => getPagesInRange(fromPage, toPage), [fromPage, toPage]);
  const selectedStudent = useMemo(
    () => students.find((student) => student.id === studentId),
    [studentId, students],
  );
  const contactPhone = normalizePhone(
    selectedStudent?.phone ||
      selectedStudent?.father_phone ||
      selectedStudent?.mother_phone ||
      selectedStudent?.parent_phone,
  );

  const fetchData = useCallback(async () => {
    try {
      const [studentsRes, teachersRes] = await Promise.all([
        studentsAPI.getAll(),
        teachersAPI.getAll(),
      ]);
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

  useEffect(() => {
    if (teacherLocked && loggedTeacher) setTeacherId(loggedTeacher.id);
  }, [teacherLocked, loggedTeacher]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setElapsedSeconds((current) => current + 1);
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const range = getJuzPageRange(juz);
    setFromPage(range.start.toString());
    setToPage(range.start.toString());
    setPageRatings({});
  }, [juz]);

  useEffect(() => {
    setPageRatings((current) =>
      Object.fromEntries(selectedPages.map((page) => [page, current[page] || "good"])),
    );
  }, [selectedPages]);

  const liveScore = useMemo(() => {
    if (!selectedPages.length) return 0;
    const scoreByRating = Object.fromEntries(SESSION_PAGE_RATINGS.map((rating) => [rating.value, rating.score]));
    const total = selectedPages.reduce((sum, page) => sum + Number(scoreByRating[pageRatings[page]] || 0), 0);
    return Math.round((total / selectedPages.length) * 10) / 10;
  }, [pageRatings, selectedPages]);
  const liveResult = getResult(liveScore);

  const updatePageRating = (page, rating) => {
    setPageRatings((current) => ({ ...current, [page]: rating }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!studentId || !teacherId) {
      toast.error(t("pleaseCompleteRequiredFields"));
      return;
    }
    if (Number(fromPage) > Number(toPage)) {
      toast.error(t("invalidPageRange"));
      return;
    }

    try {
      await sessionsAPI.create({
        student_id: studentId,
        teacher_id: teacherId,
        duration_minutes: Math.max(1, Math.ceil(elapsedSeconds / 60)),
        juz: Number(juz),
        from_page: Number(fromPage),
        to_page: Number(toPage),
        page_ratings: selectedPages.map((page) => ({
          page_number: page,
          rating: pageRatings[page] || "good",
        })),
      });
      toast.success(t("sessionCreated"));
      navigate("/sessions");
    } catch (error) {
      toast.error(error.response?.data?.detail || t("error"));
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
    <form onSubmit={handleSubmit} className="space-y-6" data-testid="session-form-page">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <Button variant="ghost" className="mb-2 gap-2 px-0" onClick={() => navigate("/sessions")}>
            <ArrowLeft className="h-4 w-4" />
            {t("backToSessions")}
          </Button>
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">{t("addSession")}</h1>
          <p className="mt-1 text-muted-foreground">{t("newSessionDescription")}</p>
        </div>
        <div className="rounded-lg border bg-primary/[0.07] p-4 md:min-w-48">
          <p className="text-sm text-muted-foreground">{t("duration")}</p>
          <p className="mt-1 text-4xl font-bold text-primary">{formatElapsedTime(elapsedSeconds)}</p>
        </div>
      </div>

      <Card className="soft-panel rounded-lg">
        <CardHeader>
          <CardTitle>{t("sessionDetails")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4">
          <div className="space-y-2 md:col-span-2">
            <Label>{t("studentName")} *</Label>
            <SearchableSelect
              options={students}
              value={studentId}
              onChange={setStudentId}
              placeholder={t("selectStudent")}
              searchPlaceholder={t("searchStudents")}
              emptyLabel={t("noData")}
              getOptionLabel={(student) => student.full_name}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>{t("teacherName")} *</Label>
            <SearchableSelect
              options={teachers}
              value={teacherId}
              onChange={setTeacherId}
              disabled={teacherLocked}
              placeholder={t("selectTeacher")}
              searchPlaceholder={t("searchTeachers")}
              emptyLabel={t("noData")}
              getOptionLabel={(teacher) => teacher.full_name}
            />
          </div>
          <div className="space-y-2">
            <Label>{t("juz")} *</Label>
            <Select value={juz} onValueChange={setJuz}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {JUZ_OPTIONS.map((item) => (
                  <SelectItem key={item} value={item.toString()}>
                    {t("juz")} {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t("fromPage")} *</Label>
            <Select value={fromPage} onValueChange={setFromPage}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageOptions.map((page) => (
                  <SelectItem key={page} value={page.toString()}>
                    {t("page")} {page}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t("toPage")} *</Label>
            <Select value={toPage} onValueChange={setToPage}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageOptions.map((page) => (
                  <SelectItem key={page} value={page.toString()}>
                    {t("page")} {page}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end gap-2">
            <Button type="button" variant="outline" disabled={!contactPhone} asChild>
              <a href={contactPhone ? `tel:${contactPhone}` : undefined}>
                <Phone className="me-2 h-4 w-4" />
                {t("call")}
              </a>
            </Button>
            <Button type="button" variant="outline" disabled={!contactPhone} asChild>
              <a href={contactPhone ? `https://wa.me/${contactPhone.replace(/^\+/, "")}` : undefined} target="_blank" rel="noreferrer">
                <MessageCircle className="me-2 h-4 w-4" />
                {t("whatsapp")}
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <Card className="soft-panel rounded-lg">
          <CardHeader>
            <CardTitle>{t("pageRatings")}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {selectedPages.map((page) => (
              <div key={page} className="rounded-lg border bg-white/70 p-3">
                <Label className="mb-2 block text-xs font-bold uppercase text-muted-foreground">
                  {t("page")} {page}
                </Label>
                <Select value={pageRatings[page] || "good"} onValueChange={(value) => updatePageRating(page, value)}>
                  <SelectTrigger className="h-10 bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SESSION_PAGE_RATINGS.map((rating) => (
                      <SelectItem key={rating.value} value={rating.value}>
                        {t(rating.value)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-lg border-primary/20 bg-primary/[0.07]">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">{t("finalScore")}</p>
            <p className="mt-1 text-5xl font-bold text-primary">{liveScore}%</p>
            <Badge className={`${getScoreColor(liveScore)} mt-3`}>{t(liveResult)}</Badge>
            <div className="mt-5 space-y-2">
              <div className="flex justify-between text-sm">
                <span>{t("totalPages")}</span>
                <strong>{selectedPages.length}</strong>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => navigate("/sessions")}>
          <MinusCircle className="me-2 h-4 w-4" />
          {t("cancel")}
        </Button>
        <Button type="submit" className="gap-2 bg-primary hover:bg-primary/90">
          <Save className="h-4 w-4" />
          {t("save")}
        </Button>
      </div>
    </form>
  );
};

export default SessionForm;
