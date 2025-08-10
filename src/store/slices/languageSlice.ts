import { createSlice, PayloadAction } from "@reduxjs/toolkit";

// Language type
export type Language = "en" | "hi" | "ml";

// Translation interface
export interface Translation {
  nav: {
    home: string;
    complaints: string;
    myComplaints: string;
    trackStatus: string;
    reports: string;
    users: string;
    dashboard: string;
    maintenance: string;
    settings: string;
    logout: string;
    login: string;
    register: string;
  };
  common: {
    submit: string;
    cancel: string;
    edit: string;
    delete: string;
    save: string;
    close: string;
    view: string;
    search: string;
    filter: string;
    loading: string;
    error: string;
    success: string;
    warning: string;
    info: string;
    confirm: string;
    yes: string;
    no: string;
    next: string;
    previous: string;
    page: string;
    of: string;
    total: string;
    items: string;
    noData: string;
    selectAll: string;
    clear: string;
    refresh: string;
    download: string;
    upload: string;
    required: string;
    optional: string;
    status: string;
    priority: string;
    type: string;
    date: string;
    time: string;
    name: string;
    email: string;
    phone: string;
    address: string;
    description: string;
    actions: string;
  };
  complaints: {
    registerComplaint: string;
    complaintId: string;
    complaintType: string;
    complaintStatus: string;
    complaintPriority: string;
    submittedBy: string;
    assignedTo: string;
    submittedOn: string;
    resolvedOn: string;
    deadline: string;
    location: string;
    ward: string;
    area: string;
    landmark: string;
    contactInfo: string;
    mobile: string;
    files: string;
    remarks: string;
    feedback: string;
    rating: string;
    comment: string;
    slaStatus: string;
    timeElapsed: string;
    escalationLevel: string;
    types: {
      Water_Supply: string;
      Electricity: string;
      Road_Repair: string;
      Garbage_Collection: string;
      Street_Lighting: string;
      Sewerage: string;
      Public_Health: string;
      Traffic: string;
      Others: string;
    };
    statuses: {
      registered: string;
      assigned: string;
      in_progress: string;
      resolved: string;
      closed: string;
      reopened: string;
    };
    priorities: {
      low: string;
      medium: string;
      high: string;
      critical: string;
    };
    slaStatuses: {
      ontime: string;
      warning: string;
      overdue: string;
      completed: string;
    };
  };
  auth: {
    login: string;
    register: string;
    logout: string;
    email: string;
    password: string;
    confirmPassword: string;
    forgotPassword: string;
    resetPassword: string;
    profile: string;
    updateProfile: string;
    changePassword: string;
    currentPassword: string;
    newPassword: string;
    fullName: string;
    phoneNumber: string;
    role: string;
    ward: string;
    department: string;
    language: string;
    notifications: string;
    emailAlerts: string;
    avatar: string;
    lastLogin: string;
    joinedOn: string;
    accountStatus: string;
    active: string;
    inactive: string;
    roles: {
      citizen: string;
      admin: string;
      ward_officer: string;
      maintenance: string;
    };
  };
  guest: {
    guestSubmission: string;
    registeredUser: string;
    emailVerification: string;
    otpSent: string;
    otpVerification: string;
    verifyAndSubmit: string;
    sendOtpAndSubmit: string;
    trackComplaint: string;
    guestSubmissionProcess: string;
    guestSubmissionDescription: string;
    welcomeBack: string;
    loginRequired: string;
    loginRequiredDescription: string;
    enterOtp: string;
    resendOtp: string;
    otpExpires: string;
    otpInstructions: string;
    checkEmail: string;
    recentComplaints: string;
    complaintDetails: string;
    nextSteps: string;
    supportContact: string;
  };
  dashboard: {
    overview: string;
    statistics: string;
    recentComplaints: string;
    pendingTasks: string;
    slaCompliance: string;
    performanceMetrics: string;
    quickActions: string;
    notifications: string;
    alerts: string;
    reports: string;
    analytics: string;
    trends: string;
    insights: string;
  };
  reports: {
    complaintReports: string;
    performanceReports: string;
    slaReports: string;
    userReports: string;
    wardReports: string;
    typeReports: string;
    statusReports: string;
    dateRange: string;
    from: string;
    to: string;
    generate: string;
    export: string;
    print: string;
    chart: string;
    table: string;
    summary: string;
    details: string;
  };
  messages: {
    complaintRegistered: string;
    complaintUpdated: string;
    complaintResolved: string;
    profileUpdated: string;
    passwordChanged: string;
    loginSuccessful: string;
    logoutSuccessful: string;
    registrationSuccessful: string;
    emailSent: string;
    fileUploaded: string;
    feedbackSubmitted: string;
    assignmentCompleted: string;
    statusUpdated: string;
    errorOccurred: string;
    networkError: string;
    unauthorizedAccess: string;
    sessionExpired: string;
    validationError: string;
    serverError: string;
  };
}

