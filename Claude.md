# Despensa Inteligente (Claude Pantry App)

Aplicación de gestión de despensa con inteligencia artificial para identificación de productos y generación de recetas.

## Tecnologías

- **Framework**: Next.js 14.2.35 (App Router)
- **UI**: React 18, TypeScript 5, Tailwind CSS 3.4.1
- **Componentes**: Radix UI, Lucide React (iconos)
- **Backend**: Firebase (Auth, Firestore, Storage)
- **IA**: Anthropic Claude API (claude-sonnet-4-20250514)

## Inicio Rápido

### Requisitos Previos

1. Node.js instalado
2. Cuenta de Firebase con proyecto configurado
3. API Key de Anthropic

### Variables de Entorno

Crear archivo `.env.local` en la raíz del proyecto:

```env
# Firebase (públicas - cliente)
NEXT_PUBLIC_FIREBASE_API_KEY=tu_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu_proyecto
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu_proyecto.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=tu_app_id

# Anthropic (servidor)
ANTHROPIC_API_KEY=tu_anthropic_api_key
```

### Instalación y Ejecución

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Acceder en http://localhost:3000
```

### Scripts Disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm start` | Servidor de producción |
| `npm run lint` | Ejecutar ESLint |

## Estructura del Proyecto

```
/src
  /app
    /(auth)/              # Rutas de autenticación
      /login              # Página de login
      /register           # Página de registro
    /(dashboard)/         # Rutas protegidas
      /inventory          # Gestión de despensa
      /recipes            # Generación de recetas
      /settings           # Configuración de cuenta
    /api/                 # API Routes
      /vision/identify    # Identificar producto por imagen
      /vision/scan-receipt # Escanear ticket de compra
      /recipes/generate   # Generar recetas con IA

  /components
    /ui/                  # Componentes base (button, card, dialog, etc.)
    /shared/              # Componentes compartidos (ProtectedRoute, Sidebar)
    /inventory/           # Componentes de inventario
    /recipes/             # Componentes de recetas

  /contexts
    /AuthContext.tsx      # Contexto de autenticación

  /hooks
    /usePantryItems.ts    # Hook para items de despensa
    /useCookedRecipes.ts  # Hook para historial de recetas
    /use-toast.ts         # Hook para notificaciones

  /lib
    /firebase.ts          # Configuración de Firebase
    /anthropic.ts         # Cliente de Anthropic
    /utils.ts             # Utilidades generales

  /types
    /index.ts             # Definiciones de tipos TypeScript
```

## Funcionalidades

### Gestión de Inventario

- Agregar items manualmente
- Escanear productos con cámara (visión IA)
- Escanear tickets de compra para importar items en lote
- Editar cantidad, unidad y fecha de caducidad
- Eliminar items
- Buscar y filtrar items
- Alertas de productos por vencer/vencidos

**Unidades soportadas**: unidades, kg, g, L, ml, paquetes, latas, botellas

### Generación de Recetas (IA)

- Genera 3 recetas basadas en items disponibles
- Asegura al menos 80% de ingredientes disponibles
- Filtros: tiempo de preparación, dificultad, tipo de cocina, restricciones dietéticas
- Marcar recetas como "cocinadas" (deduce ingredientes automáticamente)
- Muestra porcentaje de disponibilidad e ingredientes faltantes

### Autenticación

- Registro con email/contraseña
- Login/Logout
- Actualización de perfil
- Cambio de contraseña
- Datos aislados por usuario

## Base de Datos (Firestore)

```
/users/{userId}
  - email, name, createdAt
  /pantryItems/{itemId}
    - name, quantity, unit, expirationDate, addedAt, imageUrl
  /cookedRecipes/{recipeId}
    - recipeName, ingredients[], cookedAt
```

## API Endpoints

### POST /api/vision/identify
Identifica un producto a partir de una imagen.
- **Body**: `{ image: string }` (base64)
- **Response**: `{ name, quantity, unit, confidence }`

### POST /api/vision/scan-receipt
Extrae productos de un ticket de compra.
- **Body**: `{ image: string }` (base64)
- **Response**: `{ items: [{ name, quantity, unit, confidence }] }`

### POST /api/recipes/generate
Genera recetas basadas en la despensa.
- **Body**: `{ pantryItems: [], filters?: { maxTime, difficulty, cuisine, tags } }`
- **Response**: `{ recipes: [...] }`

## Flujo de Trabajo

1. Usuario se registra/inicia sesión
2. Redirige a `/inventory` (dashboard principal)
3. Agrega items a la despensa (manual o escaneo)
4. Va a `/recipes` para generar sugerencias
5. Cocina una receta → ingredientes se descuentan automáticamente
6. Gestiona perfil en `/settings`
