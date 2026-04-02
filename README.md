# TeloVendo - Gestión Avanzada de Bots para Marketplace

TeloVendo es una plataforma industrial diseñada para maximizar el alcance en Facebook Marketplace mediante la automatización estratégica de publicaciones. Permite crear órdenes masivas que son ejecutadas por bots especializados para posicionar productos de forma eficiente y a gran escala.

## Características Principales

- **Publicación Masiva**: Automatiza la creación de cientos de publicaciones con un solo clic.
- **Gestión de Bots**: Controla y monitorea la actividad de los bots en tiempo real.
- **Alcance Geográfico**: Posiciona tus productos en múltiples zonas sin esfuerzo manual.
- **Evasión de Spam**: Algoritmos inteligentes para replicar contenido de forma orgánica.

## Stack Tecnológico

- **Frontend**: [Next.js 16](https://nextjs.org) (App Router), TypeScript, Tailwind CSS.
- **Componentes**: shadcn/ui & Radix UI.
- **Base de Datos**: Prisma ORM con PostgreSQL.
- **Iconografía**: Lucide React.

## Comenzar

Primero, instala las dependencias:

```bash
npm install
```

Luego, configura tu base de datos en el archivo `.env` y ejecuta las migraciones de Prisma:

```bash
npx prisma migrate dev
```

Inicia el servidor de desarrollo:

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador para ver el resultado.

## Estructura del Proyecto

- `/app`: Rutas del App Router y componentes de página.
- `/components`: Componentes de UI reutilizables (shadcn).
- `/lib`: Utilidades, clientes de base de datos y acciones del servidor.
- `/prisma`: Esquema de la base de datos y migraciones.
