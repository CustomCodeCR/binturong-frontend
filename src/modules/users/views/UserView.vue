<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { UsersService } from "@/core/services/usersService";
import { RolesService } from "@/core/services/rolesService";
import type { User } from "@/core/interfaces/users";

// --- ESTADOS ---
const usuarios = ref<User[]>([]);
const rolesDisponibles = ref<any[]>([]);
const loading = ref(true);
const processing = ref(false);
const showModal = ref(false);
const isEditing = ref(false);
const selectedId = ref<string | null>(null);
const confirmPassword = ref("");

const form = ref({
  username: "",
  email: "",
  password: "",
  roles: [] as any[],
  isActive: true,
  mustChangePassword: false,
});

// --- FILTROS ---
const searchQuery = ref("");
const statusFilter = ref("all");
const roleFilter = ref("all");

// --- VALIDACIONES (HU-USR-01 / HU-USR-02) ---
const passwordsMatch = computed(
  () => isEditing.value || form.value.password === confirmPassword.value,
);

const isFormValid = computed(() => {
  const basicFields =
    form.value.username && form.value.email && form.value.roles.length > 0;
  return (
    basicFields &&
    (isEditing.value || (form.value.password && passwordsMatch.value))
  );
});

// --- LÓGICA ---
const filteredUsers = computed(() => {
  return usuarios.value.filter((user) => {
    const matchesSearch =
      user.username.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.value.toLowerCase());
    const matchesStatus =
      statusFilter.value === "all" ||
      (statusFilter.value === "active" ? user.isActive : !user.isActive);
    const matchesRole =
      roleFilter.value === "all" ||
      user.roles?.some((r: any) => r.name === roleFilter.value);
    return matchesSearch && matchesStatus && matchesRole;
  });
});

const loadData = async () => {
  loading.value = true;
  try {
    const [usersRes, rolesRes] = await Promise.all([
      UsersService.browse(),
      RolesService.browse(),
    ]);
    usuarios.value = usersRes;
    rolesDisponibles.value = rolesRes;
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
    roles: [],
    isActive: true,
    mustChangePassword: false,
  };
  confirmPassword.value = "";
  showModal.value = true;
};

const openEdit = (user: User) => {
  isEditing.value = true;
  selectedId.value = user.id;
  form.value = {
    username: user.username,
    email: user.email,
    password: "", // Contraseña vacía para edición
    roles: user.roles || [],
    isActive: user.isActive,
    mustChangePassword: user.mustChangePassword,
  };
  showModal.value = true;
};

const handleSubmit = async () => {
  if (!isFormValid.value) return;
  processing.value = true;
  try {
    isEditing.value
      ? await UsersService.update(selectedId.value!, form.value)
      : await UsersService.create(form.value);
    await loadData();
    showModal.value = false;
  } finally {
    processing.value = false;
  }
};

onMounted(loadData);
</script>

<template>
  <div class="p-8 bg-slate-50 min-h-screen">
    <div class="max-w-7xl mx-auto space-y-6">
      <div class="flex justify-between items-center">
        <h1 class="text-3xl font-bold text-slate-900">Users</h1>
        <button
          @click="openCreate"
          class="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold"
        >
          + New User
        </button>
      </div>

      <div class="bg-white p-4 rounded-2xl border flex gap-4">
        <input
          v-model="searchQuery"
          placeholder="Search..."
          class="flex-1 px-4 py-2 border rounded-xl"
        />
        <select v-model="statusFilter" class="px-4 border rounded-xl">
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <select v-model="roleFilter" class="px-4 border rounded-xl">
          <option value="all">All Roles</option>
          <option v-for="r in rolesDisponibles" :key="r.rolId" :value="r.name">
            {{ r.name }}
          </option>
        </select>
      </div>

      <div class="bg-white rounded-2xl border overflow-hidden">
        <table class="w-full text-left">
          <tr class="text-slate-400 text-xs uppercase border-b">
            <th class="p-6">Username</th>
            <th class="p-6">Email</th>
            <th class="p-6">Roles</th>
            <th class="p-6">Status</th>
            <th class="p-6 text-right">Actions</th>
          </tr>
          <tr
            v-for="user in filteredUsers"
            :key="user.id"
            class="border-b hover:bg-slate-50"
          >
            <td class="p-6 font-bold">{{ user.username }}</td>
            <td class="p-6 text-slate-500">{{ user.email }}</td>
            <td class="p-6">
              <span
                v-for="r in user.roles"
                :key="r.roleId"
                class="bg-blue-50 text-blue-600 px-2 py-1 rounded text-[10px] font-black uppercase mr-1"
                >{{ r.name }}</span
              >
            </td>
            <td class="p-6">
              <span
                :class="
                  user.isActive
                    ? 'text-green-600 bg-green-50'
                    : 'text-slate-500 bg-slate-100'
                "
                class="px-2 py-1 rounded text-[10px] font-bold uppercase"
              >
                {{ user.isActive ? "Active" : "Inactive" }}
              </span>
            </td>
            <td class="p-6 text-right">
              <button
                @click="openEdit(user)"
                class="text-blue-600 font-bold text-xs"
              >
                Configure
              </button>
            </td>
          </tr>
        </table>
      </div>
    </div>

    <div
      v-if="showModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
    >
      <div class="bg-white rounded-3xl w-full max-w-lg p-8 space-y-6">
        <h2 class="text-2xl font-bold">
          {{ isEditing ? "Edit" : "Create" }} User
        </h2>
        <form @submit.prevent="handleSubmit" class="space-y-4">
          <input
            v-model="form.username"
            placeholder="Username"
            required
            class="w-full p-3 border rounded-xl"
          />
          <input
            v-model="form.email"
            type="email"
            placeholder="Email"
            required
            class="w-full p-3 border rounded-xl"
          />

          <template v-if="!isEditing">
            <input
              v-model="form.password"
              type="password"
              placeholder="Password"
              required
              class="w-full p-3 border rounded-xl"
            />
            <input
              v-model="confirmPassword"
              type="password"
              placeholder="Confirm Password"
              required
              :class="{ 'border-red-400': !passwordsMatch }"
              class="w-full p-3 border rounded-xl"
            />
          </template>

          <div class="border p-4 rounded-xl">
            <label class="block text-xs font-bold text-slate-400 uppercase mb-2"
              >Roles *</label
            >
            <div class="flex flex-wrap gap-2">
              <label
                v-for="role in rolesDisponibles"
                :key="role.id"
                class="flex items-center gap-2 text-sm"
              >
                <input type="checkbox" :value="role" v-model="form.roles" />
                {{ role.name }}
              </label>
            </div>
          </div>

          <label class="flex items-center gap-2"
            ><input type="checkbox" v-model="form.isActive" /> Account
            active</label
          >
          <label class="flex items-center gap-2"
            ><input type="checkbox" v-model="form.mustChangePassword" /> Require
            password change</label
          >

          <button
            :disabled="!isFormValid || processing"
            class="w-full bg-blue-600 text-white p-4 rounded-xl font-bold disabled:opacity-50"
          >
            Save
          </button>
        </form>
      </div>
    </div>
  </div>
</template>
