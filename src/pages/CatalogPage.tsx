import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AssetDetailModal } from '../components/AssetDetailModal/AssetDetailModal';
import { AssetFormModal } from '../components/AssetFormModal/AssetFormModal';
import { AssetGrid } from '../components/AssetGrid/AssetGrid';
import { AssetList } from '../components/AssetList/AssetList';
import { EmptyState } from '../components/common/EmptyState';
import { StatusMessage } from '../components/common/StatusMessage';
import { Footer } from '../components/Footer';
import { HeroSection } from '../components/HeroSection/HeroSection';
import { NonObjectGrid } from '../components/NonObjectGrid/NonObjectGrid';
import { Pagination } from '../components/Pagination/Pagination';
import { ResultsSummary } from '../components/ResultsSummary';
import { Toolbar } from '../components/Toolbar/Toolbar';
import { Topbar } from '../components/Topbar/Topbar';
import { useAssetMutations } from '../hooks/useAssetMutations';
import { useAssetOptions } from '../hooks/useAssetOptions';
import { useAssets } from '../hooks/useAssets';
import { useFilteredAssets, useFilteredNonObjectItems } from '../hooks/useFilteredCatalog';
import { useNonObjectItems } from '../hooks/useNonObjectItems';
import { usePagination } from '../hooks/usePagination';
import type { Asset, AssetFiltersState, AssetFormMode, AssetInput, CatalogMode, ViewMode } from '../types/asset';

const ASSETS_PAGE_SIZE = 28;
const NON_OBJECT_PAGE_SIZE = 40;

const EMPTY_ASSET_FILTERS: AssetFiltersState = { search: '', category: '', fixation: '', letter: '' };

interface FormModalState {
  mode: AssetFormMode;
  asset: Asset | null;
}

