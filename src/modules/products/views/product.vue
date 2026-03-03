<script setup lang="ts">
import { ref, onMounted } from "vue";
import { ProductsService } from "@/core/services/productsService";
import { ProductCategoriesService } from "@/core/services/productCategoriesService";
import { UnitsOfMeasureService } from "@/core/services/unitsOfMeasureService";
import { TaxesService } from "@/core/services/taxesService";

import type { Product, ProductCreateRequest } from "@/core/interfaces/products";
import type { ProductCategory } from "@/core/interfaces/productCategories";
import type { UnitOfMeasure } from "@/core/interfaces/unitsOfMeasure";
import type { Tax } from "@/core/interfaces/taxes";

const productos = ref<Product[]>([]);
const categorias = ref<ProductCategory[]>([]);
const unidades = ref<UnitOfMeasure[]>([]);
const impuestos = ref<Tax[]>([]);

const loading = ref(true);
const processing = ref(false);
const error = ref("");
const showModal = ref(false);
const isEditing = ref(false);
const selectedId = ref<string | null>(null);

const form = ref<ProductCreateRequest>({
  sku: "",
  barcode: "",
  name: "",
  description: "",
  categoryId: "",
  uomId: "",
  taxId: "",
  basePrice: 0,
  averageCost: 0,
  isService: false,
  isActive: true,
});

const loadAllData = async () => {
  try {
    loading.value = true;
    const [prodRes, catRes, uomRes, taxRes] = await Promise.all([
      ProductsService.browse(),
      ProductCategoriesService.browse(),
      UnitsOfMeasureService.browse(),
      TaxesService.browse(),
    ]);
    productos.value = prodRes;
    categorias.value = catRes;
    unidades.value = uomRes;
    impuestos.value = taxRes;
  } catch (e: any) {
    error.value = "Error al sincronizar datos.";
  } finally {
    loading.value = false;
  }
};

const openCreate = () => {
  isEditing.value = false;
  selectedId.value = null;
  form.value = {
    sku: "",
    barcode: "",
    name: "",
    description: "",
    categoryId: "",
    uomId: "",
    taxId: "",
    basePrice: 0,
    averageCost: 0,
    isService: false,
    isActive: true,
  };
  showModal.value = true;
};

const openEdit = (item: Product) => {
  isEditing.value = true;
  selectedId.value = item.id;
  form.value = {
    sku: item.sku,
    barcode: item.barcode,
    name: item.name,
    description: item.description,
    categoryId: item.categoryId,
    uomId: item.uomId,
    taxId: item.taxId,
    basePrice: item.basePrice,
    averageCost: item.averageCost,
    isService: item.isService,
    isActive: item.isActive,
  };
  showModal.value = true;
};

const handleSubmit = async () => {
  if (!form.value.categoryId || !form.value.uomId || !form.value.taxId) {
    error.value =
      "Por favor, seleccione una Categoría, Unidad e Impuesto válidos.";
    return;
  }

  try {
    processing.value = true;
    error.value = "";

    const payload = {
      ...form.value,
      basePrice: Number(form.value.basePrice),
      averageCost: Number(form.value.averageCost),
    };

    if (isEditing.value && selectedId.value) {
      await ProductsService.update(selectedId.value, payload);
      const index = productos.value.findIndex((p) => p.id === selectedId.value);
      if (index !== -1) {
        const cat = categorias.value.find((c) => c.id === payload.categoryId);
        const uom = unidades.value.find((u) => u.id === payload.uomId);
        productos.value[index] = {
          ...productos.value[index],
          ...payload,
          categoryName: cat?.name || "",
          uomCode: uom?.code || "",
        };
      }
    } else {
      await ProductsService.create(payload);
      productos.value = await ProductsService.browse();
    }
    showModal.value = false;
  } catch (e: any) {
    error.value =
      "Error de formato: Asegúrese de seleccionar todas las opciones desplegables.";
    console.error(e);
  } finally {
    processing.value = false;
  }
};

