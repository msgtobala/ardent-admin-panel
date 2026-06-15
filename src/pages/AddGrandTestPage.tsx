import { Link, useNavigate } from 'react-router-dom'
import { AddGrandTestForm } from '@/components/grand-tests/AddGrandTestForm'
import { MaterialIcon } from '@/components/ui/MaterialIcon'

export default function AddGrandTestPage() {
  const navigate = useNavigate()

  function handleCancel() {
    navigate('/grand-tests/active')
  }

  function handleSaved() {
    navigate('/grand-tests/active')
  }

  return (
    <div className="flex flex-col gap-gutter">
      <div className="flex flex-col gap-2">
        <Link
          to="/grand-tests/active"
          className="inline-flex w-fit items-center gap-1 text-body-md font-medium text-primary transition hover:text-primary-action focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
        >
          <MaterialIcon name="arrow_back" size={18} />
          Back to Active Tests
        </Link>
        <div className="flex max-w-6xl flex-col gap-2">
          <h1 className="text-section-title text-on-surface">Add New Test</h1>
          <p className="text-body-md text-on-surface-variant">
            Create a grand test with basic details, qbank questions, and a final preview
          </p>
        </div>
      </div>

      <AddGrandTestForm onCancel={handleCancel} onSaved={handleSaved} />
    </div>
  )
}
