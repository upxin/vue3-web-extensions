<script setup lang="ts">
import { onMessage } from "webext-bridge/content-script";
import { shadowRootKey } from "../keys";
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
const times = ref(16);
function copyRedBallsToClipboard(n = 1) {
  const rows = document.querySelectorAll("#cpdata tr");
  const result = [];
  rows.forEach((tr) => {
    const tds = Array.from(tr.querySelectorAll("td"));
    if (!tds.length) return;
    const redBalls = tds
      .filter((td) => td.className.includes("chartball"))
      .map((td) => td.textContent.trim())
      .filter((text) => text !== "");
    if (redBalls.length >= 6) result.push(redBalls.slice(0, 6));
  });
  if (!result.length) {
    return;
  }
  const recentResults = result.slice(-n);
  const jsonStr = JSON.stringify(recentResults, null, 2);
  copyToClipboard(jsonStr);
}

function createCopyButton() {
  copyRedBallsToClipboard(times.value);
}
</script>

<template>
  <Drag v-show="cUrl === 'lotto.sina.cn'" v-model:visible="showBtns">
    <template #title>
      <Icon
        icon="oi:arrow-top"
        class="text-[#246999] cursor-pointer text-16px mr-20px"
        @click="scrollToTop"
      />
      <Icon
        icon="oi:arrow-top"
        class="text-[#246999] cursor-pointer text-16px rotate-180"
        @click="scrollToBottom"
      />
    </template>
    <section flex flex-col items-center>
      <el-input
        v-model:model-value="times"
        size="small"
        style="width: 92px; margin-left: 0; margin-bottom: 10px"
      ></el-input>
      <el-button
        size="small"
        style="width: 92px; margin-left: 0; margin-bottom: 10px"
        @click="createCopyButton"
      >
        获取近期号码
      </el-button>
      <el-button
        type="primary"
        style="width: 92px; margin-left: 0; margin-bottom: 10px"
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
        type="success"
        size="small"
        @click="getPre"
      >
        获取预选行
      </el-button>
    </section>
  </Drag>
  <Overlay ref="overlayRef" v-model:is-capturing="openCut"></Overlay>
</template>
