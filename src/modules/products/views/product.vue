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

const loadDependencies = async () => {
  try {
    const [catRes, uomRes, taxRes] = await Promise.all([
      ProductCategoriesService.browse(),
      UnitsOfMeasureService.browse(),
      TaxesService.browse(),
    ]);
    categorias.value = catRes;
    unidades.value = uomRes;
    impuestos.value = taxRes;
  } catch (e) {
    console.error("Error cargando catálogos secundarios", e);
  }
};

const fetchProductos = async () => {
  try {
    loading.value = true;
    productos.value = await ProductsService.browse();
  } catch (e: any) {
    error.value = "Error al cargar el catálogo de productos";
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
  try {
    processing.value = true;
    if (isEditing.value && selectedId.value) {
      await ProductsService.update(selectedId.value, form.value);
      const index = productos.value.findIndex((p) => p.id === selectedId.value);
      if (index !== -1) {
        const cat = categorias.value.find(
          (c) => c.id === form.value.categoryId,
        );
        const uom = unidades.value.find((u) => u.id === form.value.uomId);

        productos.value[index] = {
          ...productos.value[index],
          ...form.value,
          categoryName: cat ? cat.name : productos.value[index].categoryName,
          uomCode: uom ? uom.code : productos.value[index].uomCode,
        };
      }
    } else {
      await ProductsService.create(form.value);
      await fetchProductos();
    }
    showModal.value = false;
  } catch (e: any) {
    error.value = "Error al procesar el producto";
  } finally {
    processing.value = false;
  }
};

onMounted(() => {
  fetchProductos();
  loadDependencies();
});
</script>

<template>
  <div class="p-8 space-y-8 bg-slate-50 min-h-screen">
    <div class="flex justify-between items-center max-w-7xl mx-auto">
      <div>
        <h1 class="text-3xl font-black text-slate-900 tracking-tight">
          Productos
        </h1>
        <p class="text-slate-500 font-medium">Catálogo General de Cerrajería</p>
      </div>
      <button
        @click="openCreate"
        class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-bold shadow-lg"
      >
        + Nuevo Producto
      </button>
    </div>

    <div
      v-if="loading"
      class="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6"
    >
      <div
        v-for="i in 3"
        :key="i"
        class="h-64 bg-white rounded-3xl animate-pulse"
      ></div>
    </div>

    <div
      v-else
      class="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
    >
      <div
        v-for="item in productos"
        :key="item.id"
        class="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200 flex flex-col justify-between hover:shadow-xl transition-all"
      >
        <div>
          <div class="flex justify-between items-start mb-2">
            <span
              class="text-[10px] font-black text-blue-500 uppercase tracking-widest"
              >{{ item.sku }}</span
            >
            <span
              :class="
                item.isActive
                  ? 'bg-green-50 text-green-600'
                  : 'bg-slate-50 text-slate-400'
              "
              class="px-2 py-1 rounded-lg text-[10px] font-bold uppercase"
            >
              {{ item.isActive ? "Activo" : "Inactivo" }}
            </span>
          </div>
          <h2 class="font-bold text-lg text-slate-800 line-clamp-1">
            {{ item.name }}
          </h2>
          <p class="text-xs text-slate-400 mb-4">
            {{ item.categoryName || "Sin Categoría" }}
          </p>

          <div class="flex items-baseline gap-2 mb-4">
            <span class="text-2xl font-black text-slate-900"
              >${{ item.basePrice }}</span
            >
            <span class="text-xs text-slate-400 font-medium"
              >/ {{ item.uomCode }}</span
            >
          </div>
        </div>
        <div class="flex justify-end border-t border-slate-50 pt-4">
          <button
            @click="openEdit(item)"
            class="text-blue-600 font-black text-xs hover:underline"
          >
            EDITAR PRODUCTO
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="showModal"
      class="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-6"
    >
      <div
        class="bg-white rounded-[2.5rem] p-10 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
      >
        <h2 class="text-2xl font-black mb-6 text-slate-900">
          {{ isEditing ? "Editar" : "Nuevo" }} Producto
        </h2>

        <form @submit.prevent="handleSubmit" class="space-y-6">
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1">
              <label class="text-xs font-black text-slate-400 uppercase ml-1"
                >Nombre</label
              >
              <input
                v-model="form.name"
                type="text"
                required
                class="w-full p-3 bg-slate-50 border-2 border-slate-100 rounded-xl outline-none focus:border-blue-500 transition-all"
              />
            </div>
            <div class="space-y-1">
              <label class="text-xs font-black text-slate-400 uppercase ml-1"
                >SKU</label
              >
              <input
                v-model="form.sku"
                type="text"
                required
                class="w-full p-3 bg-slate-50 border-2 border-slate-100 rounded-xl outline-none focus:border-blue-500 transition-all"
              />
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="space-y-1">
              <label class="text-xs font-black text-slate-400 uppercase ml-1"
                >Categoría</label
              >
              <select
                v-model="form.categoryId"
                required
                class="w-full p-3 bg-slate-50 border-2 border-slate-100 rounded-xl outline-none focus:border-blue-500 appearance-none"
              >
                <option value="" disabled>Seleccione...</option>
                <option v-for="cat in categorias" :key="cat.id" :value="cat.id">
                  {{ cat.name }}
                </option>
              </select>
            </div>

            <div class="space-y-1">
              <label class="text-xs font-black text-slate-400 uppercase ml-1"
                >Unidad (UOM)</label
              >
              <select
                v-model="form.uomId"
                required
                class="w-full p-3 bg-slate-50 border-2 border-slate-100 rounded-xl outline-none focus:border-blue-500 appearance-none"
              >
                <option value="" disabled>Seleccione...</option>
                <option v-for="uom in unidades" :key="uom.id" :value="uom.id">
                  {{ uom.code }} - {{ uom.name }}
                </option>
              </select>
            </div>

            <div class="space-y-1">
              <label class="text-xs font-black text-slate-400 uppercase ml-1"
                >Impuesto</label
              >
              <select
                v-model="form.taxId"
                required
                class="w-full p-3 bg-slate-50 border-2 border-slate-100 rounded-xl outline-none focus:border-blue-500 appearance-none"
              >
                <option value="" disabled>Seleccione...</option>
                <option v-for="tax in impuestos" :key="tax.id" :value="tax.id">
                  {{ tax.name }} ({{ tax.percentage }}%)
                </option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1">
              <label class="text-xs font-black text-slate-400 uppercase ml-1"
                >Precio Base</label
              >
              <input
                v-model="form.basePrice"
                type="number"
                step="0.01"
                class="w-full p-3 bg-slate-50 border-2 border-slate-100 rounded-xl outline-none focus:border-blue-500"
              />
            </div>
            <div class="space-y-1">
              <label class="text-xs font-black text-slate-400 uppercase ml-1"
                >Costo Promedio</label
              >
              <input
                v-model="form.averageCost"
                type="number"
                step="0.01"
                class="w-full p-3 bg-slate-50 border-2 border-slate-100 rounded-xl outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div class="flex gap-4 pt-4">
            <button
              type="button"
              @click="showModal = false"
              class="flex-1 py-4 text-slate-400 font-bold hover:bg-slate-50 rounded-2xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              :disabled="processing"
              class="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black shadow-lg hover:bg-blue-700 transition-all"
            >
              {{ processing ? "PROCESANDO..." : "GUARDAR PRODUCTO" }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
