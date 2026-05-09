// ============================================================
// PROJECT 6: E-COMMERCE PRODUCT STORE (FULL FEATURED)
// Stack: React, Context API, useReducer, localStorage
// Concepts: Cart state with useReducer, Context, filtering,
//           sorting, pagination, wishlist, toast notifications
//
// HOW TO RUN:
// 1. npx create-react-app product-store
// 2. Replace src/App.js with this file
// 3. npm start
// Uses: https://fakestoreapi.com (free fake product API)
// ============================================================

import { useState, useEffect, useReducer, useContext, createContext, useCallback } from "react";

const API = "https://fakestoreapi.com";

// ─── Cart Context with useReducer ──────────────────────────────
const CartContext = createContext(null);

function useCart() { return useContext(CartContext); }

function cartReducer(state, action) {
  switch (action.type) {
    case "ADD_ITEM": {
      const existing = state.items.find(i => i.id === action.payload.id);
      if (existing) {
        return { ...state, items: state.items.map(i => i.id === action.payload.id ? { ...i, qty: i.qty + 1 } : i) };
      }
      return { ...state, items: [...state.items, { ...action.payload, qty: 1 }] };
    }
    case "REMOVE_ITEM":
      return { ...state, items: state.items.filter(i => i.id !== action.payload) };
    case "UPDATE_QTY":
      if (action.payload.qty <= 0) return { ...state, items: state.items.filter(i => i.id !== action.payload.id) };
      return { ...state, items: state.items.map(i => i.id === action.payload.id ? { ...i, qty: action.payload.qty } : i) };
    case "CLEAR":
      return { ...state, items: [] };
    default:
      return state;
  }
}

const initialCartState = { items: JSON.parse(localStorage.getItem("cart") || "[]") };

function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, initialCartState);

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(state.items));
  }, [state.items]);

  const addItem   = useCallback((product) => dispatch({ type: "ADD_ITEM",    payload: product }), []);
  const removeItem= useCallback((id)      => dispatch({ type: "REMOVE_ITEM", payload: id }), []);
  const updateQty = useCallback((id, qty) => dispatch({ type: "UPDATE_QTY",  payload: { id, qty } }), []);
  const clearCart = useCallback(()        => dispatch({ type: "CLEAR" }), []);

  const totalItems = state.items.reduce((sum, i) => sum + i.qty, 0);
  const totalPrice = state.items.reduce((sum, i) => sum + i.price * i.qty, 0);

  return (
    <CartContext.Provider value={{ items: state.items, addItem, removeItem, updateQty, clearCart, totalItems, totalPrice }}>
      {children}
    </CartContext.Provider>
  );
}

// ─── Toast Notification ───────────────────────────────────────
function Toast({ message, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 2500);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div style={styles.toast}>
      <span>✅ {message}</span>
      <button onClick={onClose} style={styles.toastClose}>✕</button>
    </div>
  );
}

// ─── Star Rating ──────────────────────────────────────────────
function StarRating({ rating, count }) {
  return (
    <div style={styles.ratingRow}>
      <span style={styles.stars}>
        {"★".repeat(Math.round(rating))}{"☆".repeat(5 - Math.round(rating))}
      </span>
      <span style={styles.ratingCount}>({count})</span>
    </div>
  );
}

