<script setup lang="ts">
import { onMessage } from "webext-bridge/content-script";
import { shadowRootKey } from "../keys";
import DataSimulation from "./DataSimulation.vue";
import Overlay from "./Overlay.vue";
import { changeGray, init } from "./hidden";
import { isGray } from "~/logic";
import logo from "~/assets/logo.svg";

function globalLog(...args) {
  console.log("chrome===:", ...args);
}
window.g = globalLog;

const el = useTemplateRef<HTMLElement>("el");
const initialValue = ref({ x: 0, y: 0 });
const { style } = useDraggable(el, {
  initialValue,
  preventDefault: true,
});

onMounted(() => {
  g("sapp");
  nextTick(() => {
    const elem = el.value;
    if (elem) {
      const width = elem.offsetWidth;
      initialValue.value.x = window.innerWidth - width; // 右边距40px
    }
  });
});

const shadowRoot = inject(shadowRootKey);

const showBtns = ref(false);
const [show, toggle] = useToggle(false);
const overlayRef = templateRef("overlayRef");
function getBall() {
  if (location.hostname !== "lotto.sina.cn") return;
  // 获取最后一个具有hasbb类的表格行
  function getLastHasbbRow() {
    return document.querySelector(".hasbb:last-child");
  }

  // 从指定元素中提取所有chartball01类的文本
  function extractChartball01Texts(element) {
    if (!element) return [];

    // 选择所有类名中包含 "chartball" 的元素
    const chartballElements = element.querySelectorAll('[class*="chartball"]');
    // 提取文本内容并返回数组
    return Array.from(chartballElements).map((el) => el.textContent.trim());
  }

  // 复制文本到剪贴板
  async function copyToClipboard(text) {
    try {
      // 使用Clipboard API复制文本
      await navigator.clipboard.writeText(text);
      g("复制成功:", text);
      ElMessage({
        type: "success",
        message: "复制成功",
        showClose: true,
        appendTo: shadowRoot as unknown as HTMLElement,
      });
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
      g("备选方案复制成功:", text);
      return true;
    }
  }

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
  g("chrome===: test-msg");
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
function handleBtnClick() {
  showBtns.value = !showBtns.value;
}
</script>

<template>
  <Drag v-model:visible="showBtns">
    <div>
      <el-button
        style="width: 92px"
        type="primary"
        size="small"
        @click="toggle()"
      >
        <img :src="logo" alt="extension icon" class="w-16px pr-4px" />
        <span>simulater</span>
      </el-button>

      <el-button
        style="width: 60px"
        type="primary"
        size="small"
        @click="openOverlay"
      >
        cut
      </el-button>
      <el-button
        style="width: 60px"
        type="primary"
        size="small"
        @click="handleGray"
      >
        {{ cMap[isGray] }}
      </el-button>
      <el-button
        style="width: 60px"
        type="primary"
        size="small"
        @click="getBall"
      >
        balls
      </el-button>
    </div>
  </Drag>

  <div ref="el" :style="style" class="fixed w-70px z-1000">
    <div
      class="drag-handle flex items-center justify-center h-22px bg-gradient-to-r from-gray-100 to-gray-200 rounded-t-2 shadow cursor-grab select-none gap-2 hover:from-blue-100 hover:to-blue-200 transition-all"
      @mousedown.stop
      @touchstart.stop
    >
      <span class="i-mingcute:drag-line-2-fill text-gray-400 text-lg" />
      <span class="text-gray-500 text-xs font-medium tracking-widest"
        >拖动</span
      >
    </div>
    <el-button
      v-if="cUrl.includes('lotto.sina.cn') || cUrl.includes('localhost')"
      type="primary"
      size="small"
      class="w-full rounded-b-2"
      @click="handleBtnClick"
    >
      <img :src="logo" class="w-16px pr-4px" />
      <span>{{ showBtns ? "close" : "open" }}</span>
    </el-button>
  </div>

  <Drag v-model:visible="show">
    <DataSimulation></DataSimulation>
  </Drag>
  <Overlay ref="overlayRef" v-model:is-capturing="openCap"></Overlay>
</template>
