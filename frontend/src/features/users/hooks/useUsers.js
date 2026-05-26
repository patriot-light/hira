import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { usersAPI } from "@/services/api";
import { toast } from "sonner";

const useUsers = () => {
  const { t } = useTranslation();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newRole, setNewRole] = useState("");

  const fetchUsers = useCallback(async () => {
    try {
      const response = await usersAPI.getAll();
      setUsers(response.data);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error(t("error"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleUpdateRole = async () => {
    try {
      await usersAPI.updateRole(selectedUser.id, newRole);
      toast.success(t("roleUpdated"));
      setRoleDialogOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      toast.error(t("error"));
    }
  };

  const handleDelete = async () => {
    try {
      await usersAPI.delete(selectedUser.id);
      toast.success(t("userDeleted"));
      setDeleteDialogOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      toast.error(t("error"));
    }
  };

  const openRoleDialog = (user) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setRoleDialogOpen(true);
  };

  const getRoleColor = (role) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-700";
      case "staff":
        return "bg-blue-100 text-blue-700";
      case "teacher":
        return "bg-green-100 text-green-700";
      case "exam_teacher":
        return "bg-purple-100 text-purple-700";
      case "student":
        return "bg-yellow-100 text-yellow-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return {
    t,
    users,
    setUsers,
    loading,
    setLoading,
    searchQuery,
    setSearchQuery,
    deleteDialogOpen,
    setDeleteDialogOpen,
    roleDialogOpen,
    setRoleDialogOpen,
    selectedUser,
    setSelectedUser,
    newRole,
    setNewRole,
    fetchUsers,
    handleUpdateRole,
    handleDelete,
    openRoleDialog,
    getRoleColor,
    filteredUsers,
  };
};

export default useUsers;
