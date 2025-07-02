<script setup lang="ts">
import { onMessage } from "webext-bridge/content-script";
import { ElButton, ElMessage } from "element-plus";
import DataSimulation from "./DataSimulation.vue";
import Overlay from "./Overlay.vue";
import { changeGray, init } from "./hidden";
import logo from "~/assets/logo.svg";
import "uno.css";
import { isGray } from "~/logic";

const showBtns = ref(false);
const [show, toggle] = useToggle(false);
const overlayRef = templateRef("overlayRef");
function getBall() {
  // 获取最后一个具有hasbb类的表格行
  function getLastHasbbRow() {
    return document.querySelector(".hasbb:last-child");
  }

  // 从指定元素中提取所有chartball01类的文本
  function extractChartball01Texts(element) {
    if (!element) return [];

    // 使用querySelectorAll获取所有class为chartball01的元素
    const chartballElements = element.querySelectorAll(".chartball01");

    // 提取文本内容并返回数组
    return Array.from(chartballElements).map((el) => el.textContent.trim());
  }

  // 复制文本到剪贴板
  async function copyToClipboard(text) {
    try {
      // 使用Clipboard API复制文本
      await navigator.clipboard.writeText(text);
      console.log("复制成功:", text);
      ElMessage.success("复制成功");
      return true;
    } catch (error) {
      console.error("复制失败:", error);
      // 备选方案：使用execCommand(clipboard)
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      console.log("备选方案复制成功:", text);
      return true;
    }
  }

  // 主函数：整合所有步骤
  function main() {
    // 1. 获取最后一个hasbb行
    const lastRow = getLastHasbbRow();

    if (!lastRow) {
      console.error("未找到class为hasbb的表格行");
      return false;
    }

    // 2. 提取chartball01文本
    const chartballTexts = extractChartball01Texts(lastRow);

    if (chartballTexts.length === 0) {
      console.error("未找到class为chartball01的元素");
      return false;
    }
    function removeLeadingZeros1(str) {
      return String(Number(str));
    }

    // 3. 拼接文本（用空格分隔）
    const textToCopy = chartballTexts
      .map((str) => {
        return removeLeadingZeros1(str);
      })
      .join(",");

    // 4. 复制到剪贴板
    return copyToClipboard(textToCopy);
  }

  // 执行主函数
  main();
}
onMessage("test", ({ data }) => {
  changeGray();
});

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "open") {
    toggle();
    sendResponse({ status: "success", message: "已打开面板" });
    return true; // 保持消息通道打开
  }
});
onMounted(() => {
  init();
  setTimeout(() => {
    changeGray();
  }, 0);
});
function handleGray() {
  if (isGray.value === "2") {
    isGray.value = "1";
  } else {
    isGray.value = "2";
  }
  setTimeout(() => {
    changeGray();
  }, 0);
}
const cMap = {
  2: "red",
  1: "gray",
} as const;
const cUrl = window.location.hostname;

const openCap = ref(false);
function openOverlay() {
  overlayRef.value?.startScreenshot?.();
}
</script>

<template>
  <Drag v-model:visible="showBtns" :x="0" :y="0">
    <div>
      <ElButton
        style="width: 92px"
        type="primary"
        size="small"
        @click="toggle()"
      >
        <img :src="logo" alt="extension icon" class="w-16px pr-4px" />
        <span>simulater</span>
      </ElButton>

      <ElButton
        style="width: 60px"
        type="primary"
        size="small"
        @click="openOverlay"
      >
        cut
      </ElButton>
      <ElButton
        style="width: 60px"
        type="primary"
        size="small"
        @click="handleGray"
      >
        {{ cMap[isGray] }}
      </ElButton>
      <ElButton
        style="width: 60px"
        type="primary"
        size="small"
        @click="getBall"
      >
        balls
      </ElButton>
    </div>
  </Drag>
  <ElButton
    v-if="cUrl.includes('lotto.sina.cn')"
    style="width: 60px"
    type="primary"
    size="small"
    class="fixed top-0px right-0px"
    @click="showBtns = !showBtns"
  >
    <img :src="logo" class="w-16px pr-4px" />
    {{ showBtns ? "close" : "open" }}
  </ElButton>
  <Drag v-model:visible="show">
    <DataSimulation></DataSimulation>
  </Drag>
  <Overlay ref="overlayRef" v-model:is-capturing="openCap"></Overlay>
</template>
