import React from "react";
import { Edit, Trash2 } from "lucide-react";
import { ActionButton } from "@/components/ui/action-button";

export function TeacherActions({ teacher, t, onEdit, onDelete }) {
  return (
    <div className="flex items-center gap-1">
      <ActionButton label={t("edit")} icon={Edit} onClick={() => onEdit(teacher)} />
      <ActionButton
        label={t("delete")}
        icon={Trash2}
        className="text-destructive hover:text-destructive"
        onClick={() => onDelete(teacher)}
      />
    </div>
  );
}
