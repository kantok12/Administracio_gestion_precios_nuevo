export interface Product {
  codigo_producto: string;
  nombre_del_producto: string;
  Descripcion?: string;
  Modelo?: string;
  categoria?: string;
  pf_eur?: string | number;
  dimensiones?: string;
  // Campos opcionales adicionales
  ay?: string;
  transporte_nacional?: string;
  PESO?: string;
}