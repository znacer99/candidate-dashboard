import { useState } from 'react'
import { X, MessageSquare, Copy, Check } from 'lucide-react'

const TEMPLATES = [
  {
    id: 'interview',
    label: 'Interview Invitation',
    english: (name, pos) => `Hello ${name || 'Candidate'},\n\nWe were impressed by your background and would like to invite you for an interview regarding the ${pos || 'applied'} position at ALGHAITH International Group.\n\nPlease let us know your availability for a brief call this week.\n\nBest regards,\nTalent Acquisition Team`,
    arabic: (name, pos) => `مرحباً ${name || 'المرشح المحترم'}،\n\nقد أثار اهتمامنا مؤهلك ويسرنا دعوتك لإجراء مقابلة عمل لوظيفة ${pos || 'المطلوبة'} في مجموعة الغيث العالمية.\n\nيرجى إعلامنا بموعد تفرغك لإجراء المقابلة خلال هذا الأسبوع.\n\nمع أطيب التحيات،\nفريق التوظيف`
  },
  {
    id: 'shortlisted',
    label: 'Shortlist Confirmation',
    english: (name, pos) => `Dear ${name || 'Candidate'},\n\nGreat news! Your profile for the ${pos || 'applied'} position has been shortlisted by our hiring managers.\n\nOur HR coordinator will reach out shortly with details regarding the next steps.\n\nWarm regards,\nHR Department`,
    arabic: (name, pos) => `عزيزي/عزيزتي ${name || 'المرشح المحترم'}،\n\nيسرنا إعلامك بأنه تم ترشيح ملفك واختياره ضمن القائمة القصيرة لوظيفة ${pos || 'المطلوبة'} في مجموعة الغيث العالمية.\n\nسيتواصل معك منسق الموارد البشرية قريباً لتزويدك بتفاصيل الخطوات القادمة.\n\nمع خالص التقدير،\nقسم الموارد البشرية`
  },
  {
    id: 'document_req',
    label: 'Document Request',
    english: (name, pos) => `Dear ${name || 'Candidate'},\n\nTo move forward with your application for the ${pos || 'applied'} position, could you please provide us with an updated copy of your ID document and latest CV?\n\nThank you for your cooperation.\n\nBest regards,\nRecruitment Team`,
    arabic: (name, pos) => `عزيزي/عزيزتي ${name || 'المرشح المحترم'}،\n\nلمتابعة إجراءات طلب التوظيف لوظيفة ${pos || 'المطلوبة'} في مجموعة الغيث العالمية، يرجى تزويدنا بنسخة محدثة من بطاقة الهوية والسيرة الذاتية (CV).\n\nشاكرين لك حسن تعاونك.\n\nمع أطيب التحيات،\nفريق التوظيف`
  },
  {
    id: 'rejection',
    label: 'Application Update',
    english: (name, pos) => `Dear ${name || 'Candidate'},\n\nThank you for taking the time to apply for the ${pos || 'applied'} role with us. After careful review, we have decided to move forward with candidates whose experience aligns even more closely with current requirements.\n\nWe will keep your profile on file for future openings. We wish you every success in your career.\n\nSincerely,\nTalent Acquisition Team`,
    arabic: (name, pos) => `عزيزي/عزيزتي ${name || 'المرشح المحترم'}،\n\nنشكرك على اهتمامك وتقديمك لوظيفة ${pos || 'المطلوبة'} في مجموعة الغيث العالمية. بعد دراسة الطلبات، تقرر المضي قدماً مع مرشحين تتوافق خبراتهم بشكل أقرب مع متطلبات الوظيفة الحالية.\n\nسنحتفظ بملفك في قاعدة بياناتنا للفرص المستقبلية. نتمنى لك دوام التوفيق والنجاح.\n\nمع فائق الاحترام،\nفريق التوظيف`
  }
]

const COUNTRY_CODES = {
  'Algerian': '213',
  'Egyptian': '20',
  'Tunisian': '216',
  'Libyan': '218',
  'Syrian': '963',
  'Palestinian': '970',
  'Sudanese': '249',
  'Moroccan': '212',
  'Yemeni': '967',
  'Jordanian': '962',
  'Iraqi': '964',
  'Kenyan': '254',
  'Indian': '91',
  'Pakistani': '92',
  'Emirati': '971',
  'Saudi': '966',
  'Kuwaiti': '965',
  'Qatari': '974',
  'Omani': '968',
  'Bahraini': '973',
  'Lebanese': '961',
  'Turkish': '90',
  'French': '33',
  'British': '44',
  'American': '1'
}

