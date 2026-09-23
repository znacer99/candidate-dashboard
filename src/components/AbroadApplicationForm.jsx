import { useState } from 'react'
import { Check, Upload, Plus, Trash2, Loader2, AlertCircle } from 'lucide-react'
import { supabase } from '../supabaseClient'

// Comprehensive International Dial Codes
const COUNTRY_DIAL_CODES = [
  { code: '+216', nameEn: 'Tunisia (+216)', nameAr: 'تونس (+216)' },
  { code: '+218', nameEn: 'Libya (+218)', nameAr: 'ليبيا (+218)' },
  { code: '+213', nameEn: 'Algeria (+213)', nameAr: 'الجزائر (+213)' },
  { code: '+20', nameEn: 'Egypt (+20)', nameAr: 'مصر (+20)' },
  { code: '+212', nameEn: 'Morocco (+212)', nameAr: 'المغرب (+212)' },
  { code: '+966', nameEn: 'Saudi Arabia (+966)', nameAr: 'السعودية (+966)' },
  { code: '+971', nameEn: 'UAE (+971)', nameAr: 'الإمارات (+971)' },
  { code: '+974', nameEn: 'Qatar (+974)', nameAr: 'قطر (+974)' },
  { code: '+965', nameEn: 'Kuwait (+965)', nameAr: 'الكويت (+965)' },
  { code: '+968', nameEn: 'Oman (+968)', nameAr: 'عمان (+968)' },
  { code: '+973', nameEn: 'Bahrain (+973)', nameAr: 'البحرين (+973)' },
  { code: '+962', nameEn: 'Jordan (+962)', nameAr: 'الأردن (+962)' },
  { code: '+961', nameEn: 'Lebanon (+961)', nameAr: 'لبنان (+961)' },
  { code: '+964', nameEn: 'Iraq (+964)', nameAr: 'العراق (+964)' },
  { code: '+963', nameEn: 'Syria (+963)', nameAr: 'سوريا (+963)' },
  { code: '+970', nameEn: 'Palestine (+970)', nameAr: 'فلسطين (+970)' },
  { code: '+249', nameEn: 'Sudan (+249)', nameAr: 'السودان (+249)' },
  { code: '+967', nameEn: 'Yemen (+967)', nameAr: 'اليمن (+967)' },
  { code: '+222', nameEn: 'Mauritania (+222)', nameAr: 'موريتانيا (+222)' },
  { code: '+49', nameEn: 'Germany (+49)', nameAr: 'ألمانيا (+49)' },
  { code: '+33', nameEn: 'France (+33)', nameAr: 'فرنسا (+33)' },
  { code: '+39', nameEn: 'Italy (+39)', nameAr: 'إيطاليا (+39)' },
  { code: '+44', nameEn: 'United Kingdom (+44)', nameAr: 'بريطانيا (+44)' },
  { code: '+34', nameEn: 'Spain (+34)', nameAr: 'إسبانيا (+34)' },
  { code: '+32', nameEn: 'Belgium (+32)', nameAr: 'بلجيكا (+32)' },
  { code: '+41', nameEn: 'Switzerland (+41)', nameAr: 'سويسرا (+41)' },
  { code: '+43', nameEn: 'Austria (+43)', nameAr: 'النمسا (+43)' },
  { code: '+31', nameEn: 'Netherlands (+31)', nameAr: 'هولندا (+31)' },
  { code: '+46', nameEn: 'Sweden (+46)', nameAr: 'السويد (+46)' },
  { code: '+90', nameEn: 'Turkey (+90)', nameAr: 'تركيا (+90)' },
  { code: '+1', nameEn: 'USA / Canada (+1)', nameAr: 'أمريكا / كندا (+1)' },
  { code: '+91', nameEn: 'India (+91)', nameAr: 'الهند (+91)' },
  { code: '+92', nameEn: 'Pakistan (+92)', nameAr: 'باكستان (+92)' },
  { code: '+880', nameEn: 'Bangladesh (+880)', nameAr: 'بنغلاديش (+880)' },
  { code: '+63', nameEn: 'Philippines (+63)', nameAr: 'الفلبين (+63)' },
  { code: '+234', nameEn: 'Nigeria (+234)', nameAr: 'نيجيريا (+234)' },
  { code: '+254', nameEn: 'Kenya (+254)', nameAr: 'كينيا (+254)' },
  { code: '+233', nameEn: 'Ghana (+233)', nameAr: 'غانا (+233)' },
  { code: '+221', nameEn: 'Senegal (+221)', nameAr: 'السنغال (+221)' },
  { code: '+225', nameEn: 'Ivory Coast (+225)', nameAr: 'ساحل العاج (+225)' },
  { code: '+237', nameEn: 'Cameroon (+237)', nameAr: 'الكاميرون (+237)' },
  { code: '+40', nameEn: 'Romania (+40)', nameAr: 'رومانيا (+40)' },
  { code: '+48', nameEn: 'Poland (+48)', nameAr: 'بولندا (+48)' },
  { code: '+55', nameEn: 'Brazil (+55)', nameAr: 'البرازيل (+55)' }
]

