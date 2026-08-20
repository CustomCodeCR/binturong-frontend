/**
 * Contrato común de los menús de acciones de fila.
 *
 * Cada módulo declaraba su propia copia de esta interfaz, así que las opciones
 * marcadas como `disabled` en las vistas se ignoraban y quedaban clicables.
 */
export interface ActionItem {
  label: string;
  action: () => void | Promise<void>;
  /** Resalta la opción como destructiva (rojo). */
  danger?: boolean;
  /** Desactiva la opción sin quitarla del menú. */
  disabled?: boolean;
}
