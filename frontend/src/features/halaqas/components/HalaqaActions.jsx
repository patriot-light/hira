import React from "react";
import { Edit, Trash2 } from "lucide-react";
import { ActionButton } from "@/components/ui/action-button";

export function HalaqaActions({ halaqa, t, onEdit, onDelete }) {
  return (
    <div className="flex items-center gap-1">
      <ActionButton label={t("edit")} icon={Edit} onClick={() => onEdit(halaqa)} data-testid={`halaqa-edit-${halaqa.id}`} />
      <ActionButton
        label={t("delete")}
        icon={Trash2}
        className="text-destructive hover:text-destructive"
        onClick={() => onDelete(halaqa)}
      />
    </div>
  );
}
