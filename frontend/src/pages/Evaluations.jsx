import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { pageEvaluationsAPI, juzEvaluationsAPI, studentsAPI } from '../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Textarea } from '../components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { 
  Plus, 
  ClipboardCheck,
  BookOpen,
  Loader2,
  Trash2,
  FileText
} from 'lucide-react';
import { toast } from 'sonner';

const Evaluations = () => {
  const { t } = useTranslation();
  const { canEvaluate, isStudent } = useAuth();
  const [pageEvaluations, setPageEvaluations] = useState([]);
  const [juzEvaluations, setJuzEvaluations] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageDialogOpen, setPageDialogOpen] = useState(false);
  const [juzDialogOpen, setJuzDialogOpen] = useState(false);
  const [pageFormData, setPageFormData] = useState({
    student_id: '',
    page_number: '',
    score: '',
    notes: ''
  });
  const [juzFormData, setJuzFormData] = useState({
    student_id: '',
    juz_number: '',
    memorization_score: '',
    mastery_score: '',
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [pageRes, juzRes, studentsRes] = await Promise.all([
        pageEvaluationsAPI.getAll(),
        juzEvaluationsAPI.getAll(),
        studentsAPI.getAll()
      ]);
      setPageEvaluations(pageRes.data);
      setJuzEvaluations(juzRes.data);
      setStudents(studentsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error(t('error'));
    } finally {
      setLoading(false);
    }
  };

  const handlePageSubmit = async (e) => {
    e.preventDefault();
    try {
      await pageEvaluationsAPI.create({
        ...pageFormData,
        page_number: parseInt(pageFormData.page_number),
        score: parseFloat(pageFormData.score)
      });
      toast.success(t('evaluationCreated'));
      setPageDialogOpen(false);
      setPageFormData({ student_id: '', page_number: '', score: '', notes: '' });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || t('error'));
    }
  };

  const handleJuzSubmit = async (e) => {
    e.preventDefault();
    try {
      await juzEvaluationsAPI.create({
        ...juzFormData,
        juz_number: parseInt(juzFormData.juz_number),
        memorization_score: parseFloat(juzFormData.memorization_score),
        mastery_score: parseFloat(juzFormData.mastery_score)
      });
      toast.success(t('evaluationCreated'));
      setJuzDialogOpen(false);
      setJuzFormData({ student_id: '', juz_number: '', memorization_score: '', mastery_score: '', notes: '' });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || t('error'));
    }
  };

  const handleDeletePageEval = async (id) => {
    try {
      await pageEvaluationsAPI.delete(id);
      toast.success('Evaluation deleted');
      fetchData();
    } catch (error) {
      toast.error(t('error'));
    }
  };

  const handleDeleteJuzEval = async (id) => {
    try {
      await juzEvaluationsAPI.delete(id);
      toast.success('Evaluation deleted');
      fetchData();
    } catch (error) {
      toast.error(t('error'));
    }
  };

  const getStudentName = (studentId) => {
    const student = students.find(s => s.id === studentId);
    return student?.full_name || '-';
  };

  const getScoreColor = (score) => {
    if (score >= 90) return 'bg-green-100 text-green-700';
    if (score >= 80) return 'bg-blue-100 text-blue-700';
    if (score >= 70) return 'bg-yellow-100 text-yellow-700';
    return 'bg-red-100 text-red-700';
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="evaluations-page">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-3">
            <ClipboardCheck className="h-8 w-8 text-primary" />
            {t('evaluations')}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t('pageEvaluation')} & {t('juzEvaluation')}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="page" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="page" className="gap-2">
            <FileText className="h-4 w-4" />
            {t('pageEvaluation')}
          </TabsTrigger>
          <TabsTrigger value="juz" className="gap-2">
            <BookOpen className="h-4 w-4" />
            {t('juzEvaluation')}
          </TabsTrigger>
        </TabsList>

        {/* Page Evaluations Tab */}
        <TabsContent value="page" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{t('pageEvaluation')}</CardTitle>
              {canEvaluate() && (
                <Button 
                  onClick={() => setPageDialogOpen(true)}
                  className="gap-2 bg-primary hover:bg-primary/90"
                  data-testid="add-page-eval-btn"
                >
                  <Plus className="h-4 w-4" />
                  {t('addEvaluation')}
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('studentName')}</TableHead>
                      <TableHead>{t('pageNumber')}</TableHead>
                      <TableHead>{t('score')}</TableHead>
                      <TableHead className="hidden md:table-cell">{t('notes')}</TableHead>
                      <TableHead className="hidden md:table-cell">Date</TableHead>
                      {canEvaluate() && <TableHead className="w-12"></TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pageEvaluations.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          {t('noData')}
                        </TableCell>
                      </TableRow>
                    ) : (
                      pageEvaluations.map((eval_) => (
                        <TableRow key={eval_.id} data-testid={`page-eval-row-${eval_.id}`}>
                          <TableCell className="font-medium">{getStudentName(eval_.student_id)}</TableCell>
                          <TableCell>{eval_.page_number}</TableCell>
                          <TableCell>
                            <Badge className={getScoreColor(eval_.score)}>
                              {eval_.score}%
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden md:table-cell max-w-[200px] truncate">
                            {eval_.notes || '-'}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">{formatDate(eval_.date)}</TableCell>
                          {canEvaluate() && (
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeletePageEval(eval_.id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          )}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Juz Evaluations Tab */}
        <TabsContent value="juz" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{t('juzEvaluation')}</CardTitle>
              {canEvaluate() && (
                <Button 
                  onClick={() => setJuzDialogOpen(true)}
                  className="gap-2 bg-primary hover:bg-primary/90"
                  data-testid="add-juz-eval-btn"
                >
                  <Plus className="h-4 w-4" />
                  {t('addEvaluation')}
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('studentName')}</TableHead>
                      <TableHead>{t('juzNumber')}</TableHead>
                      <TableHead>{t('memorization')}</TableHead>
                      <TableHead>{t('mastery')}</TableHead>
                      <TableHead className="hidden md:table-cell">Date</TableHead>
                      {canEvaluate() && <TableHead className="w-12"></TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {juzEvaluations.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          {t('noData')}
                        </TableCell>
                      </TableRow>
                    ) : (
                      juzEvaluations.map((eval_) => (
                        <TableRow key={eval_.id} data-testid={`juz-eval-row-${eval_.id}`}>
                          <TableCell className="font-medium">{getStudentName(eval_.student_id)}</TableCell>
                          <TableCell>Juz {eval_.juz_number}</TableCell>
                          <TableCell>
                            <Badge className={getScoreColor(eval_.memorization_score)}>
                              {eval_.memorization_score}%
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={getScoreColor(eval_.mastery_score)}>
                              {eval_.mastery_score}%
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">{formatDate(eval_.date)}</TableCell>
                          {canEvaluate() && (
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteJuzEval(eval_.id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          )}
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

      {/* Page Evaluation Dialog */}
      <Dialog open={pageDialogOpen} onOpenChange={setPageDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('pageEvaluation')}</DialogTitle>
            <DialogDescription>
              Record a page evaluation for a student
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePageSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="student">{t('studentName')} *</Label>
              <Select
                value={pageFormData.student_id}
                onValueChange={(value) => setPageFormData({ ...pageFormData, student_id: value })}
              >
                <SelectTrigger data-testid="page-eval-student-select">
                  <SelectValue placeholder="Select a student" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="page_number">{t('pageNumber')} *</Label>
                <Input
                  id="page_number"
                  type="number"
                  value={pageFormData.page_number}
                  onChange={(e) => setPageFormData({ ...pageFormData, page_number: e.target.value })}
                  required
                  min="1"
                  max="604"
                  data-testid="page-eval-page-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="score">{t('score')} (0-100) *</Label>
                <Input
                  id="score"
                  type="number"
                  value={pageFormData.score}
                  onChange={(e) => setPageFormData({ ...pageFormData, score: e.target.value })}
                  required
                  min="0"
                  max="100"
                  data-testid="page-eval-score-input"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">{t('notes')}</Label>
              <Textarea
                id="notes"
                value={pageFormData.notes}
                onChange={(e) => setPageFormData({ ...pageFormData, notes: e.target.value })}
                placeholder="Optional notes..."
                data-testid="page-eval-notes-input"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setPageDialogOpen(false)}>
                {t('cancel')}
              </Button>
              <Button type="submit" className="bg-primary hover:bg-primary/90" data-testid="save-page-eval-btn">
                {t('save')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Juz Evaluation Dialog */}
      <Dialog open={juzDialogOpen} onOpenChange={setJuzDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('juzEvaluation')}</DialogTitle>
            <DialogDescription>
              Record a juz evaluation for a student
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleJuzSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="student">{t('studentName')} *</Label>
              <Select
                value={juzFormData.student_id}
                onValueChange={(value) => setJuzFormData({ ...juzFormData, student_id: value })}
              >
                <SelectTrigger data-testid="juz-eval-student-select">
                  <SelectValue placeholder="Select a student" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="juz_number">{t('juzNumber')} (1-30) *</Label>
              <Select
                value={juzFormData.juz_number}
                onValueChange={(value) => setJuzFormData({ ...juzFormData, juz_number: value })}
              >
                <SelectTrigger data-testid="juz-eval-juz-select">
                  <SelectValue placeholder="Select Juz" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 30 }, (_, i) => i + 1).map((num) => (
                    <SelectItem key={num} value={num.toString()}>
                      Juz {num}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="memorization_score">{t('memorization')} *</Label>
                <Input
                  id="memorization_score"
                  type="number"
                  value={juzFormData.memorization_score}
                  onChange={(e) => setJuzFormData({ ...juzFormData, memorization_score: e.target.value })}
                  required
                  min="0"
                  max="100"
                  data-testid="juz-eval-mem-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mastery_score">{t('mastery')} *</Label>
                <Input
                  id="mastery_score"
                  type="number"
                  value={juzFormData.mastery_score}
                  onChange={(e) => setJuzFormData({ ...juzFormData, mastery_score: e.target.value })}
                  required
                  min="0"
                  max="100"
                  data-testid="juz-eval-mastery-input"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">{t('notes')}</Label>
              <Textarea
                id="notes"
                value={juzFormData.notes}
                onChange={(e) => setJuzFormData({ ...juzFormData, notes: e.target.value })}
                placeholder="Optional notes..."
                data-testid="juz-eval-notes-input"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setJuzDialogOpen(false)}>
                {t('cancel')}
              </Button>
              <Button type="submit" className="bg-primary hover:bg-primary/90" data-testid="save-juz-eval-btn">
                {t('save')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Evaluations;
