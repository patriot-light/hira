import React from "react";
import { FileText, Trash2 } from "lucide-react";
import { ActionButton } from "@/components/ui/action-button";

export function SessionActions({ session, t, canDelete, onView, onDelete }) {
  return (
    <div className="flex gap-1">
      <ActionButton label={t("viewDetails")} icon={FileText} onClick={() => onView(session)} data-testid={`view-session-${session.id}`} />
      {canDelete && (
        <ActionButton
          label={t("delete")}
          icon={Trash2}
          onClick={() => onDelete(session.id)}
          className="text-destructive hover:text-destructive"
        />
      )}
    </div>
  );
}
