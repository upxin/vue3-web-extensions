<script setup lang="ts">
import { onMounted, onUnmounted, reactive, ref } from "vue";
import { ElButton } from "element-plus";

// 窗口尺寸
const windowWidth = ref<number>(window.innerWidth);
const windowHeight = ref<number>(window.innerHeight);

// 截图状态
const isCapturing = ref<boolean>(false);
const selection = reactive({
  x: 100,
  y: 100,
  width: 300,
  height: 200,
});

// 拖拽状态
const dragState = reactive({
  isDragging: false,
  isResizing: false,
  resizeDirection: "",
  startX: 0,
  startY: 0,
  startLeft: 0,
  startTop: 0,
  startWidth: 0,
  startHeight: 0,
});

// 初始化截图
function startScreenshot() {
  isCapturing.value = true;
  document.documentElement.style.overflow = "hidden";

  // 设置默认选择框（屏幕中心）
  selection.x = windowWidth.value / 2 - 150;
  selection.y = windowHeight.value / 2 - 100;
  selection.width = 300;
  selection.height = 200;

  document.addEventListener("mousemove", onMouseMove);
  document.addEventListener("mouseup", onMouseUp);
}

// 取消截图
function cancelScreenshot() {
  isCapturing.value = false;
  document.documentElement.style.overflow = "";
  document.removeEventListener("mousemove", onMouseMove);
  document.removeEventListener("mouseup", onMouseUp);
}

// 完成截图（仅关闭截图界面，不复制图片）
function completeScreenshot() {
  console.log("截图完成，选框位置和尺寸：", selection);
  // 这里可以添加保存截图信息的逻辑
  cancelScreenshot();
}

// 开始拖拽（移动选框）
function startDrag(e: MouseEvent) {
  // 检查是否点击在控制点上，如果是则不触发拖拽
  const target = e.target as HTMLElement;
  if (target.classList.contains("handle")) return;

  if (e.button !== 0) return;
  dragState.isDragging = true;
  dragState.startX = e.clientX;
  dragState.startY = e.clientY;
  dragState.startLeft = selection.x;
  dragState.startTop = selection.y;
  e.preventDefault();
}

// 开始调整大小（通过控制点）
function startResize(direction: string, e: MouseEvent) {
  if (e.button !== 0) return;
  dragState.isResizing = true;
  dragState.resizeDirection = direction;
  dragState.startX = e.clientX;
  dragState.startY = e.clientY;
  dragState.startLeft = selection.x;
  dragState.startTop = selection.y;
  dragState.startWidth = selection.width;
  dragState.startHeight = selection.height;
  e.preventDefault();
}

// 鼠标移动事件（处理拖拽和调整大小）
function onMouseMove(e: MouseEvent) {
  if (dragState.isDragging) {
    // 拖拽选框移动
    const dx = e.clientX - dragState.startX;
    const dy = e.clientY - dragState.startY;

    // 计算新的选框位置，确保不超出屏幕
    selection.x = Math.max(
      0,
      Math.min(windowWidth.value - selection.width, dragState.startLeft + dx)
    );
    selection.y = Math.max(
      0,
      Math.min(windowHeight.value - selection.height, dragState.startTop + dy)
    );
  } else if (dragState.isResizing) {
    // 调整选框大小
    const dx = e.clientX - dragState.startX;
    const dy = e.clientY - dragState.startY;

    let newX = selection.x;
    let newY = selection.y;
    let newWidth = selection.width;
    let newHeight = selection.height;

    // 根据拖拽方向调整尺寸和位置
    switch (dragState.resizeDirection) {
      case "tl":
        newWidth = dragState.startWidth - dx;
        newHeight = dragState.startHeight - dy;
        newX = dragState.startLeft + dx;
        newY = dragState.startTop + dy;
        break;
      case "tr":
        newWidth = dragState.startWidth + dx;
        newHeight = dragState.startHeight - dy;
        newY = dragState.startTop + dy;
        break;
      case "br":
        newWidth = dragState.startWidth + dx;
        newHeight = dragState.startHeight + dy;
        break;
      case "bl":
        newWidth = dragState.startWidth - dx;
        newHeight = dragState.startHeight + dy;
        newX = dragState.startLeft + dx;
        break;
      case "t":
        newHeight = dragState.startHeight - dy;
        newY = dragState.startTop + dy;
        break;
      case "r":
        newWidth = dragState.startWidth + dx;
        break;
      case "b":
        newHeight = dragState.startHeight + dy;
        break;
      case "l":
        newWidth = dragState.startWidth - dx;
        newX = dragState.startLeft + dx;
        break;
    }

    // 确保尺寸不小于最小值，位置不超出屏幕
    const minSize = 20;
    if (newWidth >= minSize && newHeight >= minSize) {
      selection.x = Math.max(0, Math.min(windowWidth.value - newWidth, newX));
      selection.y = Math.max(0, Math.min(windowHeight.value - newHeight, newY));
      selection.width = newWidth;
      selection.height = newHeight;
    }
  }
}

