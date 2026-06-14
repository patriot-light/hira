import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/context/LanguageContext";
import { errorTypesAPI, halaqaTypesAPI } from "@/services/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TypedDeleteDialog } from "@/components/ui/typed-delete-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertCircle,
  BookOpen,
  Loader2,
  Plus,
  Settings,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

const Configuration = () => {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const [errorTypes, setErrorTypes] = useState([]);
  const [halaqaTypes, setHalaqaTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);
  const [halaqaTypeDialogOpen, setHalaqaTypeDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [errorForm, setErrorForm] = useState({
    name: "",
    deduction: "1",
    description: "",
  });
  const [halaqaTypeForm, setHalaqaTypeForm] = useState({
    name: "",
    description: "",
  });

  const fetchData = useCallback(async () => {
    try {
      const [errorsRes, halaqaTypesRes] = await Promise.all([
        errorTypesAPI.getAll(),
        halaqaTypesAPI.getAll(),
      ]);
      setErrorTypes(errorsRes.data);
      setHalaqaTypes(halaqaTypesRes.data);
    } catch (error) {
      toast.error(t("error"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const resetErrorForm = () => {
    setErrorForm({ name: "", deduction: "1", description: "" });
  };

  const resetHalaqaTypeForm = () => {
    setHalaqaTypeForm({ name: "", description: "" });
  };

  const handleErrorSubmit = async (event) => {
    event.preventDefault();
    try {
      await errorTypesAPI.create({
        ...errorForm,
        deduction: Number(errorForm.deduction),
      });
      toast.success(t("errorTypeSaved"));
      setErrorDialogOpen(false);
      resetErrorForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || t("error"));
    }
  };

  const handleHalaqaTypeSubmit = async (event) => {
    event.preventDefault();
    try {
      await halaqaTypesAPI.create(halaqaTypeForm);
      toast.success(t("halaqaTypeSaved"));
      setHalaqaTypeDialogOpen(false);
      resetHalaqaTypeForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || t("error"));
    }
  };

  const handleDeleteError = async (id) => {
    try {
      await errorTypesAPI.delete(id);
      toast.success(t("errorTypeDeleted"));
      fetchData();
    } catch (error) {
      toast.error(t("error"));
    }
  };

  const handleDeleteHalaqaType = async (id) => {
    try {
      await halaqaTypesAPI.delete(id);
      toast.success(t("halaqaTypeDeleted"));
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || t("error"));
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
    <div className="space-y-6" data-testid="configuration-page" >
      <div className="page-hero rounded-lg p-5 md:p-7">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-white/85 text-primary ring-1 ring-primary/15">
            <Settings className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground md:text-4xl">
              {t("configuration")}
            </h1>
            <p className="mt-1 text-base font-medium text-slate-600">
              {t("configurationDescription")}
            </p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="errors" className="space-y-4 ">
        <TabsList
          className={`grid h-auto w-full max-w-xl grid-cols-2 gap-2 bg-transparent p-0 ${isRTL() ? "ms-auto" : "me-auto"}`}>
          <TabsTrigger
            value="errors"
            className="min-h-11 rounded-lg border bg-white data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <AlertCircle className="me-2 h-4 w-4" />
            {t("errorTypes")}
          </TabsTrigger>
          <TabsTrigger
            value="halaqa-types"
            className="min-h-11 rounded-lg border bg-white data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <BookOpen className="me-2 h-4 w-4" />
            {t("halaqaTypes")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="errors">
          <Card className="soft-panel overflow-hidden rounded-lg  ">
            <CardHeader className="flex flex-col gap-3 border-b border-border/70 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle>{t("errorTable")}</CardTitle>
              <Button
                onClick={() => {
                  resetErrorForm();
                  setErrorDialogOpen(true);
                }}
                className="gap-2 bg-primary hover:bg-primary/90"
                data-testid="add-error-type-btn">
                <Plus className="h-4 w-4" />
                {t("addError")}
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto"style={{direction:"rtl"}}>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("name")}</TableHead>
                      <TableHead>{t("deduction")}</TableHead>
                      <TableHead className="hidden md:table-cell">
                        {t("description")}
                      </TableHead>
                      <TableHead className="w-12">{t("actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {errorTypes.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="py-8 text-center text-muted-foreground">
                          {t("noData")}
                        </TableCell>
                      </TableRow>
                    ) : (
                      errorTypes.map((errorType) => (
                        <TableRow key={errorType.id}>
                          <TableCell className="font-medium">
                            {errorType.name}
                          </TableCell>
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
                              onClick={() =>
                                setDeleteTarget({
                                  kind: "error",
                                  item: errorType,
                                })
                              }
                              aria-label={`${t("delete")} ${errorType.name}`}>
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
        </TabsContent>

        <TabsContent value="halaqa-types">
          <Card className="soft-panel overflow-hidden rounded-lg">
            <CardHeader className="flex flex-col gap-3 border-b border-border/70 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle>{t("halaqaTypes")}</CardTitle>
              <Button
                onClick={() => {
                  resetHalaqaTypeForm();
                  setHalaqaTypeDialogOpen(true);
                }}
                className="gap-2 bg-primary hover:bg-primary/90"
                data-testid="add-halaqa-type-btn">
                <Plus className="h-4 w-4" />
                {t("addHalaqaType")}
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto" style={{direction:"rtl"}}>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("name")}</TableHead>
                      <TableHead className="hidden md:table-cell">
                        {t("description")}
                      </TableHead>
                      <TableHead className="w-12">{t("actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {halaqaTypes.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={3}
                          className="py-8 text-center text-muted-foreground">
                          {t("noData")}
                        </TableCell>
                      </TableRow>
                    ) : (
                      halaqaTypes.map((type) => (
                        <TableRow key={type.id}>
                          <TableCell className="font-medium">
                            {type.name}
                          </TableCell>
                          <TableCell className="hidden max-w-md truncate md:table-cell">
                            {type.description || "-"}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={() =>
                                setDeleteTarget({
                                  kind: "halaqaType",
                                  item: type,
                                })
                              }
                              aria-label={`${t("delete")} ${type.name}`}>
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
        </TabsContent>
      </Tabs>

      <Dialog open={errorDialogOpen} onOpenChange={setErrorDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("addError")}</DialogTitle>
            <DialogDescription>{t("addErrorDescription")}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleErrorSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>{t("errorName")} *</Label>
              <Input
                value={errorForm.name}
                onChange={(event) =>
                  setErrorForm((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label>{t("deduction")} *</Label>
              <Input
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={errorForm.deduction}
                onChange={(event) =>
                  setErrorForm((current) => ({
                    ...current,
                    deduction: event.target.value,
                  }))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label>{t("notes")}</Label>
              <Textarea
                value={errorForm.description}
                onChange={(event) =>
                  setErrorForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setErrorDialogOpen(false)}>
                {t("cancel")}
              </Button>
              <Button type="submit" className="bg-primary hover:bg-primary/90">
                {t("save")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={halaqaTypeDialogOpen}
        onOpenChange={setHalaqaTypeDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("addHalaqaType")}</DialogTitle>
            <DialogDescription>
              {t("addHalaqaTypeDescription")}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleHalaqaTypeSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>{t("halaqaTypeName")} *</Label>
              <Input
                value={halaqaTypeForm.name}
                onChange={(event) =>
                  setHalaqaTypeForm((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                required
                data-testid="halaqa-type-name-input"
              />
            </div>
            <div className="space-y-2">
              <Label>{t("notes")}</Label>
              <Textarea
                value={halaqaTypeForm.description}
                onChange={(event) =>
                  setHalaqaTypeForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setHalaqaTypeDialogOpen(false)}>
                {t("cancel")}
              </Button>
              <Button type="submit" className="bg-primary hover:bg-primary/90">
                {t("save")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <TypedDeleteDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={t("confirm")}
        description={
          deleteTarget?.kind === "error"
            ? t("deleteErrorTypeConfirmation", {
                name: deleteTarget?.item?.name,
              })
            : t("deleteHalaqaTypeConfirmation", {
                name: deleteTarget?.item?.name,
              })
        }
        cancelLabel={t("cancel")}
        confirmLabel={t("delete")}
        onConfirm={async () => {
          if (deleteTarget?.kind === "error")
            await handleDeleteError(deleteTarget.item.id);
          if (deleteTarget?.kind === "halaqaType")
            await handleDeleteHalaqaType(deleteTarget.item.id);
          setDeleteTarget(null);
        }}
      />
    </div>
  );
};

export default Configuration;
