<script setup lang="ts">
import { ref, onMounted } from "vue";
import { BranchesService } from "@/core/services/branchesService";
import { WarehousesService } from "@/core/services/warehousesService";
import type { Branch } from "@/core/interfaces/branches";

const branches = ref<Branch[]>([]);
const showModal = ref(false);
const isEditing = ref(false);

const form = ref({
  branchId: "",
  branchName: "",
  warehouseId: "",
  code: "",
  name: "",
  description: "",
  isActive: true,
});

const fetchData = async () => {
  branches.value = await BranchesService.browse();
};

const openCreate = (b: Branch) => {
  isEditing.value = false;
  form.value = {
    branchId: b.branchId,
    branchName: b.name,
    warehouseId: "",
    code: "",
    name: "",
    description: "",
    isActive: true,
  };
  showModal.value = true;
};

const openEdit = (b: Branch, w: any) => {
  isEditing.value = true;
  form.value = {
    branchId: b.branchId,
    branchName: b.name,
    warehouseId: w.warehouseId,
    code: w.code,
    name: w.name,
    description: w.description || "",
    isActive: w.isActive,
  };
  showModal.value = true;
};

const handleDelete = async (id: string) => {
  if (!confirm("¿Estás seguro de eliminar esta bodega?")) return;
  await WarehousesService.delete(id);
  await fetchData();
};

const handleSubmit = async () => {
  try {
    if (isEditing.value) {
      await WarehousesService.update(form.value.warehouseId, {
        code: form.value.code,
        name: form.value.name,
        description: form.value.description,
        isActive: form.value.isActive,
      });
    } else {
      await WarehousesService.create(form.value);
    }
    showModal.value = false;
    await fetchData();
  } catch (e) {
    alert("Error al guardar");
  }
};

onMounted(fetchData);
</script>

<template>
  <div class="p-8 bg-slate-50 min-h-screen">
    <h1 class="text-3xl font-black mb-8">Sucursales y Bodegas</h1>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="b in branches"
        :key="b.branchId"
        class="bg-white p-6 rounded-[2rem] border shadow-sm"
      >
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-lg font-black text-indigo-600">{{ b.name }}</h2>
          <button
            @click="openCreate(b)"
            class="text-xs font-bold bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl hover:bg-indigo-100"
          >
            + Agregar
          </button>
        </div>

        <div class="space-y-3">
          <div
            v-for="w in b.warehouses"
            :key="w.warehouseId"
            class="p-4 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center"
          >
            <div>
              <p class="font-bold text-sm">{{ w.name }}</p>
              <p class="text-[9px] text-slate-400 font-black uppercase">
                {{ w.code }}
              </p>
            </div>
            <div class="flex gap-2">
              <button
                @click="openEdit(b, w)"
                class="text-indigo-600 font-bold text-xs underline"
              >
                Editar
              </button>
              <button
                @click="handleDelete(w.warehouseId)"
                class="text-red-400 font-bold text-xs underline"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="showModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50"
    >
      <form
        @submit.prevent="handleSubmit"
        class="bg-white p-10 rounded-[2.5rem] w-full max-w-lg space-y-4"
      >
        <h2 class="text-2xl font-black mb-2">
          {{ isEditing ? "Editar Bodega" : "Nueva Bodega" }}
        </h2>
        <p class="text-slate-400 font-bold text-xs uppercase mb-6">
          {{ form.branchName }}
        </p>

        <input
          v-model="form.code"
          placeholder="Código (ej: ALM-01)"
          class="w-full p-4 bg-slate-50 border rounded-2xl"
          required
        />
        <input
          v-model="form.name"
          placeholder="Nombre"
          class="w-full p-4 bg-slate-50 border rounded-2xl"
          required
        />
        <textarea
          v-model="form.description"
          placeholder="Descripción"
          class="w-full p-4 bg-slate-50 border rounded-2xl"
        ></textarea>

        <button
          type="submit"
          class="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black"
        >
          GUARDAR
        </button>
      </form>
    </div>
  </div>
</template>
