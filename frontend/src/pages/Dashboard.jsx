import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { reportsAPI, halaqasAPI, sessionsAPI } from '../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Progress } from '../components/ui/progress';
import { Badge } from '../components/ui/badge';
import { 
  Users, 
  GraduationCap, 
  BookOpen, 
  Mic2, 
  TrendingUp, 
  Calendar,
  ClipboardCheck,
  Award
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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            {t('welcomeBack')}, {user?.full_name}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isStudent() 
              ? t('trackMemorizationProgress')
              : t('instituteOverview')}
          </p>
        </div>
        <Badge variant="outline" className="w-fit capitalize">
          {t(user?.role)}
        </Badge>
      </div>

      {/* Stats Cards - Bento Grid */}
      {(isAdmin() || isStaff()) && stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="card-hover animate-fade-in stagger-1">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary/10">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total_students}</p>
                  <p className="text-sm text-muted-foreground">{t('students')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover animate-fade-in stagger-2">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-secondary/10">
                  <GraduationCap className="h-5 w-5 text-secondary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total_teachers}</p>
                  <p className="text-sm text-muted-foreground">{t('teachers')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover animate-fade-in stagger-3">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-accent/10">
                  <BookOpen className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total_halaqas}</p>
                  <p className="text-sm text-muted-foreground">{t('halaqas')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover animate-fade-in stagger-4">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-100">
                  <Mic2 className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total_sessions}</p>
                  <p className="text-sm text-muted-foreground">{t('sessions')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Progress Chart - Takes 2 columns */}
        <Card className="lg:col-span-2 card-hover animate-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
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
          <Card className="card-hover animate-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardCheck className="h-5 w-5 text-primary" />
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
        <Card className="card-hover animate-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
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
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
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
        <Card className="card-hover animate-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mic2 className="h-5 w-5 text-primary" />
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
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center">
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
          <Card className="card-hover animate-fade-in">
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

          <Card className="card-hover animate-fade-in">
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
