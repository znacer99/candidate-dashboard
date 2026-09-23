import { useState, useMemo } from 'react'
import { 
  Globe, Search, Check, Copy,
  Phone, Mail, FileText, Award, Languages, ShieldCheck,
  Briefcase, Download, ExternalLink
} from 'lucide-react'
import { exportToExcel } from '../utils/ExportUtils'

export default function AbroadTalentHub({ candidates = [], onSelectCandidate, onOpenForm }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedIndustry, setSelectedIndustry] = useState('ALL')
  const [selectedLanguage, setSelectedLanguage] = useState('ALL')
  const [passportFilter, setPassportFilter] = useState('ALL')
  const [copiedLink, setCopiedLink] = useState(false)

  // Filter candidates identifying those in the abroad talent pool
  const abroadCandidates = useMemo(() => {
    return candidates.filter((c) => {
      const skills = (c.skills || '').toLowerCase()
      const status = (c.status || '').toLowerCase()
      const applied = (c.applied_position || '').toLowerCase()
      const notes = (c.notes || '').toLowerCase()

      return (
        skills.includes('abroad talent pool') ||
        status.includes('abroad') ||
        applied.includes('[abroad]') ||
        notes.includes('global candidate registration') ||
        notes.includes('destination open')
      )
    })
  }, [candidates])

  // Extract industries
  const availableIndustries = useMemo(() => {
    const set = new Set()
    abroadCandidates.forEach((c) => {
      if (c.specialty) set.add(c.specialty)
    })
    return Array.from(set).sort()
  }, [abroadCandidates])

  // Multi-attribute filtering
  const filteredTalents = useMemo(() => {
    return abroadCandidates.filter((c) => {
      const q = searchTerm.toLowerCase().trim()
      const matchSearch = !q || (
        (c.full_name && c.full_name.toLowerCase().includes(q)) ||
        (c.applied_position && c.applied_position.toLowerCase().includes(q)) ||
        (c.specialty && c.specialty.toLowerCase().includes(q)) ||
        (c.skills && c.skills.toLowerCase().includes(q)) ||
        (c.nationality && c.nationality.toLowerCase().includes(q)) ||
        (c.phone && c.phone.includes(q))
      )

      const matchIndustry = selectedIndustry === 'ALL' || c.specialty === selectedIndustry
      
      const skillsLower = (c.skills || '').toLowerCase()
      const matchLanguage = selectedLanguage === 'ALL' || skillsLower.includes(selectedLanguage.toLowerCase())

      const matchPassport = passportFilter === 'ALL' || (
        passportFilter === 'ready' ? skillsLower.includes('valid for more than 6 months') :
        passportFilter === 'renewal' ? skillsLower.includes('renewal') : true
      )

      return matchSearch && matchIndustry && matchLanguage && matchPassport
    })
  }, [abroadCandidates, searchTerm, selectedIndustry, selectedLanguage, passportFilter])

  // KPIs
  const kpiStats = useMemo(() => {
    const total = abroadCandidates.length
    const readyPassport = abroadCandidates.filter(c => (c.skills || '').toLowerCase().includes('valid for more than 6 months')).length
    const germanSpeakers = abroadCandidates.filter(c => (c.skills || '').toLowerCase().includes('german')).length
    const withCertificates = abroadCandidates.filter(c => (c.skills || '').toLowerCase().includes('certifications:')).length

    return { total, readyPassport, germanSpeakers, withCertificates }
  }, [abroadCandidates])

  const copyPublicLink = () => {
    const url = `${window.location.origin}${window.location.pathname}?page=apply-abroad`
    navigator.clipboard.writeText(url)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2500)
  }

  const handleExport = () => {
    if (filteredTalents.length === 0) return
    exportToExcel(filteredTalents, 'Abroad_Talent_Pool_Candidates.xlsx')
  }

  const openWhatsAppOutreach = (candidate) => {
    if (!candidate.phone) return
    const digits = candidate.phone.replace(/\D/g, '')
    const msg = encodeURIComponent(
      `Hello ${candidate.full_name},\n\nWe reviewed your profile in the International Talent Pool regarding abroad employment opportunities (${candidate.applied_position || candidate.specialty}).\n\nWe have active international recruitment requirements matching your qualifications. Please let us know your current availability for a screening interview.\n\nBest regards,\nInternational Recruitment Team`
    )
    window.open(`https://wa.me/${digits}?text=${msg}`, '_blank')
  }

  return (
    <div className="space-y-6">
      
      {/* Clean Enterprise Top Card */}
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1.5 bg-zinc-100 dark:bg-zinc-850 text-zinc-900 dark:text-zinc-100 rounded-lg">
                <Globe className="w-4 h-4" />
              </span>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
                International Talent Pool
              </h2>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-2xl">
              Registry of professional candidates open to international opportunities across all sectors, verified certifications, and language proficiencies.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={copyPublicLink}
              className="px-3 py-1.5 bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-white text-white dark:text-zinc-900 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Link Copied' : 'Copy Form Link'}</span>
            </button>

            {onOpenForm && (
              <button
                onClick={onOpenForm}
                className="px-3 py-1.5 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-850 text-zinc-700 dark:text-zinc-300 text-xs font-medium rounded-lg border border-zinc-200 dark:border-zinc-800 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open Form</span>
              </button>
            )}

            <button
              onClick={handleExport}
              className="px-3 py-1.5 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-850 text-zinc-700 dark:text-zinc-300 text-xs font-medium rounded-lg border border-zinc-200 dark:border-zinc-800 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Minimal Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-zinc-100 dark:border-zinc-900">
          <div className="p-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border border-zinc-200/60 dark:border-zinc-850">
            <div className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">Registered Talents</div>
            <div className="text-xl font-bold text-zinc-900 dark:text-white mt-0.5">{kpiStats.total}</div>
          </div>

          <div className="p-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border border-zinc-200/60 dark:border-zinc-850">
            <div className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">Passport Ready</div>
            <div className="text-xl font-bold text-zinc-900 dark:text-white mt-0.5">{kpiStats.readyPassport}</div>
          </div>

          <div className="p-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border border-zinc-200/60 dark:border-zinc-850">
            <div className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">German Speakers</div>
            <div className="text-xl font-bold text-zinc-900 dark:text-white mt-0.5">{kpiStats.germanSpeakers}</div>
          </div>

          <div className="p-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border border-zinc-200/60 dark:border-zinc-850">
            <div className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">Certified Profiles</div>
            <div className="text-xl font-bold text-zinc-900 dark:text-white mt-0.5">{kpiStats.withCertificates}</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
            <input
              type="text"
              placeholder="Search talent or skills..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900"
            />
          </div>

          <div>
            <select
              value={selectedIndustry}
              onChange={(e) => setSelectedIndustry(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-medium text-zinc-800 dark:text-zinc-200 cursor-pointer focus:outline-none focus:border-zinc-900"
            >
              <option value="ALL">All Fields & Sectors</option>
              {availableIndustries.map((ind, i) => (
                <option key={i} value={ind}>{ind}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-medium text-zinc-800 dark:text-zinc-200 cursor-pointer focus:outline-none focus:border-zinc-900"
            >
              <option value="ALL">All Languages</option>
              <option value="German">German</option>
              <option value="English">English</option>
              <option value="French">French</option>
              <option value="Italian">Italian</option>
            </select>
          </div>

          <div>
            <select
              value={passportFilter}
              onChange={(e) => setPassportFilter(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-medium text-zinc-800 dark:text-zinc-200 cursor-pointer focus:outline-none focus:border-zinc-900"
            >
              <option value="ALL">All Passport Statuses</option>
              <option value="ready">Passport Ready (&gt; 6m)</option>
              <option value="renewal">In Renewal</option>
            </select>
          </div>

        </div>
      </div>

      {/* Candidate Cards */}
      {filteredTalents.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
          <p className="text-xs text-zinc-500">No candidates found in the International Talent Pool matching the active filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
          {filteredTalents.map((candidate) => {
            const skillsStr = candidate.skills || ''
            const isPassportReady = skillsStr.toLowerCase().includes('valid for more than 6 months')
            const hasGerman = skillsStr.toLowerCase().includes('german')
            const hasEnglish = skillsStr.toLowerCase().includes('english')
            const hasFrench = skillsStr.toLowerCase().includes('french')

            return (
              <div 
                key={candidate.id}
                className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-700 rounded-xl p-4 shadow-sm transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-900 px-2 py-0.5 rounded truncate max-w-[220px]">
                      {candidate.specialty || 'General Trade'}
                    </span>

                    <span className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 px-2 py-0.5 rounded">
                      {isPassportReady ? 'Passport Valid' : 'Passport Pending'}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-zinc-900 dark:text-white">
                    {candidate.full_name}
                  </h4>
                  <div className="text-xs text-zinc-500 mt-0.5">
                    {candidate.applied_position || 'Open Role'} • {candidate.experience || 'Experienced'}
                  </div>

                  <div className="flex items-center gap-2 mt-2 text-[11px] text-zinc-500">
                    <span>{candidate.phone || 'No phone'}</span>
                    <span>•</span>
                    <span>{candidate.nationality || 'International'}</span>
                  </div>

                  {/* Languages */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                    {hasGerman && (
                      <span className="text-[10px] font-semibold bg-zinc-100 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-800">
                        German
                      </span>
                    )}
                    {hasEnglish && (
                      <span className="text-[10px] font-semibold bg-zinc-100 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-800">
                        English
                      </span>
                    )}
                    {hasFrench && (
                      <span className="text-[10px] font-semibold bg-zinc-100 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-800">
                        French
                      </span>
                    )}
                  </div>

                  {candidate.skills && (
                    <div className="mt-2.5 p-2 bg-zinc-50 dark:bg-zinc-900/50 rounded border border-zinc-100 dark:border-zinc-850 text-[11px] text-zinc-600 dark:text-zinc-400 line-clamp-2">
                      {candidate.skills}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-900">
                  <button
                    onClick={() => openWhatsAppOutreach(candidate)}
                    className="px-2.5 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium rounded-md transition-colors cursor-pointer"
                  >
                    Contact via WhatsApp
                  </button>

                  <button
                    onClick={() => onSelectCandidate && onSelectCandidate(candidate)}
                    className="px-2.5 py-1.5 bg-zinc-100 dark:bg-zinc-850 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs font-medium rounded-md transition-colors cursor-pointer"
                  >
                    View Details
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

    </div>
  )
}
