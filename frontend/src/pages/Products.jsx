import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import SearchBar from '../components/SearchBar';
import ProductCard from '../components/ProductCard';
import { getProducts } from '../services/productService';
import { getWishlist } from '../services/wishlistService';

/**
 * Products Page (Lab 03 & Lab 04)
 * Route: /products
 *
 * Fetches products dynamically from GET /products.
 * Supports server-side search, category filtering, and sorting.
 * Tracks wishlist state for authenticated customers.
 */
function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Search, filter, and sorting state
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('');

  // Wishlist item IDs set for fast O(1) lookup
  const [wishlistIds, setWishlistIds] = useState(new Set());
  const [wishlistCount, setWishlistCount] = useState(0);

  // Categories list
  const availableCategories = ['Electronics', 'Fashion', 'Books', 'Home'];

  // Load wishlist once on mount
  useEffect(() => {
    let isSubscribed = true;
    getWishlist()
      .then((data) => {
        if (isSubscribed && data?.wishlist) {
          const idSet = new Set(data.wishlist.map((item) => (item._id || item).toString()));
          setWishlistIds(idSet);
          setWishlistCount(data.count ?? idSet.size);
        }
      })
      .catch(() => {
        // Unauthenticated users will get 401; fail silently
      });

    return () => {
      isSubscribed = false;
    };
  }, []);

  // Fetch Products based on current filters
  useEffect(() => {
    let isSubscribed = true;

    const timer = setTimeout(async () => {
      try {
        const params = {};
        if (search.trim()) {
          params.search = search.trim();
        }
        if (category.trim() && category.trim().toLowerCase() !== 'all categories') {
          params.category = category.trim();
        }
        if (sort.trim()) {
          params.sort = sort.trim();
        }

        const data = await getProducts(params);
        if (isSubscribed) {
          setProducts(data.products || []);
          setError('');
          setLoading(false);
        }
      } catch (err) {
        console.error('Failed to load products:', err);
        if (isSubscribed) {
          setError('Something went wrong while loading products.');
          setLoading(false);
        }
      }
    }, 250);

    return () => {
      isSubscribed = false;
      clearTimeout(timer);
    };
  }, [search, category, sort]);

  const handleSearchChange = (val) => {
    setLoading(true);
    setSearch(val);
  };

  const handleCategoryChange = (val) => {
    setLoading(true);
    setCategory(val);
  };

  const handleSortChange = (val) => {
    setLoading(true);
    setSort(val);
  };

  const handleManualRefresh = () => {
    setLoading(true);
    const params = {};
    if (search.trim()) params.search = search.trim();
    if (category.trim() && category.trim().toLowerCase() !== 'all categories') {
      params.category = category.trim();
    }
    if (sort.trim()) params.sort = sort.trim();

    getProducts(params)
      .then((data) => {
        setProducts(data.products || []);
        setError('');
      })
      .catch((err) => {
        console.error('Manual refresh failed:', err);
        setError('Something went wrong while loading products.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  // Handler for wishlist changes within ProductCard
  const handleWishlistChange = (productId, isAdded) => {
    setWishlistIds((prev) => {
      const next = new Set(prev);
      if (isAdded) {
        next.add(productId.toString());
      } else {
        next.delete(productId.toString());
      }
      setWishlistCount(next.size);
      return next;
    });
  };

  return (
    <div className="page-wrapper">
      <Navbar wishlistCount={wishlistCount} />

      <main className="main-content">
        <div className="catalog-container">
          {/* Page Header */}
          <div className="catalog-header">
            <h1 className="catalog-title">Explore Our Products</h1>
            <p className="catalog-subtitle">
              Discover quality gadgets, fashion, home essentials, and books at great prices.
            </p>
          </div>

          {/* Search, Category Filter & Sort UI */}
          <SearchBar
            search={search}
            setSearch={handleSearchChange}
            category={category}
            setCategory={handleCategoryChange}
            sort={sort}
            setSort={handleSortChange}
            categories={availableCategories}
            onSearchSubmit={handleManualRefresh}
          />

          {/* Catalog State Management */}
          {loading ? (
            <div className="catalog-state-box">
              <div className="spinner-large"></div>
              <p className="state-message">Loading products...</p>
            </div>
          ) : error ? (
            <div className="catalog-state-box error-state">
              <span className="state-icon">⚠️</span>
              <p className="state-message">{error}</p>
              <button
                type="button"
                className="btn btn-primary btn-sm retry-btn"
                onClick={handleManualRefresh}
              >
                Try Again
              </button>
            </div>
          ) : products.length === 0 ? (
            <div className="catalog-state-box empty-state">
              <span className="state-icon">📦</span>
              <h2 className="empty-title">No products found.</h2>
              <p className="empty-description">
                {search || category
                  ? 'Try adjusting your search terms or clearing category filters.'
                  : 'Check back soon for new arrivals.'}
              </p>
              {(search || category) && (
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => {
                    handleSearchChange('');
                    handleCategoryChange('');
                    handleSortChange('');
                  }}
                >
                  Clear All Filters
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="catalog-results-info">
                <span>
                  Showing <strong>{products.length}</strong> {products.length === 1 ? 'product' : 'products'}
                  {category ? ` in "${category}"` : ''}
                  {search ? ` matching "${search}"` : ''}
                </span>
              </div>

              {/* Dynamic Product Grid */}
              <div className="product-grid">
                {products.map((product) => (
                  <ProductCard
                    key={product._id}
                    product={product}
                    isWishlisted={wishlistIds.has(product._id.toString())}
                    onWishlistChange={handleWishlistChange}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default Products;
