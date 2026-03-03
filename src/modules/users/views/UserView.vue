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
    usuarios.value = await UsersService.browse(); //
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
        email: form.value.email,
        isActive: form.value.isActive,
        mustChangePassword: form.value.mustChangePassword,
        lastLogin: null,
        failedAttempts: 0,
        lockedUntil: null,
      };

      await UsersService.update(selectedId.value, updatePayload); //

      const index = usuarios.value.findIndex((u) => u.id === selectedId.value);
      if (index !== -1) {
        usuarios.value[index] = { ...usuarios.value[index], ...updatePayload };
      }
    } else {
      const createPayload: UserCreateRequest = {
        username: form.value.username,
        email: form.value.email,
        password: form.value.password,
        isActive: form.value.isActive,
      };
      await UsersService.create(createPayload);
      await fetchUsuarios();
    }

    showModal.value = false;
  } catch (e: any) {
    error.value = "Error al procesar la solicitud del usuario";
  } finally {
    processing.value = false;
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
        class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-blue-200 transition-all"
      >
        + Nuevo Usuario
      </button>
    </div>

    <div
      v-if="loading"
      class="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6"
    >
      <div
        v-for="i in 3"
        :key="i"
        class="h-48 bg-white rounded-3xl animate-pulse border border-slate-100"
      ></div>
    </div>

    <div
      v-else
      class="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
    >
      <div
        v-for="item in usuarios"
        :key="item.id"
        class="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200 hover:shadow-md transition-all"
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
              <p class="text-xs text-slate-400">{{ item.email }}</p>
            </div>
          </div>
          <span
            :class="
              item.isActive
                ? 'text-green-600 bg-green-50'
                : 'text-red-400 bg-red-50'
            "
            class="px-3 py-1 rounded-full text-[10px] font-black uppercase"
          >
            {{ item.isActive ? "Activo" : "Inactivo" }}
          </span>
        </div>

        <div class="space-y-2 mb-6">
          <div class="flex justify-between text-xs">
            <span class="text-slate-400">Cambio de pass:</span>
            <span
              class="font-bold"
              :class="
                item.mustChangePassword ? 'text-orange-500' : 'text-slate-600'
              "
            >
              {{ item.mustChangePassword ? "Requerido" : "No" }}
            </span>
          </div>
          <div class="flex justify-between text-xs">
            <span class="text-slate-400">Último acceso:</span>
            <span class="text-slate-600 font-medium">{{
              item.lastLogin || "Nunca"
            }}</span>
          </div>
        </div>

        <div class="flex justify-end border-t border-slate-50 pt-4">
          <button
            @click="openEdit(item)"
            class="text-blue-600 font-black text-xs hover:underline"
          >
            CONFIGURAR
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
          {{ isEditing ? "Editar" : "Nuevo" }} Usuario
        </h2>

        <form @submit.prevent="handleSubmit" class="space-y-5">
          <div class="space-y-1">
            <label class="text-xs font-black text-slate-400 uppercase"
              >Username</label
            >
            <input
              v-model="form.username"
              type="text"
              required
              class="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-blue-500 transition-all"
            />
          </div>

          <div class="space-y-1">
            <label class="text-xs font-black text-slate-400 uppercase"
              >Email</label
            >
            <input
              v-model="form.email"
              type="email"
              required
              class="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-blue-500 transition-all"
            />
          </div>

          <div v-if="!isEditing" class="space-y-1">
            <label class="text-xs font-black text-slate-400 uppercase"
              >Password Inicial</label
            >
            <input
              v-model="form.password"
              type="password"
              required
              class="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-blue-500 transition-all"
            />
          </div>

          <div class="flex flex-col gap-3 pt-2">
            <div
              class="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100"
            >
              <input
                v-model="form.isActive"
                type="checkbox"
                id="user-active"
                class="w-5 h-5 accent-blue-600"
              />
              <label for="user-active" class="text-sm font-bold text-slate-700"
                >Cuenta activa</label
              >
            </div>
            <div
              class="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100"
            >
              <input
                v-model="form.mustChangePassword"
                type="checkbox"
                id="user-must-change"
                class="w-5 h-5 accent-orange-500"
              />
              <label
                for="user-must-change"
                class="text-sm font-bold text-slate-700"
                >Exigir cambio de clave</label
              >
            </div>
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
              class="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black shadow-lg"
            >
              {{ processing ? "..." : "GUARDAR" }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
