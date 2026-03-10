<script setup lang="ts">
import { ref, onMounted } from "vue";
import { BranchesService } from "@/core/services/branchesService";
import type {
  Branch,
  BranchCreateRequest,
  BranchUpdateRequest,
} from "@/core/interfaces/branches";

const branches = ref<Branch[]>([]);
const loading = ref(true);
const processing = ref(false);
const error = ref("");
const showModal = ref(false);
const isEditing = ref(false);
const selectedId = ref<string | null>(null);

const form = ref({
  code: "",
  name: "",
  address: "",
  phone: "",
  isActive: true,
});

const fetchBranches = async () => {
  try {
    loading.value = true;
    branches.value = await BranchesService.browse();
  } catch (e: any) {
    error.value = "Error al cargar las sucursales";
  } finally {
    loading.value = false;
  }
};

const openCreate = () => {
  isEditing.value = false;
  selectedId.value = null;
  form.value = { code: "", name: "", address: "", phone: "", isActive: true };
  showModal.value = true;
};

const openEdit = (branch: Branch) => {
  isEditing.value = true;
  selectedId.value = branch.id;
  form.value = { ...branch };
  showModal.value = true;
};

const handleSubmit = async () => {
  try {
    processing.value = true;
    error.value = "";

    if (isEditing.value && selectedId.value) {
      const payload: BranchUpdateRequest = { ...form.value };
      await BranchesService.update(selectedId.value, payload);
    } else {
      const payload: BranchCreateRequest = { ...form.value };
      await BranchesService.create(payload);
    }
    await fetchBranches();
    showModal.value = false;
  } catch (e: any) {
    error.value = "Error al guardar la sucursal.";
  } finally {
    processing.value = false;
  }
};

const handleDelete = async (id: string) => {
  if (!confirm("¿Eliminar sucursal? Esta acción es irreversible.")) return;
  try {
    await BranchesService.delete(id);
    branches.value = branches.value.filter((b) => b.id !== id);
  } catch (e: any) {
    error.value = "No se pudo eliminar la sucursal.";
  }
};

onMounted(fetchBranches);
</script>

<template>
  <div class="p-8 bg-slate-50 min-h-screen">
    <div class="max-w-7xl mx-auto flex justify-between items-center mb-8">
      <div>
        <h1 class="text-3xl font-black text-slate-900">Sucursales</h1>
        <p class="text-slate-500 font-medium">
          Gestión de puntos de venta y almacenes
        </p>
      </div>
      <button
        @click="openCreate"
        class="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-indigo-700 transition-colors"
      >
        + Nueva Sucursal
      </button>
    </div>

    <div
      v-if="error"
      class="max-w-7xl mx-auto mb-6 p-4 bg-red-100 text-red-700 rounded-xl font-bold"
    >
      {{ error }}
    </div>

    <div
      v-if="!loading"
      class="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
    >
      <div
        v-for="b in branches"
        :key="b.id"
        class="bg-white p-6 rounded-[2rem] border shadow-sm"
      >
        <div class="flex justify-between mb-4">
          <span
            class="text-xs font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full"
            >{{ b.code }}</span
          >
          <span
            :class="
              b.isActive
                ? 'text-green-600 bg-green-50'
                : 'text-red-400 bg-red-50'
            "
            class="text-[10px] font-black uppercase px-3 py-1 rounded-full"
          >
            {{ b.isActive ? "Activa" : "Inactiva" }}
          </span>
        </div>
        <h2 class="font-bold text-xl mb-1 text-slate-800">{{ b.name }}</h2>
        <p class="text-sm text-slate-500 mb-4">{{ b.address }}</p>

        <div class="border-t border-slate-50 pt-4 flex justify-between">
          <button
            @click="handleDelete(b.id)"
            class="text-red-400 font-bold text-xs uppercase hover:text-red-600"
          >
            Eliminar
          </button>
          <button
            @click="openEdit(b)"
            class="text-indigo-600 font-black text-xs uppercase hover:underline"
          >
            Configurar
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="showModal"
      class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6 z-50"
    >
      <div class="bg-white rounded-[2.5rem] p-10 w-full max-w-md shadow-2xl">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-2xl font-black">
            {{ isEditing ? "Editar" : "Nueva" }} Sucursal
          </h2>
          <button
            @click="showModal = false"
            class="text-slate-400 hover:text-slate-900"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-8 w-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-4">
          <input
            v-model="form.code"
            placeholder="Código (ej: SJ-01)"
            required
            class="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-indigo-500"
          />
          <input
            v-model="form.name"
            placeholder="Nombre"
            required
            class="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-indigo-500"
          />
          <input
            v-model="form.address"
            placeholder="Dirección"
            required
            class="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-indigo-500"
          />
          <input
            v-model="form.phone"
            placeholder="Teléfono"
            class="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-indigo-500"
          />

          <div class="p-3 bg-slate-50 rounded-2xl">
            <label
              class="flex items-center gap-3 font-bold text-slate-700 cursor-pointer"
            >
              <input
                type="checkbox"
                v-model="form.isActive"
                class="w-5 h-5 accent-indigo-600"
              />
              Sucursal Activa
            </label>
          </div>

          <button
            type="submit"
            :disabled="processing"
            class="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black mt-4 hover:bg-indigo-700 transition-colors"
          >
            {{ processing ? "PROCESANDO..." : "GUARDAR" }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>
