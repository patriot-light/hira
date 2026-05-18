import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { errorTypesAPI } from "../services/api";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Textarea } from "../components/ui/textarea";
import { AlertCircle, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

const ErrorTypes = () => {
  const { t } = useTranslation();
  const [errorTypes, setErrorTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    deduction: "1",
    description: "",
  });

  const fetchData = useCallback(async () => {
    try {
      const response = await errorTypesAPI.getAll();
      setErrorTypes(response.data);
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
    setFormData({ name: "", deduction: "1", description: "" });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      await errorTypesAPI.create({
        ...formData,
        deduction: Number(formData.deduction),
      });
      toast.success(t("errorTypeSaved"));
      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || t("error"));
    }
  };

  const handleDelete = async (id) => {
    try {
      await errorTypesAPI.delete(id);
      toast.success(t("errorTypeDeleted"));
      fetchData();
    } catch (error) {
      toast.error(t("error"));
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="error-types-page">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="flex items-center gap-3 text-2xl font-bold text-foreground md:text-3xl">
            <AlertCircle className="h-8 w-8 text-primary" />
            {t("errorTypes")}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {t("errorTypesDescription")}
          </p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setDialogOpen(true);
          }}
          className="gap-2 bg-primary hover:bg-primary/90"
          data-testid="add-error-type-btn"
        >
          <Plus className="h-4 w-4" />
          {t("addError")}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("errorTable")}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("name")}</TableHead>
                  <TableHead>{t("deduction")}</TableHead>
                  <TableHead className="hidden md:table-cell">{t("description")}</TableHead>
                  <TableHead className="w-12">{t("actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {errorTypes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                      {t("noData")}
                    </TableCell>
                  </TableRow>
                ) : (
                  errorTypes.map((errorType) => (
                    <TableRow key={errorType.id}>
                      <TableCell className="font-medium">{errorType.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          -{errorType.deduction} {t("marks")}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden max-w-md truncate md:table-cell">
                        {errorType.description || "-"}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDelete(errorType.id)}
                          aria-label={`${t("delete")} ${errorType.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("addError")}</DialogTitle>
            <DialogDescription>
              {t("addErrorDescription")}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>{t("errorName")} *</Label>
              <Input
                value={formData.name}
                onChange={(event) =>
                  setFormData((current) => ({ ...current, name: event.target.value }))
                }
                required
                data-testid="error-type-name-input"
              />
            </div>
            <div className="space-y-2">
              <Label>{t("deduction")} *</Label>
              <Input
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={formData.deduction}
                onChange={(event) =>
                  setFormData((current) => ({ ...current, deduction: event.target.value }))
                }
                required
                data-testid="error-type-deduction-input"
              />
            </div>
            <div className="space-y-2">
              <Label>{t("notes")}</Label>
              <Textarea
                value={formData.description}
                onChange={(event) =>
                  setFormData((current) => ({ ...current, description: event.target.value }))
                }
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                {t("cancel")}
              </Button>
              <Button type="submit" className="bg-primary hover:bg-primary/90">
                {t("save")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ErrorTypes;
