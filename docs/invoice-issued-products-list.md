# Lista de Produse pentru Facturi Ieșire

## Rezumat

Pentru **facturi ieșire** (`issued`), lista de produse disponibile este filtrată pentru a afișa doar:
1. **Produse care NU urmăresc stocul** (servicii, utilități) - **ÎNTOTDEAUNA disponibile**
2. **Produse care urmăresc stocul ȘI au stoc disponibil** în depozitul selectat

## Fluxul de Încărcare

### 1. Inițializare Pagină

```117:122:src/components/accounting/invoices/InvoicesPageContent.tsx
  // Fetch products when invoice type is 'received'
  useEffect(() => {
    if (invoiceType === 'received') {
      fetchProducts({ isActive: true, pageSize: PRODUCTS_PAGE_SIZE });
    }
  }, [invoiceType, fetchProducts]);
```

**Observație importantă**: Pentru facturi **ieșire**, produsele **NU se încarcă automat** la inițializarea paginii. Ele se încarcă doar când:
- Utilizatorul deschide modalul de selecție produse
- Utilizatorul caută produse (minim 2 caractere)

### 2. Deschidere Modal Selectare Produse

Când utilizatorul apasă butonul "Adaugă Produs" pentru o factură ieșire:

```42:47:src/components/accounting/invoices/SelectProductModal.tsx
  // Fetch stock levels for issued invoices when warehouse is selected
  useEffect(() => {
    if (isOpen && invoiceType === 'issued' && warehouseId) {
      fetchStockLevels({ warehouseId });
    }
  }, [isOpen, invoiceType, warehouseId, fetchStockLevels]);
```

**Acțiuni:**
1. Se încarcă stocul pentru depozitul selectat (dacă există)
2. Se creează un map `stockMap` cu produsele care au stoc > 0

### 3. Filtrarea Produselor

```60:88:src/components/accounting/invoices/SelectProductModal.tsx
  // Filter products based on invoice type and stock availability
  const filteredProducts = useMemo(() => {
    let filtered = products.filter((p) => !excludeProductIds.includes(p.id));

    // For issued invoices, only show products with available stock in the selected warehouse
    if (invoiceType === 'issued' && warehouseId) {
      filtered = filtered.filter((p) => {
        // Include products that don't track stock (services, utilities)
        if (!p.trackStock) {
          return true;
        }
        // Include products that have stock in the warehouse
        return stockMap.has(p.id);
      });
    }

    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.code?.toLowerCase().includes(searchLower) ||
          p.name?.toLowerCase().includes(searchLower) ||
          p.description?.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  }, [products, excludeProductIds, invoiceType, warehouseId, stockMap, searchTerm]);
```

**Reguli de filtrare pentru facturi ieșire:**

1. **Exclude produsele deja adăugate** (`excludeProductIds`)
2. **Dacă depozitul este selectat:**
   - ✅ **Include produse cu `trackStock = false`** (servicii) - **ÎNTOTDEAUNA**
   - ✅ **Include produse cu `trackStock = true` ȘI stoc > 0** în depozitul selectat
   - ❌ **Exclude produse cu `trackStock = true` ȘI stoc = 0** în depozitul selectat
3. **Aplică filtru de căutare** (dacă există)

### 4. Calculul Stocului Disponibil

Stocul se calculează din mișcările de stoc:

```39:51:src/app/api/accounting/stock-levels/route.ts
    const baseQuery = db
      .select({
        warehouseId: stockMovements.warehouseId,
        productId: stockMovements.productId,
        quantity: sql<number>`COALESCE(SUM(CASE 
          WHEN ${stockMovements.type}::text = 'in' THEN ${stockMovements.quantity}::numeric
          WHEN ${stockMovements.type}::text = 'out' THEN -${stockMovements.quantity}::numeric
          WHEN ${stockMovements.type}::text = 'transfer' AND ${stockMovements.destinationWarehouseId} IS NOT NULL THEN -${stockMovements.quantity}::numeric
          WHEN ${stockMovements.type}::text = 'transfer' AND ${stockMovements.destinationWarehouseId} IS NULL THEN ${stockMovements.quantity}::numeric
          WHEN ${stockMovements.type}::text = 'adjustment' THEN ${stockMovements.quantity}::numeric
          WHEN ${stockMovements.type}::text = 'return' THEN ${stockMovements.quantity}::numeric
          ELSE 0
        END), 0)`,
```

