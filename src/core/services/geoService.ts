export type GeoOption = {
  id: number;
  name: string;
};

type GeoCrProvinceResponse = {
  idProvincia: number;
  descripcion: string;
};

type GeoCrCantonResponse = {
  idCanton: number;
  descripcion: string;
};

type GeoCrDistrictResponse = {
  idDistrito: number;
  descripcion: string;
};

type PaginatedPayload<T> = {
  data?: T[];
  results?: T[];
  result?: T[];
  provincias?: T[];
  cantones?: T[];
  distritos?: T[];
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
  pagination?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
};

const API_BASE_URL = "https://api-geo-cr.vercel.app";

async function safeFetch<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Geo API request failed with status ${response.status}`);
  }

  return (await response.json()) as T;
}

function extractArray<T>(payload: T[] | PaginatedPayload<T>): T[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload.data)) {
    return payload.data;
  }

  if (Array.isArray(payload.results)) {
    return payload.results;
  }

  if (Array.isArray(payload.result)) {
    return payload.result;
  }

  if (Array.isArray(payload.provincias)) {
    return payload.provincias;
  }

  if (Array.isArray(payload.cantones)) {
    return payload.cantones;
  }

  if (Array.isArray(payload.distritos)) {
    return payload.distritos;
  }

  return [];
}

function extractTotalPages<T>(payload: T[] | PaginatedPayload<T>): number {
  if (Array.isArray(payload)) {
    return 1;
  }

  return payload.meta?.totalPages ?? payload.pagination?.totalPages ?? 1;
}

async function fetchAllPages<T>(baseUrl: string): Promise<T[]> {
  const firstPayload = await safeFetch<T[] | PaginatedPayload<T>>(baseUrl);
  const firstItems = extractArray(firstPayload);
  const totalPages = extractTotalPages(firstPayload);

  if (totalPages <= 1) {
    return firstItems;
  }

  const allItems = [...firstItems];

  for (let page = 2; page <= totalPages; page += 1) {
    const separator = baseUrl.includes("?") ? "&" : "?";
    const payload = await safeFetch<T[] | PaginatedPayload<T>>(
      `${baseUrl}${separator}page=${page}`,
    );

    allItems.push(...extractArray(payload));
  }

  return allItems;
}

export const GeoService = {
  async getProvinces(): Promise<GeoOption[]> {
    const items = await fetchAllPages<GeoCrProvinceResponse>(
      `${API_BASE_URL}/provincias`,
    );

    return items.map((item) => ({
      id: Number(item.idProvincia),
      name: item.descripcion,
    }));
  },

  async getCantonsByProvince(provinceId: number): Promise<GeoOption[]> {
    const items = await fetchAllPages<GeoCrCantonResponse>(
      `${API_BASE_URL}/provincias/${provinceId}/cantones`,
    );

    return items.map((item) => ({
      id: Number(item.idCanton),
      name: item.descripcion,
    }));
  },

  async getDistrictsByCanton(cantonId: number): Promise<GeoOption[]> {
    const items = await fetchAllPages<GeoCrDistrictResponse>(
      `${API_BASE_URL}/cantones/${cantonId}/distritos`,
    );

    return items.map((item) => ({
      id: Number(item.idDistrito),
      name: item.descripcion,
    }));
  },
};
