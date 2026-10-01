/**
 * SearchBar Component
 * Provides Search Input, Category Filter, and Sorting options for Lab 03.
 */
function SearchBar({
  search,
  setSearch,
  category,
  setCategory,
  sort,
  setSort,
  categories = ['Electronics', 'Fashion', 'Books', 'Home'],
  onSearchSubmit,
}) {
  const handleSearchChange = (e) => {
    setSearch(e.target.value);
  };

  const handleCategoryChange = (e) => {
    setCategory(e.target.value);
  };

  const handleSortChange = (e) => {
    setSort(e.target.value);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (onSearchSubmit) {
      onSearchSubmit();
    }
  };

  const handleReset = () => {
    setSearch('');
    setCategory('');
    setSort('');
  };

  const hasActiveFilters = Boolean(search || category || sort);

  return (
    <div className="search-filter-card">
      <form onSubmit={handleFormSubmit} className="search-filter-form">
        {/* Search Input */}
        <div className="search-input-wrapper">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="search-input"
            placeholder="Search products..."
            value={search}
            onChange={handleSearchChange}
            aria-label="Search products"
          />
          {search && (
            <button
              type="button"
              className="clear-search-btn"
              onClick={() => setSearch('')}
              title="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        {/* Category Dropdown */}
        <div className="filter-select-wrapper">
          <select
            className="filter-select"
            value={category}
            onChange={handleCategoryChange}
            aria-label="Filter by category"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Sort Dropdown (Bonus) */}
        <div className="filter-select-wrapper">
          <select
            className="filter-select"
            value={sort}
            onChange={handleSortChange}
            aria-label="Sort products"
          >
            <option value="">Sort: Featured</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>
        </div>

        {/* Reset button if filters active */}
        {hasActiveFilters && (
          <button
            type="button"
            className="btn btn-outline btn-sm reset-filter-btn"
            onClick={handleReset}
          >
            Reset Filters
          </button>
        )}
      </form>
    </div>
  );
}

export default SearchBar;
