<script setup lang="ts">
import { ref, onMounted, computed } from "vue"
import BTButton from "@/shared/components/ui/BTButton.vue"
import BTHeader from "@/shared/components/ui/BTHeader.vue"
import BTModal from "@/shared/components/ui/BTModal.vue"
import BTInput from "@/shared/components/ui/BTInput.vue"
import BTCheckBox from "@/shared/components/ui/BTCheckBox.vue"

import { useUserList } from "../composables/useUserList"
import { useUserForm } from "../composables/useUserForm"
import { useRoles } from "../composables/useRoles"

import type { User } from "@/core/interfaces/users"


/* -------------------------
COMPOSABLES
--------------------------*/

const {
  filteredUsers,
  isLoading,
  searchQuery,
  statusFilter,
  roleFilter,
  fetchUsers,
} = useUserList()

const {
  formData,
  isSubmitting,
  passwordsMatch,
  createUser,
  updateUser,
  resetForm,
  loadUser,
  getError,
  markAsTouched,
} = useUserForm()

const { roles, fetchRoles } = useRoles()


/* -------------------------
LOCAL STATE
--------------------------*/

const showModal = ref(false)
const isEditing = ref(false)
const selectedUserId = ref<string | null>(null)


/* -------------------------
INIT
--------------------------*/

onMounted(async () => {
  await Promise.all([
    fetchUsers(),
    fetchRoles()
  ])
})


/* -------------------------
ACTIONS
--------------------------*/

function openCreate() {

  isEditing.value = false
  selectedUserId.value = null

  resetForm()

  showModal.value = true
}


function openEdit(user: User) {

  isEditing.value = true
  selectedUserId.value = user.id

  loadUser(user)

  showModal.value = true
}


async function handleSubmit() {

  let success = false

  if (isEditing.value) {

    if (!selectedUserId.value) return

    success = await updateUser(selectedUserId.value)

  } else {

    success = await createUser()

  }

  if (success) {

    showModal.value = false

    await fetchUsers()

  }

}


/* -------------------------
TABLE CONFIG
--------------------------*/

const tableHeaders = [
  { key: "username", label: "Username", sortable: true },
  { key: "email", label: "Email", sortable: true },
  { key: "roles", label: "Roles", sortable: false },
  { key: "status", label: "Status", sortable: false },
  { key: "actions", label: "Actions", sortable: false },
]

const tableRows = computed(() => filteredUsers.value)

</script>


