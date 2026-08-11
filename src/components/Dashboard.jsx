import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../supabaseClient'
import { exportToExcel } from '../utils/ExportUtils'
import CandidateDetails from './CandidateDetails'
import MultiSelectFilter from './MultiSelectFilter'
import KanbanBoard from './KanbanBoard'
import CandidateFormModal from './CandidateFormModal'
import OutreachModal from './OutreachModal'
import { 
  Search, FileSpreadsheet, 
  Sun, Moon, LogOut, CheckSquare, Square, RefreshCw, 
  Users, UserCheck, PhoneCall, AlertTriangle, ChevronLeft, ChevronRight,
  LayoutGrid, List, UserPlus
} from 'lucide-react'

// ── Nationality normalization map ──────────────────────────────────────────
// Maps known dirty / variant spellings → canonical English name
const NATIONALITY_MAP = {
  // Arabic variants
  'جزائري': 'Algerian', 'جزائرية': 'Algerian', 'الجزائرية': 'Algerian',
  'مصري': 'Egyptian', 'مصرى': 'Egyptian', 'مصرية': 'Egyptian',
  'تونسي': 'Tunisian', 'تونسية': 'Tunisian', 'تونيسية': 'Tunisian',
  'ليبي': 'Libyan', 'ليبية': 'Libyan',
  'سوري': 'Syrian', 'سورية': 'Syrian',
  'فلسطيني': 'Palestinian', 'فلسطينية': 'Palestinian',
  'سوداني': 'Sudanese', 'سودانية': 'Sudanese',
  'هندي': 'Indian', 'هندية': 'Indian',
  'باكستاني': 'Pakistani', 'باكستانية': 'Pakistani',
  'مغربي': 'Moroccan', 'مغربية': 'Moroccan',
  'يمني': 'Yemeni', 'يمنية': 'Yemeni',
  'أردني': 'Jordanian', 'أردنية': 'Jordanian',
  'عراقي': 'Iraqi', 'عراقية': 'Iraqi',
  'كيني': 'Kenyan', 'كينية': 'Kenyan',
  'ذكر': 'Unknown', // gender mistakenly entered as nationality
  // French variants
  'Algérie': 'Algerian', 'Algerien': 'Algerian', 'Agerienne': 'Algerian',
  'Tunisie': 'Tunisian', 'Tounssi': 'Tunisian', 'Tunsien': 'Tunisian',
  'Egypte': 'Egyptian', 'Egyptien': 'Egyptian',
  'Libye': 'Libyan', 'Libyen': 'Libyan',
  'Syrie': 'Syrian', 'Syrien': 'Syrian',
  'Maroc': 'Moroccan', 'Marocain': 'Moroccan',
  'Inde': 'Indian', 'Indien': 'Indian',
  'Pakistan': 'Pakistani',
  // Partial/lower-case fixes
  'algerian': 'Algerian', 'tunisian': 'Tunisian', 'egyptian': 'Egyptian',
  'libyan': 'Libyan', 'syrian': 'Syrian', 'moroccan': 'Moroccan',
  'palestinian': 'Palestinian', 'sudanese': 'Sudanese', 'indian': 'Indian',
  'pakistani': 'Pakistani', 'kenyan': 'Kenyan', 'yemeni': 'Yemeni',
  'jordanian': 'Jordanian', 'iraqi': 'Iraqi',
}

function normalizeNationality(raw) {
  if (!raw) return ''
  const trimmed = raw.trim()
  return NATIONALITY_MAP[trimmed] || NATIONALITY_MAP[trimmed.toLowerCase()] || trimmed
}

/**
 * Group repeated candidate applications by Name / Phone into a single candidate profile.
 */
