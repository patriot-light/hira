import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { teachersAPI } from '../services/api';
import { Card, CardContent } from '../components/ui/card';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
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
  Search, 
  MoreVertical, 
  Edit, 
  Trash2, 
  GraduationCap,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

const Teachers = () => {
  const { t } = useTranslation();
  const { canManage } = useAuth();
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [formData, setFormData] = useState({
    full_name: '',
    qualification: '',
    experience_years: '',
    phone: '',
    email: '',
    password: ''
  });

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      const response = await teachersAPI.getAll();
      setTeachers(response.data);
    } catch (error) {
      console.error('Error fetching teachers:', error);
      toast.error(t('error'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        experience_years: parseInt(formData.experience_years) || 0,
        password: formData.password || null
      };

      if (selectedTeacher) {
        await teachersAPI.update(selectedTeacher.id, data);
        toast.success(t('teacherUpdated'));
      } else {
        await teachersAPI.create(data);
        toast.success(t('teacherCreated'));
      }
      setDialogOpen(false);
      resetForm();
      fetchTeachers();
    } catch (error) {
      toast.error(error.response?.data?.detail || t('error'));
    }
  };

  const handleDelete = async () => {
    try {
      await teachersAPI.delete(selectedTeacher.id);
      toast.success(t('teacherDeleted'));
      setDeleteDialogOpen(false);
      setSelectedTeacher(null);
      fetchTeachers();
    } catch (error) {
      toast.error(t('error'));
    }
  };

  const handleEdit = (teacher) => {
    setSelectedTeacher(teacher);
    setFormData({
      full_name: teacher.full_name,
      qualification: teacher.qualification || '',
      experience_years: teacher.experience_years?.toString() || '',
      phone: teacher.phone || '',
      email: teacher.email || '',
      password: ''
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setSelectedTeacher(null);
    setFormData({
      full_name: '',
      qualification: '',
      experience_years: '',
      phone: '',
      email: '',
      password: ''
    });
  };
      email: ''
    });
  };

  const filteredTeachers = teachers.filter(teacher =>
    teacher.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    teacher.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    teacher.qualification?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="teachers-page">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-3">
            <GraduationCap className="h-8 w-8 text-primary" />
            {t('teachers')}
          </h1>
          <p className="text-muted-foreground mt-1">
            {teachers.length} {t('teachers')}
          </p>
        </div>
        {canManage() && (
          <Button 
            onClick={() => { resetForm(); setDialogOpen(true); }}
            className="gap-2 bg-primary hover:bg-primary/90"
            data-testid="add-teacher-btn"
          >
            <Plus className="h-4 w-4" />
            {t('addTeacher')}
          </Button>
        )}
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="ps-10"
              data-testid="search-teachers-input"
            />
          </div>
        </CardContent>
      </Card>

      {/* Teachers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTeachers.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="p-8 text-center text-muted-foreground">
              {t('noData')}
            </CardContent>
          </Card>
        ) : (
          filteredTeachers.map((teacher) => (
            <Card key={teacher.id} className="card-hover" data-testid={`teacher-card-${teacher.id}`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <GraduationCap className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{teacher.full_name}</h3>
                      <p className="text-sm text-muted-foreground">{teacher.qualification}</p>
                    </div>
                  </div>
                  {canManage() && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" data-testid={`teacher-actions-${teacher.id}`}>
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(teacher)}>
                          <Edit className="h-4 w-4 me-2" />
                          {t('edit')}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => { setSelectedTeacher(teacher); setDeleteDialogOpen(true); }}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 me-2" />
                          {t('delete')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t('experienceYears')}</span>
                    <Badge variant="outline">{teacher.experience_years} years</Badge>
                  </div>
                  {teacher.phone && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{t('phone')}</span>
                      <span>{teacher.phone}</span>
                    </div>
                  )}
                  {teacher.email && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{t('email')}</span>
                      <span className="truncate max-w-[150px]">{teacher.email}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedTeacher ? t('editTeacher') : t('addTeacher')}
            </DialogTitle>
            <DialogDescription>
              {selectedTeacher ? 'Update teacher information' : 'Add a new teacher to the institute'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">{t('fullName')} *</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  required
                  data-testid="teacher-name-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="qualification">{t('qualification')} *</Label>
                <Input
                  id="qualification"
                  value={formData.qualification}
                  onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                  required
                  placeholder="e.g., Hafiz, Ijazah in Hafs"
                  data-testid="teacher-qualification-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="experience_years">{t('experienceYears')}</Label>
                <Input
                  id="experience_years"
                  type="number"
                  value={formData.experience_years}
                  onChange={(e) => setFormData({ ...formData, experience_years: e.target.value })}
                  min="0"
                  data-testid="teacher-experience-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">{t('phone')}</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  data-testid="teacher-phone-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">{t('email')}</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  data-testid="teacher-email-input"
                />
              </div>
              {!selectedTeacher && (
                <div className="space-y-2">
                  <Label htmlFor="password">{t('password')}</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Set password for teacher login"
                    data-testid="teacher-password-input"
                  />
                  <p className="text-xs text-muted-foreground">Provide email and password to create login account</p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                {t('cancel')}
              </Button>
              <Button type="submit" className="bg-primary hover:bg-primary/90" data-testid="save-teacher-btn">
                {t('save')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('confirm')}</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedTeacher?.full_name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              {t('cancel')}
            </Button>
            <Button variant="destructive" onClick={handleDelete} data-testid="confirm-delete-teacher-btn">
              {t('delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Teachers;
