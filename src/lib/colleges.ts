import { doc, getDoc } from 'firebase/firestore'
import { db } from './firebase'

export const COLLEGES_COLLECTION = 'colleges'

export interface CollegeOption {
  cid: number
  name: string
}

function normalizeStateCode(stateCode: string): string {
  return stateCode.trim().toUpperCase()
}

function mapCollegeEntry(value: unknown): CollegeOption | null {
  if (!value || typeof value !== 'object') return null

  const entry = value as { cid?: unknown; name?: unknown }
  const name = typeof entry.name === 'string' ? entry.name.trim() : ''
  if (!name) return null

  const parsedCid = typeof entry.cid === 'number' ? entry.cid : Number(entry.cid)
  const cid = Number.isFinite(parsedCid) ? parsedCid : 0

  return { cid, name }
}

export async function fetchCollegesByStateCode(
  stateCode: string,
): Promise<CollegeOption[]> {
  const normalizedStateCode = normalizeStateCode(stateCode)
  if (!normalizedStateCode) return []

  const docRef = doc(db, COLLEGES_COLLECTION, normalizedStateCode)
  const snapshot = await getDoc(docRef)

  if (!snapshot.exists()) return []

  const collegesField = snapshot.data().colleges
  if (!Array.isArray(collegesField)) return []

  return collegesField
    .map(mapCollegeEntry)
    .filter((college): college is CollegeOption => college !== null)
    .sort((left, right) => left.name.localeCompare(right.name))
}

export function collegesToSelectOptions(colleges: CollegeOption[]) {
  return colleges.map((college) => ({
    value: college.name,
    label: college.name,
  }))
}
