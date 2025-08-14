export interface Translation {
  // Common
  common: {
    submit: string;
    cancel: string;
    save: string;
    edit: string;
    delete: string;
    view: string;
    search: string;
    loading: string;
    error: string;
    success: string;
    required: string;
    optional: string;
    all: string;
    none: string;
    yes: string;
    no: string;
    close: string;
    back: string;
    next: string;
    previous: string;
    refresh: string;
    export: string;
    download: string;
    upload: string;
  };

  // Navigation
  nav: {
    home: string;
    dashboard: string;
    complaints: string;
    users: string;
    reports: string;
    profile: string;
    settings: string;
    logout: string;
    switchRole: string;
    myComplaints: string;
    trackStatus: string;
    reopenComplaint: string;
    ward: string;
  };

  // Authentication
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
    rememberMe: string;
    loginSuccess: string;
    loginError: string;
    invalidCredentials: string;
    sessionExpired: string;
    guestMode: string;
    continueAsGuest: string;
      signUp: string;
  };

  // Complaints
  complaints: {
    registerComplaint: string;
    complaintId: string;
    complaintType: string;
    description: string;
    status: string;
    priority: string;
    submittedBy: string;
    submittedDate: string;
    lastUpdated: string;
    assignedTo: string;
    slaDeadline: string;
    ward: string;
    area: string;
    location: string;
    address: string;
    mobile: string;
    attachments: string;
    remarks: string;
    trackStatus: string;
    myComplaints: string;
    reopenComplaint: string;
    feedback: string;

    // Status
    registered: string;
    assigned: string;
    inProgress: string;
    resolved: string;
    closed: string;
    reopened: string;

    // Priority
    low: string;
    medium: string;
    high: string;
    critical: string;

    // Types
    waterSupply: string;
    electricity: string;
    roadRepair: string;
    garbageCollection: string;
    streetLighting: string;
    sewerage: string;
    publicHealth: string;
    traffic: string;
    others: string;
  };

  // Forms
  forms: {
    contactInformation: string;
    problemDetails: string;
    locationDetails: string;
    complaintDescription: string;
    optionalUploads: string;
    captchaVerification: string;
    enterCaptcha: string;
    resetForm: string;
    submitComplaint: string;
    complaintSubmitted: string;
    complaintSubmissionError: string;
    fileUploadError: string;
    invalidCaptcha: string;
    requiredField: string;
    invalidEmail: string;
    invalidPhone: string;
    minCharacters: string;
  };

  // Guest complaint form
  guestForm: {
    submitComplaint: string;
    reportCivicIssues: string;
    personalInformation: string;
    complaintInformation: string;
    locationInformation: string;
    attachments: string;
    reviewComplaint: string;
    submitForVerification: string;
    fullName: string;
    emailAddress: string;
    phoneNumber: string;
    complaintType: string;
    priority: string;
    description: string;
    ward: string;
    subZone: string;
    areaLocality: string;
    nearbyLandmark: string;
    completeAddress: string;
    locationOnMap: string;
    interactiveMapComing: string;
    currentLocationDetected: string;
    addPhotos: string;
    addPhotosDescription: string;
    uploadInstructions: string;
    maxFilesAllowed: string;
    fileSizeLimit: string;
    allowedFormats: string;
    uploadedImages: string;
    preview: string;
    remove: string;
    reviewYourComplaint: string;
    reviewDescription: string;
    readyToSubmit: string;
    readyToSubmitDescription: string;
    whatHappensNext: string;
    step1: string;
    step2: string;
    step3: string;
    step4: string;
    steps: {
      details: string;
      location: string;
      attachments: string;
      review: string;
      submit: string;
    };
    progress: string;
    stepOf: string;
    completeRequiredFields: string;
    fillRequiredInformation: string;
    fixValidationErrors: string;
    completeAllRequiredFields: string;
    invalidFileType: string;
    onlyImageFormats: string;
    fileTooLarge: string;
    selectSmallerFiles: string;
    trackingNumber: string;
    verificationCodeSent: string;
    checkEmailForCode: string;
    welcomeToSmartCity: string;
    complaintVerified: string;
    nowRegisteredCitizen: string;
    canTrackProgress: string;
    securityTip: string;
    setPasswordForEasierLogin: string;
    goToDashboard: string;
    submitAnotherComplaint: string;
    alreadyHaveAccount: string;
    loginHere: string;
    currentLocationIncluded: string;
    selectOnMap: string;
    imagePreview: string;
    previewOfUploadedImage: string;
    clickToUploadOrDrag: string;
    invalidEmailFormat: string;
    invalidPhoneFormat: string;
    descriptionTooShort: string;
    wardRequired: string;
    areaRequired: string;
    characterCount: string;
    locationDetectedIncluded: string;
  };

  // Profile
  profile: {
    personalInformation: string;
    contactDetails: string;
    preferences: string;
    changePassword: string;
    avatar: string;
    updateProfile: string;
    profileUpdated: string;
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
    passwordMismatch: string;
    passwordChanged: string;
  };

  // Settings
  settings: {
    generalSettings: string;
    languageSettings: string;
    notificationSettings: string;
    privacySettings: string;
    language: string;
    notifications: string;
    emailAlerts: string;
    smsAlerts: string;
    darkMode: string;
    soundEffects: string;
    dataRetention: string;
    accountDeletion: string;
  };

  // Dashboard
  dashboard: {
    overview: string;
    statistics: string;
    totalComplaints: string;
    resolvedToday: string;
    slaBreaches: string;
    activeUsers: string;
    complaintsByStatus: string;
    slaCompliance: string;
    recentComplaints: string;
    pendingTasks: string;
    performanceMetrics: string;
    wardPerformance: string;
    quickActions: string;
    notifications: string;
    alerts: string;
    reports: string;
    overallCompliance: string;
    onTime: string;
    warning: string;
    overdue: string;
  };

  // Admin
  admin: {
    userManagement: string;
    systemConfiguration: string;
    languageManagement: string;
    analytics: string;
    reports: string;
  };

  // Errors & Messages
  messages: {
    networkError: string;
    serverError: string;
    notFound: string;
    unauthorized: string;
    forbidden: string;
    validationError: string;
    sessionExpired: string;
    operationSuccess: string;
    operationFailed: string;
  };
}

