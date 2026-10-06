import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../auth/useAuth';
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
import { Sidebar } from '../components/Sidebar/Sidebar';
import { Toolbar } from '../components/Toolbar/Toolbar';
import { UsersModal } from '../components/UsersModal/UsersModal';
import { useAssetMutations } from '../hooks/useAssetMutations';
import { useCatalogFacets, useCatalogItems, useCatalogs } from '../hooks/useCatalogData';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import type {
  Asset,
  AssetFiltersState,
  AssetFormMode,
  AssetInput,
  CatalogItemsQuery,
  CatalogMode,
  ViewMode,
} from '../types/asset';
import styles from './CatalogPage.module.scss';

const ASSETS_PAGE_SIZE = 28;
const NON_OBJECT_PAGE_SIZE = 40;
const CATALOG_STORAGE_KEY = 'catalogo-ativos.catalogId';

const EMPTY_ASSET_FILTERS: AssetFiltersState = { search: '', category: '', fixation: '', letter: '' };

interface FormModalState {
  mode: AssetFormMode;
  asset: Asset | null;
}

function readStoredCatalogId(): string | null {
  try {
    return window.localStorage.getItem(CATALOG_STORAGE_KEY);
  } catch {
    return null;
  }
}

function storeCatalogId(catalogId: string): void {
  try {
    window.localStorage.setItem(CATALOG_STORAGE_KEY, catalogId);
  } catch {
    // Sem localStorage (modo privado etc.): a escolha vale só para a sessão.
  }
}