function formatWhatsAppPhone(rawPhone, nationality) {
  if (!rawPhone) return ''
  let digits = String(rawPhone).replace(/\D/g, '')
  if (!digits) return ''

  if (digits.startsWith('00')) {
    digits = digits.slice(2)
  }

  const allCodes = Object.values(COUNTRY_CODES)

  if (digits.startsWith('0')) {
    const withoutZero = digits.slice(1)
    if (allCodes.some((code) => withoutZero.startsWith(code))) {
      return withoutZero
    }
  }

  if (allCodes.some((code) => digits.startsWith(code))) {
    return digits
  }

  if (digits.startsWith('0')) {
    digits = digits.slice(1)
  }

  const defaultCode = COUNTRY_CODES[nationality] || '213'
  return defaultCode + digits
}

function buildMessageText(tmpl, name, pos, mode) {
  const en = tmpl.english(name, pos)
  const ar = tmpl.arabic(name, pos)

  if (mode === 'english') return en
  if (mode === 'arabic') return ar
  return `${en}\n\n-------------------------------\n\n${ar}`
}

export default function OutreachModal({ candidate, onClose }) {
  const [selectedTemplateId, setSelectedTemplateId] = useState('interview')
  const [langMode, setLangMode] = useState('bilingual') // 'bilingual' | 'english' | 'arabic'
  const [copied, setCopied] = useState(false)
  
  if (!candidate) return null

  const template = TEMPLATES.find((t) => t.id === selectedTemplateId) || TEMPLATES[0]
  
  const candidateName = candidate.full_name || 'Candidate'
  const candidatePosition = candidate.applied_position || 'Role'
  
  const [customBody, setCustomBody] = useState(
    buildMessageText(template, candidateName, candidatePosition, 'bilingual')
  )

  const handleTemplateChange = (tmplId, mode = langMode) => {
    setSelectedTemplateId(tmplId)
    const t = TEMPLATES.find((item) => item.id === tmplId)
    if (t) {
      setCustomBody(buildMessageText(t, candidateName, candidatePosition, mode))
    }
  }

  const handleLangChange = (newMode) => {
    setLangMode(newMode)
    const t = TEMPLATES.find((item) => item.id === selectedTemplateId) || TEMPLATES[0]
    setCustomBody(buildMessageText(t, candidateName, candidatePosition, newMode))
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(customBody)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSendWhatsApp = () => {
    const formattedNumber = formatWhatsAppPhone(candidate.phone, candidate.nationality)
    if (!formattedNumber) return
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${formattedNumber}&text=${encodeURIComponent(customBody)}`
    window.open(whatsappUrl, '_blank')
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-60 animate-in fade-in duration-200" onClick={onClose} />
      <div className="fixed inset-0 flex items-center justify-center p-4 z-70 pointer-events-none">
        <div className="bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden pointer-events-auto animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
          
          {/* Header */}
          <div className="flex justify-between items-center px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-xl">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-zinc-900 dark:text-white">WhatsApp Candidate Outreach</h3>
                <p className="text-xs text-zinc-500">Messaging <span className="font-semibold text-emerald-600 dark:text-emerald-400">{candidateName}</span> ({candidatePosition})</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg text-zinc-500 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-4 overflow-y-auto flex-1">
            {/* Language Mode Selector */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
                Message Language
              </label>
              <div className="flex bg-zinc-100 dark:bg-zinc-900 p-1 rounded-xl border border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => handleLangChange('bilingual')}
                  className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    langMode === 'bilingual'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                >
                  Bilingual (EN + AR)
                </button>
                <button
                  type="button"
                  onClick={() => handleLangChange('english')}
                  className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    langMode === 'english'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                >
                  English
                </button>
                <button
                  type="button"
                  onClick={() => handleLangChange('arabic')}
                  className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    langMode === 'arabic'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                >
                  العربية
                </button>
              </div>
            </div>

            {/* Template Selector */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
                Select Message Template
              </label>
              <div className="grid grid-cols-2 gap-2">
                {TEMPLATES.map((tmpl) => (
                  <button
                    key={tmpl.id}
                    onClick={() => handleTemplateChange(tmpl.id)}
                    className={`p-3 rounded-xl border text-xs font-bold text-left transition-all cursor-pointer ${
                      selectedTemplateId === tmpl.id
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shadow-sm'
                        : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-850'
                    }`}
                  >
                    {tmpl.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Message Body */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
                WhatsApp Message Text
              </label>
              <textarea
                rows={7}
                value={customBody}
                onChange={(e) => setCustomBody(e.target.value)}
                className="w-full p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-sans focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-zinc-800 dark:text-zinc-200 leading-relaxed"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40 flex items-center justify-between gap-3">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-all cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied Message!' : 'Copy Text'}</span>
            </button>

            <button
              onClick={handleSendWhatsApp}
              disabled={!candidate.phone}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Send WhatsApp Message</span>
            </button>
          </div>

        </div>
      </div>
    </>
  )
}
