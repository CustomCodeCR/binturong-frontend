<script setup lang="ts">
import { ref } from "vue"
import {
  LogOut,
  LayoutDashboard,
  Users,
  Shield,
  User,
  Truck,
  Building2,
  Briefcase,
  Package,
  ClipboardList
} from "lucide-vue-next"

const collapsed = ref(false)
const showLogout = ref(false)
</script>

<template>
  <aside
    :class="[
      'bg-slate-900 text-white flex flex-col transition-all duration-300',
      collapsed ? 'w-16' : 'w-64'
    ]"
  >
    <!-- Header -->
    <div class="p-4 flex justify-center">
      <button @click="collapsed = !collapsed" class="text-xl">
        ☰
      </button>
    </div>

    <!-- Navegación -->
    <nav
      class="flex-1 mt-4 space-y-1"
      :class="collapsed ? 'items-center text-center' : ''"
    >
      <RouterLink
        to="/home"
        class="flex items-center gap-3 px-4 py-2 hover:bg-slate-700"
      >
        <LayoutDashboard :size="20" />
        <span v-if="!collapsed">Dashboard</span>
      </RouterLink>

      <RouterLink
        to="/users"
        class="flex items-center gap-3 px-4 py-2 hover:bg-slate-700"
      >
        <Users :size="20" />
        <span v-if="!collapsed">Usuarios</span>
      </RouterLink>

      <RouterLink
        to="/roles"
        class="flex items-center gap-3 px-4 py-2 hover:bg-slate-700"
      >
        <Shield :size="20" />
        <span v-if="!collapsed">Roles</span>
      </RouterLink>

      <RouterLink
        to="/clientes"
        class="flex items-center gap-3 px-4 py-2 hover:bg-slate-700"
      >
        <User :size="20" />
        <span v-if="!collapsed">Clientes</span>
      </RouterLink>

      <RouterLink
        to="/proveedores"
        class="flex items-center gap-3 px-4 py-2 hover:bg-slate-700"
      >
        <Truck :size="20" />
        <span v-if="!collapsed">Proveedores</span>
      </RouterLink>

      <RouterLink
        to="/sucursales"
        class="flex items-center gap-3 px-4 py-2 hover:bg-slate-700"
      >
        <Building2 :size="20" />
        <span v-if="!collapsed">Sucursales</span>
      </RouterLink>

      <RouterLink
        to="/empleados"
        class="flex items-center gap-3 px-4 py-2 hover:bg-slate-700"
      >
        <Briefcase :size="20" />
        <span v-if="!collapsed">Empleados</span>
      </RouterLink>

      <RouterLink
        to="/inventario"
        class="flex items-center gap-3 px-4 py-2 hover:bg-slate-700"
      >
        <Package :size="20" />
        <span v-if="!collapsed">Inventario</span>
      </RouterLink>

      <RouterLink
        to="/auditoria"
        class="flex items-center gap-3 px-4 py-2 hover:bg-slate-700"
      >
        <ClipboardList :size="20" />
        <span v-if="!collapsed">Auditoría</span>
      </RouterLink>
    </nav>

    <!-- Logout -->
    <div class="p-4 border-t border-slate-700">
      <button
        @click="showLogout = true"
        class="flex items-center gap-3 w-full p-2 rounded hover:bg-slate-700"
      >
        <LogOut :size="20" />
        <span v-if="!collapsed">Salir</span>
      </button>
    </div>
  </aside>

  <!-- Modal Logout -->
  <div
    v-if="showLogout"
    class="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
  >
    <div class="bg-white rounded-lg p-6 w-80">
      <h3 class="text-lg font-semibold mb-2">Cerrar sesión</h3>
      <p class="text-sm text-gray-600 mb-4">
        ¿Deseas salir de tu cuenta o iniciar sesión con otra?
      </p>

      <div class="flex justify-end gap-2">
        <button
          class="px-4 py-2 text-sm rounded bg-gray-200"
          @click="showLogout = false"
        >
          Cancelar
        </button>

        <button
          class="px-4 py-2 text-sm rounded bg-blue-600 text-white"
        >
          Cambiar cuenta
        </button>

        <button
          class="px-4 py-2 text-sm rounded bg-red-600 text-white"
        >
          Salir
        </button>
      </div>
    </div>
  </div>
</template>
