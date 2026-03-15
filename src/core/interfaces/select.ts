export interface SelectQuery {
  search?: string;
  onlyActive?: boolean;
}

export interface SelectOption {
  id: string;
  label: string;
  code: string;
}
