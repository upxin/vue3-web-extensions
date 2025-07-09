<script setup lang="ts">
withDefaults(defineProps<{ title?: string; showClose?: boolean }>(), {
  title: "",
  showClose: true,
});

const handle = useTemplateRef<HTMLElement>("handle");
const titleEl = useTemplateRef<HTMLElement>("titleRef");

const initialValue = ref({ x: 100, y: 0 });

const visible = defineModel("visible", { default: true });

function close() {
  visible.value = false;
}

const showSlot = ref(true);

let timer = null;
onMounted(() => {
  timer = setTimeout(() => {
    initialValue.value.x =
      window.innerWidth - (titleEl.value?.offsetWidth || 140);
    clearTimeout(timer);
    timer = null;
  }, 50);
});
</script>

<template>
  <UseDraggable
    v-if="visible"
    class="fixed bg-white rounded-lg shadow-xl overflow-hidden select-none z-9998"
    :initial-value="initialValue"
    :prevent-default="true"
  >
    <div
      ref="titleRef"
      class="h-30px px-10px bg-gray-100 flex text-14px font-bold items-center border-b border-gray-200"
    >
      <Icon
        v-if="!showSlot"
        icon="cuida:caret-down-outline"
        width="24"
        height="24"
        style="color: #797ac6"
        class="cursor-pointer"
        @click="showSlot = !showSlot"
      />
      <Icon
        v-else
        icon="cuida:caret-up-outline"
        width="24"
        height="24"
        style="color: #797ac6"
        class="cursor-pointer"
        @click="showSlot = !showSlot"
      />

      <div
        ref="handle"
        class="text-gray-700 whitespace-nowrap min-w-124px box-border flex-1 h-full flex items-center justify-center cursor-move px-20px"
      >
        <slot name="title">
          {{ title }}
        </slot>
      </div>

      <Icon
        v-if="showClose"
        icon="zondicons:close-outline"
        class="ml-auto text-16px cursor-pointer text-gray-400"
        @click="close"
      ></Icon>
    </div>
    <div v-show="showSlot" class="p-4 h-[calc(100%-30px)] overflow-auto">
      <slot>
        <div class="flex items-center justify-center h-full text-gray-500">
          请在此处放置内容
        </div>
      </slot>
    </div>
  </UseDraggable>
</template>
