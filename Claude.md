# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Comandos

```bash
npm run dev      # Servidor de desarrollo (http://localhost:3000)
npm run build    # Build de producción
npm run lint     # Ejecutar ESLint
```

## Arquitectura

Aplicación Next.js 14 (App Router) para gestión de despensa con IA.

### Stack
- **Frontend**: React 18, TypeScript, Tailwind CSS, Radix UI
- **Backend**: Firebase (Auth, Firestore), API Routes de Next.js
- **IA**: Anthropic Claude API para visión y generación de recetas

### Estructura de Rutas

```
/src/app
  /(auth)/          # Login, registro (públicas)
  /(dashboard)/     # Inventory, recipes, planner, settings (protegidas por AuthContext)
  /api/             # Endpoints del servidor
    /vision/        # Identificar productos y escanear tickets
    /recipes/       # Generación de recetas con IA
    /planner/       # Generación de planes de comida con IA
```

### Patron de Datos

Los datos del usuario se almacenan en Firestore bajo `/users/{userId}/`:
- `pantries/` - Despensas del usuario (multi-pantry)
- `pantryItems/` - Items de despensa (cada item tiene `pantryId`)
- `cookedRecipes/` - Historial de recetas cocinadas
- `savedRecipes/` - Recetas guardadas por el usuario

Hooks personalizados (`usePantryItems`, `usePantries`, `useSavedRecipes`) manejan CRUD con suscripciones en tiempo real. `PantryContext` provee la despensa activa a todo el dashboard.

### Componentes UI

Los componentes base en `/components/ui/` siguen el patrón shadcn/ui (Radix + Tailwind). Usar estos componentes para mantener consistencia visual.

### API de Vision

Los endpoints `/api/vision/*` reciben imágenes en base64 y usan Claude para:
- Identificar productos individuales
- Extraer múltiples productos de tickets de compra

### Planificador de Comidas

El endpoint `/api/planner/generate` genera planes de comida con IA:
- Recibe items de despensa y configuración (fechas, tipos de comida, porciones)
- Devuelve `meals[]` (recetas asignadas a fecha + tipo) y `shoppingList[]`
- Para planes grandes (>15 comidas) divide en chunks semanales
- Soporta regenerar comidas individuales enviando config de 1 día y 1 tipo

### Sidebar Colapsable

La sidebar (`src/components/shared/Sidebar.tsx`) soporta modo colapsado:
- Estado persistido en `localStorage` key `sidebar-collapsed`
- Comunicación con layout via `CustomEvent("sidebar-toggle")`
- Solo afecta desktop (mobile usa drawer independiente)

### Unidades Válidas

Al agregar items: `unidades`, `kg`, `g`, `L`, `ml`, `paquetes`, `latas`, `botellas`

## Variables de Entorno

Requiere `.env.local` con:
- Variables `NEXT_PUBLIC_FIREBASE_*` para cliente
- `ANTHROPIC_API_KEY` para servidor
