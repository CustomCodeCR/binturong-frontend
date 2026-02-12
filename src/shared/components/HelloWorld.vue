<script setup lang="ts">
import { defineComponent, h, ref } from "vue";
import BTButton from "@/components/ui/BTButton.vue";
import { useDrawerStore } from "@/core/stores/drawer";
import {
  useToastStore,
  type ToastLocation,
  type Toast,
} from "@/core/stores/toast";
import { useRouter } from "vue-router";

defineProps<{ msg: string }>();

const count = ref(0);
const drawerStore = useDrawerStore();
const router = useRouter();
const toastStore = useToastStore();

const DrawerDemoContent = defineComponent({
  name: "DrawerDemoContent",
  props: {
    count: { type: Number, required: true },
  },
  setup(props) {
    return () =>
      h("div", { class: "flex flex-col gap-4" }, [
        h(
          "p",
          { class: "bt-text-body-m text-bt-grey-700" },
          "Esto es contenido del drawer (demo).",
        ),
        h(
          "div",
          {
            class:
              "rounded-m bg-bt-grey-100 p-4 bt-text-body-s text-bt-grey-800",
          },
          `Count actual: ${props.count}`,
        ),
      ]);
  },
});

function openDemoDrawer() {
  drawerStore.openDrawer({
    component: DrawerDemoContent,
    direction: "right",
    title: "BT Drawer (Demo)",
    description: "Probando drawer desde HelloWorld",
    props: { count: count.value },
  });
}

function showToast(
  severity: Toast["severity"],
  location: ToastLocation = "top-right",
) {
  // Asumiendo que tu store tiene addToast(...) (típico)
  toastStore.addToast?.({
    title: "BT Toast",
    message: `Toast severity: ${severity}`,
    severity,
    location,
  });
}
const handleClick = () => {
  router.push("/users");
};
</script>

<template>
  <div class="mx-auto max-w-xl px-6 py-12 flex flex-col gap-6">
    <h1 class="bt-text-heading-3 text-bt-grey-900">
      {{ msg }}
    </h1>

    <div
      class="rounded-m bg-bt-white shadow-bt-elevation-200 p-6 flex flex-col gap-4"
    >
      <p class="bt-text-body-m text-bt-grey-700">
        Demo: Drawer + Toasts usando BT design tokens
      </p>

      <div class="flex flex-wrap gap-2">
        <BTButton size="md" variant="primary" @click="count++">
          count is {{ count }}
        </BTButton>

        <BTButton size="md" variant="secondary" @click="openDemoDrawer">
          Open Drawer
        </BTButton>
      </div>

      <div class="flex flex-wrap gap-2">
        <BTButton size="sm" variant="primary" @click="showToast('success')"
          >Toast Success</BTButton
        >
        <BTButton size="sm" variant="primary" @click="showToast('info')"
          >Toast Info</BTButton
        >
        <BTButton size="sm" variant="primary" @click="showToast('warning')"
          >Toast Warning</BTButton
        >
        <BTButton size="sm" variant="destructive" @click="showToast('error')"
          >Toast Error</BTButton
        >
        <BTButton
          @click="handleClick"
          type="submit"
          size="sm"
          variant="secondary"
          >list</BTButton
        >
      </div>

      <p class="bt-text-body-s text-bt-grey-500">
        *Si no aparece el toast, tu store no se llama <code>addToast</code>.
        Decime el método real y te lo dejo perfecto.
      </p>
    </div>
  </div>
</template>
