import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { sessionsAPI, studentsAPI, teachersAPI } from "@/services/api";
import { useAuth } from "@/context/AuthContext";

const useSessions = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { canEvaluate } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [sessionsRes, studentsRes, teachersRes] = await Promise.all([
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
    if (!window.confirm(t("deleteSessionConfirmation"))) return;
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

  return {
    t,
    navigate,
    canEvaluate,
    sessions,
    loading,
    handleDelete,
    getStudentName,
    getTeacherName,
  };
};

export default useSessions;
