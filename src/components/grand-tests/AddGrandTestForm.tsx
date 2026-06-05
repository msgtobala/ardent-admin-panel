import { GrandTestForm } from './GrandTestForm'

interface AddGrandTestFormProps {
  onCancel: () => void
  onSaved: () => void
}

export function AddGrandTestForm({ onCancel, onSaved }: AddGrandTestFormProps) {
  return <GrandTestForm mode="add" onCancel={onCancel} onSaved={onSaved} />
}
