export type Language = 'en' | 'kn' | 'ta' | 'hi';

export interface Translations {
  // Navigation & Branding
  brandName: string;
  brandTagline: string;
  patientPortal: string;
  doctorPortal: string;
  triageDesk: string;
  fhirAbdm: string;
  signOut: string;
  audioHelp: string;
  audioOn: string;
  sos: string;

  // Login Page
  patientLoginTab: string;
  doctorLoginTab: string;
  patientIdOrEmail: string;
  doctorIdOrEmail: string;
  password: string;
  newPassword: string;
  confirmPassword: string;
  signInButton: string;
  forgotPasswordButton: string;
  forgotPasswordModalTitle: string;
  resetPasswordSubmit: string;
  resetSuccess: string;
  orContinueWith: string;
  signInWithGoogle: string;
  dontHaveAccount: string;
  alreadyHaveAccount: string;
  signUpButton: string;
  registerTitle: string;
  registerAsPatient: string;
  registerAsDoctor: string;

  // Demographics & Registration Form
  fullName: string;
  emailAddress: string;
  phoneNumber: string;
  age: string;
  gender: string;
  genderMale: string;
  genderFemale: string;
  genderOther: string;
  address: string;
  bloodGroup: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  specialization: string;
  licenseNumber: string;
  preferredLanguage: string;
  mandatoryConsentLabel: string;
  consentAgreementLink: string;
  consentAgreementModalTitle: string;
  consentAgreementBody: string;
  agreeAndClose: string;

  // Patient Portal Sidebar
  navHome: string;
  navProfile: string;
  navHistory: string;
  navSettings: string;

  // Patient Home
  selectDoctorPrompt: string;
  selectDoctorPlaceholder: string;
  assignedDoctor: string;
  startIntakeButton: string;
  resumeIntakeButton: string;
  intakeProgress: string;
  intakeCompleted: string;
  submitAnswer: string;
  typeYourAnswer: string;
  voiceInputButton: string;
  voiceListening: string;

  // Patient Profile
  profileTitle: string;
  patientIdLabel: string;
  saveProfileChanges: string;
  profileSavedSuccess: string;
  consentStatusActive: string;

  // Patient History (Medical Records CRUD)
  historyTitle: string;
  uploadRecordButton: string;
  uploadModalTitle: string;
  recordType: string;
  recordTypePrescription: string;
  recordTypeLabTest: string;
  recordTypeScanReport: string;
  recordTypeDischarge: string;
  recordTitle: string;
  recordDescription: string;
  selectFile: string;
  emptyHistoryTitle: string;
  emptyHistorySub: string;
  deleteRecord: string;
  ocrExtractedFindings: string;

  // Settings
  settingsTitle: string;
  themeLabel: string;
  themeLight: string;
  themeDark: string;
  languageLabel: string;
  privacyPolicyNotice: string;

  // Doctor Portal
  doctorQueueTitle: string;
  searchPatientPlaceholder: string;
  emptyQueueTitle: string;
  emptyQueueSub: string;
  caseReviewTitle: string;
  chiefComplaint: string;
  hpiTitle: string;
  medicalHistorySection: string;
  documentsEvidenceSection: string;
  verifyFieldButton: string;
  verifiedBadge: string;
  clinicalNotesLabel: string;
  prescriptionPlanLabel: string;
  signOffCaseButton: string;
  signOffSuccess: string;
  exportFhirButton: string;
  doctorHistoryTab: string;
}

