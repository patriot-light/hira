import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { halaqasAPI, teachersAPI } from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import { halaqaLabel } from "@/lib/halaqa";

const useTeachers = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { canManage } = useAuth();
  const [teachers, setTeachers] = useState([]);
  const [halaqas, setHalaqas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [formData, setFormData] = useState({
    full_name: "",
    qualification: "",
    experience_years: "",
    phone: "",
    email: "",
    password: "",
  });

  const fetchTeachers = useCallback(async () => {
    try {
      const [teachersRes, halaqasRes] = await Promise.all([
        teachersAPI.getAll(),
        halaqasAPI.getAll(),
      ]);
      setTeachers(teachersRes.data);
      setHalaqas(halaqasRes.data);
    } catch (error) {
      console.error("Error fetching teachers:", error);
      toast.error(t("error"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchTeachers();
  }, [fetchTeachers]);

  const resetForm = () => {
    setSelectedTeacher(null);
    setFormData({
      full_name: "",
      qualification: "",
      experience_years: "",
      phone: "",
      email: "",
      password: "",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        experience_years: parseInt(formData.experience_years) || 0,
        password: formData.password || null,
      };

      if (selectedTeacher) {
        await teachersAPI.update(selectedTeacher.id, data);
        toast.success(t("teacherUpdated"));
      } else {
        await teachersAPI.create(data);
        toast.success(t("teacherCreated"));
      }
      setDialogOpen(false);
      resetForm();
      fetchTeachers();
    } catch (error) {
      toast.error(error.response?.data?.detail || t("error"));
    }
  };

  const handleDelete = async () => {
    try {
      await teachersAPI.delete(selectedTeacher.id);
      toast.success(t("teacherDeleted"));
      setDeleteDialogOpen(false);
      setSelectedTeacher(null);
      fetchTeachers();
    } catch (error) {
      toast.error(t("error"));
    }
  };

  const handleEdit = (teacher) => {
    setSelectedTeacher(teacher);
    setFormData({
      full_name: teacher.full_name,
      qualification: teacher.qualification || "",
      experience_years: teacher.experience_years?.toString() || "",
      phone: teacher.phone || "",
      email: teacher.email || "",
      password: "",
    });
    setDialogOpen(true);
  };

  const filteredTeachers = teachers.filter(
    (teacher) =>
      teacher.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      teacher.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      teacher.qualification?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const assignedHalaqas = (teacher) =>
    halaqas.filter((halaqa) => (halaqa.teacher_ids || []).includes(teacher?.id));

  const deleteImpact = assignedHalaqas(selectedTeacher).length
    ? t("deleteTeacherImpact", {
        halaqas: assignedHalaqas(selectedTeacher).map((halaqa) => halaqaLabel(halaqa, t)).join(", "),
      })
    : "";

  return {
    t,
    navigate,
    canManage,
    teachers,
    loading,
    searchQuery,
    setSearchQuery,
    dialogOpen,
    setDialogOpen,
    deleteDialogOpen,
    setDeleteDialogOpen,
    selectedTeacher,
    setSelectedTeacher,
    formData,
    setFormData,
    handleSubmit,
    handleDelete,
    handleEdit,
    resetForm,
    filteredTeachers,
    assignedHalaqas,
    deleteImpact,
  };
};

export default useTeachers;
