<script setup lang="ts">
withDefaults(defineProps<{ title?: string; showClose?: boolean }>(), {
  title: "",
  showClose: true,
});

const handle = useTemplateRef("handle");
const titleEl = useTemplateRef("titleRef");
const boxEl = useTemplateRef("box");

const initialValue = ref({ x: 100, y: 0 });

const visible = defineModel("visible", { default: true });

function close() {
  visible.value = false;
}

const showSlot = ref(true);

let timer = null;

const { style } = useDraggable(boxEl, {
  initialValue: initialValue.value,
  preventDefault: true,
  onStart(position, event) {
    const target = event.target as HTMLElement;
    const tag = target?.tagName;
    if (["INPUT", "TEXTAREA", "BUTTON", "SELECT"].includes(tag)) {
      return false; // 阻止拖动启动
    }
  },
});
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
  <div
    v-if="visible"
    ref="box"
    :style="style"
    class="fixed bg-white rounded-lg shadow-xl overflow-hidden select-none z-9998"
  >
    <div
      ref="titleRef"
      class="h-30px px-10px bg-gray-100 flex text-14px font-bold items-center border-b border-gray-200"
    >
      <Icon
        v-if="!showSlot"
        icon="cuida:caret-down-outline"
        class="cursor-pointer text-gray text-16px"
        @click="showSlot = !showSlot"
      />
      <Icon
        v-else
        icon="cuida:caret-up-outline"
        class="cursor-pointer text-gray text-16px"
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
  </div>
</template>
