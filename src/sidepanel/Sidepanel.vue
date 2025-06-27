<script setup lang="ts">
import { sendMessage } from "webext-bridge/background";
import { storageDemo } from "~/logic/storage";

function openOptionsPage() {
  browser.runtime.openOptionsPage();
}

async function getActiveTabId(): Promise<number> {
  const tabs = await browser.tabs.query({ active: true, currentWindow: true });
  if (tabs.length === 0) {
    throw new Error("未找到激活的标签页");
  }
  return tabs[0].id!;
}

async function handleOpenClter() {
  const tabId = await getActiveTabId();
  // 方案1: 使用正确的参数格式发送消息
  sendMessage("test", { title: "哈哈" }, { context: "content-script", tabId })
    .then((response) => {
      console.log("test成功:", response);
    })
    .catch((err) => {
      console.log("test失败:", err);
    });

  browser.tabs
    .sendMessage(tabId, { type: "open", isOpen: true })
    .then((response) => {
      console.log("open成功:", response);
    })
    .catch((error) => {
      console.error("open失败:", error);
    });
}
</script>

<template>
  <main class="w-full px-4 py-5 text-center text-gray-700">
    <div @click="handleOpenClter">
      <Logo />
    </div>
    <button class="btn mt-2" @click="openOptionsPage">Open Options</button>
    <div class="mt-2">
      <span class="opacity-50">Storage:</span> {{ storageDemo }}
    </div>
  </main>
</template>
