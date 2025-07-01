<script setup lang="ts">
import { onMessage } from "webext-bridge/content-script";
import { message } from "ant-design-vue";
import DataSimulation from "./DataSimulation.vue";
import Overlay from "./Overlay.vue";
import { changeGray, init } from "./hidden";
import Drag from "./Drag.vue";
import logo from "~/assets/logo.svg";
import "uno.css";
import { isGray } from "~/logic";

const [show, toggle] = useToggle(false);
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
      message.success("复制成功");
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
</script>

<template>
  <img
    :src="logo"
    class="fixed top-50vh left-20px z-9999 cursor-pointer"
    alt="extension icon"
    @click="
      () => {
        toggle();
      }
    "
  />
  <button
    v-if="cUrl.includes('lotto.sina.cn')"
    class="fixed bottom-90px left-20px z-9999 cursor-pointer start-btn"
    @click="handleGray"
  >
    {{ cMap[isGray] }}
  </button>
  <Drag v-model:visible="show">
    <DataSimulation></DataSimulation>
  </Drag>
  <Overlay></Overlay>

  <button
    v-if="cUrl.includes('lotto.sina.cn')"
    class="fixed bottom-124px left-20px z-9999 cursor-pointer start-btn"
    @click="getBall"
  >
    balls
  </button>
</template>

<style scoped>
.start-btn {
  padding: 8px 16px;
  background-color: #409eff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
}
</style>
