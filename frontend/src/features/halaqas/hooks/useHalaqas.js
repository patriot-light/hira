import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { halaqasAPI, halaqaTypesAPI, studentsAPI, teachersAPI } from "@/services/api";
import { useAuth } from "@/context/AuthContext";

const useHalaqas = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { canManage, isTeacher } = useAuth();
  const [halaqas, setHalaqas] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [halaqaTypes, setHalaqaTypes] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [examDialogOpen, setExamDialogOpen] = useState(false);
  const [selectedHalaqa, setSelectedHalaqa] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [examRange, setExamRange] = useState({ from_juz: "1", to_juz: "1" });
  const [formName, setFormName] = useState("");
  const [formTypeId, setFormTypeId] = useState("");
  const [formGender, setFormGender] = useState("male");
  const [formAttendanceMode, setFormAttendanceMode] = useState("online");
  const [formTeacherIds, setFormTeacherIds] = useState([]);

  const fetchData = useCallback(async () => {
    try {
      const [h, tc, st, ht] = await Promise.all([
        halaqasAPI.getAll(),
        teachersAPI.getAll(),
        studentsAPI.getAll(),
        halaqaTypesAPI.getAll(),
      ]);
      setHalaqas(h.data);
      setTeachers(tc.data);
      setAllStudents(st.data);
      setHalaqaTypes(ht.data);
    } catch (error) {
      toast.error(t("error"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const resetForm = () => {
    setSelectedHalaqa(null);
    setFormName("");
    setFormTypeId("");
    setFormGender("male");
    setFormAttendanceMode("online");
    setFormTeacherIds([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formTypeId) {
      toast.error(t("pleaseSelectHalaqaType"));
      return;
    }
    try {
      const data = {
        name: formName,
        type_id: formTypeId,
        gender: formGender,
        attendance_mode: formAttendanceMode,
        teacher_ids: formTeacherIds,
        schedule: [],
      };
      if (selectedHalaqa) {
        await halaqasAPI.update(selectedHalaqa.id, data);
        toast.success(t("halaqaUpdated"));
      } else {
        await halaqasAPI.create(data);
        toast.success(t("halaqaCreated"));
      }
      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || t("error"));
    }
  };

  const handleDelete = async () => {
    try {
      await halaqasAPI.delete(selectedHalaqa.id);
      toast.success(t("halaqaDeleted"));
      setDeleteDialogOpen(false);
      setSelectedHalaqa(null);
      fetchData();
    } catch (error) {
      toast.error(t("error"));
    }
  };

  const handleEdit = (halaqa) => {
    setSelectedHalaqa(halaqa);
    setFormName(halaqa.name);
    setFormTypeId(halaqa.type_id || "");
    setFormGender(halaqa.gender || "male");
    setFormAttendanceMode(halaqa.attendance_mode || "online");
    setFormTeacherIds(halaqa.teacher_ids || []);
    setDialogOpen(true);
  };

  const handleMarkAbsent = async (halaqa, student) => {
    try {
      await halaqasAPI.markAbsent(halaqa.id, student.id, {
        reason: "absent_no_response",
      });
      toast.success(t("absenceRecorded"));
    } catch (error) {
      toast.error(error.response?.data?.detail || t("error"));
    }
  };

  const canRaiseForExam = () => canManage() || isTeacher();

  const getHalaqaStudents = (halaqaId) =>
    allStudents.filter((student) =>
      (student.halaqa_ids || (student.halaqa_id ? [student.halaqa_id] : [])).includes(halaqaId),
    );

  const openExamDialog = (student) => {
    setSelectedStudent(student);
    setExamRange({ from_juz: "1", to_juz: "1" });
    setExamDialogOpen(true);
  };

  const handleRaiseForExam = async (event) => {
    event.preventDefault();
    if (Number(examRange.from_juz) > Number(examRange.to_juz)) {
      toast.error(t("invalidJuzRange"));
      return;
    }
    try {
      await studentsAPI.raiseForExam(selectedStudent.id, examRange);
      toast.success(t("studentRaisedForExam"));
      setExamDialogOpen(false);
      setSelectedStudent(null);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || t("error"));
    }
  };

  const getHalaqaTypeName = (id) =>
    halaqaTypes.find((type) => type.id === id)?.name || "-";

  const getTeacherName = (ids) => {
    if (!ids || ids.length === 0) return "-";
    const names = ids
      .map((id) => teachers.find((teacher) => teacher.id === id)?.full_name)
      .filter(Boolean);
    return names.length ? names.join(", ") : "-";
  };

  const getStudentCount = (halaqaId) => getHalaqaStudents(halaqaId).length;

  const deleteImpact = selectedHalaqa && getStudentCount(selectedHalaqa.id)
    ? t("deleteHalaqaImpact", { count: getStudentCount(selectedHalaqa.id) })
    : "";

  const filteredHalaqas = halaqas.filter((h) =>
    h.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return {
    t,
    navigate,
    canManage,
    isTeacher,
    halaqas,
    teachers,
    halaqaTypes,
    loading,
    searchQuery,
    setSearchQuery,
    dialogOpen,
    setDialogOpen,
    deleteDialogOpen,
    setDeleteDialogOpen,
    examDialogOpen,
    setExamDialogOpen,
    selectedHalaqa,
    setSelectedHalaqa,
    selectedStudent,
    examRange,
    setExamRange,
    formName,
    setFormName,
    formTypeId,
    setFormTypeId,
    formGender,
    setFormGender,
    formAttendanceMode,
    setFormAttendanceMode,
    formTeacherIds,
    setFormTeacherIds,
    handleSubmit,
    handleDelete,
    handleEdit,
    handleMarkAbsent,
    canRaiseForExam,
    getHalaqaStudents,
    openExamDialog,
    handleRaiseForExam,
    getHalaqaTypeName,
    getTeacherName,
    getStudentCount,
    deleteImpact,
    filteredHalaqas,
  };
};

export default useHalaqas;
