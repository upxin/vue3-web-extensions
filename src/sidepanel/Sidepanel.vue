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
async function openBtns() {
  const tabId = await getActiveTabId();
  sendMessage(
    "openBtns",
    { title: "优化表格" },
    { context: "content-script", tabId }
  ).then(() => {
    ElMessage.success("已打开按钮");
  });
}
</script>

<template>
  <main
    class="w-full px-4 py-5 text-center text-gray-700 h-full flex flex-col items-center box-border"
  >
    <el-button-group>
      <el-button type="primary" class="mb-20px" @click="openOptionsPage">
        Open Options
      </el-button>
      <el-button type="primary" class="mb-20px" @click="openBtns">
        打开按钮组
      </el-button>
    </el-button-group>
    <el-radio-group v-model="isGray">
      <el-radio value="1"> 红 1 </el-radio>
      <el-radio value="2"> 灰 2 </el-radio>
    </el-radio-group>
  </main>
</template>
