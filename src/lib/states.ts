import {
  collection,
  getDocs,
  orderBy,
  query,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore'
import { db } from './firebase'

export const STATES_COLLECTION = 'states'

export interface StateOption {
  id: string
  name: string
  code: string
}

const statesRef = collection(db, STATES_COLLECTION)

function mapStateDoc(snapshot: QueryDocumentSnapshot<DocumentData>): StateOption {
  const data = snapshot.data()

  return {
    id: snapshot.id,
    name: typeof data.name === 'string' ? data.name.trim() : snapshot.id,
    code: typeof data.code === 'string' ? data.code.trim() : snapshot.id,
  }
}

export async function fetchStateOptions(): Promise<StateOption[]> {
  const snapshot = await getDocs(query(statesRef, orderBy('name', 'asc')))
  return snapshot.docs.map(mapStateDoc)
}

export function stateOptionsToSelectOptions(states: StateOption[]) {
  return states.map((state) => ({
    value: state.code,
    label: state.name,
  }))
}
