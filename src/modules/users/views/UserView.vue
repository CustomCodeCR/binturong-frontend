<script setup lang="ts">
import { ref, onMounted } from "vue";
import { UsersService } from "@/core/services/usersService";
import type {
  User,
  UserCreateRequest,
  UserUpdateRequest,
} from "@/core/interfaces/users";

const usuarios = ref<User[]>([]);
const loading = ref(true);
const processing = ref(false);
const error = ref("");
const showModal = ref(false);
const isEditing = ref(false);
const selectedId = ref<string | null>(null);

const form = ref({
  username: "",
  email: "",
  password: "",
  isActive: true,
  mustChangePassword: false,
});

const fetchUsuarios = async () => {
  try {
    loading.value = true;
    usuarios.value = await UsersService.browse();
  } catch (e: any) {
    error.value = "Error al cargar la lista de usuarios";
  } finally {
    loading.value = false;
  }
};

const openCreate = () => {
  isEditing.value = false;
  selectedId.value = null;
  form.value = {
    username: "",
    email: "",
    password: "",
    isActive: true,
    mustChangePassword: false,
  };
  showModal.value = true;
};

const openEdit = (user: User) => {
  isEditing.value = true;
  selectedId.value = user.id;
  form.value = {
    username: user.username,
    email: user.email,
    password: "",
    isActive: user.isActive,
    mustChangePassword: user.mustChangePassword,
  };
  showModal.value = true;
};

const handleSubmit = async () => {
  try {
    processing.value = true;
    error.value = "";

    if (isEditing.value && selectedId.value) {
      const updatePayload: UserUpdateRequest = {
        username: form.value.username,
        isActive: form.value.isActive,
        mustChangePassword: form.value.mustChangePassword,
        lastLogin: null,
        failedAttempts: 0,
        lockedUntil: null,
      };
      await UsersService.update(selectedId.value, updatePayload);
    } else {
      await UsersService.create({
        username: form.value.username,
        email: form.value.email,
        password: form.value.password,
        isActive: form.value.isActive,
      });
    }
    await fetchUsuarios();
    showModal.value = false;
  } catch (e: any) {
    error.value = "Error al guardar el usuario.";
  } finally {
    processing.value = false;
  }
};

const handleDelete = async (id: string) => {
  if (!confirm("¿Eliminar usuario?")) return;
  try {
    await UsersService.delete(id);
    usuarios.value = usuarios.value.filter((u) => u.id !== id);
  } catch (e: any) {
    error.value = "No se pudo eliminar.";
  }
};

onMounted(fetchUsuarios);
</script>

<template>
  <div class="p-8 space-y-8 bg-slate-50 min-h-screen">
    <div class="flex justify-between items-center max-w-7xl mx-auto">
      <div>
        <h1 class="text-3xl font-black text-slate-900">Usuarios</h1>
        <p class="text-slate-500 font-medium">Gestión de accesos y perfiles</p>
      </div>
      <button
        @click="openCreate"
        class="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold"
      >
        + Nuevo Usuario
      </button>
    </div>

    <div
      v-if="error"
      class="max-w-7xl mx-auto p-4 bg-red-100 text-red-700 rounded-xl font-bold"
    >
      {{ error }}
    </div>

    <div
      v-if="!loading"
      class="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6"
    >
      <div
        v-for="item in usuarios"
        :key="item.id"
        class="bg-white p-6 rounded-[2rem] border shadow-sm"
      >
        <div class="flex justify-between items-start mb-4">
          <div class="flex items-center gap-3">
            <div
              class="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 font-bold"
            >
              {{ item.username.substring(0, 2).toUpperCase() }}
            </div>
            <div>
              <h2 class="font-bold text-slate-800">{{ item.username }}</h2>
              <p class="text-[10px] text-slate-400 font-bold uppercase">
                {{ item.email }}
              </p>
            </div>
          </div>
          <span
            :class="
              item.isActive
                ? 'bg-green-50 text-green-600'
                : 'bg-red-50 text-red-400'
            "
            class="px-3 py-1 rounded-full text-[9px] font-black uppercase"
            >{{ item.isActive ? "Activo" : "Inactivo" }}</span
          >
        </div>
        <div class="space-y-2 mb-4">
          <p class="text-[11px] text-slate-400 font-medium">
            Cambio de clave:
            <span
              :class="
                item.mustChangePassword ? 'text-orange-500' : 'text-slate-600'
              "
              >{{ item.mustChangePassword ? "Requerido" : "Normal" }}</span
            >
          </p>
        </div>
        <div class="flex justify-between border-t pt-4">
          <button
            @click="handleDelete(item.id)"
            class="text-red-400 text-xs font-bold uppercase"
          >
            Eliminar
          </button>
          <button
            @click="openEdit(item)"
            class="text-blue-600 text-xs font-black uppercase"
          >
            Configurar
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="showModal"
      class="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-6 z-50"
    >
      <div class="bg-white rounded-[2.5rem] p-10 w-full max-w-md">
        <h2 class="text-2xl font-black mb-6">
          {{ isEditing ? "Editar" : "Nuevo" }} Usuario
        </h2>
        <form @submit.prevent="handleSubmit" class="space-y-4">
          <input
            v-model="form.username"
            placeholder="Username"
            required
            class="w-full p-4 bg-slate-50 border rounded-2xl"
          />
          <input
            v-model="form.email"
            placeholder="Email"
            type="email"
            required
            class="w-full p-4 bg-slate-50 border rounded-2xl"
          />

          <div v-if="!isEditing">
            <input
              v-model="form.password"
              placeholder="Password"
              type="password"
              required
              class="w-full p-4 bg-slate-50 border rounded-2xl"
            />
          </div>

          <div class="space-y-2 pt-2">
            <label class="flex items-center gap-2 text-sm font-bold"
              ><input type="checkbox" v-model="form.isActive" /> Cuenta
              activa</label
            >
            <label class="flex items-center gap-2 text-sm font-bold"
              ><input type="checkbox" v-model="form.mustChangePassword" />
              Exigir cambio de clave</label
            >
          </div>

          <div class="flex gap-4 pt-4">
            <button
              type="button"
              @click="showModal = false"
              class="flex-1 py-4 text-slate-400 font-bold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              :disabled="processing"
              class="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black"
            >
              GUARDAR
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
