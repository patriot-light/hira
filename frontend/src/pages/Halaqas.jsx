import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { halaqasAPI, teachersAPI, studentsAPI } from '../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Edit, 
  Trash2, 
  BookOpen,
  Users,
  Calendar,
  Clock,
  Loader2,
  UserPlus,
  UserMinus
} from 'lucide-react';
import { toast } from 'sonner';

const DAYS_LIST = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

const Halaqas = () => {
  const { t } = useTranslation();
  const { canManage } = useAuth();
  const [halaqas, setHalaqas] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [manageStudentsOpen, setManageStudentsOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedHalaqa, setSelectedHalaqa] = useState(null);
  const [halaqaStudents, setHalaqaStudents] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    level: 'beginner',
    teacher_ids: [],
    schedule: []
  });
  const [scheduleDay, setScheduleDay] = useState('');
  const [scheduleStart, setScheduleStart] = useState('');
  const [scheduleEnd, setScheduleEnd] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const halaqasRes = await halaqasAPI.getAll();
      const teachersRes = await teachersAPI.getAll();
      const studentsRes = await studentsAPI.getAll();
      setHalaqas(halaqasRes.data);
      setTeachers(teachersRes.data);
      setAllStudents(studentsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error(t('error'));
    } finally {
      setLoading(false);
    }
  };

  const fetchHalaqaStudents = async (halaqaId) => {
    try {
      const response = await halaqasAPI.getStudents(halaqaId);
      setHalaqaStudents(response.data);
    } catch (error) {
      console.error('Error fetching halaqa students:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedHalaqa) {
        await halaqasAPI.update(selectedHalaqa.id, formData);
        toast.success(t('halaqaUpdated'));
      } else {
        await halaqasAPI.create(formData);
        toast.success(t('halaqaCreated'));
      }
      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || t('error'));
    }
  };

  const handleDelete = async () => {
    try {
      await halaqasAPI.delete(selectedHalaqa.id);
      toast.success(t('halaqaDeleted'));
      setDeleteDialogOpen(false);
      setSelectedHalaqa(null);
      fetchData();
    } catch (error) {
      toast.error(t('error'));
    }
  };

  const handleEdit = (halaqa) => {
    setSelectedHalaqa(halaqa);
    setFormData({
      name: halaqa.name,
      level: halaqa.level,
      teacher_ids: halaqa.teacher_ids || [],
      schedule: halaqa.schedule || []
    });
    setDialogOpen(true);
  };

  const handleManageStudents = async (halaqa) => {
    setSelectedHalaqa(halaqa);
    await fetchHalaqaStudents(halaqa.id);
    setManageStudentsOpen(true);
  };

  const handleAssignStudent = async (studentId) => {
    try {
      await halaqasAPI.assignStudent(selectedHalaqa.id, studentId);
      toast.success('Student assigned successfully');
      await fetchHalaqaStudents(selectedHalaqa.id);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || t('error'));
    }
  };

  const handleRemoveStudent = async (studentId) => {
    try {
      await halaqasAPI.removeStudent(selectedHalaqa.id, studentId);
      toast.success('Student removed successfully');
      await fetchHalaqaStudents(selectedHalaqa.id);
      fetchData();
    } catch (error) {
      toast.error(t('error'));
    }
  };

  const resetForm = () => {
    setSelectedHalaqa(null);
    setFormData({ name: '', level: 'beginner', teacher_ids: [], schedule: [] });
    setScheduleDay('');
    setScheduleStart('');
    setScheduleEnd('');
  };

  const addScheduleItem = () => {
    if (scheduleDay && scheduleStart && scheduleEnd) {
      const newSchedule = [...formData.schedule, { day: scheduleDay, start_time: scheduleStart, end_time: scheduleEnd }];
      setFormData({ ...formData, schedule: newSchedule });
      setScheduleDay('');
      setScheduleStart('');
      setScheduleEnd('');
    }
  };

  const removeScheduleItem = (index) => {
    const newSchedule = formData.schedule.filter((_, i) => i !== index);
    setFormData({ ...formData, schedule: newSchedule });
  };

  const getLevelColor = (level) => {
    if (level === 'beginner') return 'bg-blue-100 text-blue-700';
    if (level === 'intermediate') return 'bg-yellow-100 text-yellow-700';
    if (level === 'advanced') return 'bg-green-100 text-green-700';
    return 'bg-gray-100 text-gray-700';
  };

  const getTeacherNames = (teacherIds) => {
    if (!teacherIds || teacherIds.length === 0) return '-';
    const names = teacherIds.map(id => {
      const teacher = teachers.find(t => t.id === id);
      return teacher ? teacher.full_name : null;
    }).filter(Boolean);
    return names.length > 0 ? names.join(', ') : '-';
  };

  const getStudentCount = (halaqaId) => {
    return allStudents.filter(s => s.halaqa_id === halaqaId).length;
  };

  const unassignedStudents = allStudents.filter(s => !s.halaqa_id);

  const filteredHalaqas = halaqas.filter(halaqa =>
    halaqa.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="halaqas-page">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-primary" />
            {t('halaqas')}
          </h1>
          <p className="text-muted-foreground mt-1">{halaqas.length} {t('halaqas')}</p>
        </div>
        {canManage() && (
          <Button 
            onClick={() => { resetForm(); setDialogOpen(true); }}
            className="gap-2 bg-primary hover:bg-primary/90"
            data-testid="add-halaqa-btn"
          >
            <Plus className="h-4 w-4" />
            {t('addHalaqa')}
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="ps-10"
              data-testid="search-halaqas-input"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredHalaqas.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="p-8 text-center text-muted-foreground">{t('noData')}</CardContent>
          </Card>
        ) : (
          filteredHalaqas.map((halaqa) => (
            <Card key={halaqa.id} className="card-hover" data-testid={`halaqa-card-${halaqa.id}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                      <BookOpen className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{halaqa.name}</CardTitle>
                      <Badge className={getLevelColor(halaqa.level)}>{t(halaqa.level)}</Badge>
                    </div>
                  </div>
                  {canManage() && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" data-testid={`halaqa-actions-${halaqa.id}`}>
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(halaqa)}>
                          <Edit className="h-4 w-4 me-2" />{t('edit')}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleManageStudents(halaqa)}>
                          <Users className="h-4 w-4 me-2" />{t('manageStudents')}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => { setSelectedHalaqa(halaqa); setDeleteDialogOpen(true); }}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 me-2" />{t('delete')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{t('assignedTeachers')}:</span>
                  <span className="truncate">{getTeacherNames(halaqa.teacher_ids)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{t('studentsCount')}:</span>
                  <Badge variant="outline">{getStudentCount(halaqa.id)}</Badge>
                </div>
                {halaqa.schedule && halaqa.schedule.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" /><span>{t('schedule')}:</span>
                    </div>
                    <div className="space-y-1">
                      {halaqa.schedule.map((s, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm bg-muted/50 rounded-lg px-3 py-1.5">
                          <span className="font-medium capitalize">{t(s.day)}</span>
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span>{s.start_time} - {s.end_time}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedHalaqa ? t('editHalaqa') : t('addHalaqa')}</DialogTitle>
            <DialogDescription>
              {selectedHalaqa ? 'Update halaqa information' : 'Create a new study circle'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t('halaqaName')} *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                data-testid="halaqa-name-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="level">{t('level')} *</Label>
              <Select value={formData.level} onValueChange={(value) => setFormData({ ...formData, level: value })}>
                <SelectTrigger data-testid="halaqa-level-select"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">{t('beginner')}</SelectItem>
                  <SelectItem value="intermediate">{t('intermediate')}</SelectItem>
                  <SelectItem value="advanced">{t('advanced')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('assignedTeachers')}</Label>
              <Select
                value={formData.teacher_ids[0] || ''}
                onValueChange={(value) => setFormData({ ...formData, teacher_ids: value ? [value] : [] })}
              >
                <SelectTrigger data-testid="halaqa-teacher-select">
                  <SelectValue placeholder="Select a teacher" />
                </SelectTrigger>
                <SelectContent>
                  {teachers.map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id}>{teacher.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-3">
              <Label>{t('schedule')}</Label>
              {formData.schedule.map((item, index) => (
                <div key={index} className="flex items-center gap-2 bg-muted rounded-lg p-2">
                  <span className="flex-1 text-sm capitalize">{t(item.day)}: {item.start_time} - {item.end_time}</span>
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeScheduleItem(index)} className="h-8 w-8">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <div className="grid grid-cols-3 gap-2">
                <Select value={scheduleDay} onValueChange={setScheduleDay}>
                  <SelectTrigger><SelectValue placeholder={t('day')} /></SelectTrigger>
                  <SelectContent>
                    {DAYS_LIST.map((day) => (<SelectItem key={day} value={day}>{t(day)}</SelectItem>))}
                  </SelectContent>
                </Select>
                <Input type="time" value={scheduleStart} onChange={(e) => setScheduleStart(e.target.value)} placeholder={t('startTime')} />
                <Input type="time" value={scheduleEnd} onChange={(e) => setScheduleEnd(e.target.value)} placeholder={t('endTime')} />
              </div>
              <Button type="button" variant="outline" onClick={addScheduleItem} className="w-full">
                <Plus className="h-4 w-4 me-2" />Add Schedule
              </Button>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>{t('cancel')}</Button>
              <Button type="submit" className="bg-primary hover:bg-primary/90" data-testid="save-halaqa-btn">{t('save')}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={manageStudentsOpen} onOpenChange={setManageStudentsOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('manageStudents')}: {selectedHalaqa?.name}</DialogTitle>
            <DialogDescription>Add or remove students from this halaqa</DialogDescription>
          </DialogHeader>
          <Tabs defaultValue="current" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="current">Current ({halaqaStudents.length})</TabsTrigger>
              <TabsTrigger value="add">Add ({unassignedStudents.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="current" className="space-y-2 mt-4">
              {halaqaStudents.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No students assigned</p>
              ) : (
                halaqaStudents.map((student) => (
                  <div key={student.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span className="font-medium">{student.full_name}</span>
                    <Button variant="ghost" size="sm" onClick={() => handleRemoveStudent(student.id)} className="text-destructive hover:text-destructive" data-testid={`remove-student-${student.id}`}>
                      <UserMinus className="h-4 w-4 me-1" />Remove
                    </Button>
                  </div>
                ))
              )}
            </TabsContent>
            <TabsContent value="add" className="space-y-2 mt-4">
              {unassignedStudents.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No unassigned students</p>
              ) : (
                unassignedStudents.map((student) => (
                  <div key={student.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span className="font-medium">{student.full_name}</span>
                    <Button variant="ghost" size="sm" onClick={() => handleAssignStudent(student.id)} className="text-primary hover:text-primary" data-testid={`assign-student-${student.id}`}>
                      <UserPlus className="h-4 w-4 me-1" />Add
                    </Button>
                  </div>
                ))
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('confirm')}</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedHalaqa?.name}? Students will be unassigned but not deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>{t('cancel')}</Button>
            <Button variant="destructive" onClick={handleDelete} data-testid="confirm-delete-halaqa-btn">{t('delete')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Halaqas;
