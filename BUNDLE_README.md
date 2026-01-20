# Feevra Product Bundle - Implementeringsguide

Dette er en komplet produktbundle-løsning til feevra.dk, designet til Shopify.

## 📋 Funktioner

- ✅ **Responsivt design**: 4 produkter på række på desktop, 2 på række på mobil
- ✅ **Farvevalg**: Sort, Rosa, Grå, Blå med produktbilleder
- ✅ **Antal valg**: 1, 2 eller 3 stykker med speciale priser
- ✅ **Multi-farve valg**: Vælg forskellige farver ved køb af 2 eller 3 stykker
- ✅ **Smart labels**: "Mest populær" på 2 stk, "Bedst værdi" på 3 stk
- ✅ **Shopify integration**: Fuld integration med Shopify's cart API
- ✅ **Out of stock håndtering**: Automatisk håndtering af udsolgte varianter
- ✅ **Brandfarver**: #1C1A54 som primær brandfarve

## 🎨 Design Specifikationer

### Farver
- **Brand farve**: #1C1A54 (mørkeblå)
- **Border radius**: 14px på produktbokse
- **Labels**:
  - "Mest populær": Hvid tekst på #1C1A54 baggrund
  - "Bedst værdi": Hvid tekst på #2ECC71 baggrund (grøn)

### Priser
- 1 stk: 399 kr.
- 2 stk: 750 kr. (Standard valg)
- 3 stk: 950 kr.

### Produkter

| Farve | Variant ID | Billede URL |
|-------|-----------|-------------|
| Sort  | 49885169189206 | [Link](https://cdn.shopify.com/s/files/1/0871/4570/9910/files/feevra-migraenemasken.jpg_2_e103e0c1-662b-4aca-a605-009f32c6e49e.jpg?v=1768917230) |
| Rosa  | 49885169189206 | [Link](https://cdn.shopify.com/s/files/1/0871/4570/9910/files/feevra-migraenemaske_jpg_3ec23e6e-1dce-4474-a8e8-30ad75e4a914.jpg?v=1768917229) |
| Grå   | 50595389866326 | [Link](https://cdn.shopify.com/s/files/1/0871/4570/9910/files/feevra-migraenemasken_jpg_049bb0ba-66eb-478f-87ba-5f4e1c3af56c.jpg?v=1768917230) |
| Blå   | 49885169189206 | [Link](https://cdn.shopify.com/s/files/1/0871/4570/9910/files/feevra-migraenemasken.jpg_3_021793b9-d91c-4e66-8277-77242e0f482e.jpg?v=1768917230) |

## 📦 Filer

### Standalone Version (HTML/CSS/JS)
- `product-bundle.html` - HTML struktur
- `bundle-styles.css` - Alle styles
- `bundle-script.js` - Funktionalitet og Shopify integration

### Shopify Theme Version
- `product-bundle.liquid` - Liquid template til Shopify theme

## 🚀 Installation

### Option 1: Shopify Theme Integration (Anbefalet)

1. **Upload CSS fil**:
   ```
   Åbn din Shopify admin → Online Store → Themes → Actions → Edit code
   Naviger til Assets mappen
   Upload 'bundle-styles.css'
   ```

2. **Upload JavaScript fil**:
   ```
   I Assets mappen
   Upload 'bundle-script.js'
   ```

3. **Tilføj Section**:
   ```
   Naviger til Sections mappen
   Opret ny fil: 'product-bundle.liquid'
   Kopier indholdet fra product-bundle.liquid filen
   ```

4. **Tilføj til din side**:
   ```
   Gå til din produktside eller landing page
   Klik "Add section"
   Vælg "Product Bundle"
   ```

### Option 2: Standalone HTML (Til test)

1. Åbn `product-bundle.html` i en browser
2. Test funktionaliteten lokalt
3. Tilpas efter behov

## ⚙️ Konfiguration

### Opdater Variant IDs

Åbn `bundle-script.js` og opdater variant IDs hvis nødvendigt:

```javascript
const BUNDLE_CONFIG = {
    products: {
        sort: {
            name: 'Sort',
            variantId: '49885169189206', // Opdater her
            image: '...'
        },
        // ... andre farver
    }
};
```

### Opdater Priser

```javascript
prices: {
    1: 399,  // Pris for 1 stk
    2: 750,  // Pris for 2 stk
    3: 950   // Pris for 3 stk
}
```

## 🔌 Shopify Integration

### Cart API

Bundlen bruger Shopify's Ajax Cart API:

```javascript
fetch('/cart/add.js', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({ items: items })
})
```

### Stock Checking

For at tjekke lagerstatus automatisk, bundlen integrerer med Shopify's product API:

```javascript
const response = await fetch('/products/your-product-handle.js');
const product = await response.json();
// Check product.variants[].available
```

## 📱 Responsive Design

- **Desktop (> 768px)**: 4 produkter på række
- **Tablet (480px - 768px)**: 2 produkter på række
- **Mobile (< 480px)**: 2 produkter på række

## 🎯 Bruger Flow

1. **Vælg farve**: Klik på ønsket farve (Sort, Rosa, Grå, eller Blå)
2. **Automatisk videre**: Går automatisk til antal-valg (default: 2 stk)
3. **Vælg antal**: Vælg 1, 2 eller 3 stykker
4. **Vælg farvefordeling** (kun hvis 2 eller 3 stk):
   - Ved 2 stk: Vælg farver for produkt 1 og 2
   - Ved 3 stk: Vælg farver for produkt 1, 2 og 3
5. **Tilføj til kurv**: Klik på "Tilføj til kurv" knappen
6. **Gå til kurv**: Automatisk redirect til kurv

### Gå Tilbage Funktion
- Klik "← Gå tilbage" for at ændre farvevalg
- Behold antal-valg når du går tilbage

## 🛠️ Tilpasning

### Ændre Brandfarve

I `bundle-styles.css`:

```css
:root {
    --brand-color: #1C1A54; /* Opdater her */
}
```

### Tilføj Flere Farver

1. Tilføj nyt produkt i `BUNDLE_CONFIG` i `bundle-script.js`
2. Tilføj ny `.product-card` i HTML/Liquid
3. Opdater grid hvis nødvendigt (mere end 4 farver)

### Ændre Labels

I HTML/Liquid:

```html
<div class="label-badge popular">Mest populær</div>
<div class="label-badge best-value">Bedst værdi</div>
```

## 🐛 Fejlfinding

### Problem: "Tilføj til kurv" virker ikke

**Løsning**:
- Tjek at variant IDs er korrekte
- Åbn browser console for fejlmeddelelser
- Verificer Shopify Ajax API er aktiveret i dit theme

### Problem: Udsolgte produkter vises ikke korrekt

**Løsning**:
- Tjek `checkStockAvailability()` funktionen
- Verificer product handle i fetch URL
- Tjek variant availability data

### Problem: Styling ser forkert ud

**Løsning**:
- Tjek at `bundle-styles.css` er korrekt uploadet
- Verificer ingen CSS konflikter med dit theme
- Tjek browser console for CSS fejl

## 📞 Support

For spørgsmål eller problemer, kontakt udvikler eller Shopify support.

## 📄 Licens

Copyright © 2024 Feevra.dk - Alle rettigheder forbeholdes.
