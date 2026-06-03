import { useCallback, useEffect, useState } from 'react'
import { createFaculty, updateFaculty } from '@/lib/faculties'
import type { Faculty } from '@/types/faculty'
import { useSnackbar } from '@/contexts/SnackbarContext'
import { Button } from '@/components/ui/Button'
import { MaterialIcon } from '@/components/ui/MaterialIcon'
import { TextField } from '@/components/ui/TextField'

interface EditFacultyModalProps {
  isOpen: boolean
  faculty: Faculty | null
  onClose: () => void
  onSaved: () => void
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const textareaClasses =
  'min-h-[100px] w-full resize-y rounded-input border border-border-subtle bg-surface-white px-[13px] py-[10px] text-body-md text-on-surface shadow-tier-1 placeholder:text-on-surface-variant focus:border-primary-action focus:outline-none focus:ring-2 focus:ring-focus-ring'

function getInitialFormState(faculty: Faculty | null) {
  return {
    firstName: faculty?.firstName ?? '',
    lastName: faculty?.lastName ?? '',
    displayName: faculty?.displayName ?? '',
    email: faculty?.email ?? '',
    phoneNo: faculty?.phoneNo ?? '',
    gender: faculty?.gender ?? '',
    title: faculty?.title ?? '',
    bio: faculty?.bio ?? '',
    languages: faculty?.languages ?? '',
    specialities: faculty?.specialities ?? '',
    experienceYears: faculty?.experienceYears?.toString() ?? '',
  }
}

export function EditFacultyModal({
  isOpen,
  faculty,
  onClose,
  onSaved,
}: EditFacultyModalProps) {
  const { showSnackbar } = useSnackbar()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [phoneNo, setPhoneNo] = useState('')
  const [gender, setGender] = useState('')
  const [title, setTitle] = useState('')
  const [bio, setBio] = useState('')
  const [languages, setLanguages] = useState('')
  const [specialities, setSpecialities] = useState('')
  const [experienceYears, setExperienceYears] = useState('')
  const [emailError, setEmailError] = useState<string | undefined>()
  const [firstNameError, setFirstNameError] = useState<string | undefined>()
  const [lastNameError, setLastNameError] = useState<string | undefined>()
  const [bioError, setBioError] = useState<string | undefined>()
  const [formError, setFormError] = useState<string | undefined>()
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!isOpen) return

