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
  function getLastHasbbRow() {
    return document.querySelector(".hasbb:last-child");
  }

  function extractChartball01Texts(element) {
    if (!element) return [];
    const chartballElements = element.querySelectorAll('[class*="chartball"]');
    const periodsElement = element.firstElementChild;
    const allElements = [periodsElement, ...chartballElements];
    return allElements.map((el) => el.innerText);
  }

  function main() {
    const lastRow = getLastHasbbRow();

    if (!lastRow) {
      console.error("未找到class为hasbb的表格行");
      return false;
    }

    const chartballTexts = extractChartball01Texts(lastRow);

    if (chartballTexts.length === 0) {
      console.error("未找到class为chartball01的元素");
      return false;
    }

    const textToCopy = chartballTexts.map((str) => {
      return Number(str).toString().padStart(2, "0");
    });
    return copyToClipboard(JSON.stringify(textToCopy));
  }

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
    .map((item) => Number(item).toString().padStart(2, "0"))
    .join(" ");
  const t2 = Array.from(blueballs)
    .map((element) => {
      return element?.textContent?.trim();
    })
    .map((item) => Number(item).toString().padStart(2, "0"))
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
const times = ref(1);
let count = 6; // 默认值为 ssq 的 6
if (location.search.includes("kl8")) {
  count = 20; // kl8 对应 20
} else if (location.search.includes("dlt")) {
  count = 5; // dlt 对应 5
}

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
    if (redBalls.length >= 6) result.push(redBalls.slice(0, count));
  });
  if (!result.length) {
    return;
  }
  const recentResults = result.slice(-n);
  const jsonStr =
    n === 1
      ? JSON.stringify(recentResults[0], null, 2)
      : JSON.stringify(recentResults, null, 2);
  copyToClipboard(jsonStr);
}

function createCopyButton() {
  copyRedBallsToClipboard(times.value);
}
function getback(n = -2) {
  const rows = document.querySelectorAll("#cpdata tr");
  const result = [];
  rows.forEach((tr) => {
    const tds = Array.from(tr.querySelectorAll("td"));
    if (!tds.length) return;
    const redBalls = tds
      .filter((td) => td.className.includes("chartball"))
      .map((td) => td.textContent.trim())
      .filter((text) => text !== "");
    result.push(redBalls.slice(1));
  });
  // console.log(result);
}
getback();
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
