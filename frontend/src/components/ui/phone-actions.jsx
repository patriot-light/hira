import React from "react";
import { Copy, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "./button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./tooltip";

function whatsappUrl(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  return digits ? `https://wa.me/${digits}` : "#";
}

const IconTip = ({ label, children }) => (
  <TooltipProvider delayDuration={150}>
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

const PhoneActions = ({ phone, empty = "-" }) => {
  if (!phone) return empty;

  const copyPhone = async () => {
    await navigator.clipboard?.writeText(phone);
    toast.success("Copied");
  };

  return (
    <span className="inline-flex items-center gap-1.5">
      <a
        href={whatsappUrl(phone)}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1 font-medium text-green-700 hover:underline">
        <MessageCircle className="h-4 w-4" />
        <span>{phone}</span>
      </a>
      <IconTip label="Copy">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={copyPhone}>
          <Copy className="h-3.5 w-3.5" />
        </Button>
      </IconTip>
    </span>
  );
};

export { PhoneActions, whatsappUrl };
