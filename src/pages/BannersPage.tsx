import { useState } from 'react'
import { AddBannerModal } from '@/components/banners/AddBannerModal'
import { BannersPageHeader } from '@/components/banners/BannersPageHeader'
import { BannersTable } from '@/components/banners/BannersTable'
import { useBanners } from '@/hooks/useBanners'
import type { Banner } from '@/types/banner'

type BannerModalState =
  | { mode: 'add' }
  | { mode: 'edit'; banner: Banner }
  | null

export default function BannersPage() {
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
    refreshBanners,
  } = useBanners()

  function handleNewBanner() {
    setModalState({ mode: 'add' })
  }

  function handleEditBanner(banner: Banner) {
    setModalState({ mode: 'edit', banner })
  }

  function handleCloseModal() {
    setModalState(null)
  }

  function handleBannerSaved() {
    refreshBanners()
  }

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
      />
      <AddBannerModal
        key={
          modalState === null
            ? 'closed'
            : modalState.mode === 'edit'
              ? `edit-${modalState.banner.id}`
              : 'add'
        }
        isOpen={modalState !== null}
        banner={modalState?.mode === 'edit' ? modalState.banner : null}
        onClose={handleCloseModal}
        onSaved={handleBannerSaved}
      />
    </div>
  )
}
