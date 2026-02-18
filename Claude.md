# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Comandos

```bash
npm run dev      # Servidor de desarrollo (http://localhost:3000)
npm run build    # Build de producción
npm run lint     # Ejecutar ESLint
```

## Arquitectura

Aplicación Next.js 14 (App Router) para gestión de despensa con IA. Todo el texto de UI está en español.

### Stack
- **Frontend**: React 18, TypeScript, Tailwind CSS, Radix UI (shadcn/ui)
- **Backend**: Firebase (Auth, Firestore), API Routes de Next.js
- **IA**: Anthropic Claude API (`claude-sonnet-4-20250514`) para visión y generación de recetas
- **Fuentes**: DM Serif Display (headings, clase `font-display`) + DM Sans (body)

### Estructura de Rutas

```
/src/app
  /(auth)/          # Login, registro (públicas)
  /(dashboard)/     # Inventory, recipes, planner, settings (protegidas)
  /api/             # Endpoints del servidor
    /vision/        # Identificar productos y escanear tickets
    /recipes/       # Generación de recetas con IA
    /planner/       # Generación de planes de comida con IA
```

### Composición de Contextos

```
RootLayout (AuthProvider, Toaster)
└── DashboardLayout (ProtectedRoute → redirige a /login si no hay sesión)
    └── PantryProvider (provee despensa activa)
        └── Sidebar + children
```

`AuthContext` maneja auth de Firebase. `PantryContext` maneja estado multi-pantry, persiste ID activo en `localStorage` (`despensa_active_pantry_id`), y auto-migra datos de pantry única a multi-pantry.

### Patrón de Datos

Los datos del usuario se almacenan en Firestore bajo `/users/{userId}/`:
- `pantries/` - Despensas del usuario (multi-pantry)
- `pantryItems/` - Items de despensa (cada item tiene `pantryId`)
- `productImages/` - Asociación nombre→imagen (key: nombre en lowercase)
- `cookedRecipes/` - Historial de recetas cocinadas
- `savedRecipes/` - Recetas guardadas por el usuario

### Hooks de Datos

Todos los hooks usan `onSnapshot` para suscripciones en tiempo real con cleanup:
- `usePantryItems(pantryId)` - CRUD de items filtrado por despensa
- `usePantries()` - Gestión multi-pantry con pantry por defecto
- `useSavedRecipes()` / `useCookedRecipes()` - Recetas del usuario
- `useProductImages()` - `getImageForProduct(name)` y `saveProductImage(name, url)` para auto-asociación
- `useProductNames()` - Nombres únicos para autocomplete

### API Routes

Patrones comunes en `/api/`:
- Export `maxDuration` para timeouts de Vercel (30-45s)
- Reciben POST con JSON, retornan `NextResponse.json()`
- Claude a veces retorna JSON envuelto en markdown (`` ```json `` ), se parsea con fallback
- Imágenes enviadas como base64 con media type detection

### Componentes UI

Los componentes base en `/components/ui/` siguen el patrón shadcn/ui (Radix + Tailwind + CVA). Usar estos componentes para mantener consistencia visual.

### Flujo de Escaneo de Productos

`PhotoCapture` → captura cámara o upload → base64 → API vision → `AddItemDialog` con datos pre-llenados. Las imágenes se comprimen a 600px max width, JPEG 0.7 via `compressImageForStorage()`.

### Sistema de Unidades

Unidades válidas: `unidades`, `kg`, `g`, `L`, `ml`, `paquetes`, `latas`, `botellas`

`unitConversion.ts` normaliza a unidades base (kg→g, L→ml) para comparación de disponibilidad en recetas. Solo mass (g/kg) y volume (ml/L) son compatibles entre sí.

### Sidebar Colapsable

La sidebar soporta modo colapsado:
- Estado persistido en `localStorage` key `sidebar-collapsed`
- Comunicación con layout via `CustomEvent("sidebar-toggle")`
- Solo afecta desktop (mobile usa drawer independiente)

### Planificador de Comidas

El endpoint `/api/planner/generate` genera planes de comida con IA:
- Recibe items de despensa y configuración (fechas, tipos de comida, porciones)
- Devuelve `meals[]` (recetas asignadas a fecha + tipo) y `shoppingList[]`
- Para planes grandes (>15 comidas) divide en chunks semanales
- Tipos de comida: desayuno, almuerzo, once, cena, merienda

### Design System

Paleta "Organic Kitchen" con CSS variables en `globals.css`:
- **Primary**: Terracotta `hsl(16, 65%, 50%)`
- **Background**: Warm cream `hsl(40, 33%, 98%)`
- **Sidebar**: Deep herb green `hsl(152, 32%, 14%)` (tokens propios: `--sidebar-*`)
- **Warning**: Amber `hsl(38, 92%, 50%)`

Animaciones: `animate-fade-up`, `animate-fade-in`, `animate-scale-in`, clase `stagger-children` para grids.

## Variables de Entorno

Requiere `.env.local` con:
- Variables `NEXT_PUBLIC_FIREBASE_*` para cliente
- `ANTHROPIC_API_KEY` para servidor

Firebase se inicializa lazy — soporta build sin env vars presentes.
