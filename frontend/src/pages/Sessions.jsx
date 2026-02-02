import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { sessionsAPI, studentsAPI, teachersAPI } from '../services/api';
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
  Mic2,
  Loader2,
  Trash2,
  AlertCircle,
  Clock,
  FileText
} from 'lucide-react';
import { toast } from 'sonner';

const ERROR_CATEGORIES = [
  { value: 'idgham', label: 'idgham' },
  { value: 'ikhfa', label: 'ikhfa' },
  { value: 'iqlab', label: 'iqlab' },
  { value: 'madd', label: 'madd' },
  { value: 'ghunnah', label: 'ghunnah' },
  { value: 'makharij', label: 'makharij' },
  { value: 'memorization', label: 'memorizationError' },
  { value: 'pronunciation', label: 'pronunciationError' }
];

const Sessions = () => {
  const { t } = useTranslation();
  const { canEvaluate, isStudent } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [formData, setFormData] = useState({
    student_id: '',
    teacher_id: '',
    duration_minutes: '',
    from_page: '',
    to_page: '',
    errors: []
  });
  const [currentError, setCurrentError] = useState({
    category: '',
    description: '',
    page_number: '',
    word: '',
    penalty: '1'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [sessionsRes, studentsRes, teachersRes] = await Promise.all([
        sessionsAPI.getAll(),
        studentsAPI.getAll(),
        teachersAPI.getAll()
      ]);
      setSessions(sessionsRes.data);
      setStudents(studentsRes.data);
      setTeachers(teachersRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error(t('error'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await sessionsAPI.create({
        ...formData,
        duration_minutes: parseInt(formData.duration_minutes),
        from_page: parseInt(formData.from_page),
        to_page: parseInt(formData.to_page),
        errors: formData.errors.map(err => ({
          ...err,
          page_number: parseInt(err.page_number),
          penalty: parseFloat(err.penalty)
        }))
      });
      toast.success(t('sessionCreated'));
      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || t('error'));
    }
  };

  const handleDelete = async (id) => {
    try {
      await sessionsAPI.delete(id);
      toast.success('Session deleted');
      fetchData();
    } catch (error) {
      toast.error(t('error'));
    }
  };

  const addError = () => {
    if (currentError.category && currentError.page_number) {
      setFormData({
        ...formData,
        errors: [...formData.errors, { ...currentError, id: Date.now().toString() }]
      });
      setCurrentError({
        category: '',
        description: '',
        page_number: '',
        word: '',
        penalty: '1'
      });
    }
  };

  const removeError = (index) => {
    setFormData({
      ...formData,
      errors: formData.errors.filter((_, i) => i !== index)
    });
  };

  const resetForm = () => {
    setFormData({
      student_id: '',
      teacher_id: '',
      duration_minutes: '',
      from_page: '',
      to_page: '',
      errors: []
    });
    setCurrentError({
      category: '',
      description: '',
      page_number: '',
      word: '',
      penalty: '1'
    });
  };

  const viewDetails = (session) => {
    setSelectedSession(session);
    setDetailsOpen(true);
  };

  const getStudentName = (studentId) => {
    const student = students.find(s => s.id === studentId);
    return student?.full_name || '-';
  };

  const getTeacherName = (teacherId) => {
    const teacher = teachers.find(t => t.id === teacherId);
    return teacher?.full_name || '-';
  };

  const getResultColor = (result) => {
    switch (result) {
      case 'excellent': return 'bg-green-100 text-green-700';
      case 'very_good': return 'bg-blue-100 text-blue-700';
      case 'good': return 'bg-yellow-100 text-yellow-700';
      case 'needs_review': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
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
    <div className="space-y-6" data-testid="sessions-page">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-3">
            <Mic2 className="h-8 w-8 text-primary" />
            {t('tasmee')} ({t('sessions')})
          </h1>
          <p className="text-muted-foreground mt-1">
            {sessions.length} {t('sessions')}
          </p>
        </div>
        {canEvaluate() && (
          <Button 
            onClick={() => { resetForm(); setDialogOpen(true); }}
            className="gap-2 bg-primary hover:bg-primary/90"
            data-testid="add-session-btn"
          >
            <Plus className="h-4 w-4" />
            {t('addSession')}
          </Button>
        )}
      </div>

      {/* Sessions Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('studentName')}</TableHead>
                  <TableHead className="hidden md:table-cell">{t('teacherName')}</TableHead>
                  <TableHead>{t('totalPages')}</TableHead>
                  <TableHead>{t('totalErrors')}</TableHead>
                  <TableHead>{t('finalScore')}</TableHead>
                  <TableHead>{t('result')}</TableHead>
                  <TableHead className="w-24">{t('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      {t('noData')}
                    </TableCell>
                  </TableRow>
                ) : (
                  sessions.map((session) => (
                    <TableRow key={session.id} data-testid={`session-row-${session.id}`}>
                      <TableCell className="font-medium">{getStudentName(session.student_id)}</TableCell>
                      <TableCell className="hidden md:table-cell">{getTeacherName(session.teacher_id)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{session.total_pages}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={session.total_errors > 0 ? "destructive" : "outline"}>
                          {session.total_errors}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-bold text-primary">{session.final_score?.toFixed(1)}%</span>
                      </TableCell>
                      <TableCell>
                        <Badge className={getResultColor(session.result)}>
                          {t(session.result)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => viewDetails(session)}
                            data-testid={`view-session-${session.id}`}
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                          {canEvaluate() && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(session.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add Session Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('addSession')}</DialogTitle>
            <DialogDescription>
              Record a new Tasmee' (recitation) session
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('studentName')} *</Label>
                <Select
                  value={formData.student_id}
                  onValueChange={(value) => setFormData({ ...formData, student_id: value })}
                >
                  <SelectTrigger data-testid="session-student-select">
                    <SelectValue placeholder="Select student" />
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
                <Label>{t('teacherName')} *</Label>
                <Select
                  value={formData.teacher_id}
                  onValueChange={(value) => setFormData({ ...formData, teacher_id: value })}
                >
                  <SelectTrigger data-testid="session-teacher-select">
                    <SelectValue placeholder="Select teacher" />
                  </SelectTrigger>
                  <SelectContent>
                    {teachers.map((teacher) => (
                      <SelectItem key={teacher.id} value={teacher.id}>
                        {teacher.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>{t('duration')} ({t('minutes')}) *</Label>
                <Input
                  type="number"
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
                  required
                  min="1"
                  data-testid="session-duration-input"
                />
              </div>
              <div className="space-y-2">
                <Label>{t('fromPage')} *</Label>
                <Input
                  type="number"
                  value={formData.from_page}
                  onChange={(e) => setFormData({ ...formData, from_page: e.target.value })}
                  required
                  min="1"
                  max="604"
                  data-testid="session-from-page-input"
                />
              </div>
              <div className="space-y-2">
                <Label>{t('toPage')} *</Label>
                <Input
                  type="number"
                  value={formData.to_page}
                  onChange={(e) => setFormData({ ...formData, to_page: e.target.value })}
                  required
                  min="1"
                  max="604"
                  data-testid="session-to-page-input"
                />
              </div>
            </div>

            {/* Error Tracking Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
                <Label className="text-lg font-semibold">{t('errorTracking')}</Label>
              </div>
              
              {/* Existing errors */}
              {formData.errors.length > 0 && (
                <div className="space-y-2">
                  {formData.errors.map((error, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                      <div className="flex items-center gap-3">
                        <Badge className="bg-red-100 text-red-700">{t(error.category)}</Badge>
                        <span className="text-sm">Page {error.page_number}</span>
                        {error.word && <span className="text-sm text-muted-foreground">"{error.word}"</span>}
                        <Badge variant="outline">-{error.penalty}</Badge>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeError(index)}
                        className="h-8 w-8 text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add new error */}
              <div className="p-4 border border-dashed rounded-lg space-y-3">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Select
                    value={currentError.category}
                    onValueChange={(value) => setCurrentError({ ...currentError, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('errorCategory')} />
                    </SelectTrigger>
                    <SelectContent>
                      {ERROR_CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {t(cat.label)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    placeholder={t('pageNumber')}
                    value={currentError.page_number}
                    onChange={(e) => setCurrentError({ ...currentError, page_number: e.target.value })}
                  />
                  <Input
                    placeholder={t('word')}
                    value={currentError.word}
                    onChange={(e) => setCurrentError({ ...currentError, word: e.target.value })}
                  />
                  <Input
                    type="number"
                    placeholder={t('penalty')}
                    value={currentError.penalty}
                    onChange={(e) => setCurrentError({ ...currentError, penalty: e.target.value })}
                    min="0"
                    step="0.5"
                  />
                </div>
                <Textarea
                  placeholder="Error description (optional)"
                  value={currentError.description}
                  onChange={(e) => setCurrentError({ ...currentError, description: e.target.value })}
                  className="h-16"
                />
                <Button type="button" variant="outline" onClick={addError} className="w-full">
                  <Plus className="h-4 w-4 me-2" />
                  {t('addError')}
                </Button>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                {t('cancel')}
              </Button>
              <Button type="submit" className="bg-primary hover:bg-primary/90" data-testid="save-session-btn">
                {t('save')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Session Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('sessionDetails')}</DialogTitle>
          </DialogHeader>
          {selectedSession && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">{t('studentName')}</p>
                  <p className="font-medium">{getStudentName(selectedSession.student_id)}</p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">{t('teacherName')}</p>
                  <p className="font-medium">{getTeacherName(selectedSession.teacher_id)}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-muted rounded-lg text-center">
                  <Clock className="h-5 w-5 mx-auto mb-1 text-primary" />
                  <p className="text-sm text-muted-foreground">{t('duration')}</p>
                  <p className="font-bold">{selectedSession.duration_minutes} min</p>
                </div>
                <div className="p-3 bg-muted rounded-lg text-center">
                  <FileText className="h-5 w-5 mx-auto mb-1 text-primary" />
                  <p className="text-sm text-muted-foreground">{t('totalPages')}</p>
                  <p className="font-bold">{selectedSession.total_pages}</p>
                </div>
                <div className="p-3 bg-muted rounded-lg text-center">
                  <AlertCircle className="h-5 w-5 mx-auto mb-1 text-destructive" />
                  <p className="text-sm text-muted-foreground">{t('totalErrors')}</p>
                  <p className="font-bold">{selectedSession.total_errors}</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl">
                <div>
                  <p className="text-sm text-muted-foreground">{t('finalScore')}</p>
                  <p className="text-3xl font-bold text-primary">{selectedSession.final_score?.toFixed(1)}%</p>
                </div>
                <Badge className={`${getResultColor(selectedSession.result)} text-lg px-4 py-2`}>
                  {t(selectedSession.result)}
                </Badge>
              </div>

              {selectedSession.errors && selectedSession.errors.length > 0 && (
                <div className="space-y-2">
                  <p className="font-medium">{t('errorTracking')}:</p>
                  <div className="max-h-40 overflow-y-auto space-y-2">
                    {selectedSession.errors.map((error, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-red-50 rounded-lg text-sm">
                        <Badge className="bg-red-100 text-red-700">{t(error.category)}</Badge>
                        <span>Page {error.page_number}</span>
                        {error.word && <span className="text-muted-foreground">"{error.word}"</span>}
                        <Badge variant="outline" className="ms-auto">-{error.penalty}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Sessions;
