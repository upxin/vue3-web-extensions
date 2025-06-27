<script lang="ts" setup>
import { useClipboard } from "@vueuse/core";
import { message } from "ant-design-vue";

const [messageApi, contextHolder] = message.useMessage();

const list = [
  [1, 2, 3, null, null, 12, 13, 14, null, null, 23, 24, 25],
  [4, 5, 6, 10, 11, 15, 16, 17, 21, 22, 26, 27, 28, 32, 33],
  [7, 8, 9, null, null, 18, 19, 20, null, null, 29, 30, 31],
];
const handleList = ref(new Set());
const source = computed(() => {
  return Array.from(handleList.value)
    .sort((a, b) => a - b)
    .join(",");
});
const { copy, copied } = useClipboard({ source });
watch(
  () => copied.value,
  (v) => {
    if (v) {
      messageApi.success("复制成功");
    }
  }
);
function handleItem(num: number) {
  if (num) {
    if (handleList.value.has(num)) {
      handleList.value.delete(num);
    } else {
      handleList.value.add(num);
    }
  }
}
</script>

<template>
  <contextHolder></contextHolder>
  <div
    class="bg-gradient-to-br py-20px from-slate-50 to-slate-100 flex flex-col items-center"
  >
    <div
      v-for="(item, index) in list"
      :key="index"
      class="flex gap-3 my-10px w-full px-20px box-border"
    >
      <div
        v-for="(innerItem, i) in item"
        :key="`${index}_${i}`"
        class="w-30px h-30px flex items-center justify-center rounded-md font-medium transition-all duration-300"
        :class="[
          innerItem === null
            ? 'bg-gray-200 '
            : 'bg-white  shadow-sm hover:shadow-md hover:scale-105 cursor-pointer',
          handleList.has(innerItem) ? 'text-red-5' : 'text-gray-400',
        ]"
        @click="handleItem(innerItem)"
      >
        {{ innerItem }}
      </div>
    </div>

    <!-- 按钮组 -->
    <div class="flex gap-4 mt-4">
      <button
        class="border-0 px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg shadow transition-all duration-300 transform active:scale-95"
        @click="copy(source)"
      >
        复制
      </button>
      <button
        class="border-0 px-6 py-2.5 bg-gray-200 hover:bg-gray-300 text-slate-700 font-medium rounded-lg shadow transition-all duration-300 transform active:scale-95"
        @click="handleList.clear()"
      >
        清除
      </button>
    </div>
  </div>
</template>