// ─── Product Card ─────────────────────────────────────────────
function ProductCard({ product, onAddToCart, isWishlisted, onToggleWishlist }) {
  const { items } = useCart();
  const inCart = items.some(i => i.id === product.id);
  const [imgLoaded, setImgLoaded] = useState(false);

  return (
    <div style={styles.productCard}>
      {/* Wishlist button */}
      <button
        onClick={() => onToggleWishlist(product.id)}
        style={{ ...styles.wishlistBtn, color: isWishlisted ? "#ef4444" : "#cbd5e1" }}
        aria-label="Toggle wishlist"
      >
        {isWishlisted ? "♥" : "♡"}
      </button>

      {/* Image */}
      <div style={styles.productImgWrap}>
        {!imgLoaded && <div style={styles.imgPlaceholder}>📦</div>}
        <img
          src={product.image}
          alt={product.title}
          style={{ ...styles.productImg, opacity: imgLoaded ? 1 : 0 }}
          onLoad={() => setImgLoaded(true)}
        />
      </div>

      {/* Content */}
      <div style={styles.productContent}>
        <span style={styles.categoryBadge}>{product.category}</span>
        <h3 style={styles.productTitle} title={product.title}>
          {product.title.length > 55 ? product.title.slice(0, 55) + "…" : product.title}
        </h3>
        <StarRating rating={product.rating.rate} count={product.rating.count} />
        <div style={styles.priceRow}>
          <span style={styles.price}>${product.price.toFixed(2)}</span>
          <button
            onClick={() => onAddToCart(product)}
            style={{ ...styles.addToCartBtn, ...(inCart ? styles.addToCartBtnActive : {}) }}
          >
            {inCart ? "✓ Added" : "+ Add to Cart"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Cart Drawer ──────────────────────────────────────────────
function CartDrawer({ isOpen, onClose }) {
  const { items, removeItem, updateQty, clearCart, totalPrice, totalItems } = useCart();
  const [ordered, setOrdered] = useState(false);

  const handleOrder = () => {
    setOrdered(true);
    clearCart();
    setTimeout(() => { setOrdered(false); onClose(); }, 2500);
  };

  if (!isOpen) return null;

  return (
    <>
      <div onClick={onClose} style={styles.overlay} />
      <div style={styles.drawer}>
        <div style={styles.drawerHeader}>
          <h2 style={styles.drawerTitle}>🛒 Cart ({totalItems})</h2>
          <button onClick={onClose} style={styles.drawerClose}>✕</button>
        </div>

        {ordered ? (
          <div style={styles.orderSuccess}>
            <span style={{ fontSize: 48 }}>🎉</span>
            <h3>Order Placed!</h3>
            <p>Thank you for your purchase. (Demo only)</p>
          </div>
        ) : items.length === 0 ? (
          <div style={styles.emptyCart}>
            <span style={{ fontSize: 48 }}>🛒</span>
            <p>Your cart is empty</p>
          </div>
        ) : (
          <>
            <div style={styles.drawerItems}>
              {items.map(item => (
                <div key={item.id} style={styles.cartItem}>
                  <img src={item.image} alt={item.title} style={styles.cartItemImg} />
                  <div style={styles.cartItemInfo}>
                    <p style={styles.cartItemTitle}>{item.title.slice(0, 40)}…</p>
                    <span style={styles.cartItemPrice}>${item.price.toFixed(2)}</span>
                  </div>
                  <div style={styles.qtyControl}>
                    <button onClick={() => updateQty(item.id, item.qty - 1)} style={styles.qtyBtn}>−</button>
                    <span style={styles.qtyNum}>{item.qty}</span>
                    <button onClick={() => updateQty(item.id, item.qty + 1)} style={styles.qtyBtn}>+</button>
                  </div>
                  <button onClick={() => removeItem(item.id)} style={styles.removeBtn}>🗑️</button>
                </div>
              ))}
            </div>

            <div style={styles.drawerFooter}>
              <div style={styles.totalRow}>
                <span style={styles.totalLabel}>Total</span>
                <span style={styles.totalPrice}>${totalPrice.toFixed(2)}</span>
              </div>
              <button onClick={handleOrder} style={styles.checkoutBtn}>
                Checkout →
              </button>
              <button onClick={clearCart} style={styles.clearCartBtn}>Clear cart</button>
            </div>
          </>
        )}
      </div>
    </>
  );
}

// ─── Main App ─────────────────────────────────────────────────
function Store() {
  const { addItem, totalItems } = useCart();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState(["all"]);

  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("default");
  const [search, setSearch] = useState("");
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [minRating, setMinRating] = useState(0);
  const [page, setPage] = useState(1);
  const PER_PAGE = 8;

  const [cartOpen, setCartOpen] = useState(false);
  const [wishlist, setWishlist] = useState(() => JSON.parse(localStorage.getItem("wishlist") || "[]"));
  const [toast, setToast] = useState(null);

  // Fetch products and categories
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [productsRes, categoriesRes] = await Promise.all([
          fetch(`${API}/products`),
          fetch(`${API}/products/categories`),
        ]);
        const [p, c] = await Promise.all([productsRes.json(), categoriesRes.json()]);
        setProducts(p);
        setCategories(["all", ...c]);
        // Set max price
        const maxPrice = Math.max(...p.map(prod => prod.price));
        setPriceRange([0, Math.ceil(maxPrice)]);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  useEffect(() => { localStorage.setItem("wishlist", JSON.stringify(wishlist)); }, [wishlist]);

  const toggleWishlist = (id) => {
    setWishlist(prev => prev.includes(id) ? prev.filter(w => w !== id) : [...prev, id]);
  };

  const handleAddToCart = (product) => {
    addItem(product);
    setToast(`${product.title.slice(0, 25)}… added to cart!`);
  };

  // Filter + Sort + Paginate
  const filtered = products
    .filter(p => selectedCategory === "all" || p.category === selectedCategory)
    .filter(p => p.title.toLowerCase().includes(search.toLowerCase()))
    .filter(p => p.price >= priceRange[0] && p.price <= priceRange[1])
    .filter(p => p.rating.rate >= minRating)
    .sort((a, b) => {
      if (sortBy === "price-low")  return a.price - b.price;
      if (sortBy === "price-high") return b.price - a.price;
      if (sortBy === "rating")     return b.rating.rate - a.rating.rate;
      if (sortBy === "name")       return a.title.localeCompare(b.title);
      return 0;
    });

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  useEffect(() => { setPage(1); }, [selectedCategory, search, sortBy, minRating]);

  return (
    <div style={styles.app}>
      {/* Top Bar */}
      <nav style={styles.nav}>
        <div style={styles.navInner}>
          <div style={styles.navBrand}>
            <span style={{ fontSize: 24 }}>🛍️</span>
            <span style={styles.brandName}>ShopReact</span>
          </div>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="🔍 Search products..."
            style={styles.navSearch}
          />
          <div style={styles.navRight}>
            <span style={styles.itemCount}>{filtered.length} products</span>
            <button onClick={() => setCartOpen(true)} style={styles.cartBtn}>
              🛒 Cart
              {totalItems > 0 && <span style={styles.cartBadge}>{totalItems}</span>}
            </button>
          </div>
        </div>
      </nav>

      <div style={styles.pageLayout}>
        {/* Sidebar Filters */}
        <aside style={styles.sidebar}>
          <h3 style={styles.filterTitle}>Filters</h3>

          <div style={styles.filterSection}>
            <label style={styles.filterLabel}>Category</label>
            {categories.map(cat => (
              <button key={cat} onClick={() => setSelectedCategory(cat)}
                style={{ ...styles.categoryBtn, ...(selectedCategory === cat ? styles.categoryBtnActive : {}) }}>
                {cat === "all" ? "All Categories" : cat}
              </button>
            ))}
          </div>

          <div style={styles.filterSection}>
            <label style={styles.filterLabel}>Min Rating</label>
            {[0, 3, 3.5, 4, 4.5].map(r => (
              <button key={r} onClick={() => setMinRating(r)}
                style={{ ...styles.categoryBtn, ...(minRating === r ? styles.categoryBtnActive : {}) }}>
                {r === 0 ? "All Ratings" : `${r}★ & above`}
              </button>
            ))}
          </div>

          <div style={styles.filterSection}>
            <label style={styles.filterLabel}>Sort By</label>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={styles.sortSelect}>
              <option value="default">Default</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Top Rated</option>
              <option value="name">Name A-Z</option>
            </select>
          </div>

          {wishlist.length > 0 && (
            <div style={styles.filterSection}>
              <div style={styles.wishlistCount}>♥ {wishlist.length} in wishlist</div>
            </div>
          )}
        </aside>

        {/* Products Grid */}
        <main style={styles.main}>
          {loading && (
            <div style={styles.centered}>
              <div style={styles.bigSpinner} />
              <p style={{ color: "#94a3b8" }}>Loading products...</p>
            </div>
          )}
          {error && <div style={styles.errorBox}>⚠️ {error}</div>}

          {!loading && filtered.length === 0 && (
            <div style={styles.noResults}>
              <span style={{ fontSize: 48 }}>😕</span>
              <p>No products match your filters.</p>
              <button onClick={() => { setSearch(""); setSelectedCategory("all"); setMinRating(0); }} style={styles.resetBtn}>Reset Filters</button>
            </div>
          )}

          <div style={styles.productsGrid}>
            {paginated.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={handleAddToCart}
                isWishlisted={wishlist.includes(product.id)}
                onToggleWishlist={toggleWishlist}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={styles.paginationRow}>
              <button onClick={() => setPage(p => p - 1)} disabled={page === 1} style={styles.pageBtn}>‹</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)}
                  style={{ ...styles.pageBtn, ...(p === page ? styles.pageBtnActive : {}) }}>
                  {p}
                </button>
              ))}
              <button onClick={() => setPage(p => p + 1)} disabled={page >= totalPages} style={styles.pageBtn}>›</button>
            </div>
          )}
        </main>
      </div>

      {/* Cart Drawer */}
      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />

      {/* Toast */}
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}

