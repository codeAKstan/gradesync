// Grade mapping utility: converts numeric score (0-100) to grade and gradePoint
// Assumption: Standard grading scale
// A: 70-100 (5.0), B: 60-69 (4.0), C: 50-59 (3.0), D: 45-49 (2.0), E: 40-44 (1.0), F: 0-39 (0.0)

export function mapScoreToGrade(score) {
  const s = Number(score)
  if (Number.isNaN(s)) {
    return { grade: null, gradePoint: null }
  }
  if (s < 0 || s > 100) {
    return { grade: null, gradePoint: null }
  }
  if (s >= 70) return { grade: 'A', gradePoint: 5.0 }
  if (s >= 60) return { grade: 'B', gradePoint: 4.0 }
  if (s >= 50) return { grade: 'C', gradePoint: 3.0 }
  if (s >= 45) return { grade: 'D', gradePoint: 2.0 }
  if (s >= 40) return { grade: 'E', gradePoint: 1.0 }
  return { grade: 'F', gradePoint: 0.0 }
}

export function validateMatricNumberFormat(matricNumber) {
  if (!matricNumber) return false
  return /^\d{4}\/\d{6}$/.test(String(matricNumber).trim())
}