import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { 
  Briefcase, Plus, Search, Edit, Trash2, CheckCircle, XCircle, 
  MapPin, Clock, FileText, AlertCircle, X, Loader2, Sparkles
} from 'lucide-react'

export default function JobOffersManager({ onClose }) {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  // Modal State for New / Edit Job
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingJob, setEditingJob] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [formError, setFormError] = useState('')

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    title_ar: '',
    location: 'Tripoli, Libya',
    location_ar: 'طرابلس، ليبيا',
    employment_type: 'Full-time',
    category: 'Engineering',
    specialty: '',
    description: '',
    description_ar: '',
    requirements: '',
    requirements_ar: '',
    status: 'active'
  })

  // Fetch jobs from Supabase
  const fetchJobs = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error: err } = await supabase
        .from('job_offers')
        .select('*')
        .order('created_at', { ascending: false })

      if (err) {
        // If table doesn't exist yet in Supabase schema
        if (err.code === 'PGRST205' || err.message?.includes('schema cache')) {
          setJobs([])
        } else {
          throw err
        }
      } else {
        setJobs(data || [])
      }
    } catch (err) {
      console.error('Error fetching job offers:', err)
      setError('Failed to fetch job offers from database.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchJobs()
  }, [])

  const handleOpenModal = (job = null) => {
    setFormError('')
    if (job) {
      setEditingJob(job)
      setFormData({
        title: job.title || '',
        title_ar: job.title_ar || '',
        location: job.location || 'Tripoli, Libya',
        location_ar: job.location_ar || 'طرابلس، ليبيا',
        employment_type: job.employment_type || 'Full-time',
        category: job.category || 'Engineering',
        specialty: job.specialty || '',
        description: job.description || '',
        description_ar: job.description_ar || '',
        requirements: job.requirements || '',
        requirements_ar: job.requirements_ar || '',
        status: job.status || 'active'
      })
    } else {
      setEditingJob(null)
      setFormData({
        title: '',
        title_ar: '',
        location: 'Tripoli, Libya',
        location_ar: 'طرابلس، ليبيا',
        employment_type: 'Full-time',
        category: 'Engineering',
        specialty: '',
        description: '',
        description_ar: '',
        requirements: '',
        requirements_ar: '',
        status: 'active'
      })
    }
    setIsModalOpen(true)
  }

  const handleToggleStatus = async (job) => {
    const newStatus = job.status === 'active' ? 'closed' : 'active'
    setJobs(prev => prev.map(j => j.id === job.id ? { ...j, status: newStatus } : j))

    try {
      const { error: err } = await supabase
        .from('job_offers')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', job.id)

      if (err) throw err
    } catch (err) {
      console.error('Failed to toggle status:', err)
      fetchJobs()
    }
  }

  const handleDeleteJob = async (jobId) => {
    if (!window.confirm('Are you sure you want to delete this job posting permanently?')) return

    setJobs(prev => prev.filter(j => j.id !== jobId))

    try {
      const { error: err } = await supabase
        .from('job_offers')
        .delete()
        .eq('id', jobId)

      if (err) throw err
    } catch (err) {
      console.error('Failed to delete job:', err)
      fetchJobs()
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.title.trim()) {
      setFormError('Job Title (English) is required')
      return
    }

    setIsSaving(true)
    setFormError('')

    try {
      if (editingJob) {
        // Update
        const { data, error: err } = await supabase
          .from('job_offers')
          .update({
            ...formData,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingJob.id)
          .select()

        if (err) throw err
        if (data && data[0]) {
          setJobs(prev => prev.map(j => j.id === editingJob.id ? data[0] : j))
        }
      } else {
        // Insert
        const { data, error: err } = await supabase
          .from('job_offers')
          .insert([{
            ...formData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }])
          .select()

        if (err) throw err
        if (data && data[0]) {
          setJobs(prev => [data[0], ...prev])
        }
      }

      setIsModalOpen(false)
      fetchJobs()
    } catch (err) {
      console.error('Error saving job offer:', err)
      setFormError(err.message || 'Failed to save job offer. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = (job.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (job.category || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (job.specialty || '').toLowerCase().includes(searchTerm.toLowerCase())
    
    if (filterStatus === 'active') return matchesSearch && job.status === 'active'
    if (filterStatus === 'closed') return matchesSearch && job.status === 'closed'
    return matchesSearch
  })

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 md:p-6 overflow-y-auto">
      <div className="bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-5xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 rounded-xl">
              <Briefcase className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Website Job Openings Manager</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Post & manage active job postings shown on alghaithholding.com</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleOpenModal()}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-[0.98] cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Post New Job Offer</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-xl transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-900/30 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 w-full max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search job postings by title, category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${filterStatus === 'all' ? 'bg-blue-600 text-white' : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-500'}`}
            >
              All ({jobs.length})
            </button>
            <button
              onClick={() => setFilterStatus('active')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${filterStatus === 'active' ? 'bg-emerald-600 text-white' : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-500'}`}
            >
              Active ({jobs.filter(j => j.status === 'active').length})
            </button>
            <button
              onClick={() => setFilterStatus('closed')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${filterStatus === 'closed' ? 'bg-red-600 text-white' : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-500'}`}
            >
              Closed ({jobs.filter(j => j.status === 'closed').length})
            </button>
          </div>
        </div>

        {/* Content Table / Cards */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              <p className="text-xs text-zinc-500 font-medium">Loading job postings...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-xs text-center font-semibold">
              {error}
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Briefcase className="w-12 h-12 text-zinc-400 mb-3" />
              <h3 className="font-bold text-zinc-800 dark:text-zinc-200">No Job Postings Found</h3>
              <p className="text-xs text-zinc-500 mt-1 max-w-sm">Click "Post New Job Offer" above to create your first live career posting.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredJobs.map(job => (
                <div 
                  key={job.id}
                  className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                    job.status === 'active' 
                      ? 'bg-white dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 hover:border-blue-500/40 shadow-sm'
                      : 'bg-zinc-50 dark:bg-zinc-950/40 border-zinc-200/60 dark:border-zinc-900 opacity-75'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="px-2.5 py-0.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 rounded-full text-[10px] font-bold uppercase tracking-wider">
                          {job.category || 'General'}
                        </span>
                        <h4 className="font-bold text-base text-zinc-900 dark:text-white mt-1.5">{job.title}</h4>
                        {job.title_ar && <p className="text-xs text-zinc-400 font-arabic" dir="rtl">{job.title_ar}</p>}
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border shrink-0 ${
                        job.status === 'active' 
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                          : 'bg-red-500/10 text-red-500 dark:text-red-400 border-red-500/20'
                      }`}>
                        {job.status || 'active'}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-500">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                        <span>{job.location || 'Tripoli, Libya'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-zinc-400" />
                        <span>{job.employment_type || 'Full-time'}</span>
                      </div>
                    </div>

                    {job.description && (
                      <p className="text-xs text-zinc-600 dark:text-zinc-300 line-clamp-2 leading-relaxed">
                        {job.description}
                      </p>
                    )}
                  </div>

                  <div className="pt-4 mt-4 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between">
                    <button
                      onClick={() => handleToggleStatus(job)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        job.status === 'active'
                          ? 'bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 border border-amber-500/20'
                          : 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border border-emerald-500/20'
                      }`}
                    >
                      {job.status === 'active' ? (
                        <>
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Close Listing</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Set Active</span>
                        </>
                      )}
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenModal(job)}
                        className="p-2 text-zinc-500 hover:text-blue-500 hover:bg-blue-500/10 rounded-xl transition-all"
                        title="Edit Job Posting"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteJob(job.id)}
                        className="p-2 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                        title="Delete Job Posting"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal for Creating / Editing Job Offer */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-60 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
              
              <div className="flex items-center justify-between p-5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40">
                <h3 className="font-bold text-lg text-zinc-900 dark:text-white">
                  {editingJob ? 'Edit Job Posting' : 'Post New Job Opening'}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
                {formError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-xs font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">Job Title (English) *</label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g. Senior Mechanical Engineer"
                      className="w-full px-3.5 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">Job Title (Arabic)</label>
                    <input
                      type="text"
                      value={formData.title_ar}
                      onChange={(e) => setFormData({ ...formData, title_ar: e.target.value })}
                      placeholder="مثال: مهندس ميكانيكي أول"
                      dir="rtl"
                      className="w-full px-3.5 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 font-arabic"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3.5 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs"
                    >
                      <option value="Engineering">Engineering</option>
                      <option value="Technician & Maintenance">Technician & Maintenance</option>
                      <option value="Administration & HR">Administration & HR</option>
                      <option value="Finance & Accounting">Finance & Accounting</option>
                      <option value="IT & Software">IT & Software</option>
                      <option value="Logistics & Operations">Logistics & Operations</option>
                      <option value="Sales & Marketing">Sales & Marketing</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">Employment Type</label>
                    <select
                      value={formData.employment_type}
                      onChange={(e) => setFormData({ ...formData, employment_type: e.target.value })}
                      className="w-full px-3.5 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs"
                    >
                      <option value="Full-time">Full-time</option>
                      <option value="Part-time">Part-time</option>
                      <option value="Contract">Contract</option>
                      <option value="Internship">Internship</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">Location (English)</label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="Tripoli, Libya"
                      className="w-full px-3.5 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-3.5 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs"
                    >
                      <option value="active">Active (Visible on Website)</option>
                      <option value="closed">Closed (Hidden from Website)</option>
                      <option value="draft">Draft</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">Description (English)</label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Responsibilities and role summary..."
                    className="w-full px-3.5 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">Description (Arabic)</label>
                  <textarea
                    rows={3}
                    value={formData.description_ar}
                    onChange={(e) => setFormData({ ...formData, description_ar: e.target.value })}
                    placeholder="وصف الوظيفة والمسؤوليات باللغة العربية..."
                    dir="rtl"
                    className="w-full px-3.5 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 font-arabic"
                  />
                </div>

                <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 text-xs font-bold rounded-xl border border-zinc-200 dark:border-zinc-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                  >
                    {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>{editingJob ? 'Save Changes' : 'Publish Job Offer'}</span>
                  </button>
                </div>
              </form>

            </div>
          </div>
        )}

      </div>
    </div>
  )
}