// 鼠标释放事件（结束拖拽或调整大小）
function onMouseUp() {
  dragState.isDragging = false;
  dragState.isResizing = false;
  dragState.resizeDirection = "";
}

// 更新窗口尺寸
function updateWindowSize() {
  windowWidth.value = window.innerWidth;
  windowHeight.value = window.innerHeight;
}

// 监听窗口大小变化
onMounted(() => {
  window.addEventListener("resize", updateWindowSize);
});

// 清理函数
onUnmounted(() => {
  document.removeEventListener("mousemove", onMouseMove);
  document.removeEventListener("mouseup", onMouseUp);
  window.removeEventListener("resize", updateWindowSize);
});
</script>

<template>
  <div class="screenshot-app">
    <ElButton
      type="primary"
      size="small"
      class="fixed bottom-50px left-20px z-9999 cursor-pointer"
      @click="startScreenshot"
    >
      开始截图
    </ElButton>

    <div v-if="isCapturing" class="screenshot-overlay">
      <!-- 上方遮罩 -->
      <div
        class="mask-top"
        :style="{
          width: '100%',
          height: `${selection.y}px`,
          top: '0',
          left: '0',
        }"
      ></div>

      <!-- 右侧遮罩：调整高度，不与上、下遮罩层重叠 -->
      <div
        class="mask-right"
        :style="{
          width: `${windowWidth - selection.x - selection.width}px`,
          height: `${selection.height}px`,
          left: `${selection.x + selection.width}px`,
          top: `${selection.y}px`,
        }"
      ></div>

      <!-- 下方遮罩 -->
      <div
        class="mask-bottom"
        :style="{
          width: '100%',
          height: `${windowHeight - selection.y - selection.height}px`,
          top: `${selection.y + selection.height}px`,
          left: '0',
        }"
      ></div>

      <!-- 左侧遮罩：调整高度，不与上、下遮罩层重叠 -->
      <div
        class="mask-left"
        :style="{
          width: `${selection.x}px`,
          height: `${selection.height}px`,
          top: `${selection.y}px`,
          left: '0',
        }"
      ></div>

      <!-- 选择框 -->
      <div
        class="selection-box"
        :style="{
          left: `${selection.x}px`,
          top: `${selection.y}px`,
          width: `${selection.width}px`,
          height: `${selection.height}px`,
        }"
        @mousedown="startDrag"
      >
        <!-- 边框 -->
        <div class="border top"></div>
        <div class="border right"></div>
        <div class="border bottom"></div>
        <div class="border left"></div>

        <!-- 控制点 -->
        <div
          class="handle handle-tl"
          @mousedown="(e) => startResize('tl', e)"
        ></div>
        <div
          class="handle handle-tr"
          @mousedown="(e) => startResize('tr', e)"
        ></div>
        <div
          class="handle handle-br"
          @mousedown="(e) => startResize('br', e)"
        ></div>
        <div
          class="handle handle-bl"
          @mousedown="(e) => startResize('bl', e)"
        ></div>
        <div
          class="handle handle-t"
          @mousedown="(e) => startResize('t', e)"
        ></div>
        <div
          class="handle handle-r"
          @mousedown="(e) => startResize('r', e)"
        ></div>
        <div
          class="handle handle-b"
          @mousedown="(e) => startResize('b', e)"
        ></div>
        <div
          class="handle handle-l"
          @mousedown="(e) => startResize('l', e)"
        ></div>
      </div>

      <!-- 操作栏 -->
      <div class="toolbar">
        <ElButton @click="cancelScreenshot"> 取消 </ElButton>
        <ElButton @click="completeScreenshot"> 完成 </ElButton>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 应用容器 */
