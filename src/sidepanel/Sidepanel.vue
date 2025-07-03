<script setup lang="ts">
import { sendMessage } from "webext-bridge/background";
import { isGray } from "~/logic/storage";

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
async function clear() {
  const tabId = await getActiveTabId();
  sendMessage(
    "test",
    { title: "优化表格" },
    { context: "content-script", tabId }
  )
    .then((response) => {})
    .catch((err) => {});
}

async function handleOpenClter() {
  const tabId = await getActiveTabId();

  browser.tabs
    .sendMessage(tabId, { type: "open", isOpen: true })
    .then((response) => {})
    .catch((error) => {});
}
function changeGray() {
  clear();
}
</script>

<template>
  <main
    class="w-full px-4 py-5 text-center text-gray-700 h-full flex flex-col items-center box-border"
  >
    <div class="mb-20px" @click="handleOpenClter">
      <Logo />
    </div>
    <el-button-group>
      <el-button type="primary" class="mb-20px" @click="openOptionsPage">
        Open Options
      </el-button>
      <el-button type="primary" class="mb-20px" @click="clear">
        优化表格展示
      </el-button>
    </el-button-group>
    <el-radio-group v-model="isGray" @change="changeGray">
      <el-radio value="1"> 红 1 </el-radio>
      <el-radio value="2"> 灰 2 </el-radio>
    </el-radio-group>
  </main>
</template>