<template>
  <div class="space-y-6">

    <!-- HEADER -->

    <BTHeader>

      <template #title>
        Users
      </template>

      <template #description>
        Manage system users and roles
      </template>

      <template #action>

        <BTButton
          variant="blue"
          size="md"
          shape="rounded"
          @click="openCreate"
        >
          + New User
        </BTButton>

      </template>

    </BTHeader>


    <!-- FILTERS -->

    <div class="bg-white p-4 rounded-xl border flex gap-4">

      <input
        v-model="searchQuery"
        placeholder="Search username or email..."
        class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
      />

      <select
        v-model="statusFilter"
        class="px-4 py-2 border border-gray-300 rounded-lg"
      >
        <option value="all">All Status</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
      </select>

      <select
        v-model="roleFilter"
        class="px-4 py-2 border border-gray-300 rounded-lg"
      >
        <option value="all">All Roles</option>

        <option
          v-for="r in roles"
          :key="r.roleId"
          :value="r.name"
        >
          {{ r.name }}
        </option>

      </select>

    </div>


    <!-- TABLE -->

    <div class="bg-white rounded-xl border overflow-hidden">

      <!-- loading -->

      <div
        v-if="isLoading"
        class="text-center py-12"
      >
        <div class="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"/>
      </div>


      <!-- empty -->

      <div
        v-else-if="tableRows.length === 0"
        class="text-center py-12 text-gray-500"
      >
        No users found
      </div>


      <!-- table -->

      <table
        v-else
        class="w-full text-left"
      >

        <thead>

          <tr class="bg-gray-50 border-b text-xs uppercase text-gray-600">

            <th class="p-4 font-semibold">Username</th>
            <th class="p-4 font-semibold">Email</th>
            <th class="p-4 font-semibold">Roles</th>
            <th class="p-4 font-semibold">Status</th>
            <th class="p-4 font-semibold text-right">Actions</th>

          </tr>

        </thead>


        <tbody>

          <tr
            v-for="user in tableRows"
            :key="user.id"
            class="border-b hover:bg-gray-50 transition-colors"
          >

            <td class="p-4 font-semibold text-gray-900">
              {{ user.username }}
            </td>

            <td class="p-4 text-gray-600">
              {{ user.email }}
            </td>


            <td class="p-4">

              <span
                v-for="r in user.roles || []"
                :key="r.roleId"
                class="inline-block bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-semibold mr-1"
              >
                {{ r.name }}
              </span>

            </td>


            <td class="p-4">

              <span
                :class="[
                  'inline-block px-2 py-1 rounded text-xs font-semibold',
                  user.isActive
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-600'
                ]"
              >
                {{ user.isActive ? "Active" : "Inactive" }}
              </span>

            </td>


            <td class="p-4 text-right">

              <button
                @click="openEdit(user)"
                class="text-blue-600 hover:text-blue-800 font-semibold text-sm"
              >
                Edit
              </button>

            </td>

          </tr>

        </tbody>

      </table>

    </div>


    <!-- MODAL -->

    <BTModal
      v-model="showModal"
      :title="isEditing ? 'Edit User' : 'Create User'"
      size="medium"
    >

      <template #default>

        <div class="space-y-4">


          <BTInput
            v-model:inputValue="formData.username"
            :error="!!getError('username')"
            :errorMsg="getError('username')"
            @blur="markAsTouched('username')"
          >
            <template #label>
              Username
            </template>
          </BTInput>


          <BTInput
            v-model:inputValue="formData.email"
            inputType="email"
            :error="!!getError('email')"
            :errorMsg="getError('email')"
            @blur="markAsTouched('email')"
          >
            <template #label>
              Email
            </template>
          </BTInput>


          <!-- PASSWORDS -->

          <template v-if="!isEditing">

            <BTInput
              v-model:inputValue="formData.password"
              inputType="password"
              :error="!!getError('password')"
              :errorMsg="getError('password')"
              @blur="markAsTouched('password')"
            >
              <template #label>
                Password
              </template>
            </BTInput>


            <BTInput
              v-model:inputValue="formData.confirmPassword"
              inputType="password"
              :error="!passwordsMatch"
              :errorMsg="!passwordsMatch ? 'Passwords do not match' : ''"
              @blur="markAsTouched('confirmPassword')"
            >
              <template #label>
                Confirm Password
              </template>
            </BTInput>

          </template>


          <!-- ROLES -->

          <div class="border border-gray-300 p-4 rounded-lg">

            <label class="block text-sm font-semibold text-gray-700 mb-2">
              Roles *
            </label>

            <div class="space-y-2">

              <label
                v-for="role in roles"
                :key="role.roleId"
                class="flex items-center gap-2 text-sm"
              >

                <input
                  type="checkbox"
                  :value="role"
                  v-model="formData.roles"
                  class="rounded"
                />

                <span>{{ role.name }}</span>

              </label>

            </div>

          </div>


          <BTCheckBox v-model:checked="formData.isActive">

            <template #label>
              Account active
            </template>

          </BTCheckBox>


          <BTCheckBox v-model:checked="formData.mustChangePassword">

            <template #label>
              Require password change on first login
            </template>

          </BTCheckBox>

        </div>

      </template>


      <!-- FOOTER -->

      <template #footer>

        <BTButton
          variant="secondary"
          size="md"
          shape="rounded"
          @click="showModal = false"
        >
          Cancel
        </BTButton>


        <BTButton
          variant="blue"
          size="md"
          shape="rounded"
          :loading="isSubmitting"
          :disabled="isSubmitting"
          @click="handleSubmit"
        >
          {{ isEditing ? "Update" : "Create" }}
        </BTButton>

      </template>

    </BTModal>

  </div>
</template>
