<script setup lang="ts">
import { ref, onMounted } from "vue";
import { RolesService } from "@/core/services/rolesService";
import type { Role, RoleCreateRequest } from "@/core/interfaces/roles";

const roles = ref<Role[]>([]);
const loading = ref(true);
const processing = ref(false);
const error = ref("");
const showModal = ref(false);
const isEditing = ref(false);
const selectedId = ref<string | null>(null);

const form = ref<RoleCreateRequest>({
  name: "",
  description: "",
  isActive: true,
});

const fetchRoles = async () => {
  try {
    loading.value = true;
    roles.value = await RolesService.browse();
  } catch (e: any) {
    error.value = "Error al cargar los roles";
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

const openEdit = (item: Role) => {
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
  try {
    processing.value = true;
    if (isEditing.value && selectedId.value) {
      await RolesService.update(selectedId.value, form.value);
    } else {
      await RolesService.create(form.value);
    }
    await fetchRoles();
    showModal.value = false;
  } catch (e: any) {
    error.value = "Error al guardar el rol";
  } finally {
    processing.value = false;
  }
};

const handleDelete = async (id: string) => {
  if (!confirm("¿Eliminar este rol?")) return;
  try {
    await RolesService.delete(id);
    roles.value = roles.value.filter((r) => r.id !== id);
  } catch (e: any) {
    error.value = "No se pudo eliminar el rol";
  }
};

onMounted(fetchRoles);
</script>

<template>
  <div class="p-8 space-y-8 bg-slate-50 min-h-screen">
    <div class="flex justify-between items-center max-w-7xl mx-auto">
      <h1 class="text-3xl font-black text-slate-900">Control de Roles</h1>
      <button
        @click="openCreate"
        class="bg-violet-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-violet-700"
      >
        + Nuevo Rol
      </button>
    </div>

    <div
      v-if="!loading"
      class="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
    >
      <div
        v-for="item in roles"
        :key="item.id"
        class="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm"
      >
        <h3 class="font-black text-lg">{{ item.name }}</h3>
        <p class="text-sm text-slate-500 mb-4">{{ item.description }}</p>
        <div class="flex gap-2">
          <button
            @click="handleDelete(item.id)"
            class="text-red-500 font-bold text-xs uppercase"
          >
            Eliminar
          </button>
          <button
            @click="openEdit(item)"
            class="text-violet-600 font-bold text-xs uppercase"
          >
            Editar
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="showModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
    >
      <div class="bg-white p-8 rounded-[2rem] w-full max-w-md">
        <h2 class="text-2xl font-black mb-6">
          {{ isEditing ? "Editar Rol" : "Nuevo Rol" }}
        </h2>
        <form @submit.prevent="handleSubmit" class="space-y-4">
          <input
            v-model="form.name"
            placeholder="Nombre del Rol"
            required
            class="w-full p-3 bg-slate-50 border rounded-xl"
          />
          <textarea
            v-model="form.description"
            placeholder="Descripción"
            class="w-full p-3 bg-slate-50 border rounded-xl"
          ></textarea>
          <label
            ><input type="checkbox" v-model="form.isActive" /> ¿Rol
            activo?</label
          >
          <button
            type="submit"
            class="w-full py-3 bg-violet-600 text-white rounded-xl font-bold"
          >
            Guardar
          </button>
        </form>
      </div>
    </div>
  </div>
</template>