**Formula stoc:**
- `IN` → +cantitate
- `OUT` → -cantitate
- `TRANSFER` (destinație) → -cantitate (din depozit sursă)
- `TRANSFER` (sursă) → +cantitate (în depozit destinație)
- `ADJUSTMENT` → +cantitate
- `RETURN` → +cantitate

## Afișare în Modal

### Coloane Tabel

```124:175:src/components/accounting/invoices/SelectProductModal.tsx
  const columns = useMemo(
    () => [
      {
        key: 'code' as keyof ProductWithStock,
        label: t('code'),
        render: (_: any, product: ProductWithStock) => product.code || '-',
      },
      {
        key: 'name' as keyof ProductWithStock,
        label: t('name'),
        render: (_: any, product: ProductWithStock) => product.name,
      },
      {
        key: 'unit' as keyof ProductWithStock,
        label: t('unit'),
        render: (_: any, product: ProductWithStock) => product.unit || '-',
      },
      ...(invoiceType === 'issued' && warehouseId
        ? [
            {
              key: 'availableStock' as keyof ProductWithStock,
              label: t('availableStock') || 'Stoc Disponibil',
              render: (_: any, product: ProductWithStock) => {
                if (!product.trackStock) {
                  return <span className="text-text-secondary">{t('service') || 'Serviciu'}</span>;
                }
                const stock = product.availableStock ?? 0;
                return (
                  <span className={stock > 0 ? 'text-success' : 'text-danger'}>
                    {stock.toFixed(3)} {product.unit || ''}
                  </span>
                );
              },
            },
          ]
        : []),
      {
        key: 'actions' as keyof ProductWithStock,
        label: t('actions'),
        render: (_: any, product: ProductWithStock) => (
          <button
            onClick={() => handleSelect(product)}
            className="px-3 py-1 bg-primary text-white rounded hover:bg-primary-dark"
            disabled={invoiceType === 'issued' && product.trackStock && !!warehouseId && !stockMap.has(product.id)}
          >
            {t('select')}
          </button>
        ),
      },
    ],
    [invoiceType, warehouseId, stockMap, handleSelect, t]
  );
```

**Coloane afișate:**
1. **Cod** - Codul produsului
2. **Nume** - Numele produsului
3. **Unitate** - Unitatea de măsură
4. **Stoc Disponibil** - **DOAR pentru facturi ieșire cu depozit selectat**
   - Pentru servicii (`trackStock = false`): afișează "Serviciu"
   - Pentru produse cu stoc: afișează cantitatea disponibilă (verde dacă > 0, roșu dacă = 0)
5. **Acțiuni** - Buton "Selectează" (disabled pentru produse fără stoc)

### Mesaje de Avertizare

```200:204:src/components/accounting/invoices/SelectProductModal.tsx
        {invoiceType === 'issued' && !warehouseId && (
          <div className="bg-warning/10 border border-warning rounded p-3 text-sm text-warning">
            {t('pleaseSelectWarehouse') || 'Vă rugăm să selectați o gestiune pentru a vedea stocul disponibil'}
          </div>
        )}
```

**Dacă depozitul NU este selectat:**
- Se afișează un mesaj de avertizare
- Produsele se încarcă, dar fără informații despre stoc
- Filtrarea după stoc nu se aplică

### Mesaje Când Nu Există Produse

```208:215:src/components/accounting/invoices/SelectProductModal.tsx
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-8 text-text-secondary">
            {searchTerm
              ? t('noProductsFound') || 'Nu s-au găsit produse'
              : invoiceType === 'issued' && warehouseId
              ? t('noProductsWithStock') || 'Nu există produse cu stoc disponibil în această gestiune'
              : t('noProducts') || 'Nu există produse'}
          </div>
```

**Mesaje diferite:**
- Dacă există căutare: "Nu s-au găsit produse"
- Dacă e factură ieșire cu depozit: "Nu există produse cu stoc disponibil în această gestiune"
- Altfel: "Nu există produse"

