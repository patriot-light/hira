import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { reportsAPI, halaqasAPI, sessionsAPI } from '../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Progress } from '../components/ui/progress';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { 
  Users, 
  GraduationCap, 
  BookOpen, 
  Mic2, 
  TrendingUp, 
  Calendar,
  ClipboardCheck,
  Award,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  FileBarChart,
  PlusCircle
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const Dashboard = () => {
  const { t } = useTranslation();
  const { user, isAdmin, isStaff, isTeacher, isStudent } = useAuth();
  const [stats, setStats] = useState(null);
  const [halaqas, setHalaqas] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, halaqasRes, sessionsRes] = await Promise.all([
        reportsAPI.getDashboard(),
        halaqasAPI.getAll(),
        sessionsAPI.getAll()
      ]);
      setStats(statsRes.data);
      setHalaqas(halaqasRes.data);
      setSessions(sessionsRes.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#12a89d', '#2ab572', '#d97706', '#ef4444'];

  const quickActions = [
    {
      to: "/students",
      icon: Users,
      title: t("students"),
      detail: `${stats?.total_students ?? 0} ${t("students")}`,
      color: "text-primary bg-primary/10",
      roles: ["admin", "staff", "teacher", "exam_teacher"],
    },
    {
      to: "/evaluations",
      icon: ClipboardCheck,
      title: t("startExam"),
      detail: t("newExamDescription"),
      color: "text-secondary bg-secondary/10",
      roles: ["admin", "staff", "teacher", "exam_teacher"],
    },
    {
      to: "/sessions",
      icon: Mic2,
      title: t("addSession"),
      detail: `${stats?.total_sessions ?? sessions.length} ${t("sessions")}`,
      color: "text-accent bg-accent/10",
      roles: ["admin", "staff", "teacher"],
    },
    {
      to: "/reports",
      icon: FileBarChart,
      title: t("reports"),
      detail: t("reportsDescription"),
      color: "text-sky-600 bg-sky-100",
      roles: ["admin", "staff", "teacher"],
    },
  ].filter((action) => action.roles.includes(user?.role));

  const getLevelColor = (level) => {
    switch (level) {
      case 'beginner': return 'bg-blue-100 text-blue-700';
      case 'intermediate': return 'bg-yellow-100 text-yellow-700';
      case 'advanced': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
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

  // Prepare chart data from sessions
  const chartData = sessions.slice(-7).map((session, index) => ({
    name: `${t('sessions')} ${index + 1}`,
    score: session.final_score || 0
  }));

  // Error breakdown pie chart data
  const errorData = sessions.reduce((acc, session) => {
    (session.errors || []).forEach(error => {
      const existing = acc.find(e => e.name === error.category);
      if (existing) {
        existing.value += 1;
      } else {
        acc.push({ name: error.category, value: 1 });
      }
    });
    return acc;
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse-soft text-primary">{t('loading')}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="dashboard">
      {/* Welcome Section */}
      <div className="page-hero rounded-lg p-5 md:p-7">
        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr] xl:items-stretch">
          <div className="max-w-3xl">
            <Badge className="mb-4 bg-white/80 text-primary hover:bg-white/80" variant="outline">
              <CheckCircle2 className="me-1 h-3.5 w-3.5" />
              {t(user?.role)}
            </Badge>
            <h1 className="text-3xl font-bold leading-tight text-foreground md:text-4xl">
              {t('welcomeBack')}, {user?.full_name}
            </h1>
            <p className="mt-3 text-base font-medium text-slate-600 md:text-lg">
              {isStudent() 
                ? t('trackMemorizationProgress')
                : t('instituteOverview')}
            </p>
            {quickActions.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2">
                <Button asChild className="gap-2">
                  <Link to={quickActions[0].to}>
                    <PlusCircle className="h-4 w-4" />
                    {quickActions[0].title}
                  </Link>
                </Button>
                <Button asChild variant="outline" className="gap-2 bg-white/80">
                  <Link to="/halaqas">
                    <BookOpen className="h-4 w-4" />
                    {t("halaqas")}
                  </Link>
                </Button>
              </div>
            )}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-white/70 bg-white/80 p-4">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Calendar className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs font-bold uppercase text-muted-foreground">
                    {t('todaySchedule')}
                  </p>
                  <p className="text-lg font-bold">{sessions.length}</p>
                </div>
              </div>
            </div>
            <div className="rounded-lg border border-white/70 bg-white/80 p-4">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-accent/10 text-accent">
                  <Clock3 className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs font-bold uppercase text-muted-foreground">
                    {t('recentActivity')}
                  </p>
                  <p className="text-lg font-bold">{halaqas.length}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {quickActions.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {quickActions.map((action) => (
            <Link
              key={action.to}
              to={action.to}
              className="task-tile group rounded-lg p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <span className={`flex h-14 w-14 items-center justify-center rounded-lg ${action.color}`}>
                  <action.icon className="h-6 w-6" />
                </span>
                <ArrowUpRight className="h-5 w-5 text-muted-foreground transition group-hover:text-primary" />
              </div>
              <h3 className="mt-5 text-xl font-bold text-foreground">{action.title}</h3>
              <p className="mt-2 line-clamp-2 text-sm font-medium text-muted-foreground">
                {action.detail}
              </p>
            </Link>
          ))}
        </div>
      )}

      {/* Stats Cards - Bento Grid */}
      {(isAdmin() || isStaff()) && stats && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card className="metric-card card-hover animate-fade-in stagger-1 border-primary/15">
            <CardContent className="relative p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-muted-foreground">{t('students')}</p>
                  <p className="mt-2 text-4xl font-bold">{stats.total_students}</p>
                  <p className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-primary">
                    <ArrowUpRight className="h-3.5 w-3.5" />
                    {t('active')}
                  </p>
                </div>
                <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Users className="h-7 w-7" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="metric-card card-hover animate-fade-in stagger-2 border-secondary/15">
            <CardContent className="relative p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-muted-foreground">{t('teachers')}</p>
                  <p className="mt-2 text-4xl font-bold">{stats.total_teachers}</p>
                  <p className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-secondary">
                    <ArrowUpRight className="h-3.5 w-3.5" />
                    {t('staff')}
                  </p>
                </div>
                <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
                  <GraduationCap className="h-7 w-7" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="metric-card card-hover animate-fade-in stagger-3 border-accent/15">
            <CardContent className="relative p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-muted-foreground">{t('halaqas')}</p>
                  <p className="mt-2 text-4xl font-bold">{stats.total_halaqas}</p>
                  <p className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-accent">
                    <ArrowUpRight className="h-3.5 w-3.5" />
                    {t('schedule')}
                  </p>
                </div>
                <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-accent/10 text-accent">
                  <BookOpen className="h-7 w-7" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="metric-card card-hover animate-fade-in stagger-4 border-sky-200">
            <CardContent className="relative p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-muted-foreground">{t('sessions')}</p>
                  <p className="mt-2 text-4xl font-bold">{stats.total_sessions}</p>
                  <p className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-sky-600">
                    <ArrowUpRight className="h-3.5 w-3.5" />
                    {t('totalSessions')}
                  </p>
                </div>
                <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-sky-100 text-sky-600">
                  <Mic2 className="h-7 w-7" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Progress Chart - Takes 2 columns */}
        <Card className="soft-panel lg:col-span-2 card-hover animate-fade-in">
          <CardHeader className="border-b border-border/70">
            <CardTitle className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <TrendingUp className="h-5 w-5" />
              </span>
              {t('progressChart')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#12a89d" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#12a89d" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px'
                    }} 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="score" 
                    stroke="#12a89d" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorScore)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Error Breakdown */}
        {errorData.length > 0 && (
          <Card className="soft-panel card-hover animate-fade-in">
            <CardHeader className="border-b border-border/70">
              <CardTitle className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
                  <ClipboardCheck className="h-5 w-5" />
                </span>
                {t('errorBreakdown')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={errorData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {errorData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-2 justify-center mt-2">
                {errorData.map((entry, index) => (
                  <Badge 
                    key={entry.name} 
                    variant="outline"
                    className="text-xs"
                    style={{ borderColor: COLORS[index % COLORS.length] }}
                  >
                    {t(entry.name)}: {entry.value}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Halaqas Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Halaqas List */}
        <Card className="soft-panel card-hover animate-fade-in">
          <CardHeader className="border-b border-border/70">
            <CardTitle className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <BookOpen className="h-5 w-5" />
              </span>
              {isStudent() ? t('myProgress') : t('halaqas')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {halaqas.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">{t('noData')}</p>
            ) : (
              halaqas.slice(0, 4).map((halaqa) => (
                <div 
                  key={halaqa.id} 
                  className="flex items-center justify-between gap-3 rounded-lg border border-border/70 bg-white/70 p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center">
                      <BookOpen className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{halaqa.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {halaqa.schedule?.length || 0} {t('days')}
                      </p>
                    </div>
                  </div>
                  <Badge className={getLevelColor(halaqa.level)}>
                    {t(halaqa.level)}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Recent Sessions */}
        <Card className="soft-panel card-hover animate-fade-in">
          <CardHeader className="border-b border-border/70">
            <CardTitle className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
                <Mic2 className="h-5 w-5" />
              </span>
              {t('recentActivity')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {sessions.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">{t('noData')}</p>
            ) : (
              sessions.slice(-4).reverse().map((session) => (
                <div 
                  key={session.id} 
                  className="flex items-center justify-between gap-3 rounded-lg border border-border/70 bg-white/70 p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-lg bg-secondary/10 flex items-center justify-center">
                      <Award className="h-5 w-5 text-secondary" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {t('tasmee')}: {session.from_page} - {session.to_page}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {session.duration_minutes} {t('minutes')}
                      </p>
                    </div>
                  </div>
                  <div className="text-end">
                    <p className="font-bold text-primary">{session.final_score?.toFixed(0)}%</p>
                    <Badge className={getResultColor(session.result)} variant="outline">
                      {t(session.result)}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Average Scores */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="soft-panel card-hover animate-fade-in">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-muted-foreground">
                  {t('averageScore')} ({t('pageEvaluation')})
                </span>
                <span className="text-2xl font-bold text-primary">
                  {stats.average_page_score}%
                </span>
              </div>
              <Progress value={stats.average_page_score} className="h-2" />
            </CardContent>
          </Card>

          <Card className="soft-panel card-hover animate-fade-in">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-muted-foreground">
                  {t('averageScore')} ({t('tasmee')})
                </span>
                <span className="text-2xl font-bold text-secondary">
                  {stats.average_session_score}%
                </span>
              </div>
              <Progress value={stats.average_session_score} className="h-2 [&>div]:bg-secondary" />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
