<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";

import { RolesService } from "@/core/services/rolesService";
import { SecurityService } from "@/core/services/securityService";
import { useModalStore } from "@/core/stores/modalStore";

import type { Role } from "@/core/interfaces/roles";
import type { Scope } from "@/core/interfaces/scopes";

const props = defineProps<{
  roleId: string;
}>();

const { t } = useI18n();
const modalStore = useModalStore();

const loading = ref(false);
const saving = ref(false);
const loadingScopes = ref(false);

const role = ref<Role | null>(null);
const scopeOptions = ref<Scope[]>([]);
const selectedScopeIds = ref<string[]>([]);
const scopeSearch = ref("");

const name = ref("");
const description = ref("");
const isActive = ref(true);

const filteredScopes = computed(() => {
  const term = scopeSearch.value.trim().toLowerCase();

  if (!term) {
    return scopeOptions.value;
  }

  return scopeOptions.value.filter((scope) => {
    const code = String(scope.code ?? "").toLowerCase();
    const description = String(scope.description ?? "").toLowerCase();
    const scopeId = String(scope.scopeId ?? "").toLowerCase();

    return (
      code.includes(term) ||
      description.includes(term) ||
      scopeId.includes(term)
    );
  });
});

function closeModal() {
  modalStore.close();
}

function normalizeSelectedScopeIds(ids: string[]): string[] {
  return [...new Set(ids.map((id) => String(id ?? "").trim()).filter(Boolean))];
}

function selectAllFilteredScopes() {
  selectedScopeIds.value = normalizeSelectedScopeIds([
    ...selectedScopeIds.value,
    ...filteredScopes.value.map((scope) => scope.scopeId),
  ]);
}

function clearAllScopes() {
  selectedScopeIds.value = [];
}

async function loadScopes() {
  loadingScopes.value = true;

  try {
    const scopes = await SecurityService.getScopes();
    scopeOptions.value = [...scopes].sort((a, b) =>
      a.code.localeCompare(b.code),
    );
  } catch (error: any) {
    modalStore.onError?.({
      code: error?.status ?? 500,
      message: error?.message ?? t("roles.messages.scopesLoadError"),
    });
  } finally {
    loadingScopes.value = false;
  }
}

async function loadRole() {
  loading.value = true;

  try {
    const response = await RolesService.readById(props.roleId);
    role.value = response;

    name.value = response.name;
    description.value = response.description;
    isActive.value = response.isActive;
    selectedScopeIds.value = normalizeSelectedScopeIds(
      response.scopes.map((scope) => scope.scopeId),
    );
  } catch (error: any) {
    modalStore.onError?.({
      code: error?.status ?? 500,
      message: error?.message ?? t("roles.messages.readError"),
    });
  } finally {
    loading.value = false;
  }
}

async function submit() {
  if (!role.value) {
    return;
  }

  if (!name.value.trim() || !description.value.trim()) {
    modalStore.onError?.({
      code: 400,
      message: t("roles.validation.requiredUpdate"),
    });
    return;
  }

  saving.value = true;

  try {
    await RolesService.update(role.value.roleId, {
      name: name.value.trim(),
      description: description.value.trim(),
      isActive: isActive.value,
    });

    await RolesService.setScopes(role.value.roleId, {
      scopeIds: normalizeSelectedScopeIds(selectedScopeIds.value),
    });

    const selectedScopes = scopeOptions.value.filter((scope) =>
      selectedScopeIds.value.includes(scope.scopeId),
    );

    modalStore.onSuccess?.({
      roleId: role.value.roleId,
      name: name.value.trim(),
      description: description.value.trim(),
      isActive: isActive.value,
      scopes: selectedScopes,
    });

    modalStore.close();
  } catch (error: any) {
    modalStore.onError?.({
      code: error?.status ?? 500,
      message: error?.message ?? t("roles.messages.updateError"),
    });
  } finally {
    saving.value = false;
  }
}

onMounted(async () => {
  await Promise.all([loadScopes(), loadRole()]);
});
</script>