export const translations: Record<Language, Translations> = {
  en: {
    brandName: "MediKiosk",
    brandTagline: "Pre-Consultation Clinical Intake • SIH26047",
    patientPortal: "Patient Portal",
    doctorPortal: "Doctor Portal",
    triageDesk: "Triage Desk",
    fhirAbdm: "FHIR / ABDM",
    signOut: "Sign Out",
    audioHelp: "Audio Help",
    audioOn: "Audio ON",
    sos: "SOS",

    patientLoginTab: "PATIENT LOGIN",
    doctorLoginTab: "DOCTOR LOGIN",
    patientIdOrEmail: "Patient ID (e.g. MK-P10001) or Phone / Email",
    doctorIdOrEmail: "Doctor ID (e.g. MK-D10001) or Email",
    password: "Password",
    newPassword: "New Password",
    confirmPassword: "Confirm Password",
    signInButton: "Sign In",
    forgotPasswordButton: "Forgot Password?",
    forgotPasswordModalTitle: "Reset Your Account Password",
    resetPasswordSubmit: "Set New Password",
    resetSuccess: "Password reset successfully! You can now sign in.",
    orContinueWith: "Or continue with",
    signInWithGoogle: "Sign In with Google",
    dontHaveAccount: "Don't have an account?",
    alreadyHaveAccount: "Already have an account?",
    signUpButton: "Register for MediKiosk",
    registerTitle: "Create Verified Account",
    registerAsPatient: "Patient Account",
    registerAsDoctor: "Doctor Account",

    fullName: "Full Name",
    emailAddress: "Email Address",
    phoneNumber: "Mobile Number",
    age: "Age",
    gender: "Gender",
    genderMale: "Male",
    genderFemale: "Female",
    genderOther: "Other",
    address: "Residential Address",
    bloodGroup: "Blood Group",
    emergencyContactName: "Emergency Contact Name",
    emergencyContactPhone: "Emergency Contact Phone",
    specialization: "Medical Specialization",
    licenseNumber: "Medical License Number",
    preferredLanguage: "Preferred Language",
    mandatoryConsentLabel: "I explicitly consent to the collection and processing of my health intake data for doctor consultation under ABDM & Digital Personal Data Protection (DPDP) Act standards.",
    consentAgreementLink: "View Consent Agreement & Terms",
    consentAgreementModalTitle: "Informed Patient Consent Agreement",
    consentAgreementBody: "MediKiosk operates as a pre-consultation case-taking assistant under Ministry of Ayush & ABDM standards. By proceeding, you authorize MediKiosk to record your self-reported symptoms, medications, and medical documents to prepare an evidence-linked longitudinal summary strictly for your treating physician. MediKiosk does not autonomously diagnose or prescribe. Your consent can be reviewed or revoked at any time in Settings.",
    agreeAndClose: "I Understand and Agree",

    navHome: "Home",
    navProfile: "Profile",
    navHistory: "Medical History",
    navSettings: "Settings",

    selectDoctorPrompt: "Select or Enter Doctor ID / Name before Starting Intake",
    selectDoctorPlaceholder: "Search Doctor by Name or ID (e.g. MK-D10001)...",
    assignedDoctor: "Assigned Physician",
    startIntakeButton: "Start Pre-Consultation Intake",
    resumeIntakeButton: "Continue Clinical Intake",
    intakeProgress: "Clinical Intake Progress",
    intakeCompleted: "Intake Complete! Ready for Doctor Review.",
    submitAnswer: "Submit & Next Question",
    typeYourAnswer: "Type your response or choose from options below...",
    voiceInputButton: "Speak Answer",
    voiceListening: "Listening... speak clearly into microphone",

    profileTitle: "Patient Demographic Profile",
    patientIdLabel: "Unique MediKiosk ID",
    saveProfileChanges: "Save Profile Changes",
    profileSavedSuccess: "Profile updated successfully in Supabase!",
    consentStatusActive: "Explicit Clinical Consent: ACTIVE",

    historyTitle: "Medical Records & OCR Extraction",
    uploadRecordButton: "Upload Record",
    uploadModalTitle: "Upload Medical Document (Prescription / Scan / Lab Report)",
    recordType: "Record Category",
    recordTypePrescription: "Prescription",
    recordTypeLabTest: "Lab Test Report",
    recordTypeScanReport: "Scan / X-Ray Report",
    recordTypeDischarge: "Discharge Summary",
    recordTitle: "Record Title / Doctor Name",
    recordDescription: "Notes / Description",
    selectFile: "Choose File (PDF, PNG, JPG)",
    emptyHistoryTitle: "No Medical Records Found",
    emptyHistorySub: "Upload your prescriptions, scan reports, or lab tests to build your real longitudinal case history.",
    deleteRecord: "Delete",
    ocrExtractedFindings: "AI / OCR Extracted Clinical Findings",

    settingsTitle: "Application & System Settings",
    themeLabel: "Display Theme",
    themeLight: "Healthcare Light (White & Blue)",
    themeDark: "Dark Charcoal & Blue",
    languageLabel: "Interface & Clinical Question Language",
    privacyPolicyNotice: "Designed with privacy-by-design principles and intended to align with applicable Indian data protection, ABDM consent, and healthcare security requirements. Production deployment requires formal security and compliance validation.",

    doctorQueueTitle: "Physician Clinical Queue",
    searchPatientPlaceholder: "Search Patients by Patient ID (MK-P10001) or Name in Database...",
    emptyQueueTitle: "No Patients in Queue",
    emptyQueueSub: "Connected patients who complete pre-consultation intake will appear here automatically.",
    caseReviewTitle: "Evidence-Linked Clinical Case Review",
    chiefComplaint: "Chief Complaint",
    hpiTitle: "History of Present Illness (HPI)",
    medicalHistorySection: "Medical History & Current Medications",
    documentsEvidenceSection: "Attached Document Evidence & Scans",
    verifyFieldButton: "Doctor Verify",
    verifiedBadge: "Verified by Doctor",
    clinicalNotesLabel: "Physician Clinical Notes",
    prescriptionPlanLabel: "Provisional Care Plan & Prescription",
    signOffCaseButton: "Complete & Sign Off Case",
    signOffSuccess: "Case verified and signed off successfully! Audit log and FHIR bundle generated.",
    exportFhirButton: "Export FHIR R4 Bundle",
    doctorHistoryTab: "Reviewed Cases History"
  },

  kn: {
    brandName: "ಮೆಡಿಕಿಯೋಸ್ಕ್",
    brandTagline: "ಸಮಾಲೋಚನೆಗೆ ಮುಂಚಿನ ಕ್ಲಿನಿಕಲ್ ಇಂಟೇಕ್ • SIH26047",
    patientPortal: "ರೋಗಿಗಳ ಪೋರ್ಟಲ್",
    doctorPortal: "ವೈದ್ಯರ ಪೋರ್ಟಲ್",
    triageDesk: "ಟ್ರಯಾಜ್ ಡೆಸ್ಕ್",
    fhirAbdm: "FHIR / ABDM",
    signOut: "ಸೈನ್ ಔಟ್",
    audioHelp: "ಧ್ವನಿ ಸಹಾಯ",
    audioOn: "ಧ್ವನಿ ಆನ್ ಆಗಿದೆ",
    sos: "ತುರ್ತು ಸಹಾಯ (SOS)",

    patientLoginTab: "ರೋಗಿಗಳ ಲಾಗಿನ್",
    doctorLoginTab: "ವೈದ್ಯರ ಲಾಗಿನ್",
    patientIdOrEmail: "ರೋಗಿಯ ಐಡಿ (ಉದಾ. MK-P10001) ಅಥವಾ ಫೋನ್ / ಇಮೇಲ್",
    doctorIdOrEmail: "ವೈದ್ಯರ ಐಡಿ (ಉದಾ. MK-D10001) ಅಥವಾ ಇಮೇಲ್",
    password: "ಪಾಸ್‌ವರ್ಡ್",
    newPassword: "ಹೊಸ ಪಾಸ್‌ವರ್ಡ್",
    confirmPassword: "ಪಾಸ್‌ವರ್ಡ್ ದೃಢೀಕರಿಸಿ",
    signInButton: "ಲಾಗಿನ್ ಆಗಿ",
    forgotPasswordButton: "ಪಾಸ್‌ವರ್ಡ್ ಮರೆತಿರಾ?",
    forgotPasswordModalTitle: "ಪಾಸ್‌ವರ್ಡ್ ಮರುಹೊಂದಿಸಿ",
    resetPasswordSubmit: "ಹೊಸ ಪಾಸ್‌ವರ್ಡ್ ಹೊಂದಿಸಿ",
    resetSuccess: "ಪಾಸ್‌ವರ್ಡ್ ಯಶಸ್ವಿಯಾಗಿ ಬದಲಾಗಿದೆ! ಈಗ ನೀವು ಲಾಗಿನ್ ಆಗಬಹುದು.",
    orContinueWith: "ಅಥವಾ ಇದರ ಮೂಲಕ ಮುಂದುವರಿಯಿರಿ",
    signInWithGoogle: "ಗೂಗಲ್ ಮೂಲಕ ಲಾಗಿನ್ ಆಗಿ",
    dontHaveAccount: "ಖಾತೆ ಇಲ್ಲವೇ?",
    alreadyHaveAccount: "ಈಗಾಗಲೇ ಖಾತೆ ಹೊಂದಿದ್ದೀರಾ?",
    signUpButton: "ಹೊಸ ಖಾತೆ ನೋಂದಾಯಿಸಿ",
    registerTitle: "ಖಾತೆ ನೋಂದಣಿ",
    registerAsPatient: "ರೋಗಿಯ ಖಾತೆ",
    registerAsDoctor: "ವೈದ್ಯರ ಖಾತೆ",

    fullName: "ಪೂರ್ಣ ಹೆಸರು",
    emailAddress: "ಇಮೇಲ್ ವಿಳಾಸ",
    phoneNumber: "ಮೊಬೈಲ್ ಸಂಖ್ಯೆ",
    age: "ವಯಸ್ಸು",
    gender: "ಲಿಂಗ",
    genderMale: "ಪುರುಷ",
    genderFemale: "ಮಹಿಳೆ",
    genderOther: "ಇತರೆ",
    address: "ನಿವಾಸದ ವಿಳಾಸ",
    bloodGroup: "ರಕ್ತದ ಗುಂಪು",
    emergencyContactName: "ತುರ್ತು ಸಂಪರ್ಕ ವ್ಯಕ್ತಿಯ ಹೆಸರು",
    emergencyContactPhone: "ತುರ್ತು ಸಂಪರ್ಕ ಫೋನ್ ಸಂಖ್ಯೆ",
    specialization: "ವೈದ್ಯಕೀಯ ಪರಿಣತಿ",
    licenseNumber: "ವೈದ್ಯಕೀಯ ಪರವಾನಗಿ ಸಂಖ್ಯೆ",
    preferredLanguage: "ಆದ್ಯತೆಯ ಭಾಷೆ",
    mandatoryConsentLabel: "ABDM ಮತ್ತು ಡಿಜಿಟಲ್ ವೈಯಕ್ತಿಕ ಡೇಟಾ ಸಂರಕ್ಷಣೆ (DPDP) ಕಾಯಿದೆಯ ಮಾನದಂಡಗಳ ಅಡಿಯಲ್ಲಿ ವೈದ್ಯಕೀಯ ಸಮಾಲೋಚನೆಗಾಗಿ ನನ್ನ ಆರೋಗ್ಯ ಮಾಹಿತಿಯನ್ನು ಸಂಗ್ರಹಿಸಲು ಮತ್ತು ಪ್ರಕ್ರಿಯೆಗೊಳಿಸಲು ನಾನು ಸ್ಪಷ್ಟವಾಗಿ ಒಪ್ಪಿಗೆ ನೀಡುತ್ತೇನೆ.",
    consentAgreementLink: "ಒಪ್ಪಂದದ ನಿಯಮಗಳನ್ನು ವೀಕ್ಷಿಸಿ",
    consentAgreementModalTitle: "ರೋಗಿಯ ಮಾಹಿತಿ ಒಪ್ಪಂದ",
    consentAgreementBody: "ಮೆಡಿಕಿಯೋಸ್ಕ್ ಆಯುಷ್ ಸಚಿವಾಲಯ ಮತ್ತು ABDM ಮಾನದಂಡಗಳ ಅಡಿಯಲ್ಲಿ ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತದೆ. ನಿಮ್ಮ ವೈದ್ಯರಿಗೆ ಕ್ಲಿನಿಕಲ್ ಸಾರಾಂಶವನ್ನು ಸಿದ್ಧಪಡಿಸಲು ನಿಮ್ಮ ಲಕ್ಷಣಗಳು, ಔಷಧಿಗಳು ಮತ್ತು ದಾಖಲೆಗಳನ್ನು ಸಂಗ್ರಹಿಸಲು ನೀವು ಅಧಿಕಾರ ನೀಡುತ್ತೀರಿ. ಮೆಡಿಕಿಯೋಸ್ಕ್ ತಾನಾಗಿಯೇ ರೋಗನಿರ್ಣಯ ಅಥವಾ ಔಷಧಿಯನ್ನು ನೀಡುವುದಿಲ್ಲ.",
    agreeAndClose: "ನಾನು ಅರ್ಥಮಾಡಿಕೊಂಡಿದ್ದೇನೆ ಮತ್ತು ಒಪ್ಪುತ್ತೇನೆ",

    navHome: "ಮುಖಪುಟ",
    navProfile: "ಪ್ರೊಫೈಲ್",
    navHistory: "ವೈದ್ಯಕೀಯ ಇತಿಹಾಸ",
    navSettings: "ಸೆಟ್ಟಿಂಗ್‌ಗಳು",

    selectDoctorPrompt: "ಪ್ರಾರಂಭಿಸುವ ಮೊದಲು ವೈದ್ಯರ ಐಡಿ / ಹೆಸರನ್ನು ಆಯ್ಕೆಮಾಡಿ",
    selectDoctorPlaceholder: "ವೈದ್ಯರನ್ನು ಹುಡುಕಿ (ಉದಾ. MK-D10001)...",
    assignedDoctor: "ನೇಮಕಗೊಂಡ ವೈದ್ಯರು",
    startIntakeButton: "ಕ್ಲಿನಿಕಲ್ ಇಂಟೇಕ್ ಪ್ರಾರಂಭಿಸಿ",
    resumeIntakeButton: "ಇಂಟೇಕ್ ಮುಂದುವರಿಸಿ",
    intakeProgress: "ಪ್ರಶ್ನೋತ್ತರ ಪ್ರಗತಿ",
    intakeCompleted: "ಪ್ರಶ್ನಾವಳಿ ಪೂರ್ಣಗೊಂಡಿದೆ! ವೈದ್ಯರ ಪರಿಶೀಲನೆಗೆ ಸಿದ್ಧವಾಗಿದೆ.",
    submitAnswer: "ಉತ್ತರಿಸಿ ಮತ್ತು ಮುಂದಿನ ಪ್ರಶ್ನೆ",
    typeYourAnswer: "ನಿಮ್ಮ ಉತ್ತರವನ್ನು ಟೈಪ್ ಮಾಡಿ ಅಥವಾ ಕೆಳಗೆ ಆಯ್ಕೆಮಾಡಿ...",
    voiceInputButton: "ಧ್ವನಿ ಮೂಲಕ ಮಾತನಾಡಿ",
    voiceListening: "ಆಲಿಸುತ್ತಿದೆ... ಮೈಕ್ರೊಫೋನ್‌ನಲ್ಲಿ ಸ್ಪಷ್ಟವಾಗಿ ಮಾತನಾಡಿ",

    profileTitle: "ರೋಗಿಯ ವಿವರಗಳು",
    patientIdLabel: "ಮೆಡಿಕಿಯೋಸ್ಕ್ ಐಡಿ",
    saveProfileChanges: "ಬದಲಾವಣೆಗಳನ್ನು ಉಳಿಸಿ",
    profileSavedSuccess: "ವಿವರಗಳನ್ನು ಯಶಸ್ವಿಯಾಗಿ ನವೀಕರಿಸಲಾಗಿದೆ!",
    consentStatusActive: "ಸಮ್ಮತಿ ಸ್ಥಿತಿ: ಸಕ್ರಿಯವಾಗಿದೆ",

    historyTitle: "ವೈದ್ಯಕೀಯ ದಾಖಲೆಗಳು ಮತ್ತು OCR",
    uploadRecordButton: "ದಾಖಲೆ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ",
    uploadModalTitle: "ವೈದ್ಯಕೀಯ ದಾಖಲೆ ಅಪ್‌ಲೋಡ್ (ಪ್ರಿಸ್ಕ್ರಿಪ್ಷನ್ / ಸ್ಕ್ಯಾನ್ / ಲ್ಯಾಬ್ ವರದಿ)",
    recordType: "ದಾಖಲೆಯ ಪ್ರಕಾರ",
    recordTypePrescription: "ಪ್ರಿಸ್ಕ್ರಿಪ್ಷನ್ (ಔಷಧಿ ಚೀಟಿ)",
    recordTypeLabTest: "ಪ್ರಯೋಗಾಲಯ ವರದಿ",
    recordTypeScanReport: "ಸ್ಕ್ಯಾನ್ / ಎಕ್ಸ್-ರೇ ವರದಿ",
    recordTypeDischarge: "ಡಿಸ್ಚಾರ್ಜ್ ಸಾರಾಂಶ",
    recordTitle: "ದಾಖಲೆಯ ಶೀರ್ಷಿಕೆ",
    recordDescription: "ಟಿಪ್ಪಣಿಗಳು",
    selectFile: "ಫೈಲ್ ಆಯ್ಕೆಮಾಡಿ (PDF, PNG, JPG)",
    emptyHistoryTitle: "ಯಾವುದೇ ದಾಖಲೆಗಳು ಕಂಡುಬಂದಿಲ್ಲ",
    emptyHistorySub: "ನಿಮ್ಮ ಪ್ರಿಸ್ಕ್ರಿಪ್ಷನ್ ಅಥವಾ ಸ್ಕ್ಯಾನ್ ವರದಿಗಳನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡಿ.",
    deleteRecord: "ಅಳಿಸಿ",
    ocrExtractedFindings: "AI / OCR ಹೊರತೆಗೆದ ಸಂಶೋಧನೆಗಳು",

    settingsTitle: "ಅಪ್ಲಿಕೇಶನ್ ಸೆಟ್ಟಿಂಗ್‌ಗಳು",
    themeLabel: "ಥೀಮ್ ಆಯ್ಕೆಮಾಡಿ",
    themeLight: "ಲೈಟ್ ಮೋಡ್ (ಬಿಳಿ ಮತ್ತು ನೀಲಿ)",
    themeDark: "ಡಾರ್ಕ್ ಮೋಡ್ (ಕಪ್ಪು ಮತ್ತು ನೀಲಿ)",
    languageLabel: "ಭಾಷೆ ಆಯ್ಕೆ",
    privacyPolicyNotice: "ಗೌಪ್ಯತೆ-ಮೂಲಕ-ವಿನ್ಯಾಸ ತತ್ವಗಳೊಂದಿಗೆ ವಿನ್ಯಾಸಗೊಳಿಸಲಾಗಿದೆ ಮತ್ತು ಭಾರತೀಯ ಡೇಟಾ ಸಂರಕ್ಷಣೆ ಮತ್ತು ABDM ಸಮ್ಮತಿ ಮಾನದಂಡಗಳಿಗೆ ಅನುಗುಣವಾಗಿದೆ.",

    doctorQueueTitle: "ವೈದ್ಯರ ರೋಗಿಗಳ ಪಟ್ಟಿ",
    searchPatientPlaceholder: "ರೋಗಿಯ ಐಡಿ (MK-P10001) ಅಥವಾ ಹೆಸರಿನಿಂದ ಹುಡುಕಿ...",
    emptyQueueTitle: "ಸಾಲಿನಲ್ಲಿ ಯಾವುದೇ ರೋಗಿಗಳಿಲ್ಲ",
    emptyQueueSub: "ಇಂಟೇಕ್ ಪೂರ್ಣಗೊಳಿಸಿದ ರೋಗಿಗಳು ಇಲ್ಲಿ ಸ್ವಯಂಚಾಲಿತವಾಗಿ ಕಾಣಿಸಿಕೊಳ್ಳುತ್ತಾರೆ.",
    caseReviewTitle: "ಕ್ಲಿನಿಕಲ್ ಕೇಸ್ ಪರಿಶೀಲನೆ",
    chiefComplaint: "ಮುಖ್ಯ ಲಕ್ಷಣ",
    hpiTitle: "ಪ್ರಸ್ತುತ ಅನಾರೋಗ್ಯದ ಇತಿಹಾಸ",
    medicalHistorySection: "ಹಿಂದಿನ ವೈದ್ಯಕೀಯ ಇತಿಹಾಸ ಮತ್ತು ಔಷಧಿಗಳು",
    documentsEvidenceSection: "ಅಪ್‌ಲೋಡ್ ಮಾಡಿದ ದಾಖಲೆಗಳು",
    verifyFieldButton: "ದೃಢೀಕರಿಸಿ",
    verifiedBadge: "ವೈದ್ಯರಿಂದ ಪರಿಶೀಲಿಸಲಾಗಿದೆ",
    clinicalNotesLabel: "ವೈದ್ಯರ ಕ್ಲಿನಿಕಲ್ ಟಿಪ್ಪಣಿಗಳು",
    prescriptionPlanLabel: "ಚಿಕಿತ್ಸಾ ಯೋಜನೆ ಮತ್ತು ಪ್ರಿಸ್ಕ್ರಿಪ್ಷನ್",
    signOffCaseButton: "ಸಹಿ ಮಾಡಿ ಮುಕ್ತಾಯಗೊಳಿಸಿ",
    signOffSuccess: "ಕೇಸ್ ಯಶಸ್ವಿಯಾಗಿ ಪರಿಶೀಲಿಸಲಾಗಿದೆ ಮತ್ತು ಸೈನ್ ಆಫ್ ಆಗಿದೆ!",
    exportFhirButton: "FHIR R4 ರಫ್ತು ಮಾಡಿ",
    doctorHistoryTab: "ಪರಿಶೀಲಿಸಿದ ಕೇಸ್‌ಗಳ ಇತಿಹಾಸ"
  },

  ta: {
    brandName: "மெடிகியோஸ்க்",
    brandTagline: "மருத்துவ ஆலோசனைக்கு முந்தைய தகவல் பதிவு • SIH26047",
    patientPortal: "நோயாளி போர்ட்டல்",
    doctorPortal: "மருத்துவர் போர்ட்டல்",
    triageDesk: "ட்ரியேஜ் டெஸ்க்",
    fhirAbdm: "FHIR / ABDM",
    signOut: "வெளியேறு",
    audioHelp: "ஆடியோ உதவி",
    audioOn: "ஆடியோ இயக்கத்தில் உள்ளது",
    sos: "அவசர உதவி (SOS)",

    patientLoginTab: "நோயாளி உள்நுழைவு",
    doctorLoginTab: "மருத்துவர் உள்நுழைவு",
    patientIdOrEmail: "நோயாளி ஐடி (எ.கா. MK-P10001) அல்லது தொலைபேசி / மின்னஞ்சல்",
    doctorIdOrEmail: "மருத்துவர் ஐடி (எ.கா. MK-D10001) அல்லது மின்னஞ்சல்",
    password: "கடவுச்சொல்",
    newPassword: "புதிய கடவுச்சொல்",
    confirmPassword: "கடவுச்சொல்லை உறுதிப்படுத்துக",
    signInButton: "உள்நுழைக",
    forgotPasswordButton: "கடவுச்சொல் மறந்துவிட்டதா?",
    forgotPasswordModalTitle: "கடவுச்சொல்லை மீட்டமைக்கவும்",
    resetPasswordSubmit: "புதிய கடவுச்சொல்லை அமைக்கவும்",
    resetSuccess: "கடவுச்சொல் வெற்றிகரமாக மீட்டமைக்கப்பட்டது! இப்போது உள்நுழையலாம்.",
    orContinueWith: "அல்லது இதன் மூலம் தொடரவும்",
    signInWithGoogle: "கூகிள் மூலம் உள்நுழைக",
    dontHaveAccount: "கணக்கு இல்லையா?",
    alreadyHaveAccount: "ஏற்கனவே கணக்கு உள்ளதா?",
    signUpButton: "புதிய கணக்கு பதிவு",
    registerTitle: "புதிய கணக்கு உருவாக்குதல்",
    registerAsPatient: "நோயாளி கணக்கு",
    registerAsDoctor: "மருத்துவர் கணக்கு",

    fullName: "முழு பெயர்",
    emailAddress: "மின்னஞ்சல் முகவரி",
    phoneNumber: "கைபேசி எண்",
    age: "வயது",
    gender: "பாலினம்",
    genderMale: "ஆண்",
    genderFemale: "பெண்",
    genderOther: "மற்றவை",
    address: "முகவரி",
    bloodGroup: "இரத்த பிரிவு",
    emergencyContactName: "அவசர தொடர்பு பெயர்",
    emergencyContactPhone: "அவசர தொடர்பு எண்",
    specialization: "மருத்துவ சிறப்பு",
    licenseNumber: "மருத்துவ உரிம எண்",
    preferredLanguage: "விருப்பமான மொழி",
    mandatoryConsentLabel: "ABDM மற்றும் டிஜிட்டல் தனிநபர் தரவு பாதுகாப்பு (DPDP) சட்டத்தின் கீழ் எனது மருத்துவத் தகவலைச் சேகரித்து செயலாக்க நான் முழு மனதுடன் ஒப்புதல் அளிக்கிறேன்.",
    consentAgreementLink: "ஒப்புதல் விதிமுறைகளைக் காண்க",
    consentAgreementModalTitle: "நோயாளி ஒப்புதல் ஒப்பந்தம்",
    consentAgreementBody: "மெடிகியோஸ்க் ஆயுஷ் அமைச்சகம் மற்றும் ABDM விதிமுறைகளின் கீழ் இயங்குகிறது. உங்கள் அறிகுறிகள், மருந்துகள் மற்றும் ஆவணங்களை மருத்துவரிடம் சமர்ப்பிக்க இந்த அமைப்பு உதவுகிறது. இது தானாகவே மருந்து பரிந்துரைக்காது.",
    agreeAndClose: "நான் புரிந்து கொண்டு ஒப்புக்கொள்கிறேன்",

    navHome: "முகப்பு",
    navProfile: "சுயவிவரம்",
    navHistory: "மருத்துவ வரலாறு",
    navSettings: "அமைப்புகள்",

    selectDoctorPrompt: "தொடங்குவதற்கு முன் மருத்துவர் ஐடி / பெயரைத் தேர்ந்தெடுக்கவும்",
    selectDoctorPlaceholder: "மருத்துவரைத் தேடுக (எ.கா. MK-D10001)...",
    assignedDoctor: "நியமிக்கப்பட்ட மருத்துவர்",
    startIntakeButton: "கேள்வி-பதிலைத் தொடங்கவும்",
    resumeIntakeButton: "தொடரவும்",
    intakeProgress: "முன்னேற்றம்",
    intakeCompleted: "முழுமையடைந்தது! மருத்துவர் மதிப்பாய்வுக்குத் தயார்.",
    submitAnswer: "பதிலைச் சமர்ப்பித்து அடுத்த கேள்விக்குச் செல்க",
    typeYourAnswer: "உங்கள் பதிலை உள்ளிடவும்...",
    voiceInputButton: "குரல் மூலம் பேசுக",
    voiceListening: "கேட்கிறது... தெளிவாகப் பேசுங்கள்",

    profileTitle: "நோயாளி சுயவிவரம்",
    patientIdLabel: "மெடிகியோஸ்க் ஐடி",
    saveProfileChanges: "மாற்றங்களைச் சேமிக்கவும்",
    profileSavedSuccess: "சுயவிவரம் புதுப்பிக்கப்பட்டது!",
    consentStatusActive: "ஒப்புதல் நிலை: செயலில் உள்ளது",

    historyTitle: "மருத்துவ ஆவணங்கள் & OCR",
    uploadRecordButton: "ஆவணத்தைப் பதிவேற்றுக",
    uploadModalTitle: "மருத்துவ ஆவணப் பதிவேற்றம் (மருந்து சீட்டு / ஸ்கேன் / பரிசோதனை)",
    recordType: "ஆவண வகை",
    recordTypePrescription: "மருந்துச் சீட்டு",
    recordTypeLabTest: "பரிசோதனை அறிக்கை",
    recordTypeScanReport: "ஸ்கேன் / எக்ஸ்ரே அறிக்கை",
    recordTypeDischarge: "டிஸ்சார்ஜ் சுருக்கம்",
    recordTitle: "ஆவணத் தலைப்பு",
    recordDescription: "குறிப்புகள்",
    selectFile: "கோப்பைத் தேர்ந்தெடுக்கவும் (PDF, PNG, JPG)",
    emptyHistoryTitle: "ஆவணங்கள் எதுவும் இல்லை",
    emptyHistorySub: "உங்கள் மருத்துவ ஆவணங்களை இங்கே பதிவேற்றலாம்.",
    deleteRecord: "நீக்குக",
    ocrExtractedFindings: "AI / OCR பிரித்தெடுத்த மருத்துவ விவரங்கள்",

    settingsTitle: "அமைப்புகள்",
    themeLabel: "வண்ண தீம்",
    themeLight: "வெள்ளை & நீலம் (லைட் மோட்)",
    themeDark: "இருண்ட நீலம் (டார்க் மோட்)",
    languageLabel: "மொழி தேர்வு",
    privacyPolicyNotice: "இந்திய தரவு பாதுகாப்பு மற்றும் ABDM ஒப்புதல் விதிமுறைகளின்படி வடிவமைக்கப்பட்டுள்ளது.",

    doctorQueueTitle: "மருத்துவர் நோயாளிகள் வரிசை",
    searchPatientPlaceholder: "நோயாளி ஐடி (MK-P10001) அல்லது பெயரால் தேடுக...",
    emptyQueueTitle: "வரிசையில் நோயாளிகள் இல்லை",
    emptyQueueSub: "தகவல் பதிவை முடித்த நோயாளிகள் இங்கே தோன்றுவார்கள்.",
    caseReviewTitle: "மருத்துவ பரிசீலனை",
    chiefComplaint: "முக்கிய பிரச்சனை",
    hpiTitle: "நோய் வரலாறு",
    medicalHistorySection: "முந்தைய மருத்துவ வரலாறு & மருந்துகள்",
    documentsEvidenceSection: "இணைக்கப்பட்ட ஆவணங்கள்",
    verifyFieldButton: "சரிபார்",
    verifiedBadge: "மருத்துவரால் சரிபார்க்கப்பட்டது",
    clinicalNotesLabel: "மருத்துவரின் மருத்துவக் குறிப்புகள்",
    prescriptionPlanLabel: "சிகிச்சைத் திட்டம் & மருந்துச் சீட்டு",
    signOffCaseButton: "கையொப்பமிட்டு முடிக்கவும்",
    signOffSuccess: "வழக்கு வெற்றிகரமாக சரிபார்க்கப்பட்டு கையொப்பமிடப்பட்டது!",
    exportFhirButton: "FHIR R4 ஏற்றுமதி",
    doctorHistoryTab: "மதிப்பாய்வு செய்யப்பட்ட வரலாறு"
  },

  hi: {
    brandName: "मेडीकियोस्क",
    brandTagline: "परामर्श-पूर्व केस-टेकिंग • SIH26047",
    patientPortal: "मरीज पोर्टल",
    doctorPortal: "डॉक्टर पोर्टल",
    triageDesk: "ट्राइएज डेस्क",
    fhirAbdm: "FHIR / ABDM",
    signOut: "साइन आउट",
    audioHelp: "ऑडियो सहायता",
    audioOn: "ऑडियो चालू है",
    sos: "आपातकालीन (SOS)",

    patientLoginTab: "मरीज लॉगिन",
    doctorLoginTab: "डॉक्टर लॉगिन",
    patientIdOrEmail: "मरीज आईडी (उदा. MK-P10001) या फोन / ईमेल",
    doctorIdOrEmail: "डॉक्टर आईडी (उदा. MK-D10001) या ईमेल",
    password: "पासवर्ड",
    newPassword: "नया पासवर्ड",
    confirmPassword: "पासवर्ड की पुष्टि करें",
    signInButton: "लॉगिन करें",
    forgotPasswordButton: "पासवर्ड भूल गए?",
    forgotPasswordModalTitle: "पासवर्ड रीसेट करें",
    resetPasswordSubmit: "नया पासवर्ड सेट करें",
    resetSuccess: "पासवर्ड सफलतापूर्वक रीसेट हो गया! अब आप लॉगिन कर सकते हैं।",
    orContinueWith: "या इसके साथ जारी रखें",
    signInWithGoogle: "गूगल से लॉगिन करें",
    dontHaveAccount: "खाता नहीं है?",
    alreadyHaveAccount: "पहले से खाता है?",
    signUpButton: "नया खाता बनाएं",
    registerTitle: "नया खाता पंजीकरण",
    registerAsPatient: "मरीज का खाता",
    registerAsDoctor: "डॉक्टर का खाता",

    fullName: "पूरा नाम",
    emailAddress: "ईमेल पता",
    phoneNumber: "मोबाइल नंबर",
    age: "उम्र",
    gender: "लिंग",
    genderMale: "पुरुष",
    genderFemale: "महिला",
    genderOther: "अन्य",
    address: "पता",
    bloodGroup: "रक्त समूह",
    emergencyContactName: "आपातकालीन संपर्क नाम",
    emergencyContactPhone: "आपातकालीन संपर्क फोन",
    specialization: "चिकित्सा विशेषज्ञता",
    licenseNumber: "मेडिकल लाइसेंस नंबर",
    preferredLanguage: "पसंदीदा भाषा",
    mandatoryConsentLabel: "मैं ABDM और डिजिटल पर्सनल डेटा प्रोटेक्शन (DPDP) अधिनियम के तहत परामर्श हेतु अपने स्वास्थ्य डेटा के संग्रह और उपयोग के लिए स्पष्ट सहमति देता/देती हूँ।",
    consentAgreementLink: "सहमति शर्तें देखें",
    consentAgreementModalTitle: "मरीज सहमति समझौता",
    consentAgreementBody: "मेडीकियोस्क आयुष मंत्रालय और ABDM के मानकों के अनुरूप परामर्श-पूर्व इतिहास तैयार करता है। यह प्रणाली स्वयं कोई दवा नहीं देती और न ही निदान करती है।",
    agreeAndClose: "मुझे समझ आ गया और मैं सहमत हूँ",

    navHome: "होम",
    navProfile: "प्रोफाइल",
    navHistory: "मेडिकल इतिहास",
    navSettings: "सेटिंग्स",

    selectDoctorPrompt: "शुरू करने से पहले डॉक्टर आईडी / नाम चुनें",
    selectDoctorPlaceholder: "डॉक्टर खोजें (उदा. MK-D10001)...",
    assignedDoctor: "नियुक्त चिकित्सक",
    startIntakeButton: "केस-टेकिंग शुरू करें",
    resumeIntakeButton: "प्रश्नावली जारी रखें",
    intakeProgress: "प्रगति",
    intakeCompleted: "प्रश्नावली पूर्ण! डॉक्टर समीक्षा के लिए तैयार।",
    submitAnswer: "जवाब सबमिट करें और अगला प्रश्न",
    typeYourAnswer: "अपना जवाब लिखें या नीचे विकल्प चुनें...",
    voiceInputButton: "बोलकर जवाब दें",
    voiceListening: "सुन रहा हूँ... कृपया स्पष्ट बोलें",

    profileTitle: "मरीज प्रोफाइल",
    patientIdLabel: "मेडीकियोस्क आईडी",
    saveProfileChanges: "बदलाव सहेजें",
    profileSavedSuccess: "प्रोफाइल सफलतापूर्वक अपडेट हो गई!",
    consentStatusActive: "सहमति स्थिति: सक्रिय",

    historyTitle: "मेडिकल रिकॉर्ड और OCR",
    uploadRecordButton: "रिकॉर्ड अपलोड करें",
    uploadModalTitle: "मेडिकल दस्तावेज अपलोड (पर्चा / स्कैन / लैब रिपोर्ट)",
    recordType: "दस्तावेज प्रकार",
    recordTypePrescription: "डॉक्टर का पर्चा",
    recordTypeLabTest: "लैब टेस्ट रिपोर्ट",
    recordTypeScanReport: "स्कैन / एक्स-रे रिपोर्ट",
    recordTypeDischarge: "डिस्चार्ज समरी",
    recordTitle: "दस्तावेज का शीर्षक",
    recordDescription: "टिप्पणी",
    selectFile: "फाइल चुनें (PDF, PNG, JPG)",
    emptyHistoryTitle: "कोई रिकॉर्ड नहीं मिला",
    emptyHistorySub: "अपनी पुरानी पर्चियां या रिपोर्ट यहां अपलोड करें।",
    deleteRecord: "हटाएं",
    ocrExtractedFindings: "AI / OCR द्वारा निकाले गए निष्कर्ष",

    settingsTitle: "सेटिंग्स",
    themeLabel: "डिस्प्ले थीम",
    themeLight: "लाइट मोड (सफेद और नीला)",
    themeDark: "डार्क मोड (गहरा स्लेट और नीला)",
    languageLabel: "भाषा चुनें",
    privacyPolicyNotice: "गोपनीयता-दर-डिज़ाइन सिद्धांतों के अनुसार विकसित और ABDM सहमति नियमों के अनुरूप।",

    doctorQueueTitle: "डॉक्टर मरीज कतार",
    searchPatientPlaceholder: "मरीज आईडी (MK-P10001) या नाम से खोजें...",
    emptyQueueTitle: "कतार में कोई मरीज नहीं है",
    emptyQueueSub: "इंटेक पूरा करने वाले मरीज यहां स्वतः दिखाई देंगे।",
    caseReviewTitle: "क्लीनिकल केस समीक्षा",
    chiefComplaint: "मुख्य समस्या",
    hpiTitle: "वर्तमान बीमारी का इतिहास",
    medicalHistorySection: "पिछला मेडिकल इतिहास और दवाएं",
    documentsEvidenceSection: "संलग्न दस्तावेज",
    verifyFieldButton: "सत्यापित करें",
    verifiedBadge: "डॉक्टर द्वारा सत्यापित",
    clinicalNotesLabel: "डॉक्टर के क्लीनिकल नोट्स",
    prescriptionPlanLabel: "उपचार योजना और पर्चा",
    signOffCaseButton: "हस्ताक्षर करें और समाप्त करें",
    signOffSuccess: "केस सफलतापूर्वक सत्यापित और हस्ताक्षरित हो गया!",
    exportFhirButton: "FHIR R4 निर्यात",
    doctorHistoryTab: "समीक्षित केस इतिहास"
  }
};