// Comprehensive List of Nationalities
const NATIONALITIES_LIST = [
  { en: 'Tunisian', ar: 'تونسي' },
  { en: 'Libyan', ar: 'ليبي' },
  { en: 'Algerian', ar: 'جزائري' },
  { en: 'Egyptian', ar: 'مصري' },
  { en: 'Moroccan', ar: 'مغربي' },
  { en: 'Syrian', ar: 'سوري' },
  { en: 'Lebanese', ar: 'لبناني' },
  { en: 'Jordanian', ar: 'أردني' },
  { en: 'Palestinian', ar: 'فلسطيني' },
  { en: 'Sudanese', ar: 'سوداني' },
  { en: 'Iraqi', ar: 'عراقي' },
  { en: 'Yemeni', ar: 'يمني' },
  { en: 'Mauritanian', ar: 'موريتاني' },
  { en: 'Saudi', ar: 'سعودي' },
  { en: 'Emirati', ar: 'إماراتي' },
  { en: 'Qatari', ar: 'قطري' },
  { en: 'Kuwaiti', ar: 'كويتي' },
  { en: 'Omani', ar: 'عماني' },
  { en: 'Bahraini', ar: 'بحريني' },
  { en: 'Turkish', ar: 'تركي' },
  { en: 'German', ar: 'ألماني' },
  { en: 'French', ar: 'فرنسي' },
  { en: 'Italian', ar: 'إيطالي' },
  { en: 'Spanish', ar: 'إسباني' },
  { en: 'British', ar: 'بريطاني' },
  { en: 'Canadian', ar: 'كندي' },
  { en: 'American', ar: 'أمريكي' },
  { en: 'Indian', ar: 'هندي' },
  { en: 'Pakistani', ar: 'باكستاني' },
  { en: 'Bangladeshi', ar: 'بنغالي' },
  { en: 'Filipino', ar: 'فلبيني' },
  { en: 'Senegalese', ar: 'سنغالي' },
  { en: 'Ivorian', ar: 'إيفواري' },
  { en: 'Cameroonian', ar: 'كاميروني' },
  { en: 'Ghanaian', ar: 'غاني' },
  { en: 'Nigerian', ar: 'نيجيري' },
  { en: 'Kenyan', ar: 'كيني' },
  { en: 'Romanian', ar: 'روماني' },
  { en: 'Polish', ar: 'بولندي' },
  { en: 'Russian', ar: 'روسي' },
  { en: 'Ukrainian', ar: 'أوكراني' },
  { en: 'Other Nationality', ar: 'جنسية أخرى' }
]

// Bilingual Industry Clusters
const INDUSTRY_DOMAINS = [
  { id: 'eng', en: 'Engineering & Industrial Automation', ar: 'الهندسة والتحكم الآلي والكهرباء' },
  { id: 'it', en: 'IT, Software Development & Networks', ar: 'تكنولوجيا المعلومات والبرمجة والشبكات' },
  { id: 'health', en: 'Healthcare, Nursing & Medicine', ar: 'التمريض والطب والرعاية الصحية' },
  { id: 'trades', en: 'Skilled Trades, Welding & Construction', ar: 'المهن الفنية، اللحام، البناء والتشييد' },
  { id: 'transport', en: 'Logistics, Heavy Transport & Driving', ar: 'اللوجستيك، قيادة الشاحنات والنقل الثقيل' },
  { id: 'hospitality', en: 'Hospitality, Culinary Arts & Tourism', ar: 'الفندقة، الطبخ، والسياحة' },
  { id: 'business', en: 'Business, Finance, Sales & Marketing', ar: 'المحاسبة، المبيعات والتسويق والإدارة' },
  { id: 'education', en: 'Education, Teaching & Languages', ar: 'التعليم والتدريب والترجمة' },
  { id: 'agriculture', en: 'Agriculture, Farming & Agro-Industry', ar: 'الفلاحة والزراعة والصناعات الغذائية' },
  { id: 'facility', en: 'Facility Maintenance & Security', ar: 'الصيانة العامة، الأمن وإدارة المنشآت' },
  { id: 'other', en: 'Other Professional Specialization', ar: 'مجال أو تخصص مهني آخر' }
]

