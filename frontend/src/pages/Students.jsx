import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { studentsAPI, halaqasAPI, exportAPI } from '../services/api';
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
  Download,
  FileSpreadsheet,
  FileText,
  Users,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

const Students = () => {
  const { t } = useTranslation();
  const { canManage } = useAuth();
  const [students, setStudents] = useState([]);
  const [halaqas, setHalaqas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [formData, setFormData] = useState({
    full_name: '',
    age: '',
    national_id: '',
    phone: '',
    email: '',
    password: '',
    status: 'active',
    halaqa_id: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [studentsRes, halaqasRes] = await Promise.all([
        studentsAPI.getAll(),
        halaqasAPI.getAll()
      ]);
      setStudents(studentsRes.data);
      setHalaqas(halaqasRes.data);
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
      const data = {
        ...formData,
        age: parseInt(formData.age) || 0,
        halaqa_id: formData.halaqa_id || null,
        password: formData.password || null
      };

      if (selectedStudent) {
        await studentsAPI.update(selectedStudent.id, data);
        toast.success(t('studentUpdated'));
      } else {
        await studentsAPI.create(data);
        toast.success(t('studentCreated'));
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
      await studentsAPI.delete(selectedStudent.id);
      toast.success(t('studentDeleted'));
      setDeleteDialogOpen(false);
      setSelectedStudent(null);
      fetchData();
    } catch (error) {
      toast.error(t('error'));
    }
  };

  const handleEdit = (student) => {
    setSelectedStudent(student);
    setFormData({
      full_name: student.full_name,
      age: student.age?.toString() || '',
      national_id: student.national_id || '',
      phone: student.phone || '',
      email: student.email || '',
      password: '',
      status: student.status || 'active',
      halaqa_id: student.halaqa_id || ''
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setSelectedStudent(null);
    setFormData({
      full_name: '',
      age: '',
      national_id: '',
      phone: '',
      email: '',
      password: '',
      status: 'active',
      halaqa_id: ''
    });
  };
      email: '',
      status: 'active',
      halaqa_id: ''
    });
  };

  const handleExportExcel = async () => {
    try {
      const response = await exportAPI.studentsExcel();
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'students.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success(t('success'));
    } catch (error) {
      toast.error(t('error'));
    }
  };

  const handleExportPdf = async () => {
    try {
      const response = await exportAPI.studentsPdf();
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'students.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success(t('success'));
    } catch (error) {
      toast.error(t('error'));
    }
  };

  const filteredStudents = students.filter(student =>
    student.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.national_id?.includes(searchQuery)
  );

  const getHalaqaName = (halaqaId) => {
    const halaqa = halaqas.find(h => h.id === halaqaId);
    return halaqa?.name || '-';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="students-page">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" />
            {t('students')}
          </h1>
          <p className="text-muted-foreground mt-1">
            {students.length} {t('students')}
          </p>
        </div>
        <div className="flex gap-2">
          {canManage() && (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2" data-testid="export-btn">
                    <Download className="h-4 w-4" />
                    {t('export')}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleExportExcel} data-testid="export-excel-btn">
                    <FileSpreadsheet className="h-4 w-4 me-2" />
                    {t('exportExcel')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportPdf} data-testid="export-pdf-btn">
                    <FileText className="h-4 w-4 me-2" />
                    {t('exportPdf')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button 
                onClick={() => { resetForm(); setDialogOpen(true); }}
                className="gap-2 bg-primary hover:bg-primary/90"
                data-testid="add-student-btn"
              >
                <Plus className="h-4 w-4" />
                {t('addStudent')}
              </Button>
            </>
          )}
        </div>
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
              data-testid="search-students-input"
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('fullName')}</TableHead>
                  <TableHead>{t('age')}</TableHead>
                  <TableHead className="hidden md:table-cell">{t('phone')}</TableHead>
                  <TableHead className="hidden md:table-cell">{t('halaqas')}</TableHead>
                  <TableHead>{t('status')}</TableHead>
                  {canManage() && <TableHead className="w-12">{t('actions')}</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      {t('noData')}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStudents.map((student) => (
                    <TableRow key={student.id} data-testid={`student-row-${student.id}`}>
                      <TableCell className="font-medium">{student.full_name}</TableCell>
                      <TableCell>{student.age}</TableCell>
                      <TableCell className="hidden md:table-cell">{student.phone || '-'}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        {getHalaqaName(student.halaqa_id)}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={student.status === 'active' ? 'default' : 'secondary'}
                          className={student.status === 'active' ? 'bg-green-100 text-green-700' : ''}
                        >
                          {t(student.status)}
                        </Badge>
                      </TableCell>
                      {canManage() && (
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" data-testid={`student-actions-${student.id}`}>
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEdit(student)}>
                                <Edit className="h-4 w-4 me-2" />
                                {t('edit')}
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => { setSelectedStudent(student); setDeleteDialogOpen(true); }}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 me-2" />
                                {t('delete')}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedStudent ? t('editStudent') : t('addStudent')}
            </DialogTitle>
            <DialogDescription>
              {selectedStudent ? 'Update student information' : 'Add a new student to the institute'}
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
                  data-testid="student-name-input"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="age">{t('age')} *</Label>
                  <Input
                    id="age"
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    required
                    min="1"
                    data-testid="student-age-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">{t('status')}</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger data-testid="student-status-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">{t('active')}</SelectItem>
                      <SelectItem value="inactive">{t('inactive')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="national_id">{t('nationalId')}</Label>
                <Input
                  id="national_id"
                  value={formData.national_id}
                  onChange={(e) => setFormData({ ...formData, national_id: e.target.value })}
                  data-testid="student-national-id-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">{t('phone')}</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  data-testid="student-phone-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">{t('email')}</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  data-testid="student-email-input"
                />
              </div>
              {!selectedStudent && (
                <div className="space-y-2">
                  <Label htmlFor="password">{t('password')}</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Set password for student login"
                    data-testid="student-password-input"
                  />
                  <p className="text-xs text-muted-foreground">Provide email and password to create login account</p>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="halaqa">{t('assignToHalaqa')}</Label>
                <Select
                  value={formData.halaqa_id}
                  onValueChange={(value) => setFormData({ ...formData, halaqa_id: value })}
                >
                  <SelectTrigger data-testid="student-halaqa-select">
                    <SelectValue placeholder="Select a halaqa" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {halaqas.map((halaqa) => (
                      <SelectItem key={halaqa.id} value={halaqa.id}>
                        {halaqa.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                {t('cancel')}
              </Button>
              <Button type="submit" className="bg-primary hover:bg-primary/90" data-testid="save-student-btn">
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
              Are you sure you want to delete {selectedStudent?.full_name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              {t('cancel')}
            </Button>
            <Button variant="destructive" onClick={handleDelete} data-testid="confirm-delete-btn">
              {t('delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Students;