<template>
  <div
    class="bg-bt-white rounded-l shadow-bt-elevation-400 w-full max-w-3xl p-bt-spacing-24"
  >
    <div class="mb-bt-spacing-24">
      <h2 class="text-xl font-bt-bold text-bt-primary-700">
        {{ $t("roles.modal.editTitle") }}
      </h2>
      <p class="text-bt-grey-600 mt-bt-spacing-8">
        {{ $t("roles.modal.editDescription") }}
      </p>
    </div>

    <div v-if="loading" class="py-bt-spacing-24 text-center text-bt-grey-500">
      {{ $t("common.loading") }}
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-bt-spacing-16">
      <div>
        <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
          {{ $t("roles.fields.name") }}
        </label>
        <input
          v-model="name"
          type="text"
          class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
        />
      </div>

      <div class="flex items-center gap-bt-spacing-8 pt-bt-spacing-32">
        <input v-model="isActive" type="checkbox" />
        <span class="text-bt-primary-700">
          {{ $t("roles.fields.isActive") }}
        </span>
      </div>

      <div class="md:col-span-2">
        <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
          {{ $t("roles.fields.description") }}
        </label>
        <textarea
          v-model="description"
          rows="4"
          class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
        />
      </div>

      <div class="md:col-span-2">
        <div
          class="flex items-center justify-between gap-bt-spacing-12 mb-bt-spacing-8"
        >
          <label class="block text-sm text-bt-primary-700">
            {{ $t("roles.fields.scopes") }}
          </label>

          <div class="flex items-center gap-bt-spacing-8">
            <button
              type="button"
              class="px-bt-spacing-12 py-bt-spacing-8 rounded-m bg-bt-grey-200 text-bt-primary-700 hover:bg-bt-grey-300 text-sm"
              @click="selectAllFilteredScopes"
            >
              {{ $t("common.selectAll", "Select all") }}
            </button>

            <button
              type="button"
              class="px-bt-spacing-12 py-bt-spacing-8 rounded-m bg-bt-grey-200 text-bt-primary-700 hover:bg-bt-grey-300 text-sm"
              @click="clearAllScopes"
            >
              {{ $t("common.clear", "Clear") }}
            </button>
          </div>
        </div>

        <input
          v-model="scopeSearch"
          type="text"
          :placeholder="$t('roles.searchScopesPlaceholder', 'Search scopes')"
          class="w-full mb-bt-spacing-12 px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
        />

        <div
          class="rounded-m border border-bt-grey-300 bg-bt-white max-h-72 overflow-auto p-bt-spacing-12"
        >
          <div v-if="loadingScopes" class="text-bt-grey-500">
            {{ $t("roles.validation.loadingScopes") }}
          </div>

          <label
            v-for="scope in filteredScopes"
            :key="scope.scopeId"
            class="flex items-start gap-bt-spacing-8 py-bt-spacing-8 text-bt-primary-700"
          >
            <input
              v-model="selectedScopeIds"
              type="checkbox"
              :value="scope.scopeId"
              class="mt-1"
            />
            <div>
              <div class="font-medium">{{ scope.code }}</div>
              <div class="text-xs text-bt-grey-600">
                {{ scope.description ?? scope.code }}
              </div>
              <div class="text-xs text-bt-grey-500">
                {{ scope.scopeId }}
              </div>
            </div>
          </label>

          <div
            v-if="!loadingScopes && !filteredScopes.length"
            class="text-bt-grey-500"
          >
            {{
              $t("roles.validation.noScopesAvailable", "No scopes available")
            }}
          </div>
        </div>

        <p class="mt-bt-spacing-8 text-xs text-bt-grey-500">
          {{ selectedScopeIds.length }} selected
        </p>
      </div>
    </div>

    <div class="mt-bt-spacing-24 flex justify-end gap-bt-spacing-12">
      <button
        type="button"
        class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-grey-200 text-bt-primary-700 hover:bg-bt-grey-300"
        @click="closeModal"
      >
        {{ $t("common.cancel") }}
      </button>

      <button
        type="button"
        :disabled="saving"
        class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-accent-500 text-bt-white hover:bg-bt-accent-600 disabled:bg-bt-disabled"
        @click="submit"
      >
        {{ saving ? $t("common.loading") : $t("roles.actions.saveChanges") }}
      </button>
    </div>
  </div>
</template>