export const englishTranslations: Translation = {
  common: {
    submit: "Submit",
    cancel: "Cancel",
    save: "Save",
    edit: "Edit",
    delete: "Delete",
    view: "View",
    search: "Search",
    loading: "Loading...",
    error: "Error",
    success: "Success",
    required: "Required",
    optional: "Optional",
    all: "All",
    none: "None",
    yes: "Yes",
    no: "No",
    close: "Close",
    back: "Back",
    next: "Next",
    previous: "Previous",
    refresh: "Refresh",
    export: "Export",
    download: "Download",
    upload: "Upload",
  },
  nav: {
    home: "Home",
    dashboard: "Dashboard",
    complaints: "Complaints",
    users: "Users",
    reports: "Reports",
    profile: "Profile",
    settings: "Settings",
    logout: "Logout",
    switchRole: "Switch Role",
    myComplaints: "My Complaints",
    trackStatus: "Track Status",
    reopenComplaint: "Reopen Complaint",
    ward: "Ward",
  },
  auth: {
    login: "Login",
    register: "Register",
    logout: "Logout",
    email: "Email",
    password: "Password",
    confirmPassword: "Confirm Password",
    forgotPassword: "Forgot Password?",
    resetPassword: "Reset Password",
    profile: "Profile",
    updateProfile: "Update Profile",
    rememberMe: "Remember Me",
    loginSuccess: "Login successful",
    loginError: "Login failed",
    invalidCredentials: "Invalid email or password",
    sessionExpired: "Session expired. Please login again.",
    guestMode: "Guest Mode",
      continueAsGuest: "Continue as Guest",
      signUp: "Sign Up",
  },
  complaints: {
    registerComplaint: "Register Complaint",
    complaintId: "Complaint ID",
    complaintType: "Complaint Type",
    description: "Description",
    status: "Status",
    priority: "Priority",
    submittedBy: "Submitted By",
    submittedDate: "Submitted Date",
    lastUpdated: "Last Updated",
    assignedTo: "Assigned To",
    slaDeadline: "SLA Deadline",
    ward: "Ward",
    area: "Area",
    location: "Location",
    address: "Address",
    mobile: "Mobile Number",
    attachments: "Attachments",
    remarks: "Remarks",
    trackStatus: "Track Status",
    myComplaints: "My Complaints",
    reopenComplaint: "Reopen Complaint",
    feedback: "Feedback",
    registered: "Registered",
    assigned: "Assigned",
    inProgress: "In Progress",
    resolved: "Resolved",
    closed: "Closed",
    reopened: "Reopened",
    low: "Low",
    medium: "Medium",
    high: "High",
    critical: "Critical",
    waterSupply: "Water Supply",
    electricity: "Electricity",
    roadRepair: "Road Repair",
    garbageCollection: "Garbage Collection",
    streetLighting: "Street Lighting",
    sewerage: "Sewerage",
    publicHealth: "Public Health",
    traffic: "Traffic",
    others: "Others",
  },
  forms: {
    contactInformation: "Contact Information",
    problemDetails: "Problem Details",
    locationDetails: "Location Details",
    complaintDescription: "Complaint Description",
    optionalUploads: "Optional Uploads",
    captchaVerification: "CAPTCHA Verification",
    enterCaptcha: "Enter the CAPTCHA code",
    resetForm: "Reset Form",
    submitComplaint: "Submit Complaint",
    complaintSubmitted: "Complaint submitted successfully!",
    complaintSubmissionError: "Failed to submit complaint. Please try again.",
    fileUploadError: "Error uploading file",
    invalidCaptcha: "Invalid CAPTCHA code",
    requiredField: "This field is required",
    invalidEmail: "Please enter a valid email address",
    invalidPhone: "Please enter a valid phone number",
    minCharacters: "Minimum 5 characters required",
  },
  guestForm: {
    submitComplaint: "Submit a Complaint",
    reportCivicIssues: "Report civic issues and get them resolved quickly",
    personalInformation: "Personal Information",
    complaintInformation: "Complaint Information",
    locationInformation: "Location Information",
    attachments: "Attachments",
    reviewComplaint: "Review Your Complaint",
    submitForVerification: "Submit for Verification",
    fullName: "Full Name",
    emailAddress: "Email Address",
    phoneNumber: "Phone Number",
    complaintType: "Complaint Type",
    priority: "Priority",
    description: "Description",
    ward: "Ward",
    subZone: "Sub-Zone",
    areaLocality: "Area/Locality",
    nearbyLandmark: "Nearby Landmark",
    completeAddress: "Complete Address",
    locationOnMap: "Location on Map",
    interactiveMapComing: "Interactive map picker coming soon",
    currentLocationDetected:
      "Current location detected and will be included with your complaint",
    addPhotos: "Add photos to help us better understand the issue",
    addPhotosDescription: "You can upload up to 5 images",
    uploadInstructions: "Click to upload or drag and drop",
    maxFilesAllowed: "Maximum 5 files allowed",
    fileSizeLimit: "JPG, PNG up to 10MB each",
    allowedFormats: "Only JPG and PNG images are allowed",
    uploadedImages: "Uploaded Images",
    preview: "Preview",
    remove: "Remove",
    reviewYourComplaint: "Review Your Complaint",
    reviewDescription:
      "Please review all information before submitting. You can go back to make changes if needed.",
    readyToSubmit: "Ready to Submit",
    readyToSubmitDescription:
      "Your complaint is ready for submission. After submitting, you'll receive an email with a verification code.",
    whatHappensNext: "What happens next?",
    step1: "Your complaint will be registered immediately",
    step2: "You'll receive an OTP via email for verification",
    step3: "After verification, you'll be registered as a citizen",
    step4: "You can then track your complaint progress",
    steps: {
      details: "Details",
      location: "Location",
      attachments: "Attachments",
      review: "Review",
      submit: "Submit",
    },
    progress: "Progress",
    stepOf: "Step {current} of {total}",
    completeRequiredFields: "Please complete required fields",
    fillRequiredInformation:
      "Fill in all required information before proceeding",
    fixValidationErrors: "Please fix validation errors",
    completeAllRequiredFields:
      "Complete all required fields correctly before submitting",
    invalidFileType: "Invalid file type",
    onlyImageFormats: "Only JPG and PNG images are allowed",
    fileTooLarge: "File too large",
    selectSmallerFiles: "Please select files smaller than 10MB",
    trackingNumber: "Tracking Number",
    verificationCodeSent: "Please check your email for the verification code",
    checkEmailForCode:
      "Tracking number: {trackingNumber}. Please check your email for the verification code.",
    welcomeToSmartCity: "Welcome to Cochin Smart City!",
    complaintVerified:
      "Your complaint has been verified and you've been registered as a citizen.",
    nowRegisteredCitizen: "You are now registered as a citizen",
    canTrackProgress:
      "You can now track your complaint progress from your dashboard.",
    securityTip: "Security Tip",
    setPasswordForEasierLogin:
      "Set a password in your profile settings for easier future logins.",
    goToDashboard: "Go to Dashboard",
    submitAnotherComplaint: "Submit Another Complaint",
    alreadyHaveAccount: "Already have an account?",
    loginHere: "Login here",
    currentLocationIncluded:
      "Location detected and will be included with your complaint",
    selectOnMap: "Select on Map",
    imagePreview: "Image Preview",
    previewOfUploadedImage: "Preview of uploaded image",
    clickToUploadOrDrag: "Click to upload or drag and drop",
    invalidEmailFormat: "Please enter a valid email address",
    invalidPhoneFormat: "Please enter a valid phone number",
    descriptionTooShort: "Description must be at least 10 characters",
    wardRequired: "Ward selection is required",
    areaRequired: "Area/locality is required",
    characterCount: "{count}/500 characters",
    locationDetectedIncluded:
      "Your location has been detected and will be included with your complaint",
  },
  profile: {
    personalInformation: "Personal Information",
    contactDetails: "Contact Details",
    preferences: "Preferences",
    changePassword: "Change Password",
    avatar: "Avatar",
    updateProfile: "Update Profile",
    profileUpdated: "Profile updated successfully",
    currentPassword: "Current Password",
    newPassword: "New Password",
    confirmPassword: "Confirm Password",
    passwordMismatch: "Passwords do not match",
    passwordChanged: "Password changed successfully",
  },
  settings: {
    generalSettings: "General Settings",
    languageSettings: "Language Settings",
    notificationSettings: "Notification Settings",
    privacySettings: "Privacy Settings",
    language: "Language",
    notifications: "Notifications",
    emailAlerts: "Email Alerts",
    smsAlerts: "SMS Alerts",
    darkMode: "Dark Mode",
    soundEffects: "Sound Effects",
    dataRetention: "Data Retention",
    accountDeletion: "Account Deletion",
  },
  dashboard: {
    overview: "Overview",
    statistics: "Statistics",
    totalComplaints: "Total Complaints",
    resolvedToday: "Resolved Today",
    slaBreaches: "SLA Breaches",
    activeUsers: "Active Users",
    complaintsByStatus: "Complaints by Status",
    slaCompliance: "SLA Compliance",
    recentComplaints: "Recent Complaints",
    pendingTasks: "Pending Tasks",
    performanceMetrics: "Performance Metrics",
    wardPerformance: "Ward Performance",
    quickActions: "Quick Actions",
    notifications: "Notifications",
    alerts: "Alerts",
    reports: "Reports",
    overallCompliance: "Overall compliance rate",
    onTime: "On Time",
    warning: "Warning",
    overdue: "Overdue",
  },
  admin: {
    userManagement: "User Management",
    systemConfiguration: "System Configuration",
    languageManagement: "Language Management",
    analytics: "Analytics",
    reports: "Reports",
  },
  messages: {
    networkError:
      "Network connection error. Please check your internet connection.",
    serverError: "Server error. Please try again later.",
    notFound: "The requested resource was not found.",
    unauthorized: "You are not authorized to access this resource.",
    forbidden: "Access forbidden.",
    validationError: "Please check your input and try again.",
    sessionExpired: "Your session has expired. Please login again.",
    operationSuccess: "Operation completed successfully.",
    operationFailed: "Operation failed. Please try again.",
  },
};