// Translations
const translations: Record<Language, Translation> = {
  en: {
    nav: {
      home: "Home",
      complaints: "Complaints",
      myComplaints: "My Complaints",
      trackStatus: "Track Status",
      reports: "Reports",
      users: "Users",
      dashboard: "Dashboard",
      maintenance: "Maintenance",
      settings: "Settings",
      logout: "Logout",
      login: "Login",
      register: "Register",
    },
    common: {
      submit: "Submit",
      cancel: "Cancel",
      edit: "Edit",
      delete: "Delete",
      save: "Save",
      close: "Close",
      view: "View",
      search: "Search",
      filter: "Filter",
      loading: "Loading...",
      error: "Error",
      success: "Success",
      warning: "Warning",
      info: "Information",
      confirm: "Confirm",
      yes: "Yes",
      no: "No",
      next: "Next",
      previous: "Previous",
      page: "Page",
      of: "of",
      total: "Total",
      items: "items",
      noData: "No data available",
      selectAll: "Select All",
      clear: "Clear",
      refresh: "Refresh",
      download: "Download",
      upload: "Upload",
      required: "Required",
      optional: "Optional",
      status: "Status",
      priority: "Priority",
      type: "Type",
      date: "Date",
      time: "Time",
      name: "Name",
      email: "Email",
      phone: "Phone",
      address: "Address",
      description: "Description",
      actions: "Actions",
    },
    complaints: {
      registerComplaint: "Register Complaint",
      complaintId: "Complaint ID",
      complaintType: "Complaint Type",
      complaintStatus: "Status",
      complaintPriority: "Priority",
      submittedBy: "Submitted By",
      assignedTo: "Assigned To",
      submittedOn: "Submitted On",
      resolvedOn: "Resolved On",
      deadline: "Deadline",
      location: "Location",
      ward: "Ward",
      area: "Area",
      landmark: "Landmark",
      contactInfo: "Contact Information",
      mobile: "Mobile",
      files: "Files",
      remarks: "Remarks",
      feedback: "Feedback",
      rating: "Rating",
      comment: "Comment",
      slaStatus: "SLA Status",
      timeElapsed: "Time Elapsed",
      escalationLevel: "Escalation Level",
      types: {
        Water_Supply: "Water Supply",
        Electricity: "Electricity",
        Road_Repair: "Road Repair",
        Garbage_Collection: "Garbage Collection",
        Street_Lighting: "Street Lighting",
        Sewerage: "Sewerage",
        Public_Health: "Public Health",
        Traffic: "Traffic",
        Others: "Others",
      },
      statuses: {
        registered: "Registered",
        assigned: "Assigned",
        in_progress: "In Progress",
        resolved: "Resolved",
        closed: "Closed",
        reopened: "Reopened",
      },
      priorities: {
        low: "Low",
        medium: "Medium",
        high: "High",
        critical: "Critical",
      },
      slaStatuses: {
        ontime: "On Time",
        warning: "Warning",
        overdue: "Overdue",
        completed: "Completed",
      },
    },
    auth: {
      login: "Login",
      register: "Register",
      logout: "Logout",
      email: "Email Address",
      password: "Password",
      confirmPassword: "Confirm Password",
      forgotPassword: "Forgot Password",
      resetPassword: "Reset Password",
      profile: "Profile",
      updateProfile: "Update Profile",
      changePassword: "Change Password",
      currentPassword: "Current Password",
      newPassword: "New Password",
      fullName: "Full Name",
      phoneNumber: "Phone Number",
      role: "Role",
      ward: "Ward",
      department: "Department",
      language: "Language",
      notifications: "Notifications",
      emailAlerts: "Email Alerts",
      avatar: "Avatar",
      lastLogin: "Last Login",
      joinedOn: "Joined On",
      accountStatus: "Account Status",
      active: "Active",
      inactive: "Inactive",
      roles: {
        citizen: "Citizen",
        admin: "Administrator",
        ward_officer: "Ward Officer",
        maintenance: "Maintenance Team",
      },
    },
    guest: {
      guestSubmission: "Guest Submission",
      registeredUser: "Registered User",
      emailVerification: "Email Verification",
      otpSent: "OTP Sent",
      otpVerification: "OTP Verification",
      verifyAndSubmit: "Verify & Submit",
      sendOtpAndSubmit: "Send OTP & Submit",
      trackComplaint: "Track Complaint",
      guestSubmissionProcess: "Guest Submission Process",
      guestSubmissionDescription:
        "For guest users, we'll send an OTP to your email for verification before submitting your complaint. This ensures the authenticity of your submission and enables you to track your complaint later.",
      welcomeBack: "Welcome back",
      loginRequired: "Login Required",
      loginRequiredDescription:
        "Please login or register to submit complaints as a registered user.",
      enterOtp: "Enter 6-digit OTP",
      resendOtp: "Resend",
      otpExpires: "OTP expires in",
      otpInstructions:
        "We've sent a 6-digit OTP to your email. Please enter it below to submit your complaint.",
      checkEmail: "Check your email inbox and spam folder",
      recentComplaints: "Your Recent Complaints",
      complaintDetails: "Complaint Details",
      nextSteps: "Next Steps",
      supportContact: "Need Help?",
    },
    dashboard: {
      overview: "Overview",
      statistics: "Statistics",
      recentComplaints: "Recent Complaints",
      pendingTasks: "Pending Tasks",
      slaCompliance: "SLA Compliance",
      performanceMetrics: "Performance Metrics",
      quickActions: "Quick Actions",
      notifications: "Notifications",
      alerts: "Alerts",
      reports: "Reports",
      analytics: "Analytics",
      trends: "Trends",
      insights: "Insights",
    },
    reports: {
      complaintReports: "Complaint Reports",
      performanceReports: "Performance Reports",
      slaReports: "SLA Reports",
      userReports: "User Reports",
      wardReports: "Ward Reports",
      typeReports: "Type Reports",
      statusReports: "Status Reports",
      dateRange: "Date Range",
      from: "From",
      to: "To",
      generate: "Generate",
      export: "Export",
      print: "Print",
      chart: "Chart",
      table: "Table",
      summary: "Summary",
      details: "Details",
    },
    messages: {
      complaintRegistered: "Complaint registered successfully",
      complaintUpdated: "Complaint updated successfully",
      complaintResolved: "Complaint resolved successfully",
      profileUpdated: "Profile updated successfully",
      passwordChanged: "Password changed successfully",
      loginSuccessful: "Login successful",
      logoutSuccessful: "Logout successful",
      registrationSuccessful: "Registration successful",
      emailSent: "Email sent successfully",
      fileUploaded: "File uploaded successfully",
      feedbackSubmitted: "Feedback submitted successfully",
      assignmentCompleted: "Assignment completed successfully",
      statusUpdated: "Status updated successfully",
      errorOccurred: "An error occurred",
      networkError: "Network error occurred",
      unauthorizedAccess: "Unauthorized access",
      sessionExpired: "Session expired",
      validationError: "Validation error",
      serverError: "Server error occurred",
    },
  },
  hi: {
    nav: {
      home: "होम",
      complaints: "शिकायतें",
      myComplaints: "मेरी शिकायतें",
      trackStatus: "स्थिति ट्रैक करें",
      reports: "रिपोर्ट्स",
      users: "उपयोगकर्ता",
      dashboard: "डैशबोर्ड",
      maintenance: "रखरखाव",
      settings: "सेटिंग्स",
      logout: "लॉगआउट",
      login: "लॉगिन",
      register: "पंजीकरण",
    },
    common: {
      submit: "जमा करें",
      cancel: "रद्द करें",
      edit: "संपादित करें",
      delete: "हटाएं",
      save: "सहेजें",
      close: "बंद करें",
      view: "देखें",
      search: "खोजें",
      filter: "फिल्टर",
      loading: "लोड हो रहा है...",
      error: "त्रुटि",
      success: "सफलता",
      warning: "चेतावनी",
      info: "जानकारी",
      confirm: "पुष्टि करें",
      yes: "हाँ",
      no: "नहीं",
      next: "अगला",
      previous: "पिछला",
      page: "पृष्ठ",
      of: "का",
      total: "कुल",
      items: "आइटम",
      noData: "कोई डेटा उपलब्ध नहीं",
      selectAll: "सभी चुनें",
      clear: "साफ करें",
      refresh: "रीफ्रेश",
      download: "डाउनलोड",
      upload: "अपलोड",
      required: "आवश्यक",
      optional: "वैकल्पिक",
      status: "स्थिति",
      priority: "प्राथमिकता",
      type: "प्रकार",
      date: "दिनांक",
      time: "समय",
      name: "नाम",
      email: "ईमेल",
      phone: "फोन",
      address: "पता",
      description: "विवरण",
      actions: "कार्य",
    },
    complaints: {
      registerComplaint: "शिकायत दर्ज करें",
      complaintId: "शिकायत आईडी",
      complaintType: "शिकायत प्रकार",
      complaintStatus: "स्थिति",
      complaintPriority: "प्राथमिकता",
      submittedBy: "द्वारा प्रस्तुत",
      assignedTo: "को सौंपा गया",
      submittedOn: "प्रस्तुत किया गया",
      resolvedOn: "हल किया गया",
      deadline: "समयसीमा",
      location: "स्थान",
      ward: "वार्ड",
      area: "क्षेत्र",
      landmark: "मुख्य निशान",
      contactInfo: "संपर्क जानकारी",
      mobile: "मोबाइल",
      files: "फाइलें",
      remarks: "टिप्पणियां",
      feedback: "प्रतिक्रिया",
      rating: "रेटिंग",
      comment: "टिप्पणी",
      slaStatus: "SLA स्थिति",
      timeElapsed: "बीता हुआ समय",
      escalationLevel: "एस्केलेशन स्तर",
      types: {
        Water_Supply: "पानी की आपूर्ति",
        Electricity: "बिजली",
        Road_Repair: "सड़क की मरम्मत",
        Garbage_Collection: "कचरा संग्रह",
        Street_Lighting: "सड़क प्रकाश",
        Sewerage: "मलजल",
        Public_Health: "सार्वजनिक स्वास्थ्य",
        Traffic: "यातायात",
        Others: "अन्य",
      },
      statuses: {
        registered: "पंजीकृत",
        assigned: "सौंपा गया",
        in_progress: "प्रगति में",
        resolved: "हल किया गया",
        closed: "बंद",
        reopened: "फिर से खोला गया",
      },
      priorities: {
        low: "कम",
        medium: "मध्यम",
        high: "उच्च",
        critical: "महत्वपूर्ण",
      },
      slaStatuses: {
        ontime: "समय पर",
        warning: "चेतावनी",
        overdue: "देर से",
        completed: "पूर्ण",
      },
    },
    auth: {
      login: "लॉगिन",
      register: "पंजीकरण",
      logout: "लॉगआउट",
      email: "ईमेल पता",
      password: "पासवर्ड",
      confirmPassword: "पासवर्ड की पुष्टि",
      forgotPassword: "पासवर्ड भूल गए",
      resetPassword: "पासवर्ड रीसेट करें",
      profile: "प्रोफाइल",
      updateProfile: "प्रोफाइल अपडेट करें",
      changePassword: "पासवर्ड बदलें",
      currentPassword: "वर्तमान पासवर्ड",
      newPassword: "नया पासवर्ड",
      fullName: "पूरा नाम",
      phoneNumber: "फोन नंबर",
      role: "भूमिका",
      ward: "वार्ड",
      department: "विभाग",
      language: "भाषा",
      notifications: "सूचनाएं",
      emailAlerts: "ईमेल अलर्ट",
      avatar: "अवतार",
      lastLogin: "अंतिम लॉगिन",
      joinedOn: "शामिल हुआ",
      accountStatus: "खाता स्थिति",
      active: "सक्रिय",
      inactive: "निष्क्रिय",
      roles: {
        citizen: "नागरिक",
        admin: "प्रशासक",
        ward_officer: "वार्ड अधिकारी",
        maintenance: "रखरखाव टीम",
      },
    },
    guest: {
      guestSubmission: "अतिथि सबमिशन",
      registeredUser: "पंजीकृत उपयोगकर्ता",
      emailVerification: "ईमेल सत्यापन",
      otpSent: "OTP भेजा गया",
      otpVerification: "OTP सत्यापन",
      verifyAndSubmit: "सत्यापित करें और सबमिट करें",
      sendOtpAndSubmit: "OTP भेजें और सबमिट करें",
      trackComplaint: "शिकायत ट्रैक करें",
      guestSubmissionProcess: "अतिथि सबमिशन प्रक्रिया",
      guestSubmissionDescription:
        "अतिथि उपयोगकर्ताओं के लिए, हम आपकी शिकायत सबमिट करने से पहले सत्यापन के लिए आपके ईमेल पर एक OTP भेजेंगे। यह आपके सबमिशन की प्रामाणिकता सुनिश्चित करता है और आपको बाद में अपनी शिकायत को ट्रैक करने में सक्षम बनाता है।",
      welcomeBack: "वापस स्वागत है",
      loginRequired: "लॉगिन आवश्यक",
      loginRequiredDescription:
        "पंजीकृत उपयोगकर्ता के रूप में शिकायत सबमिट करने के लिए कृपया लॉगिन करें या पंजीकरण करें।",
      enterOtp: "6-अंकीय OTP दर्ज करें",
      resendOtp: "फिर से भेजें",
      otpExpires: "OTP समाप्त होता है",
      otpInstructions:
        "हमने आपके ईमेल पर 6-अंकीय OTP भेजा है। अपनी शिकायत ���बमिट करने के लिए कृपया इसे नीचे दर्ज करें।",
      checkEmail: "अपने ईमेल इनबॉक्स और स्पैम फ़ोल्डर की जाँच करें",
      recentComplaints: "आपकी हाल की शिकायतें",
      complaintDetails: "शिकायत विवरण",
      nextSteps: "अगले कदम",
      supportContact: "सहायता चाहिए?",
    },
    dashboard: {
      overview: "अवलोकन",
      statistics: "आंकड़े",
      recentComplaints: "हाल की शिकायतें",
      pendingTasks: "लंबित कार्य",
      slaCompliance: "SLA अनुपालन",
      performanceMetrics: "प्रदर्शन मेट्रिक्स",
      quickActions: "त्वरित कार्य",
      notifications: "सूचनाएं",
      alerts: "अलर्ट",
      reports: "रिपोर्ट्स",
      analytics: "विश्लेषण",
      trends: "रुझान",
      insights: "अंतर्दृष्टि",
    },
    reports: {
      complaintReports: "शिकायत रिपोर्ट",
      performanceReports: "प्रदर्श�� रिपोर्ट",
      slaReports: "SLA रिपोर्ट",
      userReports: "उपयोगकर्ता रिपोर्ट",
      wardReports: "वार्ड रिपोर्ट",
      typeReports: "प्रकार रिपोर्ट",
      statusReports: "स्थिति रिपोर्ट",
      dateRange: "दिनांक सीमा",
      from: "से",
      to: "तक",
      generate: "उत्पन्न करें",
      export: "निर्यात",
      print: "प्रिंट",
      chart: "चार्ट",
      table: "तालिका",
      summary: "सारांश",
      details: "विवरण",
    },
    messages: {
      complaintRegistered: "शिकायत सफलतापूर्वक दर्ज की गई",
      complaintUpdated: "शिकायत सफलतापूर्वक अपडेट की गई",
      complaintResolved: "शिकायत सफलतापूर्वक हल की गई",
      profileUpdated: "प्रोफाइल सफलतापूर्वक अपडेट किया गया",
      passwordChanged: "पासवर्ड सफलतापूर्वक बदला गया",
      loginSuccessful: "लॉगिन सफल",
      logoutSuccessful: "लॉगआउट सफल",
      registrationSuccessful: "पंजीकरण सफल",
      emailSent: "ईमेल सफलतापूर्वक भेजा गया",
      fileUploaded: "फाइल सफलतापूर्वक अपलोड की गई",
      feedbackSubmitted: "प्रतिक्रिया सफलतापूर्वक सबमिट की गई",
      assignmentCompleted: "असाइनमेंट सफलतापूर्वक पूरा किया गया",
      statusUpdated: "स्थिति सफलतापूर्वक अपडेट की गई",
      errorOccurred: "एक त्रुटि हुई",
      networkError: "नेटवर्क त्रुटि हुई",
      unauthorizedAccess: "अनधिकृत पहुंच",
      sessionExpired: "सत्र समाप्त हो गया",
      validationError: "सत्यापन त्रुटि",
      serverError: "सर्वर त्रुटि हुई",
    },
  },
  ml: {
    nav: {
      home: "ഹോം",
      complaints: "പരാതികൾ",
      myComplaints: "എന്റെ പരാതികൾ",
      trackStatus: "സ്ഥിതി ട്രാക്ക് ചെയ്യുക",
      reports: "റിപ്പോർട്ടുകൾ",
      users: "ഉപയോക്താക്കൾ",
      dashboard: "ഡാഷ്ബോർഡ്",
      maintenance: "പരിപാലനം",
      settings: "സെറ്റിംഗുകൾ",
      logout: "ലോഗൗട്ട്",
      login: "ലോഗിൻ",
      register: "രജിസ്റ്റർ",
    },
    common: {
      submit: "സമർപ്പിക്കുക",
      cancel: "റദ്ദാക്കുക",
      edit: "എഡിറ്റ് ചെയ്യുക",
      delete: "ഇല്ലാതാക്കുക",
      save: "സേവ് ചെയ്യുക",
      close: "അടയ്ക്കുക",
      view: "കാണുക",
      search: "തിരയുക",
      filter: "ഫിൽട്ടർ",
      loading: "ലോഡ് ചെയ്യുന്നു...",
      error: "പിശക്",
      success: "വിജയം",
      warning: "മുന്നറിയിപ്പ്",
      info: "വിവരം",
      confirm: "സ്ഥിരീകരിക്കുക",
      yes: "അതെ",
      no: "ഇല്ല",
      next: "അടുത്തത്",
      previous: "മുമ്പത്തെ",
      page: "പേജ്",
      of: "ന്റെ",
      total: "ആകെ",
      items: "ഇനങ്ങൾ",
      noData: "ഡാറ്റ ലഭ്യമല്ല",
      selectAll: "എല്ലാം തിരഞ്ഞെടുക്കുക",
      clear: "മായ്ക്കുക",
      refresh: "പുതുക്കുക",
      download: "ഡൗൺലോഡ്",
      upload: "അപ്ലോഡ്",
      required: "ആവശ്യമാണ്",
      optional: "ഓപ്ഷണൽ",
      status: "സ്ഥിതി",
      priority: "മുൻഗണന",
      type: "തരം",
      date: "തീയതി",
      time: "സമയം",
      name: "പേര്",
      email: "ഇമെയിൽ",
      phone: "ഫോൺ",
      address: "വിലാസം",
      description: "വിവരണം",
      actions: "പ്രവർത്തനങ്ങൾ",
    },
    complaints: {
      registerComplaint: "പരാതി രജിസ്റ്റർ ചെയ്യുക",
      complaintId: "പരാതി ഐഡി",
      complaintType: "പരാതി തരം",
      complaintStatus: "സ്ഥിതി",
      complaintPriority: "മുൻഗണന",
      submittedBy: "സമർപ്പിച്ചത്",
      assignedTo: "ഏൽപ്പിച്ചത്",
      submittedOn: "സമർപ്പിച്ച തീയതി",
      resolvedOn: "പരിഹരിച്ച തീയതി",
      deadline: "അവസാന തീയതി",
      location: "സ്ഥലം",
      ward: "വാർഡ്",
      area: "പ്രദേശം",
      landmark: "ലാൻഡ്മാർക്ക്",
      contactInfo: "ബന്ധപ്പെടാനുള്ള വിവരങ്ങൾ",
      mobile: "മൊബൈൽ",
      files: "ഫയലുകൾ",
      remarks: "അഭിപ്രായങ്ങൾ",
      feedback: "ഫീഡ്ബാക്ക്",
      rating: "റേറ്റിംഗ്",
      comment: "കമന്റ്",
      slaStatus: "SLA സ്ഥിതി",
      timeElapsed: "കഴിഞ്ഞ സമയം",
      escalationLevel: "എസ്കലേഷൻ ലെവൽ",
      types: {
        Water_Supply: "ജല വിതരണം",
        Electricity: "വൈദ്യുതി",
        Road_Repair: "റോഡ് അറ്റകുറ്റപ്പണി",
        Garbage_Collection: "മാലിന്യ ശേഖരണം",
        Street_Lighting: "തെരുവ് വിളക്കുകൾ",
        Sewerage: "മലിനജല സംവിധാനം",
        Public_Health: "പൊതുജനാരോഗ്യം",
        Traffic: "ഗതാഗതം",
        Others: "മറ്റുള്ളവ",
      },
      statuses: {
        registered: "രജിസ്റ്റർ ചെയ്തു",
        assigned: "ഏൽപ്പിച്ചു",
        in_progress: "പുരോഗതിയിൽ",
        resolved: "പരിഹരിച്ചു",
        closed: "അടച്ചു",
        reopened: "വീണ്ടും തുറന്നു",
      },
      priorities: {
        low: "കുറഞ്ഞ",
        medium: "ഇടത്തരം",
        high: "ഉയർന്ന",
        critical: "അത്യാവശ്യം",
      },
      slaStatuses: {
        ontime: "സമയത്ത്",
        warning: "മുന്നറിയിപ്പ്",
        overdue: "കാലതാമസം",
        completed: "പൂർത്തിയായി",
      },
    },
    auth: {
      login: "ലോഗിൻ",
      register: "രജിസ്റ്റർ",
      logout: "ലോഗൗട്ട്",
      email: "ഇമെയിൽ വിലാസം",
      password: "പാസ്വേഡ്",
      confirmPassword: "പാസ്വേഡ് സ്ഥിരീകരിക്കുക",
      forgotPassword: "പാസ്വേഡ് മറന്നോ",
      resetPassword: "പാസ്വേഡ് റീസെറ്റ് ചെയ്യുക",
      profile: "പ്രൊഫൈൽ",
      updateProfile: "പ്രൊഫൈൽ അപ്ഡേറ്റ് ചെയ്യുക",
      changePassword: "പാസ്വേഡ് മാറ്റുക",
      currentPassword: "നിലവിലെ പാസ്വേഡ്",
      newPassword: "പുതിയ പാസ്വേഡ്",
      fullName: "പൂർണ്ണ നാമം",
      phoneNumber: "ഫോൺ നമ്പർ",
      role: "റോൾ",
      ward: "വാർഡ്",
      department: "വകുപ്പ്",
      language: "ഭാഷ",
      notifications: "അറിയിപ്പുകൾ",
      emailAlerts: "ഇമെയിൽ അലേർട്ടുകൾ",
      avatar: "അവതാർ",
      lastLogin: "അവസാന ലോഗിൻ",
      joinedOn: "ചേർന്ന തീയതി",
      accountStatus: "അക്കൗണ്ട് സ്ഥിതി",
      active: "സജീവം",
      inactive: "നിഷ്ക്രിയം",
      roles: {
        citizen: "പൗരൻ",
        admin: "അഡ്മിനിസ്ട്രേറ്റർ",
        ward_officer: "വാർഡ് ഓഫീസർ",
        maintenance: "പരിപാലന ടീം",
      },
    },
    guest: {
      guestSubmission: "അതിഥി സമർപ്പണം",
      registeredUser: "രജിസ്റ്റർ ചെയ്ത ഉപയോക്താവ്",
      emailVerification: "ഇമെയിൽ സ്ഥിരീകരണം",
      otpSent: "OTP അയച്ചു",
      otpVerification: "OTP സ്ഥിരീകരണം",
      verifyAndSubmit: "സ്ഥിരീകരിച്ച് സമർപ്പിക്കുക",
      sendOtpAndSubmit: "OTP അയച്ച് സമർപ്പിക്കുക",
      trackComplaint: "പരാതി ട്രാക്ക് ചെയ്യുക",
      guestSubmissionProcess: "അതിഥി സമർപ്പണ പ്രക്രിയ",
      guestSubmissionDescription:
        "അതിഥി ഉപയോക്താക്കൾക്കായി, നിങ്ങളുടെ പരാതി സമർപ്പിക്കുന്നതിന് മുമ്പ് സ്ഥിരീകരണത്തിനായി ഞങ്ങൾ നിങ്ങളുടെ ഇമെയിലിലേക്ക് ഒരു OTP അയയ്ക്കും. ഇത് നിങ്ങളുടെ സമർപ്പണത്തിന്റെ ആധികാരികത ഉറപ്പാക്കുകയും പിന്നീട് നിങ്ങളുടെ പരാതി ട്രാക്ക് ചെയ്യാൻ നിങ്ങളെ പ്രാപ്തമാക്കുകയും ചെയ്യുന്നു।",
      welcomeBack: "തിരികെ സ്വാഗതം",
      loginRequired: "ലോഗിൻ ആവശ്യമാണ്",
      loginRequiredDescription:
        "രജിസ്റ്റർ ചെയ്ത ഉപയോക്താവായി പരാതികൾ സമർപ്പിക്കാൻ ദ��വായി ലോഗിൻ ചെയ്യുക അല്ലെങ്കിൽ രജിസ്റ്റർ ചെയ്യുക.",
      enterOtp: "6-അക്ക OTP നൽകുക",
      resendOtp: "വീണ്ടും അയയ്ക്കുക",
      otpExpires: "OTP കാലാവധി",
      otpInstructions:
        "ഞങ്ങൾ നിങ്ങളുടെ ഇമെയിലിലേക്ക് 6-അക്ക OTP അയച്ചിട്ടുണ്ട്. നിങ്ങളുടെ പരാതി സമർപ്പിക്കാൻ ദയവായി അത് താഴെ നൽകുക.",
      checkEmail: "നിങ്ങളുടെ ഇമെയിൽ ഇൻബോക്സും സ്പാം ഫോൾഡറും പരിശോധിക്കുക",
      recentComplaints: "നിങ്ങളുടെ സമീപകാല പരാതികൾ",
      complaintDetails: "പരാതിയുടെ വിശദാംശങ്ങൾ",
      nextSteps: "അടുത്ത ഘട്ടങ്ങൾ",
      supportContact: "സഹായം വേണോ?",
    },
    dashboard: {
      overview: "അവലോകനം",
      statistics: "സ്ഥിതിവിവരക്കണക്കുകൾ",
      recentComplaints: "സമീപകാല പരാതികൾ",
      pendingTasks: "ബാക്കിയുള്ള ജോലികൾ",
      slaCompliance: "SLA അനുപാലനം",
      performanceMetrics: "പ്രകടന മെട്രിക്സ്",
      quickActions: "വേഗത്തിലുള്ള പ്രവർത്തനങ്ങൾ",
      notifications: "അറിയിപ്പുകൾ",
      alerts: "അലേർട്ടുകൾ",
      reports: "റിപ്പോർട്ടുകൾ",
      analytics: "വിശകലനം",
      trends: "ട്രെൻഡുകൾ",
      insights: "ഉൾക്കാഴ്ചകൾ",
    },
    reports: {
      complaintReports: "പരാതി റിപ്പോർട്ടുകൾ",
      performanceReports: "പ്രകടന റിപ്പോർട്ടുകൾ",
      slaReports: "SLA റിപ്പോർട്ടുകൾ",
      userReports: "ഉപയോക്താവ് റിപ്പോർട്ടുകൾ",
      wardReports: "വാർഡ് റിപ്പോർട്ടുകൾ",
      typeReports: "തരം റിപ്പോർട്ടുകൾ",
      statusReports: "സ്ഥിതി റിപ്പോർട്ടുകൾ",
      dateRange: "തീയതി പരിധി",
      from: "മുതൽ",
      to: "വരെ",
      generate: "ജനറേറ്റ�� ചെയ്യുക",
      export: "എക്സ്പോർട്ട്",
      print: "പ്രിന്റ്",
      chart: "ചാർട്ട്",
      table: "ടേബിൾ",
      summary: "സംഗ്രഹം",
      details: "വിശദാംശങ്ങൾ",
    },
    messages: {
      complaintRegistered: "പരാതി വിജയകരമായി രജിസ്റ്റർ ചെയ്തു",
      complaintUpdated: "പരാതി വിജയകരമായി അപ്ഡേറ്റ് ചെയ്തു",
      complaintResolved: "പരാതി വിജയകരമായി പരിഹരിച്ചു",
      profileUpdated: "പ്രൊഫൈൽ വിജയകരമായി അപ്ഡേറ്റ് ചെയ്തു",
      passwordChanged: "പാസ്വേഡ് വിജയകരമായി മാറ്റി",
      loginSuccessful: "ലോഗിൻ വിജയകരം",
      logoutSuccessful: "ലോഗൗട്ട് വിജയകരം",
      registrationSuccessful: "രജിസ്ട്രേഷൻ വിജയകരം",
      emailSent: "ഇമെയിൽ വിജയകരമായി അയച്ചു",
      fileUploaded: "ഫയൽ വിജയകരമായി അപ്ലോഡ് ചെയ്തു",
      feedbackSubmitted: "ഫീഡ്ബാക്ക് വിജയകരമായി സമർപ്പിച്ചു",
      assignmentCompleted: "അസൈൻമെന്റ് വിജയകരമായി പൂർത്തിയാക്കി",
      statusUpdated: "സ്ഥിതി വിജയകരമായി അപ്ഡേറ്റ് ചെയ്തു",
      errorOccurred: "ഒരു പിശക് സംഭവിച്ചു",
      networkError: "നെറ്റ്വർക്ക് പിശക് സംഭവിച്ചു",
      unauthorizedAccess: "അനധികൃത പ്രവേശനം",
      sessionExpired: "സെഷൻ കാലഹരണപ്പെട്ടു",
      validationError: "വാലിഡേഷൻ പിശക്",
      serverError: "സെർവർ പിശക് സംഭവിച്ചു",
    },
  },
};

// Language state interface
export interface LanguageState {
  currentLanguage: Language;
  translations: Translation;
  isLoading: boolean;
}

// Initial state
const initialState: LanguageState = {
  currentLanguage: (localStorage.getItem("language") as Language) || "en",
  translations: translations.en,
  isLoading: false,
};

// Language slice
const languageSlice = createSlice({
  name: "language",
  initialState: {
    ...initialState,
    translations: translations[initialState.currentLanguage],
  },
  reducers: {
    setLanguage: (state, action: PayloadAction<Language>) => {
      state.currentLanguage = action.payload;
      state.translations = translations[action.payload];
      localStorage.setItem("language", action.payload);
    },
    resetLanguage: (state) => {
      state.currentLanguage = "en";
      state.translations = translations.en;
      localStorage.removeItem("language");
    },
  },
});

export const { setLanguage, resetLanguage } = languageSlice.actions;
export default languageSlice.reducer;

// Selectors
export const selectLanguage = (state: { language: LanguageState }) =>
  state.language.currentLanguage;
export const selectTranslations = (state: { language: LanguageState }) =>
  state.language.translations;
export const selectLanguageLoading = (state: { language: LanguageState }) =>
  state.language.isLoading;

// Export translations for direct use
export { translations };
