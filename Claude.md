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
  /(dashboard)/     # Inventory, recipes, settings (protegidas por AuthContext)
  /api/             # Endpoints del servidor
```

### Patron de Datos

Los datos del usuario se almacenan en Firestore bajo `/users/{userId}/`:
- `pantryItems/` - Items de despensa
- `cookedRecipes/` - Historial de recetas cocinadas

Hooks personalizados (`usePantryItems`, `useCookedRecipes`) manejan CRUD con suscripciones en tiempo real.

### Componentes UI

Los componentes base en `/components/ui/` siguen el patrón shadcn/ui (Radix + Tailwind). Usar estos componentes para mantener consistencia visual.

### API de Vision

Los endpoints `/api/vision/*` reciben imágenes en base64 y usan Claude para:
- Identificar productos individuales
- Extraer múltiples productos de tickets de compra

### Unidades Válidas

Al agregar items: `unidades`, `kg`, `g`, `L`, `ml`, `paquetes`, `latas`, `botellas`

## Variables de Entorno

Requiere `.env.local` con:
- Variables `NEXT_PUBLIC_FIREBASE_*` para cliente
- `ANTHROPIC_API_KEY` para servidor