    const initial = getInitialFormState(faculty)
    setFirstName(initial.firstName)
    setLastName(initial.lastName)
    setDisplayName(initial.displayName)
    setEmail(initial.email)
    setPhoneNo(initial.phoneNo)
    setGender(initial.gender)
    setTitle(initial.title)
    setBio(initial.bio)
    setLanguages(initial.languages)
    setSpecialities(initial.specialities)
    setExperienceYears(initial.experienceYears)
    setEmailError(undefined)
    setFirstNameError(undefined)
    setLastNameError(undefined)
    setBioError(undefined)
    setFormError(undefined)
    setIsSubmitting(false)
  }, [isOpen, faculty])

  const isEditMode = faculty != null

  const handleClose = useCallback(() => {
    if (isSubmitting) return
    onClose()
  }, [isSubmitting, onClose])

  useEffect(() => {
    if (!isOpen) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') handleClose()
    }

    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, handleClose])

  function validate(): boolean {
    let valid = true
    const trimmedFirstName = firstName.trim()
    const trimmedLastName = lastName.trim()
    const trimmedEmail = email.trim()
    const trimmedBio = bio.trim()

    if (!trimmedFirstName) {
      setFirstNameError('First name is required')
      valid = false
    } else {
      setFirstNameError(undefined)
    }

    if (!trimmedLastName) {
      setLastNameError('Last name is required')
      valid = false
    } else {
      setLastNameError(undefined)
    }

    if (!trimmedEmail) {
      setEmailError('Email is required')
      valid = false
    } else if (!EMAIL_PATTERN.test(trimmedEmail)) {
      setEmailError('Enter a valid email address')
      valid = false
    } else {
      setEmailError(undefined)
    }

    if (!trimmedBio) {
      setBioError('Bio is required')
      valid = false
    } else {
      setBioError(undefined)
    }

    return valid
  }

  async function handleSave() {
    if (!validate()) return

    setFormError(undefined)
    setIsSubmitting(true)

    const parsedExperience = experienceYears.trim()
      ? Number.parseInt(experienceYears, 10)
      : 0

    const payload = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      displayName: displayName.trim() || [firstName, lastName].filter(Boolean).join(' '),
      email: email.trim(),
      phoneNo: phoneNo.trim(),
      gender: gender.trim(),
      title: title.trim(),
      bio: bio.trim(),
      languages: languages.trim(),
      specialities: specialities.trim(),
      experienceYears: Number.isNaN(parsedExperience) ? 0 : parsedExperience,
    }

    try {
      if (isEditMode && faculty) {
        await updateFaculty(faculty.id, payload)
      } else {
        await createFaculty(payload)
      }

      showSnackbar(
        isEditMode
          ? 'Faculty updated successfully'
          : 'Faculty created successfully',
      )
      onSaved()
      onClose()
    } catch {
      const errorMessage = isEditMode
        ? 'Failed to update faculty. Please try again.'
        : 'Failed to create faculty. Please try again.'
      showSnackbar(errorMessage)
      setFormError(errorMessage)
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-[2px]"
      role="presentation"
    >
      <button
        type="button"
        aria-label={isEditMode ? 'Close edit faculty dialog' : 'Close add faculty dialog'}
        className="absolute inset-0 cursor-pointer bg-on-surface/40"
        onClick={handleClose}
        disabled={isSubmitting}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-faculty-modal-title"
        className="relative z-10 flex max-h-[90vh] w-full max-w-[672px] flex-col overflow-hidden rounded-xl bg-surface-white shadow-tier-2"
      >
        <div className="flex items-start justify-between border-b border-border-subtle bg-surface px-gutter py-5">
          <div className="flex flex-col gap-2 pr-4">
            <h2 id="edit-faculty-modal-title" className="text-h3 text-on-surface">
              {isEditMode ? 'Edit Faculty' : 'Add New Faculty'}
            </h2>
            <p className="text-body-md text-on-surface-variant">
              {isEditMode
                ? 'Update faculty profile details for the Ardent MDS Plus app'
                : 'Create a new faculty profile for the Ardent MDS Plus app'}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            aria-label="Close"
            className="cursor-pointer rounded-full p-2 transition hover:bg-row-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:opacity-60"
          >
            <MaterialIcon name="close" size={20} className="text-on-surface" />
          </button>
        </div>

        <form
          className="flex flex-col gap-gutter overflow-y-auto px-gutter py-gutter"
          onSubmit={(event) => {
            event.preventDefault()
            handleSave()
          }}
          noValidate
        >
          <div className="grid gap-gutter sm:grid-cols-2">
            <TextField
              id="faculty-first-name"
              label="First Name"
              value={firstName}
              disabled={isSubmitting}
              required
              error={firstNameError}
              onChange={(event) => {
                setFirstName(event.target.value)
                if (firstNameError) setFirstNameError(undefined)
              }}
            />
            <TextField
              id="faculty-last-name"
              label="Last Name"
              value={lastName}
              disabled={isSubmitting}
              required
              error={lastNameError}
              onChange={(event) => {
                setLastName(event.target.value)
                if (lastNameError) setLastNameError(undefined)
              }}
            />
          </div>

          <TextField
            id="faculty-display-name"
            label="Display Name"
            value={displayName}
            disabled={isSubmitting}
            onChange={(event) => setDisplayName(event.target.value)}
          />

          <div className="grid gap-gutter sm:grid-cols-2">
            <TextField
              id="faculty-email"
              label="Email"
              type="email"
              autoComplete="email"
              value={email}
              disabled={isSubmitting}
              required
              error={emailError}
              onChange={(event) => {
                setEmail(event.target.value)
                if (emailError) setEmailError(undefined)
              }}
            />
            <TextField
              id="faculty-phone"
              label="Phone"
              type="tel"
              autoComplete="tel"
              value={phoneNo}
              disabled={isSubmitting}
              onChange={(event) => setPhoneNo(event.target.value)}
            />
          </div>

          <div className="grid gap-gutter sm:grid-cols-2">
            <TextField
              id="faculty-title"
              label="Title"
              value={title}
              disabled={isSubmitting}
              onChange={(event) => setTitle(event.target.value)}
            />
            <TextField
              id="faculty-gender"
              label="Gender"
              value={gender}
              disabled={isSubmitting}
              onChange={(event) => setGender(event.target.value)}
            />
          </div>

          <div className="grid gap-gutter sm:grid-cols-2">
            <TextField
              id="faculty-languages"
              label="Languages"
              value={languages}
              disabled={isSubmitting}
              onChange={(event) => setLanguages(event.target.value)}
            />
            <TextField
              id="faculty-specialities"
              label="Specialities"
              value={specialities}
              disabled={isSubmitting}
              onChange={(event) => setSpecialities(event.target.value)}
            />
          </div>

          <TextField
            id="faculty-experience"
            label="Experience (years)"
            type="number"
            min={0}
            value={experienceYears}
            disabled={isSubmitting}
            onChange={(event) => setExperienceYears(event.target.value)}
          />

          <div className="flex w-full flex-col gap-1">
            <label htmlFor="faculty-bio" className="text-label-sm text-on-surface">
              Bio
              <span className="text-error-red" aria-hidden="true">
                {' '}
                *
              </span>
            </label>
            <textarea
              id="faculty-bio"
              value={bio}
              disabled={isSubmitting}
              required
              aria-invalid={bioError ? true : undefined}
              aria-describedby={bioError ? 'faculty-bio-error' : undefined}
              onChange={(event) => {
                setBio(event.target.value)
                if (bioError) setBioError(undefined)
              }}
              className={[
                textareaClasses,
                bioError ? 'border-error-red' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            />
            {bioError ? (
              <p id="faculty-bio-error" className="text-label-sm text-error-red" role="alert">
                {bioError}
              </p>
            ) : null}
          </div>

          {formError ? (
            <p className="text-label-sm text-error-red" role="alert">
              {formError}
            </p>
          ) : null}
        </form>

        <div className="flex items-center justify-end border-t border-border-subtle bg-surface-container-low px-gutter py-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Close
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isSubmitting}
            className="ml-4 shadow-tier-1"
          >
            {isSubmitting ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>
    </div>
  )
}
