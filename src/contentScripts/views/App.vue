<script setup lang="ts">
import { useToggle } from "@vueuse/core";
import { onMessage } from "webext-bridge/content-script";
import DataSimulation from "./DataSimulation.vue";
import { changeGray, init } from "./hidden";
import Drag from "./Drag.vue";
import logo from "~/assets/logo.svg";
import "uno.css";
import { isGray } from "~/logic";

const [show, toggle] = useToggle(false);

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
    class="fixed bottom-100px left-20px z-9999 cursor-pointer"
    @click="handleGray"
  >
    {{ cMap[isGray] }}
  </button>
  <Drag v-model:visible="show">
    <DataSimulation></DataSimulation>
  </Drag>
</template>
