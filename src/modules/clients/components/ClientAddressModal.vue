<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";

import { useModalStore } from "@/core/stores/modalStore";
import { ClientsService } from "@/core/services/clientsService";
import { GeoService } from "@/core/services/geoService";

import type { ClientAddress } from "@/core/interfaces/clients";
import type { GeoOption } from "@/core/services/geoService";

const props = defineProps<{
  clientId: string;
  address?: ClientAddress | null;
}>();

const { t } = useI18n();
const modalStore = useModalStore();

const loading = ref(false);
const loadingCatalogs = ref(false);
const loadingCantons = ref(false);
const loadingDistricts = ref(false);

const addressType = ref(props.address?.addressType ?? "");
const addressLine = ref(props.address?.addressLine ?? "");
const notes = ref(props.address?.notes ?? "");
const isPrimary = ref(props.address?.isPrimary ?? false);

const provinces = ref<GeoOption[]>([]);
const cantons = ref<GeoOption[]>([]);
const districts = ref<GeoOption[]>([]);

const provinceId = ref<number | null>(null);
const cantonId = ref<number | null>(null);
const districtId = ref<number | null>(null);

const province = ref(props.address?.province ?? "");
const canton = ref(props.address?.canton ?? "");
const district = ref(props.address?.district ?? "");

const isEdit = computed(() => !!props.address?.addressId);

function closeModal() {
  modalStore.close();
}

async function loadProvinces() {
  provinces.value = await GeoService.getProvinces();
}

async function loadCantons(selectedProvinceId: number) {
  loadingCantons.value = true;

  try {
    cantons.value = await GeoService.getCantonsByProvince(selectedProvinceId);
  } finally {
    loadingCantons.value = false;
  }
}

async function loadDistricts(selectedCantonId: number) {
  loadingDistricts.value = true;

  try {
    districts.value = await GeoService.getDistrictsByCanton(selectedCantonId);
  } finally {
    loadingDistricts.value = false;
  }
}

async function hydrateEditSelections() {
  if (!props.address) return;

  const matchedProvince =
    provinces.value.find(
      (item) =>
        item.name.trim().toLowerCase() ===
        (props.address?.province ?? "").trim().toLowerCase(),
    ) ?? null;

  if (!matchedProvince) return;

  provinceId.value = matchedProvince.id;
  province.value = matchedProvince.name;

  await loadCantons(matchedProvince.id);

  const matchedCanton =
    cantons.value.find(
      (item) =>
        item.name.trim().toLowerCase() ===
        (props.address?.canton ?? "").trim().toLowerCase(),
    ) ?? null;

  if (!matchedCanton) return;

  cantonId.value = matchedCanton.id;
  canton.value = matchedCanton.name;

  await loadDistricts(matchedCanton.id);

  const matchedDistrict =
    districts.value.find(
      (item) =>
        item.name.trim().toLowerCase() ===
        (props.address?.district ?? "").trim().toLowerCase(),
    ) ?? null;

  if (!matchedDistrict) return;

  districtId.value = matchedDistrict.id;
  district.value = matchedDistrict.name;
}

watch(provinceId, async (value, oldValue) => {
  if (value === oldValue) return;

  const selectedProvince =
    provinces.value.find((item) => item.id === value) ?? null;

  province.value = selectedProvince?.name ?? "";

  cantonId.value = null;
  districtId.value = null;
  canton.value = "";
  district.value = "";
  cantons.value = [];
  districts.value = [];

  if (!value) return;

  try {
    await loadCantons(value);
  } catch (error: any) {
    modalStore.onError?.({
      code: 500,
      message:
        error?.message ?? t("clients.addresses.messages.loadCantonsError"),
    });
  }
});

watch(cantonId, async (value, oldValue) => {
  if (value === oldValue) return;

  const selectedCanton =
    cantons.value.find((item) => item.id === value) ?? null;

  canton.value = selectedCanton?.name ?? "";

  districtId.value = null;
  district.value = "";
  districts.value = [];

  if (!value) return;

  try {
    await loadDistricts(value);
  } catch (error: any) {
    modalStore.onError?.({
      code: 500,
      message:
        error?.message ?? t("clients.addresses.messages.loadDistrictsError"),
    });
  }
});

watch(districtId, (value) => {
  const selectedDistrict =
    districts.value.find((item) => item.id === value) ?? null;

  district.value = selectedDistrict?.name ?? "";
});

async function loadCatalogs() {
  loadingCatalogs.value = true;

  try {
    await loadProvinces();

    if (props.address) {
      await hydrateEditSelections();
    }
  } catch (error: any) {
    modalStore.onError?.({
      code: 500,
      message:
        error?.message ?? t("clients.addresses.messages.loadProvincesError"),
    });
  } finally {
    loadingCatalogs.value = false;
  }
}

