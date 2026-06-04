/** Firestore `videos/{id}` — slug from subject name, e.g. "Dental Materials" → `dental_materials`. */
export function buildVideoSubjectIdFromName(subjectName: string): string {
  return subjectName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}