## Validare la Selecție

```108:122:src/components/accounting/invoices/SelectProductModal.tsx
  const handleSelect = useCallback(
    (product: ProductWithStock) => {
      // For issued invoices with stock products, verify stock is available
      if (invoiceType === 'issued' && product.trackStock && warehouseId) {
        const stock = stockMap.get(product.id);
        if (!stock || stock <= 0) {
          alert(t('productOutOfStock') || `Produsul ${product.name} nu are stoc disponibil în gestiunea selectată`);
          return;
        }
      }
      onSelect(product);
      onClose();
    },
    [invoiceType, warehouseId, stockMap, onSelect, onClose, t]
  );
```

**Validare:**
- Pentru produse cu stoc (`trackStock = true`), se verifică din nou disponibilitatea
- Dacă stocul este 0 sau negativ, se afișează alertă și selecția este blocată

## Căutare Produse

```59:66:src/hooks/useInvoiceProductSelection.ts
  const handleProductSearch = useCallback(
    (searchTerm: string) => {
      if (searchTerm.trim().length >= SEARCH_MIN_LENGTH) {
        fetchProducts({ search: searchTerm.trim(), isActive: true, pageSize: PRODUCTS_PAGE_SIZE });
      }
    },
    [fetchProducts]
  );
```

**Căutare:**
- Minim 2 caractere
- Se caută în: `code`, `name`, `description`, `barcode`
- Se încarcă doar produse active (`isActive = true`)

## Exemplu Practic

### Scenariu 1: Factură Ieșire cu Depozit Selectat

**Depozit:** Depozit Central
**Produse în sistem:**
- Produs A (trackStock: true) - Stoc: 50 buc
- Produs B (trackStock: true) - Stoc: 0 buc
- Serviciu C (trackStock: false)

**Lista afișată:**
- ✅ Produs A - Stoc: 50.000 buc (verde)
- ✅ Serviciu C - "Serviciu" (gri)
- ❌ Produs B - **NU apare** (stoc = 0)

### Scenariu 2: Factură Ieșire Fără Depozit Selectat

**Depozit:** Nu este selectat

**Lista afișată:**
- ✅ Toate produsele active (fără filtru de stoc)
- ⚠️ Mesaj: "Vă rugăm să selectați o gestiune pentru a vedea stocul disponibil"
- ❌ Coloana "Stoc Disponibil" nu apare

### Scenariu 3: Căutare Produse

**Căutare:** "lapte"

**Rezultate:**
- Se încarcă produsele care conțin "lapte" în cod/nume/descriere
- Se aplică aceleași filtre (stoc pentru facturi ieșire)
- Dacă nu există rezultate: "Nu s-au găsit produse"

## Tabele Implicate

### Citire (Read)
- **`products`**: Lista produselor (filtrate după `isActive = true`)
- **`stock_movements`**: Calcul stoc disponibil per depozit și produs
- **`warehouses`**: Validare depozit selectat

### Logica de Filtrare

```sql
-- Produse afișate pentru facturi ieșire cu depozit selectat:
SELECT p.* 
FROM products p
WHERE p.is_active = true
  AND (
    -- Servicii (întotdeauna disponibile)
    p.track_stock = false
    OR
    -- Produse cu stoc disponibil în depozit
    (p.track_stock = true 
     AND EXISTS (
       SELECT 1 
       FROM stock_movements sm
       WHERE sm.product_id = p.id
         AND sm.warehouse_id = :warehouseId
       HAVING SUM(CASE 
         WHEN sm.type = 'in' THEN sm.quantity
         WHEN sm.type = 'out' THEN -sm.quantity
         -- ... alte tipuri
       END) > 0
     )
    )
  )
```

## Observații Importante

1. **Produsele NU se încarcă automat** pentru facturi ieșire - doar la căutare
2. **Filtrarea după stoc** se aplică DOAR dacă depozitul este selectat
3. **Serviciile sunt întotdeauna disponibile** (nu urmăresc stoc)
4. **Stocul se calculează dinamic** din mișcările de stoc
5. **Validare dublă**: la filtrare ȘI la selecție
6. **Butonul "Selectează" este disabled** pentru produse fără stoc disponibil