export const hindiTranslations: Translation = {
  common: {
    submit: "जमा करें",
    cancel: "रद्द करें",
    save: "सहेजें",
    edit: "संपादित करें",
    delete: "मिटाएं",
    view: "देखें",
    search: "खोजें",
    loading: "लोड हो रहा है...",
    error: "त्रुटि",
    success: "सफल",
    required: "आवश्यक",
    optional: "वैकल्पिक",
    all: "सभी",
    none: "कोई नहीं",
    yes: "हाँ",
    no: "नहीं",
    close: "बंद करें",
    back: "वापस",
    next: "अगला",
    previous: "पिछला",
    refresh: "ताज़ा करें",
    export: "निर्यात",
    download: "डाउनलोड",
    upload: "अपलोड",
  },
  nav: {
    home: "होम",
    dashboard: "डैशबोर्ड",
    complaints: "शिकायतें",
    users: "उपयोगकर्ता",
    reports: "रिपोर्ट",
    profile: "प्रोफाइल",
    settings: "सेटिंग्स",
    logout: "लॉगआउट",
    switchRole: "भूमिका बदलें",
  },
  auth: {
    login: "लॉगिन",
    logout: "लॉगआउट",
    email: "ईमेल",
    password: "पासवर्ड",
    forgotPassword: "पासवर्ड भूल गए?",
      rememberMe: "मुझे याद रखें",
    loginSuccess: "लॉगिन सफल",
    loginError: "लॉगिन असफल",
    invalidCredentials: "गलत ईमेल पासवर्ड",
    sessionExpired: "सत्र समाप्त हो गया। कृपया फिर से लॉगिन करे।",
    guestMode: "अतिथि मोड",
      continueAsGuest: "अतिथि के रूप में जारी रखें",
      signUp: "साइन अप करें"
  },
  complaints: {
    registerComplaint: "शिकायत दर्ज करें",
    complaintId: "शिकायत आईडी",
    complaintType: "शिकायत का प्रकार",
    description: "विवरण",
    status: "स्थिति",
    priority: "प्राथमिकता",
    submittedBy: "द्वारा प्रस्तुत",
    submittedDate: "प्रस्तुत दिनांक",
    lastUpdated: "अंतिम अद्यतन",
    assignedTo: "सौंपा गया",
    slaDeadline: "SLA समय सीमा",
    ward: "वार्ड",
    area: "क्षेत्र",
    location: "स्थान",
    address: "पता",
    mobile: "मोबाइल नंबर",
      attachments: "अनुलग्नक",
    remarks: "टिप्पणियां",
    trackStatus: "स्थिति ट्रैक करें",
      myComplaints: "मेरी शिकायतें",
    reopenComplaint: "शिकायत फिर से खोलें",
    feedback: "प्रतिक्रिया",
    registered: "पंजीकृत",
    assigned: "सौंपा गया",
    inProgress: "प्रगति में",
    resolved: "हल किया गया",
      closed: "बंद",
    reopened: "फिर से खोला गया",
    low: "कम",
    medium: "मध्यम",
    high: "उच्च",
    critical: "गंभीर",
    waterSupply: "पानी की आपूर्ति",
    electricity: "बिजली",
    roadRepair: "सड़क मरम्मत",
    garbageCollection: "कचरा संग्रह",
    streetLighting: "स्ट्रीट लाइटिंग",
    sewerage: "सीवरेज",
    publicHealth: "सार्वजनिक स्वास्थ्य",
    traffic: "यातायात",
    others: "अन्य",
  },
  forms: {
    contactInformation: "संपर्क जानकारी",
      problemDetails: "समस्या विवरण",
    locationDetails: "स्थान विवरण",
      complaintDescription: "शिकायत विवरण",
    optionalUploads: "वैकल्पिक अपलोड",
    captchaVerification: "कैप्चा सत्यापन",
    enterCaptcha: "कैप्चा कोड दर्ज करें",
      resetForm: "फॉर्म रीसेट करें",
    submitComplaint: "शिकायत जमा करें",
      complaintSubmitted: "शिकायत सफलतापूर्वक जमा की गई!",
    complaintSubmissionError:
      "शिकायत जमा करने में असफल। कृपया पुनः प्रयास करें।",
    fileUploadError: "फाइल अपलोड में त्रुटि",
    invalidCaptcha: "गलत कैप्चा कोड",
    requiredField: "यह फील्ड आवश्यक है",
    invalidEmail: "कृपया एक वैध ईमेल पता दर्ज करें",
    invalidPhone: "कृपया एक वैध फोन नंबर दर्ज करें",
    minCharacters: "न्यूनतम 5 अक्षर आवश्यक",
  },
  profile: {
    personalInformation: "व्यक्तिगत जानकारी",
    contactDetails: "संपर्क विवरण",
    preferences: "प्राथमिकताएं",
    changePassword: "पासवर्ड बदलें",
    avatar: "अवतार",
    updateProfile: "प्रोफाइल अपडेट करें",
    profileUpdated: "प्रोफाइल सफलतापूर्वक अपडेट किया गया",
    currentPassword: "वर्तमान पासवर्ड",
    newPassword: "नया पासवर्ड",
    confirmPassword: "पासवर्ड की पुष्टि करें",
    passwordMismatch: "पासवर्ड मेल नहीं खाते",
      passwordChanged: "पासवर्ड सफलतापूर्वक बदला गया",
  },
  settings: {
    generalSettings: "सामान्य सेटिंग्स",
    languageSettings: "भाषा सेटिंग्स",
    notificationSettings: "अधिसूचना सेटिंग्स",
    privacySettings: "गोपनीयता सेटिंग्स",
    language: "भाषा",
    notifications: "अधिसूचनाएं",
    emailAlerts: "ईमेल अलर्ट",
    smsAlerts: "SMS अलर्ट",
    darkMode: "डार्क मोड",
      soundEffects: "साउंड इफेक्ट्स",
    dataRetention: "डेटा रिटेंशन",
      accountDeletion: "खाता हटाना",
  },
  dashboard: {
    totalComplaints: "कुल शिकायतें",
    resolvedToday: "आज हल की गई",
    slaBreaches: "SLA उल्लंघन",
    activeUsers: "सक्रिय उपयोगकर्ता",
    complaintsByStatus: "स्थिति के अनुसार शिकायतें",
    slaCompliance: "SLA अनुपालन",
    recentComplaints: "हाल की शिकायतें",
    wardPerformance: "वार्ड प्रदर्शन",
      quickActions: "त्वरित कार्रवाई",
    overallCompliance: "समग्र अनुपालन दर",
    onTime: "समय पर",
    warning: "चेतावनी",
    overdue: "देरी से",
  },
  admin: {
    userManagement: "उपयोगकर्ता प्रबंधन",
    systemConfiguration: "सिस्टम कॉन्फ़िगरेशन",
    languageManagement: "भाषा प्रबंधन",
    analytics: "विश्लेषण",
    reports: "रिपोर्ट",
  },
  messages: {
    networkError:
      "नेटवर्क कनेक्शन त्रुटि। कृपया अपना इंटरनेट कनेक्शन जांचें।",
      serverError: "सर्वर त्रुटि। कृपया बाद में पुनः प्रयास करें।",
    notFound: "अनुरोधित संसाधन नहीं मिला।",
    unauthorized: "आप इस संसाधन तक पहुंचने के लिए अधिकृत नहीं हैं।",
      forbidden: "पहुंच निषिद्ध।",
      validationError: "कृपया अपना इनपुट जांचें और पुनः प्रयास करें।",
      sessionExpired: "आपका सत्र समाप्त हो गया है। कृपया फिर से लॉगिन करें।",
    operationSuccess: "ऑपरेशन सफलतापूर्वक पूरा हुआ।",
      operationFailed: "ऑपरेशन असफल। कृपया पुनः प्रयास करें।",
  },
};

