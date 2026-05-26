import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { exportAPI, halaqasAPI, studentsAPI } from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import { studentHalaqaIds } from "@/lib/halaqa";

const useStudents = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { canManage, isTeacher, isExamTeacher } = useAuth();
  const [students, setStudents] = useState([]);
  const [halaqas, setHalaqas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [examDialogOpen, setExamDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [examRange, setExamRange] = useState({ from_juz: "1", to_juz: "1" });
  const [formData, setFormData] = useState({
    full_name: "",
    age: "",
    national_id: "",
    phone: "",
    parent_phone: "",
    email: "",
    password: "",
    status: "active",
    halaqa_id: "",
    halaqa_ids: [],
  });

  const fetchData = useCallback(async () => {
    try {
      const [studentsRes, halaqasRes] = await Promise.all([
        studentsAPI.getAll(),
        halaqasAPI.getAll(),
      ]);
      setStudents(studentsRes.data);
      setHalaqas(halaqasRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error(t("error"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const resetForm = () => {
    setSelectedStudent(null);
    setFormData({
      full_name: "",
      age: "",
      national_id: "",
      phone: "",
      parent_phone: "",
      email: "",
      password: "",
      status: "active",
      halaqa_id: "",
      halaqa_ids: [],
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        age: parseInt(formData.age) || 0,
        halaqa_ids: formData.halaqa_ids || [],
        halaqa_id: formData.halaqa_ids?.[0] || null,
        password: formData.password || null,
      };

      if (selectedStudent) {
        await studentsAPI.update(selectedStudent.id, data);
        toast.success(t("studentUpdated"));
      } else {
        await studentsAPI.create(data);
        toast.success(t("studentCreated"));
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
      await studentsAPI.delete(selectedStudent.id);
      toast.success(t("studentDeleted"));
      setDeleteDialogOpen(false);
      setSelectedStudent(null);
      fetchData();
    } catch (error) {
      toast.error(t("error"));
    }
  };

  const handleEdit = (student) => {
    setSelectedStudent(student);
    setFormData({
      full_name: student.full_name,
      age: student.age?.toString() || "",
      national_id: student.national_id || "",
      phone: student.phone || "",
      parent_phone: student.parent_phone || "",
      email: student.email || "",
      password: "",
      status: student.status || "active",
      halaqa_id: student.halaqa_id || "",
      halaqa_ids: student.halaqa_ids || (student.halaqa_id ? [student.halaqa_id] : []),
    });
    setDialogOpen(true);
  };

  const canRaiseForExam = () => canManage() || isTeacher();

  const openExamEvaluation = (student) => {
    navigate(`/evaluations/new?student_id=${student.id}`);
  };

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

  const downloadBlob = (response, filename) => {
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleExportExcel = async () => {
    try {
      const response = await exportAPI.studentsExcel();
      downloadBlob(response, "students.xlsx");
      toast.success(t("success"));
    } catch (error) {
      toast.error(t("error"));
    }
  };

  const handleExportPdf = async () => {
    try {
      const response = await exportAPI.studentsPdf();
      downloadBlob(response, "students.pdf");
      toast.success(t("success"));
    } catch (error) {
      toast.error(t("error"));
    }
  };

  const filteredStudents = students.filter(
    (student) =>
      student.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.father_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.mother_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.phone?.includes(searchQuery),
  );

  const getHalaqaNames = (student) =>
    studentHalaqaIds(student)
      .map((id) => halaqas.find((halaqa) => halaqa.id === id))
      .filter(Boolean);

  const getDeleteImpact = () => {
    const count = getHalaqaNames(selectedStudent).length;
    return count ? t("deleteStudentImpact", { count }) : "";
  };

  return {
    t,
    navigate,
    canManage,
    isExamTeacher,
    loading,
    students,
    halaqas,
    searchQuery,
    setSearchQuery,
    dialogOpen,
    setDialogOpen,
    deleteDialogOpen,
    setDeleteDialogOpen,
    examDialogOpen,
    setExamDialogOpen,
    selectedStudent,
    setSelectedStudent,
    examRange,
    setExamRange,
    formData,
    setFormData,
    handleSubmit,
    handleDelete,
    handleEdit,
    resetForm,
    canRaiseForExam,
    openExamEvaluation,
    openExamDialog,
    handleRaiseForExam,
    handleExportExcel,
    handleExportPdf,
    filteredStudents,
    getHalaqaNames,
    getDeleteImpact,
  };
};

export default useStudents;