export function CatalogPage() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const [usersModalOpen, setUsersModalOpen] = useState(false);

  const catalogs = useCatalogs();
  const [preferredCatalogId, setPreferredCatalogId] = useState(readStoredCatalogId);
  const catalogList = catalogs.data ?? [];
  // Se o catálogo guardado não existir mais, cai no primeiro da lista.
  const selectedCatalog = catalogList.find((catalog) => catalog.id === preferredCatalogId) ?? catalogList[0] ?? null;
  const catalogId = selectedCatalog?.id ?? null;

  const [mode, setMode] = useState<CatalogMode>('assets');
  const [view, setView] = useState<ViewMode>('grid');
  const [assetFilters, setAssetFilters] = useState<AssetFiltersState>(EMPTY_ASSET_FILTERS);
  const [nonObjectSearch, setNonObjectSearch] = useState('');
  const [assetsPage, setAssetsPage] = useState(1);
  const [nonObjectPage, setNonObjectPage] = useState(1);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [formModal, setFormModal] = useState<FormModalState | null>(null);

  const debouncedAssetSearch = useDebouncedValue(assetFilters.search.trim());
  const debouncedNonObjectSearch = useDebouncedValue(nonObjectSearch.trim());

  const assetsQuery: CatalogItemsQuery = {
    type: 'ASSET',
    page: assetsPage,
    pageSize: ASSETS_PAGE_SIZE,
    search: debouncedAssetSearch,
    categoria: assetFilters.category,
    fijacion: assetFilters.fixation,
    letter: assetFilters.letter,
  };
  const nonObjectQuery: CatalogItemsQuery = {
    type: 'NON_OBJECT',
    page: nonObjectPage,
    pageSize: NON_OBJECT_PAGE_SIZE,
    search: debouncedNonObjectSearch,
    letter: assetFilters.letter,
  };

  const facets = useCatalogFacets(catalogId);
  // Só a aba ativa busca; cada uma guarda seu último resultado ao alternar.
  const assetItems = useCatalogItems(mode === 'assets' ? catalogId : null, assetsQuery);
  const nonObjectItems = useCatalogItems(mode === 'non-object' ? catalogId : null, nonObjectQuery);
  const currentItems = mode === 'assets' ? assetItems : nonObjectItems;

  const {
    createAsset: submitCreateAsset,
    updateAsset: submitUpdateAsset,
    submitting: mutationSubmitting,
    error: mutationError,
    resetError: resetMutationError,
  } = useAssetMutations();

  const resetPages = () => {
    setAssetsPage(1);
    setNonObjectPage(1);
  };

  const updateAssetFilters = (patch: Partial<AssetFiltersState>) => {
    setAssetFilters((prev) => ({ ...prev, ...patch }));
    resetPages();
  };

  const handleCatalogChange = (nextCatalogId: string) => {
    setPreferredCatalogId(nextCatalogId);
    storeCatalogId(nextCatalogId);
    setAssetFilters(EMPTY_ASSET_FILTERS);
    setNonObjectSearch('');
    resetPages();
  };

  const handleModeChange = (nextMode: CatalogMode) => {
    setMode(nextMode);
    updateAssetFilters({ letter: '' });
  };

  const handleNonObjectSearchChange = (search: string) => {
    setNonObjectSearch(search);
    setNonObjectPage(1);
  };

  const handleClearNonObjectFilters = () => {
    handleNonObjectSearchChange('');
    updateAssetFilters({ letter: '' });
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
    if (!formModal || !catalogId) return;
    try {
      if (formModal.mode === 'edit' && formModal.asset) {
        await submitUpdateAsset(catalogId, formModal.asset.id, input);
      } else {
        await submitCreateAsset(catalogId, input);
      }
    } catch {
      // O erro já está em `mutationError` e é exibido no próprio formulário.
      return;
    }
    setFormModal(null);
    assetItems.reload();
    facets.reload();
  };

  const renderResults = () => {
    if (catalogs.error && !catalogs.data) return <StatusMessage message={t('status.error')} tone="error" />;
    if (!catalogs.data) return <StatusMessage message={t('status.loading')} tone="loading" />;
    if (!selectedCatalog) return <EmptyState message={t('catalog.empty')} />;
    if (!currentItems.data) {
      return currentItems.error ? (
        <StatusMessage message={t('status.error')} tone="error" />
      ) : (
        <StatusMessage message={t('status.loading')} tone="loading" />
      );
    }

    const { data: items, meta } = currentItems.data;
    const resultsClassName = `${styles['catalog-page__results']} ${
      currentItems.loading ? styles['catalog-page__results--refreshing'] : ''
    }`;

    return (
      <>
        {currentItems.error && <StatusMessage message={t('status.error')} tone="error" />}
        <ResultsSummary
          mode={mode}
          count={meta.total}
          view={view}
          onViewChange={setView}
          onAddAsset={openCreateModal}
        />
        <div className={resultsClassName} aria-busy={currentItems.loading}>
          {items.length === 0 ? (
            <EmptyState message={mode === 'assets' ? t('results.emptyAssets') : t('results.emptyNonObject')} />
          ) : mode === 'non-object' ? (
            <NonObjectGrid items={items} />
          ) : view === 'grid' ? (
            <AssetGrid assets={items} query={assetFilters.search} onSelect={setSelectedAsset} />
          ) : (
            <AssetList assets={items} onSelect={setSelectedAsset} />
          )}
        </div>
        <Pagination
          page={meta.page}
          maxPage={meta.totalPages}
          onChange={mode === 'assets' ? setAssetsPage : setNonObjectPage}
        />
      </>
    );
  };

  return (
    <>
      <Sidebar
        catalogs={catalogList}
        selectedCatalogId={catalogId}
        onCatalogChange={handleCatalogChange}
        user={user}
        onManageUsers={() => setUsersModalOpen(true)}
        onLogout={logout}
      />
      <div className={styles['catalog-page__content']}>
        <main className="shell">
          <HeroSection
            assetsCount={facets.data?.counts.assets ?? 0}
            categoriesCount={facets.data?.categories.length ?? 0}
            fixationsCount={facets.data?.fixations.length ?? 0}
            nonObjectCount={facets.data?.counts.nonObjects ?? 0}
          />

          <Toolbar
            mode={mode}
            onModeChange={handleModeChange}
            assetFilters={assetFilters}
            categories={facets.data?.categories ?? []}
            fixations={facets.data?.fixations ?? []}
            onAssetSearchChange={(search) => updateAssetFilters({ search })}
            onCategoryChange={(category) => updateAssetFilters({ category })}
            onFixationChange={(fixation) => updateAssetFilters({ fixation })}
            onClearAssetFilters={() => updateAssetFilters(EMPTY_ASSET_FILTERS)}
            nonObjectSearch={nonObjectSearch}
            onNonObjectSearchChange={handleNonObjectSearchChange}
            onClearNonObjectFilters={handleClearNonObjectFilters}
            activeLetter={assetFilters.letter}
            onLetterChange={(letter) => updateAssetFilters({ letter })}
          />

          {renderResults()}

          <Footer />
        </main>
      </div>

      <AssetDetailModal asset={selectedAsset} onClose={() => setSelectedAsset(null)} onEdit={openEditModal} />

      {formModal && (
        <AssetFormModal
          mode={formModal.mode}
          initialValue={formModal.asset}
          categories={facets.data?.categories ?? []}
          fixations={facets.data?.fixations ?? []}
          submitting={mutationSubmitting}
          submitError={mutationError ? t('form.genericError') : null}
          onSubmit={handleFormSubmit}
          onClose={closeFormModal}
        />
      )}

      {usersModalOpen && user?.isAdmin && <UsersModal onClose={() => setUsersModalOpen(false)} />}
    </>
  );
}
