export interface SelectQuery {
  search?: string;
  onlyActive?: boolean;
}

export interface SelectOption {
  id: string;
  label: string;
  /** Opcional: el backend lo declara como `string?` y puede venir nulo. */
  code?: string;
}