function groupCandidates(rawList) {
  if (!rawList || rawList.length === 0) return []

  const groups = new Map()

  rawList.forEach((c) => {
    const emailClean = (c.email || '').toLowerCase().trim()
    const phoneDigits = c.phone ? String(c.phone).replace(/\D/g, '') : ''
    const nameKey = (c.full_name || '').toLowerCase().trim().replace(/\s+/g, ' ')

    let key = ''
    if (emailClean && emailClean.length > 3) {
      key = `email_${emailClean}`
    } else if (phoneDigits && phoneDigits.length >= 7) {
      key = `phone_${phoneDigits.slice(-8)}`
    } else if (nameKey) {
      key = `name_${nameKey}`
    } else {
      key = `id_${c.id}`
    }

    if (!groups.has(key)) {
      groups.set(key, {
        ...c,
        applied_positions: c.applied_position ? [c.applied_position] : [],
        applications_count: 1,
        applications: [c]
      })
    } else {
      const existing = groups.get(key)
      existing.applications.push(c)
      existing.applications_count += 1
      
      // Update name to Latin/English if available
      if (c.full_name && /[\u0600-\u06FF]/.test(existing.full_name) && !/[\u0600-\u06FF]/.test(c.full_name)) {
        existing.full_name = c.full_name
      }

      if (c.applied_position && !existing.applied_positions.includes(c.applied_position)) {
        existing.applied_positions.push(c.applied_position)
      }

      if (!existing.skills && c.skills) existing.skills = c.skills
      if (!existing.specialty && c.specialty) existing.specialty = c.specialty
      if (!existing.education && c.education) existing.education = c.education
      if (!existing.email && c.email) existing.email = c.email
      if (!existing.phone && c.phone) existing.phone = c.phone
      if (!existing.cv_filepath && c.cv_filepath) existing.cv_filepath = c.cv_filepath
      if (!existing.id_document_filepath && c.id_document_filepath) existing.id_document_filepath = c.id_document_filepath

      existing.applied_position = existing.applied_positions.join(', ')
    }
  })

  return Array.from(groups.values())
}

