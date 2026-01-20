# Feevra Bundle - Installations Guide 🚀

## 📝 Alt-i-én Custom Liquid Section

Denne guide viser dig hvordan du installerer Feevra produktbundle direkte i dit Shopify tema.

## ⚡ Hurtig Installation (Anbefalet)

### Trin 1: Åbn Shopify Theme Editor

1. Log ind på din Shopify admin
2. Gå til **Online Store** → **Themes**
3. Find dit aktive tema
4. Klik på **Actions** → **Edit code**

### Trin 2: Opret Ny Section

1. I venstre sidebar, find **Sections** mappen
2. Klik på **Add a new section**
3. Navngiv den: `feevra-bundle`
4. Klik **Done**

### Trin 3: Indsæt Koden

1. Åbn filen `feevra-bundle-custom.liquid`
2. **Copy hele indholdet** (Ctrl+A, Ctrl+C)
3. **Paste det ind** i den nye section i Shopify (Ctrl+V)
4. Klik **Save** (Ctrl+S)

### Trin 4: Tilføj til Din Side

#### Option A: Tilføj til en specifik side
1. Gå til **Online Store** → **Pages**
2. Vælg den side hvor bundlen skal vises (eller opret en ny)
3. I page editor, klik **Add section**
4. Find og vælg **Feevra Product Bundle**
5. Klik **Save**

#### Option B: Tilføj til Homepage
1. Gå til **Online Store** → **Themes**
2. Klik **Customize** på dit aktive tema
3. Vælg homepage template
4. Klik **Add section**
5. Find og vælg **Feevra Product Bundle**
6. Klik **Save**

#### Option C: Tilføj til en Product Page
1. Gå til **Online Store** → **Themes**
2. Klik **Customize**
3. Vælg en produktside
4. Klik **Add section**
5. Find og vælg **Feevra Product Bundle**
6. Placer den hvor du ønsker på siden
7. Klik **Save**

## ✅ Færdig!

Din Feevra produktbundle er nu live og klar til brug! 🎉

## 🎨 Tilpasning

### Ændre Variant IDs

Hvis du har brug for at ændre variant IDs:

1. Åbn `Sections` → `feevra-bundle.liquid`
2. Find linjen med `FEEVRA_BUNDLE_CONFIG`
3. Opdater variant IDs:

```javascript
const FEEVRA_BUNDLE_CONFIG = {
  products: {
    sort: {
      name: 'Sort',
      variantId: '49885169189206', // <-- Ændre her
      image: '...'
    },
    // ... andre farver
  }
};
```

### Ændre Priser

Find `prices` objektet i koden:

```javascript
prices: {
  1: 399,  // <-- Ændre pris for 1 stk
  2: 750,  // <-- Ændre pris for 2 stk
  3: 950   // <-- Ændre pris for 3 stk
}
```

### Ændre Brandfarve

Find CSS delen og opdater:

```css
.feevra-bundle-wrapper {
    --brand-color: #1C1A54; /* <-- Ændre her */
}
```

### Ændre Produktbilleder

Find HTML delen og opdater image URLs:

```html
<img src="https://cdn.shopify.com/..." alt="Sort" loading="lazy">
```

## 🔍 Test Bundle

1. Gå til den side hvor du tilføjede bundlen
2. Test farvevalg
3. Test antal valg (1, 2, 3 stk)
4. Test multi-farve valg ved 2 og 3 stk
5. Test "Tilføj til kurv" funktionalitet
6. Verificer produkterne er i kurven

## 📱 Responsivt Design

Bundlen tilpasser sig automatisk:

- **Desktop (> 768px)**: 4 produkter på række
- **Tablet (480-768px)**: 2 produkter på række
- **Mobile (< 480px)**: 2 produkter på række

## 🛠️ Fejlfinding

### Problem: Bundlen vises ikke

**Løsning:**
1. Tjek at sectionen er gemt korrekt
2. Verificer at du har tilføjet sectionen til siden
3. Prøv at refreshe siden (Ctrl+F5)

### Problem: "Tilføj til kurv" virker ikke

**Løsning:**
1. Åbn browser console (F12)
2. Tjek for JavaScript fejl
3. Verificer at variant IDs er korrekte
4. Test om Shopify Ajax Cart API er aktiveret

### Problem: Billeder vises ikke

**Løsning:**
1. Tjek at image URLs er korrekte
2. Verificer at billederne er uploadet til Shopify
3. Prøv at re-upload billederne til Shopify Files

### Problem: Styling ser forkert ud

**Løsning:**
1. Tjek om dit tema har konflikter med CSS
2. Prøv at tilføje `!important` til kritiske styles
3. Inspicér elementet i browser (F12) for at se hvilke styles der anvendes

## 📊 Funktionsliste

- ✅ **Responsivt design** - Fungerer på alle enheder
- ✅ **4 farver** - Sort, Rosa, Grå, Blå
- ✅ **3 mængder** - 1, 2, eller 3 stykker
- ✅ **Multi-farve valg** - Vælg forskellige farver ved 2-3 stk
- ✅ **Smart labels** - "Mest populær" og "Bedst værdi"
- ✅ **Default valg** - 2 stk er pre-selected
- ✅ **Gå tilbage** - Nem navigation mellem steps
- ✅ **Shopify integration** - Fuld cart integration
- ✅ **Out of stock** - Håndterer udsolgte varianter
- ✅ **Brandfarver** - #1C1A54 med 14px border radius

## 💡 Tips

1. **Test først på en test-side** før du gør bundlen live
2. **Backup dit tema** før du laver ændringer
3. **Brug Shopify's preview** funktion til at se ændringer før publish
4. **Tjek på forskellige enheder** (mobil, tablet, desktop)

## 📞 Support

Hvis du støder på problemer:

1. Tjek denne guide igen
2. Se browser console for fejl (F12)
3. Verificer alle variant IDs er korrekte
4. Test på en anden browser

## 🎯 Næste Skridt

Efter installation kan du:

1. Tilpasse farver og styling efter dit brand
2. Tilføje flere produktfarver
3. Ændre priser og mængder
4. Integrere med email marketing
5. Tilføje analytics tracking

---

**Lavet til feevra.dk** 💙

Alle rettigheder forbeholdes © 2024