async function submit() {
  if (
    !addressType.value.trim() ||
    !addressLine.value.trim() ||
    !province.value.trim() ||
    !canton.value.trim() ||
    !district.value.trim()
  ) {
    modalStore.onError?.({
      code: 400,
      message: t("clients.addresses.validation.required"),
    });
    return;
  }

  loading.value = true;

  try {
    if (isEdit.value && props.address?.addressId) {
      await ClientsService.updateAddress(
        props.clientId,
        props.address.addressId,
        {
          addressType: addressType.value.trim(),
          addressLine: addressLine.value.trim(),
          province: province.value.trim(),
          canton: canton.value.trim(),
          district: district.value.trim(),
          notes: notes.value.trim(),
          isPrimary: isPrimary.value,
        },
      );
    } else {
      await ClientsService.addAddress(props.clientId, {
        addressType: addressType.value.trim(),
        addressLine: addressLine.value.trim(),
        province: province.value.trim(),
        canton: canton.value.trim(),
        district: district.value.trim(),
        notes: notes.value.trim(),
        isPrimary: isPrimary.value,
      });
    }

    modalStore.onSuccess?.({ ok: true });
    modalStore.close();
  } catch (error: any) {
    modalStore.onError?.({
      code: error?.status ?? 500,
      message:
        error?.message ??
        (isEdit.value
          ? t("clients.addresses.messages.updateError")
          : t("clients.addresses.messages.createError")),
    });
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  await loadCatalogs();
});
</script>

<template>
  <div
    class="bg-bt-white rounded-l shadow-bt-elevation-400 w-full max-w-3xl p-bt-spacing-24"
  >
    <div class="mb-bt-spacing-24">
      <h2 class="text-xl font-bt-bold text-bt-primary-700">
        {{
          isEdit
            ? $t("clients.addresses.modal.editTitle")
            : $t("clients.addresses.modal.createTitle")
        }}
      </h2>
      <p class="text-bt-grey-600 mt-bt-spacing-8">
        {{
          isEdit
            ? $t("clients.addresses.modal.editDescription")
            : $t("clients.addresses.modal.createDescription")
        }}
      </p>
    </div>

    <div
      v-if="loadingCatalogs"
      class="py-bt-spacing-24 text-center text-bt-grey-500"
    >
      {{ $t("common.loading") }}
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-bt-spacing-16">
      <div>
        <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
          {{ $t("clients.addresses.fields.addressType") }}
        </label>
        <input
          v-model="addressType"
          type="text"
          class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
        />
      </div>

      <div>
        <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
          {{ $t("clients.addresses.fields.addressLine") }}
        </label>
        <input
          v-model="addressLine"
          type="text"
          class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
        />
      </div>

      <div>
        <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
          {{ $t("clients.addresses.fields.province") }}
        </label>
        <select
          v-model="provinceId"
          :disabled="loadingCantons || loadingDistricts"
          class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white focus:outline-none focus:ring-2 focus:ring-bt-accent-500 disabled:bg-bt-grey-100 disabled:text-bt-grey-500"
        >
          <option :value="null">
            {{ $t("common.selectOption") }}
          </option>
          <option v-for="item in provinces" :key="item.id" :value="item.id">
            {{ item.name }}
          </option>
        </select>
      </div>

      <div>
        <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
          {{ $t("clients.addresses.fields.canton") }}
        </label>
        <select
          v-model="cantonId"
          :disabled="!provinceId || loadingCantons || loadingDistricts"
          class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white focus:outline-none focus:ring-2 focus:ring-bt-accent-500 disabled:bg-bt-grey-100 disabled:text-bt-grey-500"
        >
          <option :value="null">
            {{
              loadingCantons ? $t("common.loading") : $t("common.selectOption")
            }}
          </option>
          <option v-for="item in cantons" :key="item.id" :value="item.id">
            {{ item.name }}
          </option>
        </select>
      </div>

      <div>
        <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
          {{ $t("clients.addresses.fields.district") }}
        </label>
        <select
          v-model="districtId"
          :disabled="!cantonId || loadingDistricts"
          class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 bg-bt-white focus:outline-none focus:ring-2 focus:ring-bt-accent-500 disabled:bg-bt-grey-100 disabled:text-bt-grey-500"
        >
          <option :value="null">
            {{
              loadingDistricts
                ? $t("common.loading")
                : $t("common.selectOption")
            }}
          </option>
          <option v-for="item in districts" :key="item.id" :value="item.id">
            {{ item.name }}
          </option>
        </select>
      </div>

      <div class="md:col-span-2">
        <label class="block mb-bt-spacing-8 text-sm text-bt-primary-700">
          {{ $t("clients.addresses.fields.notes") }}
        </label>
        <textarea
          v-model="notes"
          rows="3"
          class="w-full px-bt-spacing-16 py-bt-spacing-12 rounded-m border border-bt-grey-300 focus:outline-none focus:ring-2 focus:ring-bt-accent-500"
        />
      </div>

      <div class="md:col-span-2 flex items-center gap-bt-spacing-8">
        <input v-model="isPrimary" type="checkbox" />
        <span class="text-bt-primary-700">
          {{ $t("clients.addresses.fields.isPrimary") }}
        </span>
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
        :disabled="
          loading || loadingCatalogs || loadingCantons || loadingDistricts
        "
        class="px-bt-spacing-16 py-bt-spacing-12 rounded-m bg-bt-accent-500 text-bt-white hover:bg-bt-accent-600 disabled:bg-bt-disabled"
        @click="submit"
      >
        {{ loading ? $t("common.loading") : $t("common.save") }}
      </button>
    </div>
  </div>
</template>