export default function Dashboard({ onLogout }) {
  const [candidates, setCandidates] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // View mode: 'table' vs 'kanban'
  const [viewMode, setViewMode] = useState('table')

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [isJobManagerOpen, setIsJobManagerOpen] = useState(false)
  const [candidateToEdit, setCandidateToEdit] = useState(null)
  const [candidateForOutreach, setCandidateForOutreach] = useState(null)
  
  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('')
  const [nationalityFilter, setNationalityFilter] = useState([])
  const [specialtyFilter, setSpecialtyFilter] = useState([])
  const [experienceFilter, setExperienceFilter] = useState([])
  const [statusFilter, setStatusFilter] = useState([])
  const [sortBy, setSortBy] = useState('newest') // newest, oldest
  
  // Selection state
  const [selectedIds, setSelectedIds] = useState(new Set())
  
  // Detail panel state
  const [activeCandidate, setActiveCandidate] = useState(null)
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)

  // Status Change Handler for Kanban / Quick updates
  const handleStatusChange = async (candidateId, newStatus) => {
    // Optimistic UI update
    setCandidates((prev) =>
      prev.map((c) => (c.id === candidateId ? { ...c, status: newStatus } : c))
    )

    try {
      const { error: updateErr } = await supabase
        .from('candidates')
        .update({ status: newStatus })
        .eq('id', candidateId)

      if (updateErr) throw updateErr
    } catch (err) {
      console.error('Failed to update candidate status:', err)
      // Revert if error
      fetchCandidates()
    }
  }

  // Handle Form Modal Save Success
  const handleFormSuccess = (savedCandidate) => {
    if (!savedCandidate) return
    setCandidates((prev) => {
      const exists = prev.some((c) => c.id === savedCandidate.id)
      if (exists) {
        return prev.map((c) => (c.id === savedCandidate.id ? savedCandidate : c))
      }
      return [savedCandidate, ...prev]
    })
    if (activeCandidate && activeCandidate.id === savedCandidate.id) {
      setActiveCandidate(savedCandidate)
    }
  }



  // Dark/Light Mode state
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('candidate_theme')
    if (saved) return saved === 'dark'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  // Theme application
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('candidate_theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('candidate_theme', 'light')
    }
  }, [isDarkMode])

  // Fetch candidates from Supabase
  const fetchCandidates = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase
        .from('candidates')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setCandidates(data || [])
    } catch (err) {
      console.error('Error fetching candidates:', err)
      setError('Failed to retrieve candidates from database. Please reload.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let active = true
    async function initLoad() {
      try {
        const { data, error } = await supabase
          .from('candidates')
          .select('*')
          .order('created_at', { ascending: false })
        if (active) {
          if (error) throw error
          setCandidates(data || [])
          setLoading(false)
        }
      } catch (err) {
        if (active) {
          console.error('Error fetching candidates:', err)
          setError('Failed to retrieve candidates from database. Please reload.')
          setLoading(false)
        }
      }
    }
    initLoad()
    return () => { active = false }
  }, [])

  // Filter & search match helpers
  const getMatchesSearch = (c, term) => {
    if (!term) return true
    const query = term.toLowerCase()
    return (
      (c.full_name && c.full_name.toLowerCase().includes(query)) ||
      (c.applied_position && c.applied_position.toLowerCase().includes(query)) ||
      (c.skills && c.skills.toLowerCase().includes(query))
    )
  }

  const getMatchesNationality = (c, filter) => {
    if (filter.length === 0) return true
    return filter.includes(normalizeNationality(c.nationality))
  }

  const getMatchesSpecialty = (c, filter) => {
    if (filter.length === 0) return true
    return filter.includes(c.specialty)
  }

  const getMatchesExperience = (c, filter) => {
    if (filter.length === 0) return true
    return filter.includes(c.experience)
  }

  const getMatchesStatus = (c, filter) => {
    if (filter.length === 0) return true
    return filter.includes(c.status)
  }

  // Deduplication toggle state
  const [deduplicate, setDeduplicate] = useState(true)

  // Candidate dataset processed via deduplication if enabled
  const processedCandidates = useMemo(() => {
    if (!deduplicate) return candidates
    return groupCandidates(candidates)
  }, [candidates, deduplicate])

  // Extract unique filter options dynamically from data with live counts
  const filterOptions = useMemo(() => {
    const rawNationalities = new Set()
    const rawSpecialties = new Set()
    const rawExperiences = new Set()
    const rawStatuses = new Set()

    processedCandidates.forEach((c) => {
      if (c.nationality) {
        const normalized = normalizeNationality(c.nationality)
        if (normalized && normalized !== 'Unknown') rawNationalities.add(normalized)
      }
      if (c.specialty) rawSpecialties.add(c.specialty)
      if (c.experience) rawExperiences.add(c.experience)
      if (c.status) rawStatuses.add(c.status)
    })

    const filterCandidatesExcept = (ignoredDimension) => {
      return processedCandidates.filter((c) => {
        const matchSearch = getMatchesSearch(c, searchTerm)
        const matchNat = ignoredDimension === 'nationality' ? true : getMatchesNationality(c, nationalityFilter)
        const matchSpec = ignoredDimension === 'specialty' ? true : getMatchesSpecialty(c, specialtyFilter)
        const matchExp = ignoredDimension === 'experience' ? true : getMatchesExperience(c, experienceFilter)
        const matchStat = ignoredDimension === 'status' ? true : getMatchesStatus(c, statusFilter)
        return matchSearch && matchNat && matchSpec && matchExp && matchStat
      })
    }

    const nationalitiesCounts = Array.from(rawNationalities).map((nat) => {
      const matching = filterCandidatesExcept('nationality')
      const count = matching.filter((c) => normalizeNationality(c.nationality) === nat).length
      return { label: nat, value: nat, count }
    }).sort((a, b) => a.label.localeCompare(b.label))

    const specialtiesCounts = Array.from(rawSpecialties).map((spec) => {
      const matching = filterCandidatesExcept('specialty')
      const count = matching.filter((c) => c.specialty === spec).length
      return { label: spec, value: spec, count }
    }).sort((a, b) => a.label.localeCompare(b.label))

    const experiencesCounts = Array.from(rawExperiences).map((exp) => {
      const matching = filterCandidatesExcept('experience')
      const count = matching.filter((c) => c.experience === exp).length
      return { label: exp, value: exp, count }
    }).sort((a, b) => {
      const numA = parseInt(a.label) || 0
      const numB = parseInt(b.label) || 0
      return numA - numB
    })

    const statusesCounts = Array.from(rawStatuses).map((stat) => {
      const matching = filterCandidatesExcept('status')
      const count = matching.filter((c) => c.status === stat).length
      return { label: stat, value: stat, count }
    }).sort((a, b) => a.label.localeCompare(b.label))

    return {
      nationalities: nationalitiesCounts,
      specialties: specialtiesCounts,
      experiences: experiencesCounts,
      statuses: statusesCounts
    }
  }, [processedCandidates, searchTerm, nationalityFilter, specialtyFilter, experienceFilter, statusFilter])

  // Filter, search & client-side sort logic
  const filteredCandidates = useMemo(() => {
    const filtered = processedCandidates.filter((c) => {
      return (
        getMatchesSearch(c, searchTerm) &&
        getMatchesNationality(c, nationalityFilter) &&
        getMatchesSpecialty(c, specialtyFilter) &&
        getMatchesExperience(c, experienceFilter) &&
        getMatchesStatus(c, statusFilter)
      )
    })

    return [...filtered].sort((a, b) => {
      if (sortBy === 'newest') {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0
        return dateB - dateA
      } else if (sortBy === 'oldest') {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0
        return dateA - dateB
      }
      return 0
    })
  }, [processedCandidates, searchTerm, nationalityFilter, specialtyFilter, experienceFilter, statusFilter, sortBy])

  // Keep track of filters to reset pagination synchronously during render
  const [prevFilters, setPrevFilters] = useState({
    searchTerm,
    nationalityFilter,
    specialtyFilter,
    experienceFilter,
    statusFilter,
    sortBy
  })

  if (
    prevFilters.searchTerm !== searchTerm ||
    prevFilters.nationalityFilter !== nationalityFilter ||
    prevFilters.specialtyFilter !== specialtyFilter ||
    prevFilters.experienceFilter !== experienceFilter ||
    prevFilters.statusFilter !== statusFilter ||
    prevFilters.sortBy !== sortBy
  ) {
    setPrevFilters({
      searchTerm,
      nationalityFilter,
      specialtyFilter,
      experienceFilter,
      statusFilter,
      sortBy
    })
    setCurrentPage(1)
  }

  // Pagination calculations
  const paginatedCandidates = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    return filteredCandidates.slice(startIndex, startIndex + pageSize)
  }, [filteredCandidates, currentPage, pageSize])

  const totalPages = Math.ceil(filteredCandidates.length / pageSize) || 1

  // Selection handlers
  const handleSelectRow = (id) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  const handleSelectAllFiltered = () => {
    const filteredIds = filteredCandidates.map((c) => c.id)
    const allSelected = filteredIds.length > 0 && filteredIds.every((id) => selectedIds.has(id))
    
    const newSelected = new Set(selectedIds)
    if (allSelected) {
      filteredIds.forEach((id) => newSelected.delete(id))
    } else {
      filteredIds.forEach((id) => newSelected.add(id))
    }
    setSelectedIds(newSelected)
  }

  const handleClearSelection = () => {
    setSelectedIds(new Set())
  }

  // Get selected candidate objects
  const selectedCandidatesList = useMemo(() => {
    return candidates.filter((c) => selectedIds.has(c.id))
  }, [candidates, selectedIds])

  // KPI Calculations (Now dynamic based on filteredCandidates)
  const stats = useMemo(() => {
    const total = filteredCandidates.length
    const applied = filteredCandidates.filter((c) => {
      const s = (c.status || 'applied').toLowerCase()
      return s === 'applied' || s === 'new' || s === 'pending'
    }).length
    const interviewing = filteredCandidates.filter((c) => (c.status || '').toLowerCase() === 'interviewing').length
    const shortlisted = filteredCandidates.filter((c) => (c.status || '').toLowerCase() === 'shortlisted').length

    return { total, applied, interviewing, shortlisted }
  }, [filteredCandidates])

  // Export handlers
  const handleExportExcel = () => {
    if (selectedCandidatesList.length === 0) return
    exportToExcel(selectedCandidatesList)
  }

  const handleClearAllFilters = () => {
    setSearchTerm('')
    setNationalityFilter([])
    setSpecialtyFilter([])
    setExperienceFilter([])
    setStatusFilter([])
  }

  const getStatusBadgeStyle = (status) => {
    switch (status?.toLowerCase()) {
      case 'new':
      case 'applied':
      case 'pending':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
      case 'interviewing':
        return 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20'
      case 'shortlisted':
        return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
      case 'rejected':
        return 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
      default:
        return 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border border-zinc-500/20'
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#09090b] text-zinc-900 dark:text-zinc-50 transition-colors duration-200">
      
      {/* Top Banner Navigation */}
      <header className="sticky top-0 z-30 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-[#09090b]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 text-white rounded-xl shadow-md">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-extrabold text-lg tracking-tight">HR Candidate Portal</h1>
              <p className="text-[10px] text-zinc-500 font-semibold tracking-wider uppercase dark:text-zinc-400">Management Dashboard</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle: Table vs Kanban */}
            <div className="flex items-center p-1 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
              <button
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Table</span>
              </button>
              <button
                onClick={() => setViewMode('kanban')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'kanban'
                    ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Kanban</span>
              </button>
            </div>

            {/* Add Candidate Button */}
            <button
              onClick={() => {
                setCandidateToEdit(null)
                setIsFormModalOpen(true)
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer active:scale-[0.98]"
            >
              <UserPlus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Candidate</span>
            </button>

            {/* Manage Job Postings Button */}
            <button
              onClick={() => setIsJobManagerOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer active:scale-[0.98]"
              title="Post & Manage Job Openings on Website"
            >
              <Briefcase className="w-4 h-4" />
              <span className="hidden sm:inline">Job Postings</span>
            </button>

            {/* Theme Toggle */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-xl transition-all"
              title="Toggle Dark/Light Mode"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-zinc-600" />}
            </button>

            {/* Refresh Button */}
            <button
              onClick={fetchCandidates}
              className="p-2.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-xl transition-all"
              title="Reload Database"
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 text-zinc-600 dark:text-zinc-400 ${loading ? 'animate-spin' : ''}`} />
            </button>

            {/* Logout */}
            <button
              onClick={onLogout}
              className="p-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-500 rounded-xl transition-all flex items-center gap-1.5 font-semibold text-sm"
              title="Log Out"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* KPI Stats Widgets */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-zinc-950 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-900 shadow-sm flex items-center gap-4 hover:scale-[1.01] transition-all">
            <div className="p-3 bg-zinc-100 dark:bg-zinc-900 text-zinc-500 rounded-xl border border-zinc-200/50 dark:border-zinc-800">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Total Candidates</p>
              <h3 className="text-2xl font-extrabold mt-1">{loading ? '...' : stats.total}</h3>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-950 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-900 shadow-sm flex items-center gap-4 hover:scale-[1.01] transition-all">
            <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl border border-blue-500/15">
              <PhoneCall className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">New Applied</p>
              <h3 className="text-2xl font-extrabold mt-1 text-blue-600 dark:text-blue-400">{loading ? '...' : stats.applied}</h3>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-950 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-900 shadow-sm flex items-center gap-4 hover:scale-[1.01] transition-all">
            <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl border border-amber-500/15">
              <RefreshCw className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Interviewing</p>
              <h3 className="text-2xl font-extrabold mt-1 text-amber-600 dark:text-amber-400">{loading ? '...' : stats.interviewing}</h3>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-950 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-900 shadow-sm flex items-center gap-4 hover:scale-[1.01] transition-all">
            <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl border border-emerald-500/15">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Shortlisted</p>
              <h3 className="text-2xl font-extrabold mt-1 text-emerald-600 dark:text-emerald-400">{loading ? '...' : stats.shortlisted}</h3>
            </div>
          </div>
        </div>

        {/* Filters and Actions Box */}
        <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-900 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
            <div className="relative flex-1 max-w-lg">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Search name, position, or skills..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>

            {/* Sort & Clear Filter / Action Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Deduplicate Toggle Button */}
              <button
                onClick={() => setDeduplicate(!deduplicate)}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                  deduplicate
                    ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30 shadow-sm'
                    : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800'
                }`}
                title="Group candidate applications by name/phone"
              >
                <span>{deduplicate ? 'Merged Profiles (ON)' : 'Show All Raw Submissions'}</span>
              </button>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Sort By:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-semibold rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all text-zinc-700 dark:text-zinc-300 cursor-pointer"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                </select>
              </div>

              {(searchTerm || nationalityFilter.length > 0 || specialtyFilter.length > 0 || experienceFilter.length > 0 || statusFilter.length > 0) && (
                <button
                  onClick={handleClearAllFilters}
                  className="px-4 py-2 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 text-xs font-bold rounded-xl border border-dashed border-zinc-200 dark:border-zinc-850 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all cursor-pointer"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          {/* Filter Dropdown Matrix */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2 border-t border-zinc-100 dark:border-zinc-900/60">
            <MultiSelectFilter
              label="Nationality"
              options={filterOptions.nationalities}
              selectedValues={nationalityFilter}
              onChange={setNationalityFilter}
              placeholder="All Nationalities"
              searchPlaceholder="Search nationalities..."
            />

            <MultiSelectFilter
              label="Specialty"
              options={filterOptions.specialties}
              selectedValues={specialtyFilter}
              onChange={setSpecialtyFilter}
              placeholder="All Specialties"
              searchPlaceholder="Search specialties..."
            />

            <MultiSelectFilter
              label="Experience"
              options={filterOptions.experiences}
              selectedValues={experienceFilter}
              onChange={setExperienceFilter}
              placeholder="All Experience"
              searchPlaceholder="Search experience..."
            />

            <MultiSelectFilter
              label="Status"
              options={filterOptions.statuses}
              selectedValues={statusFilter}
              onChange={setStatusFilter}
              placeholder="All Statuses"
              searchPlaceholder="Search statuses..."
            />
          </div>
        </div>

        {/* Selected Items Action Bar */}
        {selectedIds.size > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-500/10 animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold">
                {selectedIds.size} Selected
              </span>
              <span className="text-sm font-semibold">Bulk operations on selected candidates:</span>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                onClick={handleClearSelection}
                className="px-3.5 py-2 text-xs font-bold text-white hover:bg-white/10 rounded-xl transition-all"
              >
                Deselect All
              </button>
              <button
                onClick={handleExportExcel}
                className="flex items-center gap-1.5 px-4 py-2 bg-white text-blue-700 font-bold text-xs rounded-xl shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Export Excel</span>
              </button>
            </div>
          </div>
        )}

        {/* Main Data Container: Table vs Kanban */}
        {viewMode === 'kanban' ? (
          <KanbanBoard
            candidates={filteredCandidates}
            onCandidateClick={setActiveCandidate}
            onStatusChange={handleStatusChange}
            onOutreachClick={setCandidateForOutreach}
          />
        ) : (
          <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-900 shadow-sm overflow-hidden">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4">
                <div className="w-10 h-10 border-4 border-zinc-200 dark:border-zinc-800 border-t-blue-600 rounded-full animate-spin" />
                <p className="text-sm font-semibold text-zinc-500">Loading candidate records...</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                <AlertTriangle className="w-12 h-12 text-red-500 mb-3" />
                <p className="font-bold text-zinc-800 dark:text-zinc-200">{error}</p>
                <button
                  onClick={fetchCandidates}
                  className="mt-4 px-4 py-2 bg-zinc-900 dark:bg-white dark:text-zinc-900 text-white text-xs font-bold rounded-xl transition-colors hover:bg-zinc-800 dark:hover:bg-zinc-100"
                >
                  Retry Request
                </button>
              </div>
            ) : filteredCandidates.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-zinc-500">
                <Search className="w-10 h-10 mb-3 text-zinc-400" />
                <p className="text-sm font-medium">No candidates match your search filters.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-100 dark:border-zinc-900/80">
                      <th className="p-4 w-12 text-center">
                        <button
                          onClick={handleSelectAllFiltered}
                          className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-850 rounded transition-colors text-zinc-500"
                        >
                          {filteredCandidates.length > 0 && filteredCandidates.every((c) => selectedIds.has(c.id)) ? (
                            <CheckSquare className="w-5 h-5 text-blue-600 dark:text-blue-500" />
                          ) : (
                            <Square className="w-5 h-5" />
                          )}
                        </button>
                      </th>
                      <th className="p-4 text-xs font-bold uppercase tracking-wider text-zinc-500 min-w-[220px]">Name</th>
                      <th className="p-4 text-xs font-bold uppercase tracking-wider text-zinc-500 min-w-[110px]">Nationality</th>
                      <th className="p-4 text-xs font-bold uppercase tracking-wider text-zinc-500 min-w-[160px]">Applied Position</th>
                      <th className="p-4 text-xs font-bold uppercase tracking-wider text-zinc-500 min-w-[160px]">Specialty</th>
                      <th className="p-4 text-xs font-bold uppercase tracking-wider text-zinc-500 text-center min-w-[90px] whitespace-nowrap">Exp.</th>
                      <th className="p-4 text-xs font-bold uppercase tracking-wider text-zinc-500 min-w-[130px]">Education</th>
                      <th className="p-4 text-xs font-bold uppercase tracking-wider text-zinc-500 text-center min-w-[110px] whitespace-nowrap">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900/60">
                    {paginatedCandidates.map((c) => {
                      const isSelected = selectedIds.has(c.id)
                      return (
                        <tr
                          key={c.id}
                          className={`hover:bg-zinc-50/70 dark:hover:bg-zinc-900/30 transition-colors cursor-pointer group ${
                            isSelected ? 'bg-blue-500/5 dark:bg-blue-500/5' : ''
                          }`}
                          onClick={() => setActiveCandidate(c)}
                        >
                          {/* Checkbox column */}
                          <td
                            className="p-4 text-center"
                            onClick={(e) => {
                              e.stopPropagation() // Prevent row opening detail drawer
                              handleSelectRow(c.id)
                            }}
                          >
                            <button className="p-1 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors">
                              {isSelected ? (
                                <CheckSquare className="w-5 h-5 text-blue-600 dark:text-blue-500" />
                              ) : (
                                <Square className="w-5 h-5" />
                              )}
                            </button>
                          </td>

                          {/* Candidate Name */}
                          <td className="p-4 min-w-[220px]">
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors whitespace-nowrap">
                                  {c.full_name || 'N/A'}
                                </p>
                                {c.applications_count > 1 && (
                                  <span className="px-2 py-0.5 bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 rounded-full text-[10px] font-extrabold shrink-0 whitespace-nowrap">
                                    {c.applications_count} Submissions
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-zinc-400 font-medium truncate max-w-[180px]">{c.email || 'No email'}</p>
                            </div>
                          </td>

                          {/* Nationality */}
                          <td className="p-4 font-medium text-zinc-600 dark:text-zinc-300 whitespace-nowrap min-w-[110px]">
                            {normalizeNationality(c.nationality) || 'N/A'}
                          </td>

                          {/* Applied Position */}
                          <td className="p-4 font-semibold text-zinc-800 dark:text-zinc-200 min-w-[160px]">
                            {c.applied_position || 'N/A'}
                          </td>

                          {/* Specialty */}
                          <td className="p-4 text-zinc-600 dark:text-zinc-300 font-medium min-w-[160px]">
                            {c.specialty || 'N/A'}
                          </td>

                          {/* Experience */}
                          <td className="p-4 text-center text-zinc-800 dark:text-zinc-200 font-semibold whitespace-nowrap min-w-[90px]">
                            {c.experience || 'N/A'}
                          </td>

                          {/* Education */}
                          <td className="p-4 text-zinc-500 dark:text-zinc-400 font-medium truncate max-w-[180px] min-w-[130px]" title={c.education}>
                            {c.education || 'N/A'}
                          </td>

                          {/* Status */}
                          <td className="p-4 text-center min-w-[110px]" onClick={(e) => e.stopPropagation()}>
                            <span className={`inline-flex px-2.5 py-1 text-xs font-bold uppercase tracking-wider rounded-full whitespace-nowrap ${getStatusBadgeStyle(c.status)}`}>
                              {c.status || 'N/A'}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            {!loading && !error && filteredCandidates.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 bg-zinc-50/50 dark:bg-zinc-950/40 border-t border-zinc-100 dark:border-zinc-900">
                <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500">
                  <span>Show</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value))
                      setCurrentPage(1)
                    }}
                    className="px-2 py-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded-lg"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                  <span>entries</span>
                  <span className="ml-4 border-l border-zinc-200 dark:border-zinc-800 pl-4">
                    Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, filteredCandidates.length)} of {filteredCandidates.length} matches
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
                    disabled={currentPage === 1}
                    className="p-2 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-850 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    title="Previous Page"
                  >
                    <ChevronLeft className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                  </button>
                  
                  {Array.from({ length: Math.min(totalPages, 5) }).map((_, idx) => {
                    let pageNum = idx + 1
                    if (totalPages > 5 && currentPage > 3) {
                      pageNum = currentPage - 3 + idx
                      if (pageNum + (4 - idx) > totalPages) {
                        pageNum = totalPages - 4 + idx
                      }
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-9 h-9 text-xs font-bold rounded-xl transition-all ${
                          currentPage === pageNum
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-850 text-zinc-700 dark:text-zinc-350'
                        }`}
                      >
                        {pageNum}
                      </button>
                    )
                  })}

                  <button
                    onClick={() => setCurrentPage(Math.min(currentPage + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="p-2 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-850 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    title="Next Page"
                  >
                    <ChevronRight className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Candidate Details Side Drawer */}
      <CandidateDetails
        candidate={activeCandidate}
        onClose={() => setActiveCandidate(null)}
        onDeleteSuccess={(deletedId) => {
          setCandidates((prev) => prev.filter((c) => c.id !== deletedId))
          setActiveCandidate(null)
          setSelectedIds((prev) => {
            const newSelected = new Set(prev)
            newSelected.delete(deletedId)
            return newSelected
          })
        }}
        onEditClick={(cand) => {
          setCandidateToEdit(cand)
          setIsFormModalOpen(true)
        }}
        onOutreachClick={(cand) => {
          setCandidateForOutreach(cand)
        }}
      />

      {/* Add / Edit Candidate Form Modal */}
      {isFormModalOpen && (
        <CandidateFormModal
          candidate={candidateToEdit}
          onClose={() => {
            setIsFormModalOpen(false)
            setCandidateToEdit(null)
          }}
          onSuccess={handleFormSuccess}
        />
      )}

      {/* Automated Outreach Template Modal */}
      {candidateForOutreach && (
        <OutreachModal
          candidate={candidateForOutreach}
          onClose={() => setCandidateForOutreach(null)}
        />
      )}

      {/* Website Job Postings Manager Modal */}
      {isJobManagerOpen && (
        <JobOffersManager onClose={() => setIsJobManagerOpen(false)} />
      )}

    </div>
  )
}