export function CatalogPage() {
  const { t } = useTranslation();

  const { data: fetchedAssets, loading: assetsLoading, error: assetsError } = useAssets();
  const {
    data: nonObjectItems,
    loading: nonObjectLoading,
    error: nonObjectError,
  } = useNonObjectItems();

  // Ativos criados/editados nesta sessão, sobrepostos aos dados buscados.
  // Ainda não há backend nem persistência real — ver
  // `src/services/assetService.ts` — então isso dura só a sessão atual
  // (recarregar a página volta ao dataset original).
  const [sessionCreatedAssets, setSessionCreatedAssets] = useState<Asset[]>([]);
  const [sessionUpdatedById, setSessionUpdatedById] = useState<Record<string, Asset>>({});

  const assets = useMemo(() => {
    const applyOverride = (asset: Asset) => sessionUpdatedById[asset.id] ?? asset;
    const base = fetchedAssets ?? [];
    return [...sessionCreatedAssets.map(applyOverride), ...base.map(applyOverride)];
  }, [fetchedAssets, sessionCreatedAssets, sessionUpdatedById]);

  const [mode, setMode] = useState<CatalogMode>('assets');
  const [view, setView] = useState<ViewMode>('grid');
  const [assetFilters, setAssetFilters] = useState<AssetFiltersState>(EMPTY_ASSET_FILTERS);
  const [nonObjectSearch, setNonObjectSearch] = useState('');
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [formModal, setFormModal] = useState<FormModalState | null>(null);

  const safeNonObjectItems = useMemo(() => nonObjectItems ?? [], [nonObjectItems]);

  const { categories, fixations } = useAssetOptions(assets);

  const filteredAssets = useFilteredAssets(assets, assetFilters);
  const filteredNonObjectItems = useFilteredNonObjectItems(safeNonObjectItems, {
    search: nonObjectSearch,
    letter: assetFilters.letter,
  });

  const assetsResetKey = `${mode}|${assetFilters.search}|${assetFilters.category}|${assetFilters.fixation}|${assetFilters.letter}`;
  const nonObjectResetKey = `${mode}|${nonObjectSearch}|${assetFilters.letter}`;

  const assetsPagination = usePagination(filteredAssets, ASSETS_PAGE_SIZE, assetsResetKey);
  const nonObjectPagination = usePagination(filteredNonObjectItems, NON_OBJECT_PAGE_SIZE, nonObjectResetKey);

  const {
    createAsset: submitCreateAsset,
    updateAsset: submitUpdateAsset,
    submitting: mutationSubmitting,
    error: mutationError,
    resetError: resetMutationError,
  } = useAssetMutations();

  const handleModeChange = (nextMode: CatalogMode) => {
    setMode(nextMode);
    setAssetFilters((prev) => ({ ...prev, letter: '' }));
  };

  const handleLetterChange = (letter: string) => {
    setAssetFilters((prev) => ({ ...prev, letter }));
  };

  const handleClearAssetFilters = () => {
    setAssetFilters(EMPTY_ASSET_FILTERS);
  };

  const handleClearNonObjectFilters = () => {
    setNonObjectSearch('');
    setAssetFilters((prev) => ({ ...prev, letter: '' }));
  };

  const openCreateModal = () => {
    resetMutationError();
    setFormModal({ mode: 'create', asset: null });
  };

  const openEditModal = (asset: Asset) => {
    resetMutationError();
    setSelectedAsset(null);
    setFormModal({ mode: 'edit', asset });
  };

  const closeFormModal = () => {
    setFormModal(null);
    resetMutationError();
  };

  const handleFormSubmit = async (input: AssetInput) => {
    if (!formModal) return;
    if (formModal.mode === 'edit' && formModal.asset) {
      const updated = await submitUpdateAsset(formModal.asset.id, input);
      setSessionUpdatedById((prev) => ({ ...prev, [updated.id]: updated }));
    } else {
      const created = await submitCreateAsset(input);
      setSessionCreatedAssets((prev) => [created, ...prev]);
    }
    setFormModal(null);
  };

  const isLoading = mode === 'assets' ? assetsLoading : nonObjectLoading;
  const error = mode === 'assets' ? assetsError : nonObjectError;

  return (
    <>
      <Topbar />
      <main className="shell">
        <HeroSection
          assetsCount={assets.length}
          categoriesCount={categories.length}
          fixationsCount={fixations.length}
          nonObjectCount={safeNonObjectItems.length}
        />

        <Toolbar
          mode={mode}
          onModeChange={handleModeChange}
          assetFilters={assetFilters}
          categories={categories}
          fixations={fixations}
          onAssetSearchChange={(search) => setAssetFilters((prev) => ({ ...prev, search }))}
          onCategoryChange={(category) => setAssetFilters((prev) => ({ ...prev, category }))}
          onFixationChange={(fixation) => setAssetFilters((prev) => ({ ...prev, fixation }))}
          onClearAssetFilters={handleClearAssetFilters}
          nonObjectSearch={nonObjectSearch}
          onNonObjectSearchChange={setNonObjectSearch}
          onClearNonObjectFilters={handleClearNonObjectFilters}
          activeLetter={assetFilters.letter}
          onLetterChange={handleLetterChange}
        />

        {isLoading && <StatusMessage message={t('status.loading')} tone="loading" />}
        {!isLoading && error && <StatusMessage message={t('status.error')} tone="error" />}

        {!isLoading && !error && mode === 'assets' && (
          <>
            <ResultsSummary
              mode="assets"
              count={filteredAssets.length}
              view={view}
              onViewChange={setView}
              onAddAsset={openCreateModal}
            />
            {filteredAssets.length === 0 ? (
              <EmptyState message={t('results.emptyAssets')} />
            ) : view === 'grid' ? (
              <AssetGrid
                assets={assetsPagination.pageItems}
                query={assetFilters.search}
                onSelect={setSelectedAsset}
              />
            ) : (
              <AssetList assets={assetsPagination.pageItems} onSelect={setSelectedAsset} />
            )}
            <Pagination
              page={assetsPagination.page}
              maxPage={assetsPagination.maxPage}
              onChange={assetsPagination.goToPage}
            />
          </>
        )}

        {!isLoading && !error && mode === 'non-object' && (
          <>
            <ResultsSummary
              mode="non-object"
              count={filteredNonObjectItems.length}
              view={view}
              onViewChange={setView}
              onAddAsset={openCreateModal}
            />
            {filteredNonObjectItems.length === 0 ? (
              <EmptyState message={t('results.emptyNonObject')} />
            ) : (
              <NonObjectGrid items={nonObjectPagination.pageItems} />
            )}
            <Pagination
              page={nonObjectPagination.page}
              maxPage={nonObjectPagination.maxPage}
              onChange={nonObjectPagination.goToPage}
            />
          </>
        )}

        <Footer />
      </main>

      <AssetDetailModal asset={selectedAsset} onClose={() => setSelectedAsset(null)} onEdit={openEditModal} />

      {formModal && (
        <AssetFormModal
          mode={formModal.mode}
          initialValue={formModal.asset}
          categories={categories}
          fixations={fixations}
          submitting={mutationSubmitting}
          submitError={mutationError ? t('form.genericError') : null}
          onSubmit={handleFormSubmit}
          onClose={closeFormModal}
        />
      )}
    </>
  );
}