export const malayalamTranslations: Translation = {
  common: {
    submit: "സമർപ്പിക്കുക",
    cancel: "റദ്ദാക്കുക",
    save: "സേവ് ചെയ്യുക",
        edit: "തിരുത്തുക",
    delete: "നീക്കം ചെയ്യുക",
    view: "കാണുക",
        search: "തിരയുക",
    loading: "ലോഡിംഗ്...",
    error: "പിശക്",
    success: "വിജയം",
    required: "ആവശ്യമാണ്",
    optional: "ഓപ്ഷണൽ",
    all: "എല്ലാം",
    none: "ഒന്നും ഇല്ല",
    yes: "അതെ",
    no: "ഇല്ല",
    close: "അടയ്ക്കുക",
    back: "തിരികെ",
    next: "അടുത്തത്",
    previous: "മുമ്പത്തെ",
    refresh: "പുതുക്കുക",
        export: "കയറ്റുമതി",
    download: "ഡൗൺലോഡ്",
    upload: "അപ്ലോഡ്",
  },
  nav: {
    home: "ഹോം",
    dashboard: "ഡാഷ്ബോർഡ്",
    complaints: "പരാതികൾ",
    users: "ഉപയോക്താക്കൾ",
    reports: "റിപ്പോർട്ടുകൾ",
      profile: "പ്രൊഫൈൽ",
    settings: "സെറ്റിംഗ്സ്",
    logout: "ലോഗൗട്ട്",
    switchRole: "റോൾ മാറ്റുക",
  },
  auth: {
    login: "ലോഗിൻ",
    logout: "ലോഗൗട്ട്",
    email: "ഇമെയിൽ",
    password: "പാസ്‌വേഡ്",
    forgotPassword: "പാസ്‌വേഡ് മറന്നോ?",
    rememberMe: "എന്നെ ഓർക്കുക",
    loginSuccess: "ലോഗിൻ വിജയകരം",
    loginError: "ലോഗിൻ പരാജയപ്പെട്ടു",
      invalidCredentials: "അസാധുവായ ഇമെയിൽ അല്ലെങ്കിൽ പാസ്‌വേഡ്",
    sessionExpired: "സെഷൻ കാലഹരണപ്പെട്ടു. ദയവായി വീണ്ടും ലോഗിൻ ചെയ്യുക.",
      guestMode: "അതിഥി മോഡ്",
      continueAsGuest: "അതിഥിയായി തുടരുക",
      signUp: "സൈൻ അപ്പ് ചെയ്യുക",
  },
  complaints: {
    registerComplaint: "പരാതി രജിസ്റ്റർ ചെയ്യുക",
    complaintId: "പരാതി ഐഡി",
    complaintType: "പരാതിയുടെ തരം",
    description: "വിവരണം",
    status: "നില",
    priority: "മുൻഗണന",
    submittedBy: "സമർപ്പിച്ചത്",
      submittedDate: "സമർപ്പിച്ച തീയതി",
      lastUpdated: "അവസാനം അപ്ഡേറ്റ് ചെയ്തത്",
    assignedTo: "നിയോഗിച്ചത്",
    slaDeadline: "SLA ഡെഡ്‌ലൈൻ",
    ward: "വാർഡ്",
    area: "പ്രദേശം",
    location: "സ്ഥലം",
    address: "വിലാസം",
    mobile: "മൊബൈൽ നമ്പർ",
    attachments: "അറ്റാച്ച്‌മെന്റുകൾ",
    remarks: "കുറിപ്പുകൾ",
      trackStatus: "ട്രാക്ക് സ്റ്റാറ്റസ്",
    myComplaints: "എന്റെ പരാതികൾ",
      reopenComplaint: "പരാതി വീണ്ടും തുറക്കുക",
    feedback: "ഫീഡ്ബാക്ക്",
    registered: "രജിസ്റ്റർ ചെയ്തു",
    assigned: "നിയോഗിച്ചു",
    inProgress: "പുരോഗതിയിൽ",
    resolved: "പരിഹരിച്ചു",
    closed: "അടച്ചു",
    reopened: "വീണ്ടും തുറന്നു",
    low: "കുറവ്",
    medium: "ഇടത്തരം",
    high: "ഉയർന്ന",
    critical: "നിർണായകം",
    waterSupply: "ജലവിതരണം",
    electricity: "വൈദ്യുതി",
    roadRepair: "റോഡ് അ��്റകുറ്റപ്പണി",
    garbageCollection: "മാലിന്യ ശേഖരണം",
    streetLighting: "��്ട്രീറ്റ് ലൈറ്റിംഗ്",
    sewerage: "മലിനജല സംവിധാനം",
    publicHealth: "പൊതുജനാരോഗ്യം",
    traffic: "ട്രാഫിക്",
    others: "മറ്റുള്ളവ",
  },
  forms: {
      contactInformation: "ബന്ധപ്പെടാനുള്ള വിവരങ്ങൾ",
    problemDetails: "പ്രശ്ന വിവരങ്ങൾ",
      locationDetails: "ലൊക്കേഷൻ വിശദാംശങ്ങൾ",
    complaintDescription: "പരാതി വിവരണം",
    optionalUploads: "ഓപ്ഷണൽ അപ്ലോഡുകൾ",
    captchaVerification: "കാപ്ച്ച സ്ഥിരീകരണം",
    enterCaptcha: "കാപ്ച്ച കോഡ് നൽകുക",
    resetForm: "ഫോം റീസെറ്റ് ചെയ്യുക",
    submitComplaint: "പരാതി സമർപ്പിക്കുക",
    complaintSubmitted: "പരാതി വിജയകരമായി സമർപ്പിച്ചു!",
    complaintSubmissionError:
      "പരാതി സമർപ്പിക്കുന്നതിൽ പരാജയപ്പെട്ടു. വീണ്ടും ശ്രമിക്കുക.",
    fileUploadError: "ഫയൽ അപ്ലോഡ് ചെയ്യുന്നതിൽ പിശക്",
    invalidCaptcha: "തെറ്റായ കാപ്ച്ച കോഡ്",
    requiredField: "ഈ ഫീൽഡ് ആവശ്യമാണ്",
    invalidEmail: "ദയവായി സാധുവായ ഇമെയിൽ വിലാസം നൽകുക",
    invalidPhone: "ദയവായി സാധുവായ ഫോൺ നമ്പർ നൽകുക",
    minCharacters: "കുറഞ്ഞത് 5 പ്രതീകങ്ങൾ ആവശ്യമാണ്",
  },
  profile: {
    personalInformation: "വ്യക്തിഗത വിവരങ്ങൾ",
    contactDetails: "ബന്ധപ്പെടാനുള്ള വിവരങ്ങൾ",
    preferences: "മുൻഗണനകൾ",
    changePassword: "പാസ്‌വേഡ് മാറ്റുക",
    avatar: "അവതാർ",
    updateProfile: "പ്രൊഫൈൽ അപ്ഡേറ്റ് ചെയ്യുക",
      profileUpdated: "പ്രൊഫൈൽ വിജയകരമായി അപ്ഡേറ്റ് ചെയ്തു",
    currentPassword: "നിലവിലെ പാസ്‌വേഡ്",
    newPassword: "പുതിയ പാസ്‌വേഡ്",
    confirmPassword: "പാസ്‌വേഡ് സ്ഥിരീകരിക്കുക",
    passwordMismatch: "പാസ്‌വേഡുകൾ പൊരുത്തപ്പെടുന്നില്ല",
    passwordChanged: "പാസ്‌വേഡ് വിജയകരമായി മാറ്റി",
  },
  settings: {
    generalSettings: "സാധാരണ ക്രമീകരണങ്ങൾ",
    languageSettings: "ഭാഷാ ക്രമീകരണങ്ങൾ",
    notificationSettings: "അറിയിപ്പ് ക്രമീകരണങ്ങൾ",
      privacySettings: "സ്വകാര്യത ക്രമീകരണങ്ങൾ",
    language: "ഭാഷ",
    notifications: "അറിയിപ്പുകൾ",
    emailAlerts: "ഇമെയിൽ അലേർട്ടുകൾ",
    smsAlerts: "SMS അലേർട്ടുകൾ",
    darkMode: "ഡാർക്ക് മോഡ്",
    soundEffects: "സൗണ്ട് ഇഫക്റ്റുകൾ",
    dataRetention: "ഡാറ്റ നിലനിർത്തൽ",
    accountDeletion: "അക്കൗണ്ട് നീക്കം ചെയ്യൽ",
  },
  dashboard: {
    totalComplaints: "മൊത്തം പരാതികൾ",
      resolvedToday: "ഇന്ന് പരിഹരിച്ചു",
    slaBreaches: "SLA ലംഘനങ്ങൾ",
    activeUsers: "സജീവ ഉപയോക്താക്കൾ",
    complaintsByStatus: "നിലയനുസരിച്ച് പരാതികൾ",
    slaCompliance: "SLA അനുസരണം",
    recentComplaints: "അടുത്തകാല പരാതികൾ",
    wardPerformance: "വാർഡ് പ്രകടനം",
    quickActions: "വേഗത്തിലുള്ള പ്രവർത്തനങ്ങൾ",
      overallCompliance: "മൊത്തത്തിലുള്ള പാലിക്കൽ നിരക്ക്",
    onTime: "സമയത്ത്",
    warning: "മുന്നറിയിപ്പ്",
    overdue: "കാലഹരണപ്പെട്ട",
  },
  admin: {
    userManagement: "ഉപയോക്തൃ മാനേജ്മെന്റ്",
    systemConfiguration: "സിസ്റ്റം കോൺഫിഗറേഷൻ",
    languageManagement: "ഭാഷാ മാനേജ്മെന്റ്",
    analytics: "അനാലിറ്റിക്സ്",
    reports: "റിപ്പോർട്ടുകൾ",
  },
  messages: {
    networkError:
      "നെറ്റ്‌വർക്ക് കണക്ഷൻ പിശക്. നിങ്ങളുടെ ഇന്റർനെറ്റ് കണക്ഷൻ പരിശോധിക്കുക.",
      serverError: "സെർവർ പിശക്. പിന്നീട് വീണ്ടും ശ്രമിക്കുക.",
      notFound: "അഭ്യർത്ഥിച്ച ഉറവിടം കണ്ടെത്തിയില്ല.",
    unauthorized: "ഈ ഉറവിടം ആക്സസ് ചെയ്യാൻ നിങ്ങൾക്ക് അധികാരമില്ല.",
    forbidden: "പ്രവേശനം വിലക്കിയിരിക്കുന്നു.",
    validationError:
      "നിങ്ങളുടെ ഇൻപുട്ട് പരിശോധിച്ച് വീണ്ടും ശ്രമിക്കുക.",
    sessionExpired:
      "നിങ്ങളുടെ സെഷൻ കാലഹരണപ്പെട്ടു. വീണ്ടും ലോഗിൻ ചെയ്യുക.",
    operationSuccess: "പ്രവർത്തനം വിജയകരമായി പൂർത്തിയാക്കി.",
    operationFailed: "പ്രവർത്തനം പരാജയപ്പെട്ടു. ദയവായി വീണ്ടും ശ്രമിക്കുക.",
  },
};

export const translations = {
  en: englishTranslations,
  hi: hindiTranslations,
  ml: malayalamTranslations,
};
