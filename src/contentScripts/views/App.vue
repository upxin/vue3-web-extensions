<script setup lang="ts">
import { useToggle } from "@vueuse/core";
import { onMessage } from "webext-bridge/content-script";
import DataSimulation from "./DataSimulation.vue";
import Drag from "./Drag.vue";
import logo from "~/assets/logo.svg";
import "uno.css";

const [show, toggle] = useToggle(false);

onMessage("test", ({ data }) => {
  console.log("test:", data);
});

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "open") {
    toggle(true); // 打开面板
    sendResponse({ status: "success", message: "已打开面板" });
    return true; // 保持消息通道打开
  }
});
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
  <Drag v-model:visible="show">
    <DataSimulation></DataSimulation>
  </Drag>
</template>
