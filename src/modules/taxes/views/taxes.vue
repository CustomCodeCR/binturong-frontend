<script setup lang="ts">
import { ref, onMounted } from "vue";
import { TaxesService } from "@/core/services/taxesService";
import type { Tax, TaxCreateRequest } from "@/core/interfaces/taxes";

const impuestos = ref<Tax[]>([]);
const loading = ref(true);
const processing = ref(false);
const error = ref("");
const showModal = ref(false);
const isEditing = ref(false);
const selectedId = ref<string | null>(null);

const form = ref<TaxCreateRequest>({
  name: "",
  code: "",
  percentage: 0,
  isActive: true,
});

const fetchImpuestos = async () => {
  try {
    loading.value = true;
    impuestos.value = await TaxesService.browse();
  } catch (e: any) {
    error.value = "Error al cargar los impuestos";
  } finally {
    loading.value = false;
  }
};

const openCreate = () => {
  isEditing.value = false;
  selectedId.value = null;
  form.value = { name: "", code: "", percentage: 0, isActive: true };
  showModal.value = true;
};

const openEdit = (item: Tax) => {
  isEditing.value = true;
  selectedId.value = item.id;
  form.value = {
    name: item.name,
    code: item.code,
    percentage: item.percentage,
    isActive: item.isActive,
  };
  showModal.value = true;
};

const handleSubmit = async () => {
  if (!form.value.name || !form.value.code) return;

  try {
    processing.value = true;
    error.value = "";

    if (isEditing.value && selectedId.value) {
      await TaxesService.update(selectedId.value, form.value);
      const index = impuestos.value.findIndex((t) => t.id === selectedId.value);
      if (index !== -1) {
        impuestos.value[index] = { ...impuestos.value[index], ...form.value };
      }
    } else {
      await TaxesService.create(form.value);
      await fetchImpuestos();
    }

    showModal.value = false;
  } catch (e: any) {
    error.value = "No se pudo procesar la operación de impuestos";
  } finally {
    processing.value = false;
  }
};

const handleDelete = async (id: string) => {
  if (
    !confirm(
      "¿Está seguro de eliminar este impuesto? Esta acción no se puede deshacer.",
    )
  ) {
    return;
  }

  try {
    processing.value = true;
    error.value = "";

    await TaxesService.delete(id);

    impuestos.value = impuestos.value.filter((t) => t.id !== id);
  } catch (e: any) {
    error.value =
      "No se pudo eliminar el impuesto. Es posible que esté en uso en el inventario.";
  } finally {
    processing.value = false;
  }
};

onMounted(fetchImpuestos);
</script>

<template>
  <div class="p-8 space-y-8 bg-slate-50 min-h-screen">
    <div class="flex justify-between items-center max-w-7xl mx-auto">
      <div>
        <h1 class="text-3xl font-black text-slate-900 tracking-tight">
          Impuestos
        </h1>
        <p class="text-slate-500 font-medium">
          Configuración de tasas tributarias
        </p>
      </div>
      <button
        @click="openCreate"
        class="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-emerald-200 transition-all active:scale-95"
      >
        + Nuevo Impuesto
      </button>
    </div>

    <div
      v-if="error"
      class="max-w-7xl mx-auto bg-red-50 text-red-600 p-4 rounded-2xl font-semibold border border-red-200"
    >
      {{ error }}
    </div>

    <div
      v-if="loading"
      class="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6"
    >
      <div
        v-for="i in 3"
        :key="i"
        class="h-48 bg-white rounded-[2rem] animate-pulse border border-slate-100"
      ></div>
    </div>

    <div
      v-else
      class="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
    >
      <div
        v-for="item in impuestos"
        :key="item.id"
        class="bg-white p-7 rounded-[2rem] shadow-sm border border-slate-200 hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
      >
        <div>
          <div class="flex justify-between items-start mb-4">
            <div>
              <span
                class="text-xs font-black text-emerald-500 uppercase tracking-widest"
                >{{ item.code }}</span
              >
              <h2 class="font-bold text-xl text-slate-800">{{ item.name }}</h2>
            </div>
            <span
              :class="
                item.isActive
                  ? 'text-emerald-600 bg-emerald-50'
                  : 'text-slate-400 bg-slate-100'
              "
              class="px-3 py-1 rounded-full text-[10px] font-black uppercase"
            >
              {{ item.isActive ? "Activo" : "Inactivo" }}
            </span>
          </div>

          <div class="mb-6">
            <span class="text-3xl font-black text-slate-900"
              >{{ item.percentage }}%</span
            >
            <p
              class="text-xs text-slate-400 font-bold uppercase tracking-tighter"
            >
              Valor porcentual
            </p>
          </div>
        </div>

        <div
          class="flex justify-between items-center border-t border-slate-50 pt-5 mt-4"
        >
          <button
            @click="handleDelete(item.id)"
            :disabled="processing"
            class="text-red-400 hover:text-red-600 font-bold text-xs uppercase tracking-tight transition-colors disabled:opacity-50"
          >
            Eliminar
          </button>

          <button
            @click="openEdit(item)"
            class="bg-emerald-50 text-emerald-600 px-5 py-2 rounded-xl font-black text-xs hover:bg-emerald-600 hover:text-white transition-all uppercase"
          >
            Modificar
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="showModal"
      class="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-6"
    >
      <div
        class="bg-white rounded-[2.5rem] p-10 w-full max-w-md shadow-2xl border border-white relative"
      >
        <h2 class="text-2xl font-black mb-2 text-slate-900">
          {{ isEditing ? "Editar" : "Nuevo" }} Impuesto
        </h2>
        <p class="text-slate-400 mb-8 font-medium">
          Define los valores tributarios para el sistema.
        </p>

        <form @submit.prevent="handleSubmit" class="space-y-6">
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <label class="text-xs font-black text-slate-400 uppercase ml-1"
                >Código</label
              >
              <input
                v-model="form.code"
                type="text"
                required
                placeholder="IVA"
                class="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-emerald-500 transition-all uppercase"
              />
            </div>
            <div class="space-y-2">
              <label class="text-xs font-black text-slate-400 uppercase ml-1"
                >Porcentaje (%)</label
              >
              <input
                v-model="form.percentage"
                type="number"
                step="0.01"
                required
                class="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-emerald-500 transition-all"
              />
            </div>
          </div>

          <div class="space-y-2">
            <label class="text-xs font-black text-slate-400 uppercase ml-1"
              >Nombre Comercial</label
            >
            <input
              v-model="form.name"
              type="text"
              required
              placeholder="Ej: Impuesto General"
              class="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-emerald-500 transition-all"
            />
          </div>

          <div
            class="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100"
          >
            <input
              v-model="form.isActive"
              type="checkbox"
              id="tax-active"
              class="w-5 h-5 accent-emerald-600"
            />
            <label
              for="tax-active"
              class="text-sm font-bold text-slate-700 cursor-pointer"
              >Impuesto habilitado</label
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
              class="flex-[2] py-4 bg-emerald-600 text-white rounded-2xl font-black shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all disabled:bg-slate-200"
            >
              {{ processing ? "GUARDANDO..." : "GUARDAR" }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
