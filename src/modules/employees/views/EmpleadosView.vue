<script setup lang="ts">
import { ref, onMounted } from "vue";
import { EmployeesService } from "@/core/services/employeesService";
import { BranchesService } from "@/core/services/branchesService";
import { UsersService } from "@/core/services/usersService";
import type {
  Employee,
  EmployeeCreateRequest,
  EmployeeUpdateRequest,
} from "@/core/interfaces/employees";
import type { Branch } from "@/core/interfaces/branches";
import type { User } from "@/core/interfaces/users";

const employees = ref<Employee[]>([]);
const branches = ref<Branch[]>([]);
const users = ref<User[]>([]);
const loading = ref(true);
const showModal = ref(false);
const isEditing = ref(false);
const selectedId = ref<string | null>(null);

const form = ref({
  userId: "",
  branchId: "",
  fullName: "",
  nationalId: "",
  jobTitle: "",
  baseSalary: 0,
  hireDate: new Date().toISOString().split("T")[0],
  terminationDate: "",
  isActive: true,
});

const fetchData = async () => {
  loading.value = true;
  [employees.value, branches.value, users.value] = await Promise.all([
    EmployeesService.browse(),
    BranchesService.browse(),
    UsersService.browse(),
  ]);
  loading.value = false;
};

const openEdit = (e: Employee) => {
  isEditing.value = true;
  selectedId.value = e.id;
  form.value = {
    userId: e.userId || "",
    branchId: e.branchId,
    fullName: e.fullName,
    nationalId: e.nationalId,
    jobTitle: e.jobTitle,
    baseSalary: e.baseSalary,
    hireDate: e.hireDate.split("T")[0],
    terminationDate: e.terminationDate ? e.terminationDate.split("T")[0] : "",
    isActive: e.isActive,
  };
  showModal.value = true;
};

const handleSubmit = async () => {
  try {
    const payload = {
      ...form.value,
      baseSalary: Number(form.value.baseSalary),
      terminationDate:
        form.value.terminationDate === "" ? null : form.value.terminationDate,
    };

    if (isEditing.value && selectedId.value) {
      await EmployeesService.update(
        selectedId.value,
        payload as unknown as EmployeeUpdateRequest,
      );
    } else {
      await EmployeesService.create(
        payload as unknown as EmployeeCreateRequest,
      );
    }
    await fetchData();
    showModal.value = false;
  } catch (e) {
    console.error(e);
    alert("Error: Verifica que los campos de fecha y los IDs sean correctos.");
  }
};

const handleDelete = async (id: string) => {
  if (!confirm("¿Eliminar este empleado?")) return;
  await EmployeesService.delete(id);
  await fetchData();
};

onMounted(fetchData);
</script>

<template>
  <div class="p-8 bg-slate-50 min-h-screen">
    <div class="max-w-7xl mx-auto flex justify-between items-center mb-8">
      <h1 class="text-3xl font-black text-slate-900">Gestión de Empleados</h1>
      <button
        @click="
          isEditing = false;
          showModal = true;
        "
        class="bg-emerald-600 text-white px-6 py-3 rounded-2xl font-bold"
      >
        + Nuevo Empleado
      </button>
    </div>

    <div
      class="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
    >
      <div
        v-for="e in employees"
        :key="e.id"
        class="bg-white p-6 rounded-[2rem] border shadow-sm"
      >
        <div class="flex justify-between items-start mb-4">
          <div>
            <h3 class="font-bold text-lg text-slate-800">{{ e.fullName }}</h3>
            <p class="text-[10px] text-slate-400 font-black uppercase">
              {{ e.jobTitle }}
            </p>
          </div>
          <span
            :class="
              e.isActive
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-600'
            "
            class="text-[9px] font-black px-2 py-1 rounded-full uppercase"
            >{{ e.isActive ? "Activo" : "Inactivo" }}</span
          >
        </div>
        <div class="space-y-1 mb-4 text-sm text-slate-600">
          <p>🏢 {{ e.branchName || "Sin sucursal" }}</p>
          <p>💰 Salario: ${{ e.baseSalary.toLocaleString() }}</p>
        </div>
        <div class="flex gap-2 border-t pt-4">
          <button
            @click="handleDelete(e.employeeId)"
            class="text-red-400 font-bold text-xs uppercase hover:text-red-600"
          >
            Eliminar
          </button>
          <button
            @click="openEdit(e)"
            class="text-emerald-600 font-bold text-xs uppercase hover:underline"
          >
            Editar
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="showModal"
      class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-6 z-50"
    >
      <form
        @submit.prevent="handleSubmit"
        class="bg-white p-10 rounded-[2.5rem] w-full max-w-lg space-y-4"
      >
        <h2 class="text-2xl font-black mb-6">
          {{ isEditing ? "Editar Empleado" : "Nuevo Empleado" }}
        </h2>

        <select
          v-model="form.userId"
          class="w-full p-4 bg-slate-50 border rounded-2xl"
          required
        >
          <option value="" disabled>Seleccione un Usuario</option>
          <option v-for="u in users" :key="u.userId" :value="u.userId">
            {{ u.username }}
          </option>
        </select>

        <select
          v-model="form.branchId"
          class="w-full p-4 bg-slate-50 border rounded-2xl"
          required
        >
          <option value="" disabled>Seleccione Sucursal</option>
          <option v-for="b in branches" :key="b.branchId" :value="b.branchId">
            {{ b.name }}
          </option>
        </select>

        <input
          v-model="form.fullName"
          placeholder="Nombre Completo"
          class="w-full p-4 bg-slate-50 border rounded-2xl"
          required
        />
        <input
          v-model="form.nationalId"
          placeholder="ID Nacional"
          class="w-full p-4 bg-slate-50 border rounded-2xl"
          :disabled="isEditing"
          required
        />
        <input
          v-model.number="form.baseSalary"
          type="number"
          placeholder="Salario Base"
          class="w-full p-4 bg-slate-50 border rounded-2xl"
          required
        />

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="text-[10px] font-bold text-slate-400 uppercase"
              >Fecha Contratación</label
            >
            <input
              type="date"
              v-model="form.hireDate"
              class="w-full p-4 bg-slate-50 border rounded-2xl"
              required
            />
          </div>
          <div>
            <label class="text-[10px] font-bold text-slate-400 uppercase"
              >Fecha Terminación</label
            >
            <input
              type="date"
              v-model="form.terminationDate"
              class="w-full p-4 bg-slate-50 border rounded-2xl"
            />
          </div>
        </div>

        <button
          type="submit"
          class="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black"
        >
          GUARDAR DATOS
        </button>
      </form>
    </div>
  </div>
</template>
