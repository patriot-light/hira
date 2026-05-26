import React, { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "./button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./dialog";
import { Input } from "./input";
import { Label } from "./label";

const TypedDeleteDialog = ({
  open,
  onOpenChange,
  title,
  description,
  name,
  impact,
  confirmLabel,
  cancelLabel,
  inputLabel,
  onConfirm,
}) => {
  const [value, setValue] = useState("");

  useEffect(() => {
    if (!open) setValue("");
  }, [open]);

  const disabled = name && value !== name;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {impact && (
          <div className="flex gap-3 rounded-lg border border-destructive/25 bg-destructive/5 p-3 text-sm text-destructive">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{impact}</p>
          </div>
        )}
        {name && (
          <div className="space-y-2">
            <Label>{inputLabel}</Label>
            <Input
              value={value}
              onChange={(event) => setValue(event.target.value)}
            />
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {cancelLabel}
          </Button>
          <Button variant="destructive" disabled={disabled} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export { TypedDeleteDialog };
