<script setup lang="ts">
import { ref, onMounted } from "vue";
import { ProductCategoriesService } from "@/core/services/productCategoriesService";
import type {
  ProductCategory,
  ProductCategoryCreateRequest,
} from "@/core/interfaces/productCategories";

const inventario = ref<ProductCategory[]>([]);
const loading = ref(true);
const processing = ref(false);
const error = ref("");
const showModal = ref(false);
const isEditing = ref(false);
const selectedId = ref<string | null>(null);

const form = ref<ProductCategoryCreateRequest>({
  name: "",
  description: "",
  isActive: true,
});

const fetchInventario = async () => {
  try {
    loading.value = true;
    inventario.value = await ProductCategoriesService.browse();
  } catch (e: any) {
    error.value = "Error al conectar con la API";
  } finally {
    loading.value = false;
  }
};

const openCreate = () => {
  isEditing.value = false;
  selectedId.value = null;
  form.value = { name: "", description: "", isActive: true };
  showModal.value = true;
};

const openEdit = (item: ProductCategory) => {
  isEditing.value = true;
  selectedId.value = item.id;
  form.value = {
    name: item.name,
    description: item.description,
    isActive: item.isActive,
  };
  showModal.value = true;
};

const handleSubmit = async () => {
  if (!form.value.name) return;

  try {
    processing.value = true;
    error.value = "";

    if (isEditing.value && selectedId.value) {
      await ProductCategoriesService.update(selectedId.value, form.value);
      const index = inventario.value.findIndex(
        (c) => c.id === selectedId.value,
      );
      if (index !== -1) {
        inventario.value[index] = { ...inventario.value[index], ...form.value };
      }
    } else {
      await ProductCategoriesService.create(form.value);
      await fetchInventario();
    }
    showModal.value = false;
  } catch (e: any) {
    error.value = "No se pudo guardar la información.";
  } finally {
    processing.value = false;
  }
};

const handleDelete = async (id: string) => {
  if (
    !confirm(
      "¿Seguro que deseas eliminar esta categoría? Esta acción no se puede deshacer.",
    )
  )
    return;

  try {
    processing.value = true;
    await ProductCategoriesService.delete(id);
    inventario.value = inventario.value.filter((c) => c.id !== id);
  } catch (e: any) {
    error.value =
      "No se pudo eliminar la categoría. Es posible que tenga productos asociados.";
  } finally {
    processing.value = false;
  }
};

onMounted(fetchInventario);
</script>

<template>
  <div class="p-8 space-y-8 bg-slate-50 min-h-screen">
    <div class="flex justify-between items-center max-w-7xl mx-auto">
      <div>
        <h1 class="text-3xl font-black text-slate-900 tracking-tight">
          Categorías de Inventario
        </h1>
        <p class="text-slate-500 font-medium">Cerrajería Calderón</p>
      </div>
      <button
        @click="openCreate"
        class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-blue-200 transition-all active:scale-95"
      >
        + Nueva Categoría
      </button>
    </div>

    <div
      v-if="error"
      class="max-w-7xl mx-auto bg-red-50 border border-red-200 text-red-600 p-4 rounded-2xl font-semibold"
    >
      {{ error }}
    </div>

    <div
      v-if="!loading"
      class="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
    >
      <div
        v-for="item in inventario"
        :key="item.id"
        class="bg-white p-7 rounded-[2rem] shadow-sm border border-slate-200 hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
      >
        <div>
          <div class="flex justify-between items-start mb-4">
            <h2 class="font-bold text-xl text-slate-800">{{ item.name }}</h2>
            <span
              :class="
                item.isActive
                  ? 'text-green-600 bg-green-50'
                  : 'text-slate-400 bg-slate-100'
              "
              class="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter"
            >
              {{ item.isActive ? "Activo" : "Inactivo" }}
            </span>
          </div>
          <p
            class="text-sm text-slate-500 mb-8 line-clamp-2 leading-relaxed h-10"
          >
            {{ item.description || "Sin descripción" }}
          </p>
        </div>

        <div
          class="flex justify-between items-center border-t border-slate-50 pt-5"
        >
          <button
            @click="handleDelete(item.id)"
            :disabled="processing"
            class="text-red-400 hover:text-red-600 font-bold text-xs uppercase tracking-tight"
          >
            Eliminar
          </button>
          <button
            @click="openEdit(item)"
            class="text-blue-600 font-black text-sm hover:underline tracking-tight"
          >
            EDITAR DETALLES
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="showModal"
      class="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-6"
    >
      <div
        class="bg-white rounded-[2.5rem] p-10 w-full max-w-lg shadow-2xl border border-white relative"
      >
        <h2 class="text-2xl font-black mb-8 text-slate-900">
          {{ isEditing ? "Actualizar" : "Crear" }} Categoría
        </h2>

        <form @submit.prevent="handleSubmit" class="space-y-6">
          <div class="space-y-2">
            <label class="text-xs font-black text-slate-400 uppercase ml-1"
              >Nombre</label
            >
            <input
              v-model="form.name"
              type="text"
              required
              class="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-blue-500 transition-all"
            />
          </div>

          <div class="space-y-2">
            <label class="text-xs font-black text-slate-400 uppercase ml-1"
              >Descripción</label
            >
            <textarea
              v-model="form.description"
              class="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none h-32 resize-none focus:border-blue-500 transition-all"
            ></textarea>
          </div>

          <div
            class="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100"
          >
            <input
              v-model="form.isActive"
              type="checkbox"
              id="active-check"
              class="w-5 h-5 accent-blue-600"
            />
            <label
              for="active-check"
              class="text-sm font-bold text-slate-700 cursor-pointer"
              >Categoría activa</label
            >
          </div>

          <div class="flex gap-4 pt-6">
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
              class="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all"
            >
              {{ processing ? "PROCESANDO..." : "GUARDAR" }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