const POPULAR_LANGUAGES = [
  { en: 'Arabic', ar: 'العربية' },
  { en: 'English', ar: 'الإنجليزية' },
  { en: 'German', ar: 'الألمانية (Deutsch)' },
  { en: 'French', ar: 'الفرنسية (Français)' },
  { en: 'Italian', ar: 'الإيطالية (Italiano)' },
  { en: 'Spanish', ar: 'الإسبانية (Español)' },
  { en: 'Turkish', ar: 'التركية (Türkçe)' }
]

const LANGUAGE_LEVELS = [
  { id: 'Native', en: 'Native / Bilingual', ar: 'اللغة الأم / إتقان تام' },
  { id: 'C1/C2', en: 'C1 / C2 (Advanced / Fluent)', ar: 'متقدم / طليق (C1/C2)' },
  { id: 'B2', en: 'B2 (Upper Intermediate)', ar: 'فوق المتوسط (B2)' },
  { id: 'B1', en: 'B1 (Intermediate / Work-Ready)', ar: 'متوسط / جاهز للعمل (B1)' },
  { id: 'A2', en: 'A2 (Elementary)', ar: 'مستوى أساسي (A2)' },
  { id: 'A1', en: 'A1 (Beginner)', ar: 'مبتدئ (A1)' }
]

const EDUCATION_LEVELS = [
  { id: 'vocational', en: 'Vocational / Technical Diploma (BTP / BTS / CAP / IHK)', ar: 'مؤهل مهني أو تقني (BTP / BTS / CAP / IHK)' },
  { id: 'highschool', en: 'High School Diploma (Baccalaureate)', ar: 'شهادة البكالوريا / الثانوية العامة' },
  { id: 'bachelor', en: 'Bachelor Degree / Licence', ar: 'إجازة / ليسانس / بكالوريوس' },
  { id: 'master', en: 'Master Degree / Engineering Diploma', ar: 'ماجستير / شهادة مهندس' },
  { id: 'phd', en: 'Doctorate / PhD', ar: 'دكتوراه' },
  { id: 'practical', en: 'Certified Professional Experience / Practical Craft', ar: 'خبرة مهنية عملية معتمدة' }
]

