# 🔧 Sistema Interno IT - Pretensa & Paschini

Sistema integral de gestión tecnológica desarrollado con Next.js, React, Electron y tecnologías modernas.

## ✨ Características

### 📊 **Módulos de Gestión**
- **👥 Empleados** - Vista 360° con equipos y solicitudes asociadas
- **💻 Equipos** - Inventario completo de hardware especializado
- **📦 Inventario** - Componentes, cables y accesorios
- **🖨️ Impresoras** - Dispositivos, consumibles y reemplazos
- **👤 Usuarios** - Cuentas Windows, QNAP, Calipso y Email
- **💾 Backups** - Registro y monitoreo de respaldos
- **🛒 Compras** - Solicitudes y prioridades
- **🎫 Solicitudes** - Sistema de tickets y soporte técnico

### 🚀 **Tecnologías**
- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS, Framer Motion
- **Base de Datos**: Prisma ORM
- **Desktop**: Electron 38
- **Mobile**: Capacitor (iOS/Android)
- **Export**: Excel/PDF profesional

### ⚡ **Optimizaciones**
- SWR para caché inteligente
- React.memo, useCallback, useMemo
- Filtrado debounced
- Animaciones optimizadas
- Build production-ready

## 🔧 Comandos

### Desarrollo
```bash
npm run dev          # Desarrollo web (puerto 4250)
npm run electron:dev # Desarrollo con Electron
```

### Producción
```bash
npm run build:installer  # Build completo + instalador Windows
npm run build:ios        # Build iOS con Capacitor  
npm run build:android    # Build Android con Capacitor
```

### Utilidades
```bash
npm run lint        # Linting
npm run prisma:*    # Comandos de base de datos
```

## 📁 Estructura

```
├── app/                # Rutas de Next.js
├── components/         # Componentes reutilizables
├── lib/               # Utilidades y hooks
├── prisma/            # Esquema de base de datos
├── electron/          # Configuración de Electron
├── scripts/           # Scripts de build
├── installer/         # Configuración de instaladores
└── public/           # Recursos estáticos
```

## 🚀 Builds Disponibles

- **Windows**: Instalador NSIS + Portable
- **iOS**: App Store + TestFlight
- **Android**: APK + Play Store

## 📱 Responsive Design

- Desktop optimizado
- Tablet adaptativo  
- Mobile con menú hamburguesa
- Tablas → Cards en móvil

## 🎨 Animaciones

- Transiciones fluidas con Framer Motion
- Shaders personalizados con Paper Design
- Círculo pulsante de ayuda
- AnimatedContainer en todas las páginas

---

**⚡ Generado con Claude Code** - Sistema optimizado para máximo rendimiento y compatibilidad.
