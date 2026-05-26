import React from "react";
import { halaqaLabel } from "@/lib/halaqa";

export function StudentHalaqaLinks({ halaqas, onNavigate, t }) {
  if (!halaqas.length) return "-";

  return (
    <div className="flex flex-wrap gap-1">
      {halaqas.map((halaqa) => (
        <button
          key={halaqa.id}
          type="button"
          className="text-start text-primary hover:underline"
          onClick={() => onNavigate(halaqa.id)}
        >
          {halaqaLabel(halaqa, t)}
        </button>
      ))}
    </div>
  );
}
