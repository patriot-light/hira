import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      // App
      appName: "Hira Institute",
      appNameAr: "معهد حراء",
      
      // Navigation
      dashboard: "Dashboard",
      students: "Students",
      teachers: "Teachers",
      halaqas: "Halaqas",
      evaluations: "Evaluations",
      sessions: "Sessions",
      reports: "Reports",
      settings: "Settings",
      users: "Users",
      staff: "Staff",
      
      // Auth
      login: "Login",
      logout: "Logout",
      email: "Email",
      password: "Password",
      loginTitle: "Welcome Back",
      loginSubtitle: "Sign in to continue to Hira Institute",
      rememberMe: "Remember me",
      forgotPassword: "Forgot password?",
      
      // Roles
      admin: "Admin",
      teacher: "Teacher",
      student: "Student",
      staffRole: "Staff",
      
      // Common
      save: "Save",
      cancel: "Cancel",
      delete: "Delete",
      edit: "Edit",
      add: "Add",
      search: "Search",
      filter: "Filter",
      export: "Export",
      exportPdf: "Export PDF",
      exportExcel: "Export Excel",
      actions: "Actions",
      status: "Status",
      active: "Active",
      inactive: "Inactive",
      view: "View",
      loading: "Loading...",
      noData: "No data available",
      confirm: "Confirm",
      success: "Success",
      error: "Error",
      
      // Students
      studentName: "Student Name",
      fullName: "Full Name",
      age: "Age",
      nationalId: "National ID",
      phone: "Phone",
      addStudent: "Add Student",
      editStudent: "Edit Student",
      studentDetails: "Student Details",
      assignToHalaqa: "Assign to Halaqa",
      
      // Teachers
      teacherName: "Teacher Name",
      qualification: "Qualification",
      experienceYears: "Years of Experience",
      addTeacher: "Add Teacher",
      editTeacher: "Edit Teacher",
      
      // Halaqas
      halaqaName: "Halaqa Name",
      level: "Level",
      beginner: "Beginner",
      intermediate: "Intermediate",
      advanced: "Advanced",
      schedule: "Schedule",
      assignedTeachers: "Assigned Teachers",
      studentsCount: "Students",
      addHalaqa: "Add Halaqa",
      editHalaqa: "Edit Halaqa",
      manageStudents: "Manage Students",
      
      // Schedule
      day: "Day",
      startTime: "Start Time",
      endTime: "End Time",
      sunday: "Sunday",
      monday: "Monday",
      tuesday: "Tuesday",
      wednesday: "Wednesday",
      thursday: "Thursday",
      friday: "Friday",
      saturday: "Saturday",
      
      // Evaluations
      pageEvaluation: "Page Evaluation",
      juzEvaluation: "Juz Evaluation",
      pageNumber: "Page Number",
      juzNumber: "Juz Number",
      score: "Score",
      memorization: "Memorization",
      mastery: "Mastery",
      notes: "Notes",
      addEvaluation: "Add Evaluation",
      evaluationHistory: "Evaluation History",
      
      // Sessions
      recitationSession: "Recitation Session",
      tasmee: "Tasmee'",
      duration: "Duration",
      minutes: "minutes",
      fromPage: "From Page",
      toPage: "To Page",
      totalPages: "Total Pages",
      totalErrors: "Total Errors",
      finalScore: "Final Score",
      result: "Result",
      addSession: "Add Session",
      sessionDetails: "Session Details",
      
      // Errors
      errorTracking: "Error Tracking",
      errorCategory: "Error Category",
      idgham: "Idgham",
      ikhfa: "Ikhfa",
      iqlab: "Iqlab",
      madd: "Madd",
      ghunnah: "Ghunnah",
      makharij: "Makharij",
      memorizationError: "Memorization",
      pronunciationError: "Pronunciation",
      penalty: "Penalty",
      word: "Word",
      addError: "Add Error",
      
      // Results
      excellent: "Excellent",
      veryGood: "Very Good",
      good: "Good",
      needsReview: "Needs Review",
      
      // Reports
      studentReport: "Student Report",
      halaqaReport: "Halaqa Report",
      teacherReport: "Teacher Report",
      overallPerformance: "Overall Performance",
      progressChart: "Progress Chart",
      errorBreakdown: "Error Breakdown",
      memorization_progress: "Memorization Progress",
      averageScore: "Average Score",
      totalSessions: "Total Sessions",
      
      // Dashboard
      welcomeBack: "Welcome Back",
      quickStats: "Quick Stats",
      recentActivity: "Recent Activity",
      upcomingClasses: "Upcoming Classes",
      myProgress: "My Progress",
      todaySchedule: "Today's Schedule",
      
      // Messages
      studentCreated: "Student created successfully",
      studentUpdated: "Student updated successfully",
      studentDeleted: "Student deleted successfully",
      teacherCreated: "Teacher created successfully",
      teacherUpdated: "Teacher updated successfully",
      teacherDeleted: "Teacher deleted successfully",
      halaqaCreated: "Halaqa created successfully",
      halaqaUpdated: "Halaqa updated successfully",
      halaqaDeleted: "Halaqa deleted successfully",
      evaluationCreated: "Evaluation saved successfully",
      sessionCreated: "Session recorded successfully",
      loginSuccess: "Welcome to Hira Institute!",
      loginError: "Invalid email or password",
    }
  },
  ar: {
    translation: {
      // App
      appName: "معهد حراء",
      appNameAr: "معهد حراء",
      
      // Navigation
      dashboard: "لوحة التحكم",
      students: "الطلاب",
      teachers: "المعلمون",
      halaqas: "الحلقات",
      evaluations: "التقييمات",
      sessions: "الجلسات",
      reports: "التقارير",
      settings: "الإعدادات",
      users: "المستخدمون",
      staff: "الموظفون",
      
      // Auth
      login: "تسجيل الدخول",
      logout: "تسجيل الخروج",
      email: "البريد الإلكتروني",
      password: "كلمة المرور",
      loginTitle: "مرحباً بعودتك",
      loginSubtitle: "سجل دخولك للمتابعة إلى معهد حراء",
      rememberMe: "تذكرني",
      forgotPassword: "نسيت كلمة المرور؟",
      
      // Roles
      admin: "مدير",
      teacher: "معلم",
      student: "طالب",
      staffRole: "موظف",
      
      // Common
      save: "حفظ",
      cancel: "إلغاء",
      delete: "حذف",
      edit: "تعديل",
      add: "إضافة",
      search: "بحث",
      filter: "تصفية",
      export: "تصدير",
      exportPdf: "تصدير PDF",
      exportExcel: "تصدير Excel",
      actions: "الإجراءات",
      status: "الحالة",
      active: "نشط",
      inactive: "غير نشط",
      view: "عرض",
      loading: "جاري التحميل...",
      noData: "لا توجد بيانات",
      confirm: "تأكيد",
      success: "نجاح",
      error: "خطأ",
      
      // Students
      studentName: "اسم الطالب",
      fullName: "الاسم الكامل",
      age: "العمر",
      nationalId: "رقم الهوية",
      phone: "الهاتف",
      addStudent: "إضافة طالب",
      editStudent: "تعديل طالب",
      studentDetails: "تفاصيل الطالب",
      assignToHalaqa: "تعيين في حلقة",
      
      // Teachers
      teacherName: "اسم المعلم",
      qualification: "المؤهل",
      experienceYears: "سنوات الخبرة",
      addTeacher: "إضافة معلم",
      editTeacher: "تعديل معلم",
      
      // Halaqas
      halaqaName: "اسم الحلقة",
      level: "المستوى",
      beginner: "مبتدئ",
      intermediate: "متوسط",
      advanced: "متقدم",
      schedule: "الجدول",
      assignedTeachers: "المعلمون المعينون",
      studentsCount: "الطلاب",
      addHalaqa: "إضافة حلقة",
      editHalaqa: "تعديل حلقة",
      manageStudents: "إدارة الطلاب",
      
      // Schedule
      day: "اليوم",
      startTime: "وقت البدء",
      endTime: "وقت الانتهاء",
      sunday: "الأحد",
      monday: "الاثنين",
      tuesday: "الثلاثاء",
      wednesday: "الأربعاء",
      thursday: "الخميس",
      friday: "الجمعة",
      saturday: "السبت",
      
      // Evaluations
      pageEvaluation: "تقييم الصفحة",
      juzEvaluation: "تقييم الجزء",
      pageNumber: "رقم الصفحة",
      juzNumber: "رقم الجزء",
      score: "الدرجة",
      memorization: "الحفظ",
      mastery: "الإتقان",
      notes: "ملاحظات",
      addEvaluation: "إضافة تقييم",
      evaluationHistory: "سجل التقييمات",
      
      // Sessions
      recitationSession: "جلسة التسميع",
      tasmee: "التسميع",
      duration: "المدة",
      minutes: "دقيقة",
      fromPage: "من صفحة",
      toPage: "إلى صفحة",
      totalPages: "إجمالي الصفحات",
      totalErrors: "إجمالي الأخطاء",
      finalScore: "الدرجة النهائية",
      result: "النتيجة",
      addSession: "إضافة جلسة",
      sessionDetails: "تفاصيل الجلسة",
      
      // Errors
      errorTracking: "تتبع الأخطاء",
      errorCategory: "نوع الخطأ",
      idgham: "إدغام",
      ikhfa: "إخفاء",
      iqlab: "إقلاب",
      madd: "مد",
      ghunnah: "غنة",
      makharij: "مخارج",
      memorizationError: "حفظ",
      pronunciationError: "نطق",
      penalty: "الخصم",
      word: "الكلمة",
      addError: "إضافة خطأ",
      
      // Results
      excellent: "ممتاز",
      veryGood: "جيد جداً",
      good: "جيد",
      needsReview: "يحتاج مراجعة",
      
      // Reports
      studentReport: "تقرير الطالب",
      halaqaReport: "تقرير الحلقة",
      teacherReport: "تقرير المعلم",
      overallPerformance: "الأداء العام",
      progressChart: "مخطط التقدم",
      errorBreakdown: "تحليل الأخطاء",
      memorization_progress: "تقدم الحفظ",
      averageScore: "متوسط الدرجات",
      totalSessions: "إجمالي الجلسات",
      
      // Dashboard
      welcomeBack: "مرحباً بعودتك",
      quickStats: "إحصائيات سريعة",
      recentActivity: "النشاط الأخير",
      upcomingClasses: "الحلقات القادمة",
      myProgress: "تقدمي",
      todaySchedule: "جدول اليوم",
      
      // Messages
      studentCreated: "تم إنشاء الطالب بنجاح",
      studentUpdated: "تم تحديث الطالب بنجاح",
      studentDeleted: "تم حذف الطالب بنجاح",
      teacherCreated: "تم إنشاء المعلم بنجاح",
      teacherUpdated: "تم تحديث المعلم بنجاح",
      teacherDeleted: "تم حذف المعلم بنجاح",
      halaqaCreated: "تم إنشاء الحلقة بنجاح",
      halaqaUpdated: "تم تحديث الحلقة بنجاح",
      halaqaDeleted: "تم حذف الحلقة بنجاح",
      evaluationCreated: "تم حفظ التقييم بنجاح",
      sessionCreated: "تم تسجيل الجلسة بنجاح",
      loginSuccess: "مرحباً بك في معهد حراء!",
      loginError: "البريد الإلكتروني أو كلمة المرور غير صحيحة",
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: localStorage.getItem('language') || 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