.screenshot-app {
  position: fixed;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

/* 背景内容 */
.background-content {
  max-width: 800px;
  padding: 40px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
  text-align: center;
}

.background-content h1 {
  color: #333;
  margin-bottom: 20px;
}

.background-content p {
  color: #666;
  margin-bottom: 10px;
}

.background-content img {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
  margin-top: 20px;
}

/* 启动按钮 */
.start-btn {
  padding: 8px 16px;
  background-color: #409eff;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
}

.screenshot-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 9999;
  background: transparent;
}

/* 遮罩层（四个方向） */
.mask-top,
.mask-right,
.mask-bottom,
.mask-left {
  position: absolute;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(2px);
  z-index: 9998;
}

/* 选择框 */
.selection-box {
  position: absolute;
  border: 1px solid #409eff;
  background: transparent;
  cursor: move;
  z-index: 10000;
}

/* 边框 */
.border {
  position: absolute;
  background: #409eff;
  z-index: 10001;
}

.border.top {
  top: 0;
  left: 0;
  width: 100%;
  height: 2px;
}

.border.right {
  top: 0;
  right: 0;
  width: 2px;
  height: 100%;
}

.border.bottom {
  bottom: 0;
  left: 0;
  width: 100%;
  height: 2px;
}

.border.left {
  top: 0;
  left: 0;
  width: 2px;
  height: 100%;
}

/* 控制点 */
.handle {
  position: absolute;
  width: 12px;
  height: 12px;
  background: #409eff;
  border: 2px solid white;
  border-radius: 50%;
  box-shadow: 0 0 4px rgba(0, 0, 0, 0.3);
  z-index: 10002;
  transition: all 0.2s;
}

.handle:hover {
  background: #337ab7;
}

.handle-tl {
  top: -6px;
  left: -6px;
  cursor: nwse-resize;
}
.handle-tr {
  top: -6px;
  right: -6px;
  cursor: nesw-resize;
}
.handle-bl {
  bottom: -6px;
  left: -6px;
  cursor: nesw-resize;
}
.handle-br {
  bottom: -6px;
  right: -6px;
  cursor: nwse-resize;
}
.handle-t {
  top: -6px;
  left: 50%;
  transform: translateX(-50%);
  cursor: ns-resize;
}
.handle-r {
  top: 50%;
  right: -6px;
  transform: translateY(-50%);
  cursor: ew-resize;
}
.handle-b {
  bottom: -6px;
  left: 50%;
  transform: translateX(-50%);
  cursor: ns-resize;
}
.handle-l {
  top: 50%;
  left: -6px;
  transform: translateY(-50%);
  cursor: ew-resize;
}

/* 工具栏 */
.toolbar {
  position: fixed;
  bottom: 50px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 10px;
  background: rgba(255, 255, 255, 0.9);
  padding: 8px 16px;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  z-index: 10003;
}

.toolbar button {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.toolbar button:first-child {
  background: #e4e7ed;
  color: #606266;
}

.toolbar button:first-child:hover {
  background: #dcdfe6;
}

.toolbar button:nth-child(2) {
  background: #409eff;
  color: white;
}

.toolbar button:nth-child(2):hover {
  background: #337ab7;
}
</style>