onMounted(loadAllData);
</script>

<template>
  <div class="p-8 space-y-8 bg-slate-50 min-h-screen">
    <div class="flex justify-between items-center max-w-7xl mx-auto">
      <h1 class="text-3xl font-black text-slate-900">Productos</h1>
      <button
        @click="openCreate"
        class="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold"
      >
        + Nuevo
      </button>
    </div>

    <div
      v-if="error"
      class="max-w-7xl mx-auto bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded shadow"
    >
      <p class="font-bold">Error de validación:</p>
      <p>{{ error }}</p>
    </div>

    <div
      v-if="!loading"
      class="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6"
    >
      <div
        v-for="item in productos"
        :key="item.id"
        class="bg-white p-6 rounded-3xl border shadow-sm"
      >
        <h3 class="font-bold text-lg">{{ item.name }}</h3>
        <p class="text-gray-500 text-sm">{{ item.categoryName }}</p>
        <div class="mt-4 flex justify-between items-center">
          <span class="font-black text-xl">${{ item.basePrice }}</span>
          <button
            @click="openEdit(item)"
            class="text-blue-600 font-bold text-sm"
          >
            EDITAR
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="showModal"
      class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    >
      <div
        class="bg-white rounded-[2rem] p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
      >
        <h2 class="text-2xl font-black mb-6">
          {{ isEditing ? "Editar" : "Nuevo" }} Producto
        </h2>

        <form
          @submit.prevent="handleSubmit"
          class="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <input
            v-model="form.name"
            placeholder="Nombre"
            required
            class="p-3 bg-gray-50 border rounded-xl outline-none focus:border-blue-500"
          />
          <input
            v-model="form.sku"
            placeholder="SKU"
            required
            class="p-3 bg-gray-50 border rounded-xl outline-none focus:border-blue-500"
          />

          <div class="flex flex-col gap-1">
            <label class="text-[10px] font-bold text-gray-400 uppercase ml-1"
              >Categoría</label
            >
            <select
              v-model="form.categoryId"
              required
              class="p-3 bg-gray-50 border rounded-xl"
            >
              <option value="" disabled>Seleccione Categoría</option>
              <option v-for="cat in categorias" :key="cat.id" :value="cat.id">
                {{ cat.name }}
              </option>
            </select>
          </div>

          <div class="flex flex-col gap-1">
            <label class="text-[10px] font-bold text-gray-400 uppercase ml-1"
              >Unidad (UOM)</label
            >
            <select
              v-model="form.uomId"
              required
              class="p-3 bg-gray-50 border rounded-xl"
            >
              <option value="" disabled>Seleccione Unidad</option>
              <option v-for="uom in unidades" :key="uom.id" :value="uom.uomId">
                {{ uom.name }}
              </option>
            </select>
          </div>

          <div class="flex flex-col gap-1 md:col-span-2">
            <label class="text-[10px] font-bold text-gray-400 uppercase ml-1"
              >Impuesto</label
            >
            <select
              v-model="form.taxId"
              required
              class="p-3 bg-gray-50 border rounded-xl"
            >
              <option value="" disabled>Seleccione Impuesto</option>
              <option v-for="tax in impuestos" :key="tax.id" :value="tax.taxId">
                {{ tax.name }} ({{ tax.percentage }}%)
              </option>
            </select>
          </div>

          <input
            v-model="form.basePrice"
            type="number"
            step="0.01"
            placeholder="Precio"
            class="p-3 bg-gray-50 border rounded-xl"
          />
          <input
            v-model="form.averageCost"
            type="number"
            step="0.01"
            placeholder="Costo"
            class="p-3 bg-gray-50 border rounded-xl"
          />

          <div class="md:col-span-2 flex justify-end gap-3 mt-6">
            <button
              type="button"
              @click="showModal = false"
              class="px-6 py-2 text-gray-400 font-bold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              :disabled="processing"
              class="px-10 py-2 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-100"
            >
              {{ processing ? "Guardando..." : "Guardar Producto" }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
