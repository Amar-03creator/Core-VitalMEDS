import { useState, useEffect, useRef } from 'react';
import { Package, Search, Plus, Printer, Download, Filter, XCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { api } from '../../services/api';
import { toast } from 'sonner';
import { Skeleton } from '../../components/ui/skeleton'; // Ensure this path is correct

// Extracted Components
import { FilterModal } from '../../features/Admin/ProductsPage/modals/FilterModal';
import { ExportModal } from '../../features/Admin/ProductsPage/modals/ExportModal';
import { ProductCard } from '../../features/Admin/ProductsPage/components/ProductCard';
import { AddProductModal } from '../../modals/AddProductModal';

// Shadcn Skeleton Layout
const ProductCardSkeleton = () => (
  <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-3 shadow-sm flex items-start gap-4">
    <Skeleton className="w-12 h-12 rounded-xl shrink-0 bg-slate-200" />
    <div className="flex-1 space-y-3 py-1">
      <Skeleton className="h-5 w-3/4 rounded-lg bg-slate-200" />
      <Skeleton className="h-4 w-1/2 rounded-lg bg-slate-200" />
    </div>
    <div className="w-16 flex flex-col items-end gap-2 py-1 shrink-0">
      <Skeleton className="h-7 w-full rounded-lg bg-slate-200" />
      <Skeleton className="h-3 w-3/4 mt-1 rounded-lg bg-slate-200" />
    </div>
  </div>
);

const ProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [stats, setStats] = useState({ total: 0, lowStock: 0, outStock: 0, categories: 0 });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState(() => {
    const saved = sessionStorage.getItem('vitalMedsProductFilters');
    return saved ? JSON.parse(saved) : { category: 'All', gstRate: 'All', type: 'All', company: 'All' };
  });

  // Pagination State
  // ✨ URL-based Pagination State
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get('page') || '1', 10);

  // A drop-in replacement for setPage that updates the URL instead of local RAM
  const setPage = (updater) => {
    const newPage = typeof updater === 'function' ? updater(page) : updater;
    setSearchParams(prev => {
      if (newPage === 1) prev.delete('page'); // Keeps the URL clean on page 1
      else prev.set('page', newPage);
      return prev;
    });
  };
  const [totalPages, setTotalPages] = useState(1);
  const [pageInput, setPageInput] = useState('1'); // Controls the editable input box

  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(() => {
    return !!sessionStorage.getItem('addProductForm');
  });
  const [editProduct, setEditProduct] = useState(null);

  // Keep input box synced and auto-scroll to top on page change
  useEffect(() => {
    setPageInput(String(page));

    // A tiny delay ensures React has painted the new items, 
    // so the browser actually knows HOW to scroll up!
    const timer = setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    }, 50);

    return () => clearTimeout(timer);
  }, [page]);

  // Fetch logic
  const loadProducts = async () => {
    // ONLY show skeletons if we are doing a fresh search or initial load (Page 1)
    if (page === 1) {
      setLoading(true);
    }

    try {
      const res = await api.getProducts({
        search,
        category: filters.category,
        gstRate: filters.gstRate,
        type: filters.type,
        company: filters.company,
        page,
        limit: 15
      });

      const fetchedProducts = res.data || [];
      setProducts(fetchedProducts);
      setTotalPages(res.totalPages || 1);

      setStats({
        total: res.total || 0,
        lowStock: fetchedProducts.filter(p => p.totalStock > 0 && p.totalStock <= (p.lowStockThreshold || 0)).length,
        outStock: fetchedProducts.filter(p => p.totalStock === 0).length,
        categories: 12
      });
    } catch (error) {
      console.error(error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    sessionStorage.setItem('vitalMedsProductFilters', JSON.stringify(filters));
  }, [filters]);

  // ✨ Safely track if dependencies ACTUALLY changed to avoid React 18 Strict Mode bugs
  const prevSearch = useRef(search);
  const prevFilters = useRef(filters);

  useEffect(() => {
    // Only reset page if the search string or filter object ACTUALLY changed
    if (prevSearch.current === search && prevFilters.current === filters) {
      return;
    }
    prevSearch.current = search;
    prevFilters.current = filters;

    setPage(1); // Reset to page 1 ONLY on new searches/filters
  }, [search, filters]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadProducts();
    }, 300);
    return () => clearTimeout(timer);
  }, [page, search, filters]);

  const clearFilters = () => {
    setFilters({ category: 'All', gstRate: 'All', type: 'All', company: 'All' });
    setSearch('');
    setPage(1);
  };

  const handleModalSave = () => {
    setIsAddModalOpen(false);
    loadProducts();
  };

  // --- Pagination Input Handlers ---
  const handlePageSubmit = () => {
    const parsed = parseInt(pageInput, 10);

    // Validation
    if (isNaN(parsed) || parsed < 1 || parsed > totalPages) {
      toast.error(`Please enter a valid page between 1 and ${totalPages}`);
      setPageInput(String(page)); // Revert to the current active page
      return;
    }

    // If valid and different, trigger the page change
    if (parsed !== page) {
      setPage(parsed);
    }
  };

  const handlePageKeyDown = (e) => {
    if (e.key === 'Enter') {
      handlePageSubmit();
    }
  };

  /* ── EXPORT STATE & PDF GENERATOR ── */
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportAction, setExportAction] = useState('print');
  const [exportCompanies, setExportCompanies] = useState([]);
  const [exportData, setExportData] = useState([]);

  const openExportModal = async (action) => {
    try {
      const response = await api.getProductsWithBatches();
      const enrichedProducts = response.data || [];

      if (enrichedProducts.length === 0) {
        toast.error("No products available to export.");
        return;
      }

      const uniqueCompanies = [...new Set(enrichedProducts.map(p => p.company))].sort();

      setExportData(enrichedProducts);
      setExportCompanies(uniqueCompanies);
      setExportAction(action);
      setIsExportModalOpen(true);
    } catch (err) {
      toast.error("Failed to fetch product data for export.");
    }
  };

  const handleExecuteExport = (selectedCompanies, action) => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Distributor Price List", 14, 15);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 22);

    let currentY = 28;

    selectedCompanies.sort().forEach(company => {
      const companyProducts = exportData.filter(p => p.company === company);
      if (companyProducts.length === 0) return;

      if (currentY > doc.internal.pageSize.getHeight() - 25) {
        doc.addPage();
        currentY = 20;
      }

      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text(company, 14, currentY);
      currentY += 4;

      const tableRows = companyProducts.map(p => {
        const compStr = p.compositions?.length > 0 ? p.compositions.join(', ') : 'N/A';
        const latestMrp = p.batches?.length > 0 ? p.batches[p.batches.length - 1].mrp : 'N/A';

        return [
          p.name,
          p.packing,
          compStr,
          latestMrp !== 'N/A' ? `Rs. ${latestMrp}` : 'N/A'
        ];
      });

      autoTable(doc, {
        head: [["Medicine Name", "Packing", "Composition", "MRP"]],
        body: tableRows,
        startY: currentY,
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold' },
        columnStyles: {
          0: { cellWidth: 40 },
          1: { cellWidth: 25 },
          2: { cellWidth: 'auto' },
          3: { cellWidth: 25, halign: 'right' }
        },
        margin: { bottom: 15 }
      });

      currentY = doc.lastAutoTable.finalY + 10;
    });

    if (action === 'print') {
      doc.autoPrint();
      window.open(doc.output('bloburl'), '_blank');
    } else {
      doc.save("VitalMEDS_Price_List.pdf");
    }
  };

  const openEdit = (product) => {
    setEditProduct(product);
    setIsAddModalOpen(true);
  };

  return (
    <div className="px-4 py-4 space-y-4 max-w-2xl mx-auto bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-slate-900 text-2xl font-black tracking-tight">Catalog</h1>
          <p className="text-slate-500 text-xs font-medium">Master Product Directory</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => openExportModal('print')} className="p-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl shadow-sm hover:bg-slate-50">
            <Printer size={18} />
          </button>
          <button onClick={() => openExportModal('download')} className="p-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl shadow-sm hover:bg-slate-50">
            <Download size={18} />
          </button>
          <button onClick={() => { setEditProduct(null); setIsAddModalOpen(true); }} className="flex items-center gap-1.5 bg-slate-900 text-white text-sm font-bold px-4 py-2.5 rounded-xl shadow-sm hover:bg-slate-800">
            <Plus size={16} /> Add
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-4 gap-2">
        <div className="rounded-2xl p-3 border bg-white border-slate-200 text-center shadow-sm">
          <p className="text-xl font-black text-slate-800">{stats.total}</p>
          <p className="text-[10px] font-bold text-slate-400 uppercase">Products</p>
        </div>
        <div className="rounded-2xl p-3 border bg-amber-50 border-amber-200 text-center">
          <p className="text-xl font-black text-amber-700">{stats.lowStock}</p>
          <p className="text-[10px] font-bold text-amber-600 uppercase">Low Stock</p>
        </div>
        <div className="rounded-2xl p-3 border bg-red-50 border-red-200 text-center">
          <p className="text-xl font-black text-red-700">{stats.outStock}</p>
          <p className="text-[10px] font-bold text-red-600 uppercase">Out</p>
        </div>
        <div className="rounded-2xl p-3 border bg-blue-50 border-blue-200 text-center">
          <p className="text-xl font-black text-blue-700">{stats.categories}</p>
          <p className="text-[10px] font-bold text-blue-600 uppercase">Categories</p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex gap-2">
        <div className="flex-1 flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-3 shadow-sm">
          <Search size={18} className="text-slate-400 shrink-0" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search catalog..."
            className="flex-1 text-sm text-slate-800 placeholder-slate-400 bg-transparent outline-none font-medium"
          />
        </div>
        <button onClick={() => setIsFilterModalOpen(true)} className="px-3.5 bg-white border border-slate-200 text-slate-700 rounded-xl shadow-sm flex items-center">
          <Filter size={18} />
        </button>
      </div>

      {/* Active Filters Bar */}
      {(filters.category !== 'All' || filters.gstRate !== 'All' || filters.type !== 'All' || filters.company !== 'All' || search !== '') && (
        <div className="flex items-center justify-between bg-slate-200/50 rounded-xl px-3 py-2">
          <span className="text-xs font-semibold text-slate-600">Filters Active</span>
          <button onClick={clearFilters} className="flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-red-600 transition-colors">
            <XCircle size={14} /> Clear All
          </button>
        </div>
      )}

      {/* Data List & Pagination */}
      <div className="pb-20">
        {loading ? (
          <>
            <ProductCardSkeleton />
            <ProductCardSkeleton />
            <ProductCardSkeleton />
            <ProductCardSkeleton />
          </>
        ) : products.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <Package className="mx-auto mb-3 opacity-50" size={40} />
            <p className="text-sm font-medium">No products found in Master Catalog</p>
          </div>
        ) : (
          <div className={`space-y-3 transition-opacity duration-200 ${loading && page > 1 ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
            {products.map((p, index) => (
              /* ✨ Animate each card individually with a staggered delay */
              <div 
                key={p._id || p.id} 
                className="animate-fadeSlideUp"
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <ProductCard product={p} onEdit={openEdit} />
              </div>
            ))}
          </div>
        )}

        {/* New Pagination Control Bar */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 bg-white border border-slate-200 rounded-2xl p-2 shadow-sm">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex items-center gap-1 px-4 py-2.5 text-sm font-bold text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft size={18} /> Prev
            </button>

            <div className="flex items-center gap-2 text-sm font-bold text-slate-600">
              <input
                value={pageInput}
                onChange={(e) => setPageInput(e.target.value)}
                onBlur={handlePageSubmit}
                onKeyDown={handlePageKeyDown}
                className="w-14 text-center bg-slate-50 border border-slate-200 rounded-lg py-1.5 text-base focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-all"
              />
              <span className="text-slate-400">/</span>
              <span>{totalPages}</span>
            </div>

            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="flex items-center gap-1 px-4 py-2.5 text-sm font-bold text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 disabled:opacity-40 transition-colors"
            >
              Next <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeSlideUp {
          animation: fadeSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
      `}</style>

      <FilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        filters={filters}
        setFilters={setFilters}
      />

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        availableCompanies={exportCompanies}
        actionType={exportAction}
        onExport={handleExecuteExport}
      />

      {isAddModalOpen && (
        <AddProductModal
          productToEdit={editProduct}
          onClose={() => setIsAddModalOpen(false)}
          onSave={handleModalSave}
        />
      )}
    </div>
  );
};

export default ProductsPage;