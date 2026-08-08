// גבולות גיל למערכת: מתחת ל-18 אסור להירשם, ומעל 100 זה כנראה נתון שגוי
export const MIN_AGE = 18
export const MAX_AGE = 100

export const MIN_BIRTH_YEAR = 1944
// שנת הלידה המאוחרת ביותר שעדיין נותנת גיל 18
export function maxBirthYear(): number {
  return new Date().getFullYear() - MIN_AGE
}

export function calcAge(dateOfBirth: string | null | undefined): number {
  if (!dateOfBirth) return 0
  const today = new Date()
  const birth = new Date(dateOfBirth)
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

// גיל מתוך פרופיל: השאלון שומר birth_year בלבד, ולכן date_of_birth הוא רק fallback.
// גיל מחוץ לטווח הסביר (נתון שגוי בדאטהבייס) מוחזר כ-null כדי שלא יוצג.
export function calcAgeFromProfile(p: { birth_year?: number | null; date_of_birth?: string | null }): number | null {
  let age: number | null = null
  if (p.birth_year) age = new Date().getFullYear() - p.birth_year
  else if (p.date_of_birth) age = calcAge(p.date_of_birth)
  if (age == null || age < MIN_AGE || age > MAX_AGE) return null
  return age
}

export function formatLastSeen(lastSeen: string): string {
  const diff = Date.now() - new Date(lastSeen).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 5) return 'עכשיו'
  if (mins < 60) return `לפני ${mins} דקות`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `לפני ${hours} שעות`
  const days = Math.floor(hours / 24)
  return `לפני ${days} ימים`
}

export function formatHeight(cm: number | null): string {
  if (!cm) return ''
  const feet = Math.floor(cm / 30.48)
  const inches = Math.round((cm / 30.48 - feet) * 12)
  return `${cm} ס"מ (${feet}'${inches}")`
}
