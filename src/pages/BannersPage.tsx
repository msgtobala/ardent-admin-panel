import { useState } from 'react'
import { AddBannerModal } from '@/components/banners/AddBannerModal'
import { DeleteBannerModal } from '@/components/banners/DeleteBannerModal'
import { BannersPageHeader } from '@/components/banners/BannersPageHeader'
import { BannersTable } from '@/components/banners/BannersTable'
import { useSnackbar } from '@/contexts/SnackbarContext'
import { useBanners } from '@/hooks/useBanners'
import { ACTIVE_BANNER_DELETE_MESSAGE } from '@/lib/banners'
import type { Banner } from '@/types/banner'

type BannerModalState =
  | { mode: 'add' }
  | { mode: 'edit'; banner: Banner }
  | { mode: 'delete'; banner: Banner }
  | null

export default function BannersPage() {
  const { showSnackbar } = useSnackbar()
  const [modalState, setModalState] = useState<BannerModalState>(null)
  const {
    banners,
    currentPage,
    totalPages,
    isLoading,
    isInitialLoading,
    isPageLoading,
    error,
    hasNext,
    hasPrevious,
    sortField,
    sortDirection,
    handleSort,
    handleNext,
    handlePrevious,
    handleRetry,
    handleToggleIsActive,
    handleDelete,
    refreshBanners,
  } = useBanners()

  function handleNewBanner() {
    setModalState({ mode: 'add' })
  }

  function handleEditBanner(banner: Banner) {
    setModalState({ mode: 'edit', banner })
  }

  function handleDeleteBanner(banner: Banner) {
    if (banner.isActive) {
      showSnackbar(ACTIVE_BANNER_DELETE_MESSAGE)
      return
    }

    setModalState({ mode: 'delete', banner })
  }

  function handleCloseModal() {
    setModalState(null)
  }

  function handleBannerSaved() {
    refreshBanners()
  }

  async function handleConfirmDelete() {
    if (modalState?.mode !== 'delete') return
    await handleDelete(modalState.banner.id)
  }

  const isFormModalOpen =
    modalState?.mode === 'add' || modalState?.mode === 'edit'
  const editingBanner =
    modalState?.mode === 'edit' ? modalState.banner : null
  const deletingBanner =
    modalState?.mode === 'delete' ? modalState.banner : null

  return (
    <div className="flex flex-col gap-gutter">
      <BannersPageHeader onNewBanner={handleNewBanner} />
      <BannersTable
        banners={banners}
        currentPage={currentPage}
        totalPages={totalPages}
        isLoading={isLoading}
        isInitialLoading={isInitialLoading}
        isPageLoading={isPageLoading}
        error={error}
        hasNext={hasNext}
        hasPrevious={hasPrevious}
        sortField={sortField}
        sortDirection={sortDirection}
        onSort={handleSort}
        onNext={handleNext}
        onPrevious={handlePrevious}
        onRetry={handleRetry}
        onToggleIsActive={handleToggleIsActive}
        onEdit={handleEditBanner}
        onDelete={handleDeleteBanner}
      />
      <AddBannerModal
        key={
          modalState === null
            ? 'closed'
            : modalState.mode === 'edit'
              ? `edit-${modalState.banner.id}`
              : modalState.mode === 'add'
                ? 'add'
                : 'closed'
        }
        isOpen={isFormModalOpen}
        banner={editingBanner}
        onClose={handleCloseModal}
        onSaved={handleBannerSaved}
      />
      <DeleteBannerModal
        isOpen={deletingBanner !== null}
        banner={deletingBanner}
        onClose={handleCloseModal}
        onConfirm={handleConfirmDelete}
      />
    </div>
  )
}
