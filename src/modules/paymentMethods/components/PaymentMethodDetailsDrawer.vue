<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useDrawerStore } from "@/core/stores/drawerStore";
import { PaymentMethodsService } from "@/core/services/paymentMethodsService";
import type { PaymentMethod } from "@/core/interfaces/paymentMethods";

const props = defineProps<{
  paymentMethodId: string;
}>();

const { t } = useI18n();
const drawerStore = useDrawerStore();

const loadingPaymentMethod = ref(false);
const paymentMethod = ref<PaymentMethod | null>(null);

async function loadPaymentMethod() {
  loadingPaymentMethod.value = true;

  try {
    paymentMethod.value = await PaymentMethodsService.readById(
      props.paymentMethodId,
    );
  } finally {
    loadingPaymentMethod.value = false;
  }
}

function closeDrawer() {
  drawerStore.closeDrawer();
}

onMounted(async () => {
  await loadPaymentMethod();
});

watch(
  () => props.paymentMethodId,
  async () => {
    await loadPaymentMethod();
  },
);
</script>

<template>
  <div class="h-full bg-bt-white p-bt-spacing-24 overflow-y-auto">
    <div class="flex items-start justify-between mb-bt-spacing-24">
      <div>
        <h2 class="text-xl font-bt-bold text-bt-primary-700">
          {{ $t("paymentMethods.drawer.title") }}
        </h2>
        <p class="text-bt-grey-600 mt-bt-spacing-8">
          {{
            $t("paymentMethods.drawer.description", {
              description: paymentMethod?.description ?? "",
            })
          }}
        </p>
      </div>

      <button
        type="button"
        class="px-bt-spacing-12 py-bt-spacing-8 rounded-m bg-bt-grey-200 text-bt-primary-700 hover:bg-bt-grey-300"
        @click="closeDrawer"
      >
        {{ $t("paymentMethods.actions.close") }}
      </button>
    </div>

    <div v-if="loadingPaymentMethod" class="text-bt-grey-500">
      {{ $t("common.loading") }}
    </div>

    <div v-else-if="paymentMethod" class="space-y-bt-spacing-16">
      <div class="grid grid-cols-1 gap-bt-spacing-16">
        <div
          class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
        >
          <div class="text-xs text-bt-grey-500">
            {{ $t("paymentMethods.table.code") }}
          </div>
          <div class="text-bt-primary-700 font-bt-semibold">
            {{ paymentMethod.code }}
          </div>
        </div>

        <div
          class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
        >
          <div class="text-xs text-bt-grey-500">
            {{ $t("paymentMethods.table.description") }}
          </div>
          <div class="text-bt-primary-700 font-bt-semibold">
            {{ paymentMethod.description }}
          </div>
        </div>

        <div
          class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
        >
          <div class="text-xs text-bt-grey-500">
            {{ $t("paymentMethods.table.status") }}
          </div>
          <div
            class="font-bt-semibold"
            :class="
              paymentMethod.isActive
                ? 'text-bt-success-700'
                : 'text-bt-error-700'
            "
          >
            {{
              paymentMethod.isActive
                ? $t("paymentMethods.status.active")
                : $t("paymentMethods.status.inactive")
            }}
          </div>
        </div>

        <div
          class="p-bt-spacing-16 rounded-m border border-bt-grey-200 bg-bt-grey-50"
        >
          <div class="text-xs text-bt-grey-500">
            {{ $t("paymentMethods.table.updatedAt") }}
          </div>
          <div class="text-bt-primary-700 font-bt-semibold">
            {{ paymentMethod.updatedAt }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