export default function App() {
  return (
    <CartProvider>
      <Store />
    </CartProvider>
  );
}

const styles = {
  app: { minHeight: "100vh", background: "#f8fafc", fontFamily: "'Segoe UI', sans-serif" },
  nav: { background: "#fff", borderBottom: "1px solid #e2e8f0", position: "sticky", top: 0, zIndex: 100 },
  navInner: { maxWidth: 1200, margin: "0 auto", padding: "12px 20px", display: "flex", alignItems: "center", gap: 16 },
  navBrand: { display: "flex", alignItems: "center", gap: 8 },
  brandName: { fontSize: 20, fontWeight: 800, color: "#0f172a" },
  navSearch: { flex: 1, maxWidth: 480, border: "1px solid #e2e8f0", borderRadius: 99, padding: "9px 16px", fontSize: 14, outline: "none" },
  navRight: { display: "flex", alignItems: "center", gap: 12, marginLeft: "auto" },
  itemCount: { fontSize: 13, color: "#94a3b8" },
  cartBtn: { background: "#0f172a", color: "#fff", border: "none", borderRadius: 10, padding: "9px 18px", fontWeight: 700, cursor: "pointer", fontSize: 14, position: "relative" },
  cartBadge: { position: "absolute", top: -6, right: -6, background: "#ef4444", color: "#fff", borderRadius: "50%", width: 18, height: 18, fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 },
  pageLayout: { display: "grid", gridTemplateColumns: "220px 1fr", maxWidth: 1200, margin: "0 auto", padding: "24px 20px", gap: 24 },
  sidebar: { position: "sticky", top: 68, height: "fit-content" },
  filterTitle: { fontSize: 16, fontWeight: 700, color: "#0f172a", margin: "0 0 16px" },
  filterSection: { marginBottom: 24 },
  filterLabel: { display: "block", fontSize: 12, fontWeight: 600, color: "#374151", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 },
  categoryBtn: { display: "block", width: "100%", textAlign: "left", background: "transparent", border: "1px solid transparent", borderRadius: 8, padding: "7px 10px", fontSize: 13, cursor: "pointer", color: "#374151", marginBottom: 2, textTransform: "capitalize" },
  categoryBtnActive: { background: "#ede9fe", color: "#6d28d9", fontWeight: 700, border: "1px solid #c4b5fd" },
  sortSelect: { width: "100%", border: "1px solid #e2e8f0", borderRadius: 8, padding: "8px 10px", fontSize: 13, outline: "none" },
  wishlistCount: { fontSize: 13, color: "#ef4444", fontWeight: 600 },
  main: { minWidth: 0 },
  centered: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 400, gap: 16 },
  bigSpinner: { width: 48, height: 48, border: "4px solid #e2e8f0", borderTop: "4px solid #6366f1", borderRadius: "50%", animation: "spin 0.8s linear infinite" },
  errorBox: { background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 10, padding: 16, color: "#dc2626" },
  noResults: { textAlign: "center", padding: 60, color: "#94a3b8", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 },
  resetBtn: { background: "#6366f1", color: "#fff", border: "none", borderRadius: 8, padding: "8px 18px", cursor: "pointer", fontWeight: 600, fontSize: 14 },
  productsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16, marginBottom: 24 },
  productCard: { background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", overflow: "hidden", position: "relative", transition: "box-shadow 0.2s", display: "flex", flexDirection: "column" },
  wishlistBtn: { position: "absolute", top: 10, right: 10, background: "rgba(255,255,255,0.9)", border: "none", borderRadius: "50%", width: 30, height: 30, cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1 },
  productImgWrap: { height: 180, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, background: "#f8fafc" },
  imgPlaceholder: { fontSize: 40 },
  productImg: { maxWidth: "100%", maxHeight: "100%", objectFit: "contain", transition: "opacity 0.3s" },
  productContent: { padding: "14px 16px 16px", flex: 1, display: "flex", flexDirection: "column" },
  categoryBadge: { fontSize: 10, color: "#6366f1", background: "#ede9fe", borderRadius: 99, padding: "2px 8px", textTransform: "capitalize", alignSelf: "flex-start", marginBottom: 8 },
  productTitle: { fontSize: 13, fontWeight: 600, color: "#0f172a", lineHeight: 1.4, margin: "0 0 8px", flex: 1 },
  ratingRow: { display: "flex", alignItems: "center", gap: 6, marginBottom: 12 },
  stars: { color: "#f59e0b", fontSize: 13, letterSpacing: 1 },
  ratingCount: { fontSize: 11, color: "#94a3b8" },
  priceRow: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  price: { fontSize: 18, fontWeight: 800, color: "#0f172a" },
  addToCartBtn: { background: "#6366f1", color: "#fff", border: "none", borderRadius: 8, padding: "7px 12px", fontWeight: 600, cursor: "pointer", fontSize: 12, transition: "all 0.2s" },
  addToCartBtnActive: { background: "#16a34a" },
  paginationRow: { display: "flex", justifyContent: "center", gap: 6, flexWrap: "wrap" },
  pageBtn: { width: 36, height: 36, border: "1px solid #e2e8f0", borderRadius: 8, background: "#fff", cursor: "pointer", fontSize: 14, color: "#374151", fontWeight: 500 },
  pageBtnActive: { background: "#6366f1", color: "#fff", borderColor: "#6366f1" },
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 200 },
  drawer: { position: "fixed", right: 0, top: 0, bottom: 0, width: 380, background: "#fff", zIndex: 201, display: "flex", flexDirection: "column", boxShadow: "-4px 0 24px rgba(0,0,0,0.15)" },
  drawerHeader: { padding: "20px 20px 16px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" },
  drawerTitle: { margin: 0, fontSize: 20, fontWeight: 700 },
  drawerClose: { background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#94a3b8" },
  drawerItems: { flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 12 },
  cartItem: { display: "flex", gap: 10, alignItems: "center" },
  cartItemImg: { width: 56, height: 56, objectFit: "contain", background: "#f8fafc", borderRadius: 8, padding: 4 },
  cartItemInfo: { flex: 1, minWidth: 0 },
  cartItemTitle: { fontSize: 12, color: "#374151", margin: "0 0 4px", lineHeight: 1.3 },
  cartItemPrice: { fontSize: 14, fontWeight: 700, color: "#0f172a" },
  qtyControl: { display: "flex", alignItems: "center", gap: 8, border: "1px solid #e2e8f0", borderRadius: 8, padding: "2px 8px" },
  qtyBtn: { background: "none", border: "none", fontSize: 16, cursor: "pointer", color: "#374151", padding: "2px 4px" },
  qtyNum: { fontSize: 14, fontWeight: 700, minWidth: 20, textAlign: "center" },
  removeBtn: { background: "none", border: "none", cursor: "pointer", fontSize: 16, opacity: 0.5 },
  drawerFooter: { borderTop: "1px solid #e2e8f0", padding: 20, display: "flex", flexDirection: "column", gap: 10 },
  totalRow: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  totalLabel: { fontSize: 14, color: "#64748b", fontWeight: 600 },
  totalPrice: { fontSize: 22, fontWeight: 800, color: "#0f172a" },
  checkoutBtn: { background: "#0f172a", color: "#fff", border: "none", borderRadius: 12, padding: "14px", fontWeight: 700, cursor: "pointer", fontSize: 15 },
  clearCartBtn: { background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 13, fontWeight: 500 },
  emptyCart: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, color: "#94a3b8" },
  orderSuccess: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, color: "#0f172a", textAlign: "center", padding: 24 },
  toast: { position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", background: "#0f172a", color: "#fff", borderRadius: 12, padding: "12px 20px", display: "flex", alignItems: "center", gap: 12, zIndex: 300, fontSize: 14, boxShadow: "0 4px 20px rgba(0,0,0,0.3)", whiteSpace: "nowrap" },
  toastClose: { background: "none", border: "none", color: "rgba(255,255,255,0.6)", cursor: "pointer", fontSize: 14 },
};
