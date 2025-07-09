<script setup lang="ts">
import { onMessage } from "webext-bridge/content-script";
import { shadowRootKey } from "../keys";
import DataSimulation from "./DataSimulation.vue";
import Overlay from "./Overlay.vue";
import { changeGray, init } from "./hidden";
import { isGray } from "~/logic";

function globalLog(...args) {
  console.log("chrome===:", ...args);
}
window.g = globalLog;

const shadowRoot = inject(shadowRootKey);

const showBtns = ref(true);
const [showSimulater, toggle] = useToggle(false);
const overlayRef = templateRef("overlayRef");

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

function getBall() {
  if (location.hostname !== "lotto.sina.cn") return;
  // 获取最后一个具有hasbb类的表格行
  function getLastHasbbRow() {
    return document.querySelector(".hasbb:last-child");
  }

  // 从指定元素中提取所有chartball01类的文本
  function extractChartball01Texts(element) {
    if (!element) return [];
    const chartballElements = element.querySelectorAll('[class*="chartball"]');
    const periodsElement = element.firstElementChild;
    const allElements = [periodsElement, ...chartballElements];
    return Array.from(allElements).map(
      (el) => Number(el?.textContent.trim()) || ""
    );
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

onMessage("openBtns", ({ data }) => {
  showBtns.value = true;
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
  2: "改为红色",
  1: "改为灰色",
} as const;

const cUrl = window.location.hostname;

const openCut = ref(false);
function openOverlay() {
  overlayRef.value?.startScreenshot?.();
}
function getPre() {
  // 获取所有class为realball的元素
  const realballElements = document.querySelectorAll(".realball");
  const blueballs = document.querySelectorAll(".blueball");

  // 提取每个元素的文本内容
  const t1 = Array.from(realballElements)
    .map((element) => {
      return element?.textContent?.trim();
    })
    .map((item) => Number(item))
    .join(" ");
  const t2 = Array.from(blueballs)
    .map((element) => {
      return element?.textContent?.trim();
    })
    .map((item) => Number(item))
    .join(" ");

  copyToClipboard(`${t1} , ${t2}`);
}

function scrollToTop() {
  window.scrollTo({
    top: 0,
  });
}

// 滚动到底部
function scrollToBottom() {
  window.scrollTo({
    top: document.documentElement.scrollHeight,
  });
}
</script>

<template>
  <Drag v-show="cUrl === 'lotto.sina.cn'" v-model:visible="showBtns">
    <section flex flex-col items-center>
      <el-button
        style="width: 92px; margin-left: 0; margin-bottom: 10px"
        type="primary"
        size="small"
        @click="openOverlay"
      >
        画圈
      </el-button>
      <el-button
        style="width: 92px; margin-left: 0; margin-bottom: 10px"
        type="primary"
        size="small"
        @click="handleGray"
      >
        {{ cMap[isGray] }}
      </el-button>
      <el-button
        style="width: 92px; margin-left: 0; margin-bottom: 10px"
        type="warning"
        size="small"
        @click="getBall"
      >
        最新开奖号
      </el-button>
      <el-button
        style="width: 92px; margin-left: 0; margin-bottom: 10px"
        type="primary"
        size="small"
        @click="getPre"
      >
        获取预选行
      </el-button>
    </section>
  </Drag>
  <Overlay ref="overlayRef" v-model:is-capturing="openCut"></Overlay>
  <!-- 滚动按钮容器（固定在右侧中间） -->
  <div class="fixed right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-50">
    <Icon
      icon="cuida:caret-up-outline"
      class="text-[#246999] cursor-pointer transition-transform text-30px"
      @click="scrollToTop"
    />

    <Icon
      icon="cuida:caret-down-outline"
      class="text-[#246999] cursor-pointer transition-transform text-30px"
      @click="scrollToBottom"
    />
  </div>
</template>
