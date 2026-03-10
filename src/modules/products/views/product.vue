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
  form.value = { ...item };
  showModal.value = true;
};

const handleSubmit = async () => {
  if (!form.value.categoryId || !form.value.uomId || !form.value.taxId) {
    error.value = "Seleccione Categoría, Unidad e Impuesto.";
    return;
  }
  try {
    processing.value = true;
    const payload = {
      ...form.value,
      basePrice: Number(form.value.basePrice),
      averageCost: Number(form.value.averageCost),
    };
    if (isEditing.value && selectedId.value) {
      await ProductsService.update(selectedId.value, payload);
    } else {
      await ProductsService.create(payload);
    }
    await loadAllData();
    showModal.value = false;
  } catch (e: any) {
    error.value = "Error al guardar el producto.";
  } finally {
    processing.value = false;
  }
};

const handleDelete = async (id: string) => {
  if (!confirm("¿Está seguro de eliminar este producto?")) return;
  try {
    processing.value = true;
    await ProductsService.delete(id);
    productos.value = productos.value.filter((p) => p.id !== id);
  } catch (e: any) {
    error.value = "No se pudo eliminar el producto.";
  } finally {
    processing.value = false;
  }
};

onMounted(loadAllData);
</script>

<template>
  <div class="p-8 space-y-8 bg-slate-50 min-h-screen">
    <div class="flex justify-between items-center max-w-7xl mx-auto">
      <h1 class="text-3xl font-black text-slate-900">Inventario</h1>
      <button
        @click="openCreate"
        class="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-blue-700 transition-colors"
      >
        + Nuevo Producto
      </button>
    </div>

    <div
      v-if="error"
      class="max-w-7xl mx-auto bg-red-50 text-red-700 p-4 rounded-xl border-l-4 border-red-500 font-bold"
    >
      {{ error }}
    </div>

    <div
      v-if="!loading"
      class="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
    >
      <div
        v-for="item in productos"
        :key="item.id"
        class="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-between"
      >
        <div class="space-y-4">
          <span
            :class="
              item.isActive
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-500'
            "
            class="text-[10px] uppercase font-black px-3 py-1 rounded-full"
          >
            {{ item.isActive ? "Activo" : "Inactivo" }}
          </span>
          <div>
            <h3 class="font-black text-xl text-slate-800">{{ item.name }}</h3>
            <p class="text-slate-400 text-xs uppercase tracking-wider">
              {{ item.categoryName || "Sin Categoría" }}
            </p>
          </div>
        </div>
        <div class="mt-6 flex justify-between items-center border-t pt-4">
          <button
            @click="handleDelete(item.id)"
            class="text-red-400 hover:text-red-600 font-bold text-xs uppercase"
          >
            Eliminar
          </button>
          <button
            @click="openEdit(item)"
            class="text-blue-600 font-black text-sm hover:underline"
          >
            EDITAR
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="showModal"
      class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
    >
      <div
        class="bg-white rounded-[2rem] p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
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
            class="p-3 bg-slate-50 border rounded-xl"
          />
          <input
            v-model="form.sku"
            placeholder="SKU"
            required
            class="p-3 bg-slate-50 border rounded-xl"
          />

          <select
            v-model="form.categoryId"
            required
            class="p-3 bg-slate-50 border rounded-xl"
          >
            <option value="" disabled>Seleccione Categoría</option>
            <option
              v-for="cat in categorias"
              :key="cat.categoryId"
              :value="cat.categoryId"
            >
              {{ cat.name }}
            </option>
          </select>

          <select
            v-model="form.uomId"
            required
            class="p-3 bg-slate-50 border rounded-xl"
          >
            <option value="" disabled>Seleccione Unidad</option>
            <option v-for="uom in unidades" :key="uom.uomId" :value="uom.uomId">
              {{ uom.name }}
            </option>
          </select>

          <select
            v-model="form.taxId"
            class="p-3 bg-slate-50 border rounded-xl md:col-span-2"
          >
            <option value="" disabled>Seleccione Impuesto</option>
            <option
              v-for="tax in impuestos"
              :key="tax.taxId"
              :value="tax.taxId"
            >
              {{ tax.name }}
            </option>
          </select>

          <input
            v-model="form.basePrice"
            type="number"
            placeholder="Precio Base"
            class="p-3 bg-slate-50 border rounded-xl"
          />
          <input
            v-model="form.averageCost"
            type="number"
            placeholder="Costo Promedio"
            class="p-3 bg-slate-50 border rounded-xl"
          />

          <div class="md:col-span-2 flex gap-4">
            <label
              ><input type="checkbox" v-model="form.isService" />
              ¿Servicio?</label
            >
            <label
              ><input type="checkbox" v-model="form.isActive" /> Activo</label
            >
          </div>

          <div class="md:col-span-2 flex justify-end gap-3 mt-6">
            <button type="button" @click="showModal = false" class="px-6 py-2">
              Cancelar
            </button>
            <button
              type="submit"
              :disabled="processing"
              class="px-10 py-2 bg-blue-600 text-white rounded-xl font-bold"
            >
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
