// Áreas de la empresa - Lista completa y unificada
export const AREAS = [
  "RRHH",
  "sistemas", 
  "compras",
  "calidad",
  "finanzas", 
  "directorio",
  "tecnica pretensa",
  "tecnica paschini",
  "ventas",
  "produccion", 
  "logistica",
  "laboratorio",
  "taller pretensa", 
  "taller paschini",
  "pañol",
  "mantenimiento",
  "proveedores",
  "recepcion",
  "guardia",
  "planta hormigonera",
  "comedor"
] as const

// Para Select/SearchableSelect components (formato { value, label })
export const AREA_OPTIONS = AREAS.map(area => ({
  value: area,
  label: area.charAt(0).toUpperCase() + area.slice(1) // Capitalizar primera letra
}))

// Alias para compatibilidad con código existente
export const FIXED_AREAS = AREAS