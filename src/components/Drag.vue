<script setup lang="ts">
interface Props {
  showClose?: boolean;
  x?: number;
  y?: number;
  zIndex?: number;
  title?: string;
}

const props = withDefaults(defineProps<Props>(), {
  showClose: true,
  x: -1,
  y: -1,
  zIndex: 10000,
  title: "拖拽区域",
});
// 使用defineModel定义visible双向绑定
const visible = defineModel("visible", {
  default: true,
});

// 状态管理
const isDragging = ref(false);
const position = ref({ x: 0, y: 0 });
const offset = ref({ x: 0, y: 0 });
const { width: windowWidth, height: windowHeight } = useWindowSize();
const modalRef = ref();
const modalSize = ref({ width: 0, height: 0 });

// 初始化位置 - 居中显示
function initializePosition() {
  if (visible.value && modalRef.value) {
    // 更新模态框尺寸
    if (props.x >= 0) {
      position.value = {
        x: props.x,
        y: props.y,
      };
      return;
    }
    updateModalSize();
  }
}

// 更新模态框尺寸
function updateModalSize() {
  if (modalRef.value) {
    modalSize.value = {
      width: modalRef.value.offsetWidth,
      height: modalRef.value.offsetHeight,
    };
    console.log(windowWidth.value, modalSize.value.width);
    // 默认居中 计算居中位置
    position.value = {
      x: (windowWidth.value - modalSize.value.width) / 2,
      y: (windowHeight.value - modalSize.value.height) / 2,
    };
  }
}

// 初始化
onMounted(() => {
  const timer = setTimeout(() => {
    initializePosition();
    clearTimeout(timer);
  }, 50);
  // 添加窗口大小变化监听
  window.addEventListener("resize", handleWindowResize);
});

// 处理窗口大小变化
function handleWindowResize() {
  if (!visible.value) return;

  // 延迟更新以避免频繁计算
  nextTick(() => {
    updateModalSize();

    // 确保模态框不会超出新的窗口边界
    position.value = {
      x: Math.max(
        0,
        Math.min(windowWidth.value - modalSize.value.width, position.value.x)
      ),
      y: Math.max(
        0,
        Math.min(windowHeight.value - modalSize.value.height, position.value.y)
      ),
    };
  });
}

// 监听visible变化，重置位置
watch(
  visible,
  (newVal) => {
    if (newVal) {
      nextTick(() => {
        initializePosition();
      });
    }
  },
  { immediate: true }
);

// 开始拖拽
function startDrag(e) {
  // 只允许通过标题栏拖拽
  if (!e.target.closest("#drag-title")) return;

  isDragging.value = true;
  offset.value = {
    x: e.clientX - position.value.x,
    y: e.clientY - position.value.y,
  };

  // 添加事件监听器
  document.addEventListener("mousemove", onMouseMove);
  document.addEventListener("mouseup", onMouseUp);
}

// 鼠标移动
function onMouseMove(e) {
  if (!isDragging.value) return;

  // 更新模态框尺寸（以防窗口大小已变化）
  updateModalSize();

  // 计算新位置
  let newX = e.clientX - offset.value.x;
  let newY = e.clientY - offset.value.y;

  // 完整边界检查（上、下、左、右）
  newX = Math.max(0, Math.min(windowWidth.value - modalSize.value.width, newX));
  newY = Math.max(
    0,
    Math.min(windowHeight.value - modalSize.value.height, newY)
  );

  position.value = { x: newX, y: newY };
}

// 结束拖拽
function onMouseUp() {
  isDragging.value = false;
  document.removeEventListener("mousemove", onMouseMove);
  document.removeEventListener("mouseup", onMouseUp);
}

// 关闭模态框
function close() {
  visible.value = false;
}

// 清理事件监听器
onUnmounted(() => {
  document.removeEventListener("mousemove", onMouseMove);
  document.removeEventListener("mouseup", onMouseUp);
  window.removeEventListener("resize", handleWindowResize);
});
</script>

<template>
  <div
    ref="modalRef"
    class="fixed bg-white rounded-lg shadow-xl overflow-hidden select-none"
    :style="{
      left: `${position.x}px`,
      top: `${position.y}px`,
      zIndex,
      display: visible ? 'block' : 'none',
    }"
  >
    <!-- 标题栏 - 拖拽区域 -->
    <div
      id="drag-title"
      class="h-30px bg-gray-100 flex text-14px font-bold items-center px-14px cursor-move border-b border-gray-200"
      @mousedown="startDrag"
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

<style scoped>
/* 确保组件可被点击 */
div {
  touch-action: none;
}
</style>
