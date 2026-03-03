<script setup lang="ts">
import { ref, onMounted } from "vue";
import { UnitsOfMeasureService } from "@/core/services/unitsOfMeasureService";
import type {
  UnitOfMeasure,
  UnitOfMeasureCreateRequest,
} from "@/core/interfaces/unitsOfMeasure";

// --- ESTADOS ---
const unidades = ref<UnitOfMeasure[]>([]);
const loading = ref(true);
const processing = ref(false);
const error = ref("");
const showModal = ref(false);
const isEditing = ref(false);
const selectedId = ref<string | null>(null);

// Formulario basado en la interfaz de creación
const form = ref<UnitOfMeasureCreateRequest>({
  code: "",
  name: "",
  isActive: true,
});

// --- CARGAR DATOS ---
const fetchUnidades = async () => {
  try {
    loading.value = true;
    unidades.value = await UnitsOfMeasureService.browse();
  } catch (e: any) {
    error.value = "Error al cargar las unidades de medida";
  } finally {
    loading.value = false;
  }
};

// --- MODALES ---
const openCreate = () => {
  isEditing.value = false;
  selectedId.value = null;
  form.value = { code: "", name: "", isActive: true };
  showModal.value = true;
};

const openEdit = (item: UnitOfMeasure) => {
  isEditing.value = true;
  selectedId.value = item.id;
  form.value = {
    code: item.code,
    name: item.name,
    isActive: item.isActive,
  };
  showModal.value = true;
};

// --- GUARDAR (POST / PUT) ---
const handleSubmit = async () => {
  if (!form.value.name || !form.value.code) return;

  try {
    processing.value = true;
    error.value = "";

    if (isEditing.value && selectedId.value) {
      // Actualizar
      await UnitsOfMeasureService.update(selectedId.value, form.value);

      // Actualización reactiva local para refresco instantáneo
      const index = unidades.value.findIndex((u) => u.id === selectedId.value);
      if (index !== -1) {
        unidades.value[index] = { ...unidades.value[index], ...form.value };
      }
    } else {
      // Crear
      await UnitsOfMeasureService.create(form.value);
      await fetchUnidades();
    }

    showModal.value = false;
  } catch (e: any) {
    error.value = "No se pudo procesar la unidad de medida";
  } finally {
    processing.value = false;
  }
};

onMounted(fetchUnidades);
</script>

<template>
  <div class="p-8 space-y-8 bg-slate-50 min-h-screen">
    <div class="flex justify-between items-center max-w-7xl mx-auto">
      <div>
        <h1 class="text-3xl font-black text-slate-900 tracking-tight">
          Unidades de Medida
        </h1>
        <p class="text-slate-500 font-medium">
          Configuración de magnitudes del sistema
        </p>
      </div>
      <button
        @click="openCreate"
        class="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-indigo-200 transition-all active:scale-95"
      >
        + Nueva Unidad
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
      class="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6"
    >
      <div
        v-for="i in 4"
        :key="i"
        class="h-32 bg-white rounded-3xl animate-pulse border border-slate-100"
      ></div>
    </div>

    <div
      v-else
      class="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
    >
      <div
        v-for="item in unidades"
        :key="item.id"
        class="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200 hover:shadow-xl transition-all duration-300"
      >
        <div class="flex justify-between items-start mb-2">
          <span
            class="text-xs font-black text-indigo-500 uppercase tracking-widest"
            >{{ item.code }}</span
          >
          <span
            :class="
              item.isActive
                ? 'text-green-600 bg-green-50'
                : 'text-slate-400 bg-slate-100'
            "
            class="px-2 py-0.5 rounded-full text-[10px] font-black uppercase"
          >
            {{ item.isActive ? "Activo" : "Inactivo" }}
          </span>
        </div>
        <h2 class="font-bold text-lg text-slate-800 mb-6">{{ item.name }}</h2>
        <div class="flex justify-end border-t border-slate-50 pt-4">
          <button
            @click="openEdit(item)"
            class="text-indigo-600 font-black text-xs hover:underline"
          >
            EDITAR
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="showModal"
      class="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-6"
    >
      <div class="bg-white rounded-[2.5rem] p-10 w-full max-w-md shadow-2xl">
        <h2 class="text-2xl font-black mb-8 text-slate-900">
          {{ isEditing ? "Actualizar" : "Nueva" }} Unidad
        </h2>

        <form @submit.prevent="handleSubmit" class="space-y-6">
          <div class="space-y-2">
            <label class="text-xs font-black text-slate-400 uppercase ml-1"
              >Código (Ej: KG, MTS, UND)</label
            >
            <input
              v-model="form.code"
              type="text"
              required
              maxlength="5"
              class="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-indigo-500 transition-all uppercase"
            />
          </div>

          <div class="space-y-2">
            <label class="text-xs font-black text-slate-400 uppercase ml-1"
              >Nombre Completo</label
            >
            <input
              v-model="form.name"
              type="text"
              required
              class="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-indigo-500 transition-all"
            />
          </div>

          <div
            class="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100"
          >
            <input
              v-model="form.isActive"
              type="checkbox"
              id="uom-active"
              class="w-5 h-5 accent-indigo-600"
            />
            <label
              for="uom-active"
              class="text-sm font-bold text-slate-700 cursor-pointer"
              >Unidad disponible</label
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
              class="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700 disabled:bg-slate-200 transition-all"
            >
              {{ processing ? "PROCESANDO..." : "GUARDAR" }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