export default function AbroadApplicationForm({ onBackToLogin }) {
  const [lang, setLang] = useState('ar') // 'ar' or 'en'
  const isAr = lang === 'ar'

  const [dialCode, setDialCode] = useState('+216')
  const [phoneNumber, setPhoneNumber] = useState('')

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    nationality: 'Tunisian',
    currentCountry: '',
    industry: 'Engineering & Industrial Automation',
    customIndustry: '',
    jobTitle: '',
    experienceYears: '3 to 5 years',
    educationLevel: 'Vocational / Technical Diploma (BTP / BTS / CAP / IHK)',
    passportStatus: 'Valid for more than 6 months',
    skillsKeywords: '',
    shortBio: '',
  })

  const [certificates, setCertificates] = useState([
    { title: '', organization: '', year: '' }
  ])

  const [languages, setLanguages] = useState([
    { language: 'Arabic', level: 'Native / Bilingual' },
    { language: 'English', level: 'B1 (Intermediate / Work-Ready)' }
  ])

  const [cvFile, setCvFile] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submittedSuccess, setSubmittedSuccess] = useState(false)
  const [candidateRefId, setCandidateRefId] = useState('')

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const addCertificate = () => {
    setCertificates((prev) => [...prev, { title: '', organization: '', year: '' }])
  }

  const removeCertificate = (index) => {
    setCertificates((prev) => prev.filter((_, i) => i !== index))
  }

  const updateCertificate = (index, field, value) => {
    setCertificates((prev) => {
      const copy = [...prev]
      copy[index][field] = value
      return copy
    })
  }

  const addLanguage = () => {
    setLanguages((prev) => [...prev, { language: 'German', level: 'A2 (Elementary)' }])
  }

  const removeLanguage = (index) => {
    setLanguages((prev) => prev.filter((_, i) => i !== index))
  }

  const updateLanguage = (index, field, value) => {
    setLanguages((prev) => {
      const copy = [...prev]
      copy[index][field] = value
      return copy
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitError('')

    if (!formData.fullName.trim() || !phoneNumber.trim()) {
      setSubmitError(isAr ? 'يرجى إدخال الاسم الكامل ورقم الهاتف أو الواتساب.' : 'Please provide your full name and phone number.')
      return
    }

    setIsSubmitting(true)

    try {
      let uploadedCvUrl = ''

      if (cvFile) {
        const cleanName = `${Date.now()}_${cvFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
        const storagePath = `abroad_applicants/${cleanName}`

        const { error: uploadErr } = await supabase.storage
          .from('candidates')
          .upload(storagePath, cvFile, { upsert: true })

        if (!uploadErr) {
          const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
          uploadedCvUrl = `${supabaseUrl}/storage/v1/object/public/candidates/${storagePath}`
        }
      }

      const activeIndustry = formData.industry === 'Other Professional Specialization' || formData.industry === 'مجال أو تخصص مهني آخر'
        ? formData.customIndustry || 'Other Specialization'
        : formData.industry

      const certsText = certificates
        .filter(c => c.title.trim())
        .map(c => `${c.title} (${c.organization || 'Verified'} ${c.year || ''})`.trim())
        .join(' | ')

      const langsText = languages
        .filter(l => l.language)
        .map(l => `${l.language} [${l.level}]`)
        .join(', ')

      const fullFormattedPhone = `${dialCode} ${phoneNumber.trim()}`

      const structuredSkills = [
        `[ABROAD TALENT POOL]`,
        `Field: ${activeIndustry}`,
        certsText ? `Certifications: ${certsText}` : null,
        langsText ? `Languages: ${langsText}` : null,
        `Passport: ${formData.passportStatus}`,
        formData.skillsKeywords ? `Skills: ${formData.skillsKeywords}` : null
      ].filter(Boolean).join(' • ')

      const candidateRecord = {
        full_name: formData.fullName.trim(),
        email: formData.email.trim() || `applicant_${Date.now()}@abroad-pool.intl`,
        phone: fullFormattedPhone,
        nationality: formData.nationality,
        applied_position: `[Abroad] ${formData.jobTitle.trim() || activeIndustry}`,
        specialty: activeIndustry,
        experience: formData.experienceYears,
        education: formData.educationLevel,
        skills: structuredSkills,
        cv_filepath: uploadedCvUrl || null,
        status: 'Abroad Applicant',
        notes: `Global Candidate Registration. Open Destination. Location: ${formData.currentCountry || 'Not specified'}.`
      }

      const { data, error: insertErr } = await supabase
        .from('candidates')
        .insert([candidateRecord])
        .select()

      if (insertErr) throw insertErr

      const generatedId = data && data[0] ? data[0].id : `REF-${Date.now().toString().slice(-5)}`
      setCandidateRefId(generatedId)
      setSubmittedSuccess(true)

    } catch (err) {
      console.error('Submission failed:', err)
      setSubmitError(err.message || (isAr ? 'فشل تسجيل الطلب، يرجى التحقق من الاتصال بالإنترنت.' : 'Submission failed. Please check connection.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  // Confirmation view
  if (submittedSuccess) {
    return (
      <div className="min-h-screen bg-neutral-50 text-neutral-900 flex items-center justify-center p-6" dir={isAr ? 'rtl' : 'ltr'}>
        <div className="max-w-md w-full bg-white border border-neutral-200 rounded-xl p-8 text-center shadow-sm">
          <div className="w-12 h-12 bg-neutral-100 text-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4 border border-neutral-300">
            <Check className="w-6 h-6 stroke-[2.5]" />
          </div>

          <h2 className="text-xl font-bold text-neutral-900 mb-1">
            {isAr ? 'تم تسجيل ملفك بنجاح' : 'Registration Complete'}
          </h2>
          <p className="text-sm text-neutral-500 mb-6">
            {isAr ? 'تم إدراج بياناتك المهنية في قاعدة الكفاءات للتوظيف الدولي.' : 'Your candidate profile has been recorded in the International Talent Registry.'}
          </p>
          
          <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3 mb-6 text-xs">
            <span className="text-neutral-500 block mb-0.5 uppercase tracking-wider font-semibold">
              {isAr ? 'رقم الملف المرجعي' : 'Reference Number'}
            </span>
            <span className="font-mono text-base font-bold text-neutral-900">#{candidateRefId}</span>
          </div>

          <div className="space-y-2">
            <button
              onClick={() => {
                setSubmittedSuccess(false)
                setPhoneNumber('')
                setFormData({
                  fullName: '', email: '', nationality: 'Tunisian', currentCountry: '',
                  industry: 'Engineering & Industrial Automation', customIndustry: '', jobTitle: '',
                  experienceYears: '3 to 5 years', educationLevel: 'Vocational / Technical Diploma (BTP / BTS / CAP / IHK)',
                  passportStatus: 'Valid for more than 6 months', skillsKeywords: '', shortBio: ''
                })
              }}
              className="w-full py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white font-medium rounded-lg text-xs transition-colors cursor-pointer"
            >
              {isAr ? 'تسجيل ملف جديد' : 'Submit Another Profile'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 flex flex-col font-sans" dir={isAr ? 'rtl' : 'ltr'}>
      
      {/* Top Header */}
      <header className="bg-white border-b border-neutral-200 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-neutral-900 tracking-tight">
              {isAr ? 'بوابة تسجيل الكفاءات للتوظيف الدولي' : 'International Talent Registry'}
            </h1>
            <p className="text-xs text-neutral-500">
              {isAr ? 'استمارة ترشيح الكفاءات للفرص المهنية بالخارج في جميع التخصصات' : 'Registration form for candidates seeking global opportunities across all fields'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Language Switcher */}
            <div className="flex items-center border border-neutral-200 rounded-lg p-0.5 bg-neutral-100 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setLang('ar')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  isAr ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                عربي
              </button>
              <button
                type="button"
                onClick={() => setLang('en')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  !isAr ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                English
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Form Container */}
      <main className="max-w-3xl mx-auto w-full px-4 py-8">
        <form onSubmit={handleSubmit} className="bg-white border border-neutral-200 rounded-xl p-6 sm:p-10 shadow-sm space-y-8">
          
          {submitError && (
            <div className="flex items-center gap-2.5 p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          {/* Section 1: Personal Details */}
          <div className="space-y-4">
            <h2 className="text-xs font-bold text-neutral-900 uppercase tracking-wider border-b border-neutral-100 pb-2">
              {isAr ? '1. البيانات الشخصية ومعلومات الاتصال' : '1. Personal & Contact Details'}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  {isAr ? 'الاسم الكامل *' : 'Full Name *'}
                </label>
                <input
                  type="text"
                  name="fullName"
                  required
                  value={formData.fullName}
                  onChange={handleInputChange}
                  placeholder={isAr ? 'مثال: محمد بن سالم' : 'e.g. Mohamed Ben Salem'}
                  className="w-full px-3.5 py-2.5 bg-white border border-neutral-300 rounded-lg text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-900 transition-colors"
                />
              </div>

              {/* Phone with Country Code Dropdown */}
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  {isAr ? 'رقم الهاتف / الواتساب (مع رمز الدولة) *' : 'Phone / WhatsApp *'}
                </label>
                <div className="flex items-center gap-1.5" dir="ltr">
                  <select
                    value={dialCode}
                    onChange={(e) => setDialCode(e.target.value)}
                    className="w-36 px-2.5 py-2.5 bg-white border border-neutral-300 rounded-lg text-xs font-semibold text-neutral-900 focus:outline-none focus:border-neutral-900 cursor-pointer"
                  >
                    {COUNTRY_DIAL_CODES.map((item, idx) => (
                      <option key={idx} value={item.code}>
                        {isAr ? item.nameAr : item.nameEn}
                      </option>
                    ))}
                  </select>

                  <input
                    type="tel"
                    required
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="XX XXX XXX"
                    className="flex-1 px-3.5 py-2.5 bg-white border border-neutral-300 rounded-lg text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-900 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  {isAr ? 'البريد الإلكتروني' : 'Email Address'}
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="name@example.com"
                  className="w-full px-3.5 py-2.5 bg-white border border-neutral-300 rounded-lg text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-900 transition-colors"
                  dir="ltr"
                />
              </div>

              {/* Nationality Dropdown */}
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  {isAr ? 'الجنسية الحالية *' : 'Current Nationality *'}
                </label>
                <select
                  name="nationality"
                  value={formData.nationality}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 bg-white border border-neutral-300 rounded-lg text-sm text-neutral-900 focus:outline-none focus:border-neutral-900 cursor-pointer"
                >
                  {NATIONALITIES_LIST.map((nat, idx) => (
                    <option key={idx} value={nat.en}>
                      {isAr ? `${nat.ar} (${nat.en})` : nat.en}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Professional Specialization */}
          <div className="space-y-4">
            <h2 className="text-xs font-bold text-neutral-900 uppercase tracking-wider border-b border-neutral-100 pb-2">
              {isAr ? '2. التخصص والمجال المهني (جميع المجالات مشمولة)' : '2. Professional Specialization & Industry (All Fields)'}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  {isAr ? 'المجال أو القطاع الأساسي *' : 'Primary Field / Sector *'}
                </label>
                <select
                  name="industry"
                  value={formData.industry}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 bg-white border border-neutral-300 rounded-lg text-sm text-neutral-900 focus:outline-none focus:border-neutral-900 cursor-pointer"
                >
                  {INDUSTRY_DOMAINS.map((domain, i) => (
                    <option key={i} value={domain.en}>
                      {isAr ? `${domain.ar} (${domain.en})` : domain.en}
                    </option>
                  ))}
                </select>
              </div>

              {formData.industry.includes('Other') && (
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    {isAr ? 'حدد تخصصك أو مجالك بدقة:' : 'Specify Specialization Field:'}
                  </label>
                  <input
                    type="text"
                    name="customIndustry"
                    value={formData.customIndustry}
                    onChange={handleInputChange}
                    placeholder={isAr ? 'أدخل تخصصك الدقيق هنا...' : 'Enter your specific domain...'}
                    className="w-full px-3.5 py-2.5 bg-white border border-neutral-300 rounded-lg text-sm text-neutral-900 focus:outline-none focus:border-neutral-900"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    {isAr ? 'المسمى الوظيفي أو التخصص الدقيق *' : 'Exact Job Title / Profession *'}
                  </label>
                  <input
                    type="text"
                    name="jobTitle"
                    required
                    value={formData.jobTitle}
                    onChange={handleInputChange}
                    placeholder={isAr ? 'مثال: مبرمج PLC، لحام معتمد، ممرض، سائق شاحنة ثقيلة...' : 'e.g. PLC Programmer, TIG Welder, Registered Nurse...'}
                    className="w-full px-3.5 py-2.5 bg-white border border-neutral-300 rounded-lg text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-900 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    {isAr ? 'سنوات الخبرة العملية' : 'Years of Practical Experience'}
                  </label>
                  <select
                    name="experienceYears"
                    value={formData.experienceYears}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 bg-white border border-neutral-300 rounded-lg text-sm text-neutral-900 focus:outline-none focus:border-neutral-900 cursor-pointer"
                  >
                    <option value="0 to 1 year">{isAr ? 'أقل من سنة (مبتدئ / خريج جديد)' : '0 to 1 year (Entry / Junior)'}</option>
                    <option value="1 to 3 years">{isAr ? '1 إلى 3 سنوات' : '1 to 3 years'}</option>
                    <option value="3 to 5 years">{isAr ? '3 إلى 5 سنوات' : '3 to 5 years'}</option>
                    <option value="5 to 8 years">{isAr ? '5 إلى 8 سنوات' : '5 to 8 years'}</option>
                    <option value="8+ years">{isAr ? 'أكثر من 8 سنوات (خبير / محترف)' : '8+ years (Senior / Master)'}</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Education & Certifications */}
          <div className="space-y-4">
            <h2 className="text-xs font-bold text-neutral-900 uppercase tracking-wider border-b border-neutral-100 pb-2">
              {isAr ? '3. المؤهلات والشهادات والرخص المهنية' : '3. Qualifications & Verified Certifications'}
            </h2>

            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">
                {isAr ? 'أعلى مستوى تعليمي أو تكويني' : 'Highest Education Completed'}
              </label>
              <select
                name="educationLevel"
                value={formData.educationLevel}
                onChange={handleInputChange}
                className="w-full px-3.5 py-2.5 bg-white border border-neutral-300 rounded-lg text-sm text-neutral-900 focus:outline-none focus:border-neutral-900 cursor-pointer"
              >
                {EDUCATION_LEVELS.map((edu, idx) => (
                  <option key={idx} value={edu.en}>
                    {isAr ? edu.ar : edu.en}
                  </option>
                ))}
              </select>
            </div>

            {/* Dynamic Certificates */}
            <div className="space-y-2 pt-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-medium text-neutral-700">
                  {isAr ? 'الشهادات والرخص المهنية المعتمدة' : 'Professional Certifications & Licenses'}
                </label>
                <button
                  type="button"
                  onClick={addCertificate}
                  className="text-xs text-neutral-700 hover:text-neutral-900 font-semibold flex items-center gap-1 border border-neutral-300 hover:bg-neutral-50 px-2.5 py-1 rounded-md transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> {isAr ? 'إضافة شهادة' : 'Add Certificate'}
                </button>
              </div>

              {certificates.map((cert, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder={isAr ? 'اسم الشهادة (مثال: Siemens TIA, Welder EN ISO, CCNA...)' : 'Certificate Name...'}
                    value={cert.title}
                    onChange={(e) => updateCertificate(index, 'title', e.target.value)}
                    className="flex-1 px-3 py-2 bg-white border border-neutral-300 rounded-lg text-xs text-neutral-900 focus:outline-none focus:border-neutral-900"
                  />
                  <input
                    type="text"
                    placeholder={isAr ? 'الجهة المانحة' : 'Issuing Body'}
                    value={cert.organization}
                    onChange={(e) => updateCertificate(index, 'organization', e.target.value)}
                    className="w-1/3 px-3 py-2 bg-white border border-neutral-300 rounded-lg text-xs text-neutral-900 focus:outline-none focus:border-neutral-900"
                  />
                  <input
                    type="text"
                    placeholder={isAr ? 'السنة' : 'Year'}
                    value={cert.year}
                    onChange={(e) => updateCertificate(index, 'year', e.target.value)}
                    className="w-16 px-2 py-2 bg-white border border-neutral-300 rounded-lg text-xs text-neutral-900 focus:outline-none focus:border-neutral-900 text-center"
                  />
                  {certificates.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeCertificate(index)}
                      className="p-1.5 text-neutral-400 hover:text-red-600 rounded-md transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: Languages & Practical Skills */}
          <div className="space-y-4">
            <h2 className="text-xs font-bold text-neutral-900 uppercase tracking-wider border-b border-neutral-100 pb-2">
              {isAr ? '4. اللغات والمهارات العملية' : '4. Language Proficiencies & Practical Skills'}
            </h2>

            {/* Dynamic Languages */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-medium text-neutral-700">
                  {isAr ? 'اللغات ومستوى الإتقان' : 'Languages Spoken & Proficiency Level'}
                </label>
                <button
                  type="button"
                  onClick={addLanguage}
                  className="text-xs text-neutral-700 hover:text-neutral-900 font-semibold flex items-center gap-1 border border-neutral-300 hover:bg-neutral-50 px-2.5 py-1 rounded-md transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> {isAr ? 'إضافة لغة' : 'Add Language'}
                </button>
              </div>

              <div className="space-y-2">
                {languages.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <select
                      value={item.language}
                      onChange={(e) => updateLanguage(index, 'language', e.target.value)}
                      className="flex-1 px-3 py-2 bg-white border border-neutral-300 rounded-lg text-xs text-neutral-900 focus:outline-none focus:border-neutral-900 cursor-pointer"
                    >
                      {POPULAR_LANGUAGES.map((langItem, lIdx) => (
                        <option key={lIdx} value={langItem.en}>
                          {isAr ? `${langItem.ar} (${langItem.en})` : langItem.en}
                        </option>
                      ))}
                    </select>

                    <select
                      value={item.level}
                      onChange={(e) => updateLanguage(index, 'level', e.target.value)}
                      className="w-1/2 px-3 py-2 bg-white border border-neutral-300 rounded-lg text-xs text-neutral-900 focus:outline-none focus:border-neutral-900 cursor-pointer font-medium"
                    >
                      {LANGUAGE_LEVELS.map((lvl, lvIdx) => (
                        <option key={lvIdx} value={lvl.en}>
                          {isAr ? lvl.ar : lvl.en}
                        </option>
                      ))}
                    </select>

                    {languages.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeLanguage(index)}
                        className="p-1.5 text-neutral-400 hover:text-red-600 rounded-md transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Technical tools and machinery */}
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">
                {isAr ? 'أهم الأدوات، البرامج والآلات والمعدات التي تتقنها' : 'Key Technical Tools, Machinery & Practical Competencies'}
              </label>
              <textarea
                name="skillsKeywords"
                rows={2}
                value={formData.skillsKeywords}
                onChange={handleInputChange}
                placeholder={isAr ? 'مثال: Siemens TIA Portal, لحام MIG/MAG, فحص الدوائر الكهربائية, قيادة الرافعات...' : 'e.g. Siemens S7-1200, TIG Welding, Multimeter...'}
                className="w-full px-3.5 py-2.5 bg-white border border-neutral-300 rounded-lg text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-900 resize-none"
              />
            </div>
          </div>

          {/* Section 5: Travel Readiness & Document Upload */}
          <div className="space-y-4">
            <h2 className="text-xs font-bold text-neutral-900 uppercase tracking-wider border-b border-neutral-100 pb-2">
              {isAr ? '5. جاهزية السفر والسيرة الذاتية' : '5. Travel Readiness & Curriculum Vitae'}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  {isAr ? 'حالة جواز السفر *' : 'Passport Status *'}
                </label>
                <select
                  name="passportStatus"
                  value={formData.passportStatus}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 bg-white border border-neutral-300 rounded-lg text-sm text-neutral-900 focus:outline-none focus:border-neutral-900 cursor-pointer"
                >
                  <option value="Valid for more than 6 months">
                    {isAr ? 'صالح لأكثر من 6 أشهر (جاهز للسفر)' : 'Valid for more than 6 months'}
                  </option>
                  <option value="Under renewal or in progress">
                    {isAr ? 'قيد التجديد أو الاستخراج حالياً' : 'Under renewal or in progress'}
                  </option>
                  <option value="Not yet issued / Ready to apply">
                    {isAr ? 'لا يوجد حالياً / جاهز للاستخراج فوراً' : 'Not yet issued / Ready to apply'}
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  {isAr ? 'السيرة الذاتية (PDF أو Word)' : 'Curriculum Vitae (PDF / Word)'}
                </label>
                <label className="flex items-center gap-2.5 px-3.5 py-2 bg-neutral-50 hover:bg-neutral-100 border border-neutral-300 rounded-lg cursor-pointer transition-colors text-xs text-neutral-700">
                  <Upload className="w-4 h-4 text-neutral-500 shrink-0" />
                  <span className="truncate">{cvFile ? cvFile.name : (isAr ? 'اختر ملف السيرة الذاتية (اختياري)' : 'Select file (optional)')}</span>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => setCvFile(e.target.files[0] || null)}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Submission Bar */}
          <div className="pt-4 border-t border-neutral-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-neutral-500 text-center sm:text-left">
              {isAr ? 'تتم مراجعة ومعالجة كافة البيانات المسجلة بسرية تامة.' : 'Data is reviewed confidentially for international corporate matching.'}
            </p>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto px-6 py-2.5 bg-neutral-900 hover:bg-neutral-800 active:bg-neutral-950 text-white font-medium text-xs rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{isAr ? 'جاري تسجيل الملف...' : 'Submitting Profile...'}</span>
                </>
              ) : (
                <span>{isAr ? 'تسجيل الملف في قاعدة الكفاءات' : 'Submit Candidate Profile'}</span>
              )}
            </button>
          </div>

        </form>
      </main>
    </div>
  )
}
