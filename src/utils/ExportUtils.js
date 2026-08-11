import * as XLSX from 'xlsx'

// ── Nationality normalization (same map as Dashboard) ──────────────────────
const NATIONALITY_MAP = {
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
  'ذكر': '',
  'Algérie': 'Algerian', 'Algerien': 'Algerian', 'Agerienne': 'Algerian',
  'Tunisie': 'Tunisian', 'Tounssi': 'Tunisian', 'Tunsien': 'Tunisian',
  'Egypte': 'Egyptian', 'Egyptien': 'Egyptian',
  'Libye': 'Libyan', 'Libyen': 'Libyan',
  'Syrie': 'Syrian', 'Syrien': 'Syrian',
  'Maroc': 'Moroccan', 'Marocain': 'Moroccan',
  'Inde': 'Indian', 'Indien': 'Indian',
  'Pakistan': 'Pakistani',
  'algerian': 'Algerian', 'tunisian': 'Tunisian', 'egyptian': 'Egyptian',
  'libyan': 'Libyan', 'syrian': 'Syrian', 'moroccan': 'Moroccan',
  'palestinian': 'Palestinian', 'sudanese': 'Sudanese', 'indian': 'Indian',
  'pakistani': 'Pakistani', 'kenyan': 'Kenyan', 'yemeni': 'Yemeni',
  'jordanian': 'Jordanian', 'iraqi': 'Iraqi',
}

function normalizeNationality(raw) {
  if (!raw) return 'N/A'
  const trimmed = raw.trim()
  const result = NATIONALITY_MAP[trimmed] || NATIONALITY_MAP[trimmed.toLowerCase()] || trimmed
  return result || 'N/A'
}


/**
 * Export selected candidates to Excel file (.xlsx)
 * @param {Array} selectedCandidates - List of selected candidate objects
 */
export const exportToExcel = (selectedCandidates) => {
  if (!selectedCandidates || selectedCandidates.length === 0) return

  // Format data for spreadsheet
  const data = selectedCandidates.map((c) => ({
    'ID': c.id,
    'Full Name': c.full_name || 'N/A',
    'Email': c.email || 'N/A',
    'Phone': c.phone || 'N/A',
    'Nationality': normalizeNationality(c.nationality),
    'Applied Position': c.applied_position || 'N/A',
    'Specialty': c.specialty || 'N/A',
    'Experience': c.experience || 'N/A',
    'Education': c.education || 'N/A',
    'Skills': c.skills || 'N/A',
    'Status': c.status || 'N/A',
    'Applied Date': c.created_at ? new Date(c.created_at).toLocaleDateString('en-GB') : 'N/A',
    'CV': c.cv_filepath ? '✓ Uploaded' : '✗ Missing',
    'ID Document': c.id_document_filepath ? '✓ Uploaded' : '✗ Missing',
  }))

  const worksheet = XLSX.utils.json_to_sheet(data)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Candidates')

  // Set column widths based on maximum contents length
  const maxProps = Object.keys(data[0] || {}).map((key) => {
    return Math.max(
      key.length,
      ...data.map((row) => String(row[key] || '').length)
    )
  })
  worksheet['!cols'] = maxProps.map((w) => ({ wch: Math.min(w + 2, 40) }))

  XLSX.writeFile(workbook, `ALGHAITH_Candidates_${new Date().toISOString().slice(0, 10)}.xlsx`)
}


