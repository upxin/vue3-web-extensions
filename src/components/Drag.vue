<script setup lang="ts">
withDefaults(defineProps<{ title?: string; showClose?: boolean }>(), {
  title: "",
  showClose: true,
});
const el = useTemplateRef<HTMLElement>("modalRef");
const initialValue = ref({ x: 0, y: 50 });
const { style } = useDraggable(el, {
  initialValue,
  preventDefault: true,
});

watch(
  () => el.value,
  (v) => {
    if (v) {
      const width = v.offsetWidth;
      initialValue.value.x = window.innerWidth - width; // 右边距40px
    }
  }
);

const visible = defineModel("visible", { default: false });

function close() {
  visible.value = false;
}
</script>

<template>
  <div
    v-if="visible"
    ref="modalRef"
    class="fixed bg-white rounded-lg shadow-xl overflow-hidden select-none min-w-140px"
    :style="style"
  >
    <!-- 标题栏 - 拖拽区域 -->
    <div
      id="drag-title"
      class="h-30px bg-gray-100 flex text-14px font-bold items-center px-14px cursor-move border-b border-gray-200"
    >
      <slot name="title">
        <span class="text-gray-700">{{ title }}</span>
      </slot>
      <zondicons:close-outline
        v-if="showClose"
        class="ml-auto text-16px cursor-pointer text-gray-400"
        @click="close"
      />
    </div>

    <!-- 内容区域 -->
    <div class="p-4 h-[calc(100%-30px)] overflow-auto">
      <slot>
        <div class="flex items-center justify-center h-full text-gray-500">
          请在此处放置内容
        </div>
      </slot>
    </div>
  </div>
</template>
