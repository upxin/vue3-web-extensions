<script setup lang="ts">
import { onMessage } from 'webext-bridge/content-script'
import { shadowRootKey } from '../keys'
import Overlay from './Overlay.vue'
import { changeGray, init } from './hidden'

function globalLog(...args) {
  console.log('chrome===:', ...args)
}
window.g = globalLog

const shadowRoot = inject(shadowRootKey)

const showBtns = ref(true)
const overlayRef = templateRef('overlayRef')

async function copyToClipboard(text) {
  try {
    // 使用Clipboard API复制文本
    await navigator.clipboard.writeText(text)
    g('复制成功:', text)
    ElMessage({
      type: 'success',
      message: '复制成功',
      showClose: true,
      appendTo: shadowRoot as unknown as HTMLElement,
    })
    return true
  }
  catch (error) {
    console.error('复制失败:', error)
    // 备选方案：使用execCommand(clipboard)
    const textarea = document.createElement('textarea')
    textarea.value = text
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    g('备选方案复制成功:', text)
    return true
  }
}

const ballIndex = ref(1) // 输入框绑定的要获取的期数数量

function getBall() {
  if (location.hostname !== 'lotto.sina.cn')
    return

  const rows = Array.from(
    document.querySelectorAll('#cpdata tr, table tr'),
  ).filter(tr => tr.querySelector('[class*="chartball"]'))

  const count = Number.parseInt(String(ballIndex.value), 10)
  // 验证输入有效性
  if (!Number.isFinite(count) || count <= 0) {
    ElMessage({
      type: 'warning',
      message: '请输入有效的正整数期数数量',
      appendTo: shadowRoot as any,
    })
    return
  }

  // 检查数量是否超出范围
  if (count > rows.length) {
    ElMessage({
      type: 'warning',
      message: `超出范围：当前仅有 ${rows.length} 期，可输入 1–${rows.length} 之间的数量`,
      appendTo: shadowRoot as any,
    })
    return
  }

  // 取最后count行（最新的count期）
  const selectedRows = rows.slice(-count)

  // 处理每行数据，过滤含冒号的无效内容
  const resultList = selectedRows.map((tr) => {
    // 提取期号（第一个 td）
    const period = (tr.querySelector('td')?.textContent || '').trim()

    // 提取红球（仅保留数字类内容）
    const balls = Array.from(tr.querySelectorAll('[class*="chartball"]'))
      .map(td => (td.textContent || '').trim())
      .filter(Boolean)
      .map(v => String(Number(v)).padStart(2, '0'))

    // 合并期号+红球，过滤掉含冒号的内容（核心修复）
    const rowData = [period, ...balls].filter(item => !item.includes(':'))

    return rowData
  })

  // 核心修复：单条数据返回一维数组，多条返回二维数组
  const finalResult = resultList.length === 1 ? resultList[0] : resultList

  // 复制最终结果
  copyToClipboard(JSON.stringify(finalResult, null, 2))
}

onMessage('openBtns', ({ data }) => {
  showBtns.value = true
})

onMounted(() => {
  init()
  setTimeout(() => {
    changeGray()
  }, 0)
})

const cUrl = window.location.hostname

const openCut = ref(false)
function openOverlay() {
  overlayRef.value?.startScreenshot?.()
}
function getPre() {
  // 获取所有class为realball的元素
  const realballElements = document.querySelectorAll('.realball')
  const blueballs = document.querySelectorAll('.blueball')

  // 提取每个元素的文本内容
  const t1 = Array.from(realballElements)
    .map((element) => {
      return element?.textContent?.trim()
    })
    .map(item => Number(item).toString().padStart(2, '0'))
    .join(' ')
  const t2 = Array.from(blueballs)
    .map((element) => {
      return element?.textContent?.trim()
    })
    .map(item => Number(item).toString().padStart(2, '0'))
    .join(' ')

  copyToClipboard(`${t1} , ${t2}`)
}

function scrollToTop() {
  window.scrollTo({
    top: 0,
  })
}

// 滚动到底部
function scrollToBottom() {
  window.scrollTo({
    top: document.documentElement.scrollHeight,
  })
}
const times = ref(1)
let count = 6 // 默认值为 ssq 的 6
if (location.search.includes('kl8')) {
  count = 20 // kl8 对应 20
}
else if (location.search.includes('dlt')) {
  count = 5 // dlt 对应 5
}

function copyRedBallsToClipboard(n = 1) {
  const rows = document.querySelectorAll('#cpdata tr')
  const result = []
  rows.forEach((tr) => {
    const tds = Array.from(tr.querySelectorAll('td'))
    if (!tds.length)
      return
    const redBalls = tds
      .filter(td => td.className.includes('chartball'))
      .map(td => td.textContent.trim())
      .filter(text => text !== '')
    if (redBalls.length >= 6)
      result.push(redBalls.slice(0, count))
  })
  if (!result.length) {
    return
  }
  const recentResults = result.slice(-n)
  const jsonStr
    = n === 1
      ? JSON.stringify(recentResults[0], null, 2)
      : JSON.stringify(recentResults, null, 2)
  copyToClipboard(jsonStr)
}

function createCopyButton() {
  copyRedBallsToClipboard(times.value)
}
function getback(n = -2) {
  const rows = document.querySelectorAll('#cpdata tr')
  const result = []
  rows.forEach((tr) => {
    const tds = Array.from(tr.querySelectorAll('td'))
    if (!tds.length)
      return
    const redBalls = tds
      .filter(td => td.className.includes('chartball'))
      .map(td => td.textContent.trim())
      .filter(text => text !== '')
    result.push(redBalls.slice(1))
  })
  // console.log(result);
}
getback()
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
        type="warning"
        style="width: 92px; margin-left: 0; margin-bottom: 10px"
        @click="createCopyButton"
      >
        不带篮球
      </el-button>
      <el-button
        type="primary"
        style="width: 92px; margin-left: 0; margin-bottom: 10px"
        size="small"
        @click="openOverlay"
      >
        画圈
      </el-button>

      <!-- <el-button
        style="width: 92px; margin-left: 0; margin-bottom: 10px"
        type="primary"
        size="small"
        @click="handleGray"
      >
        {{ cMap[isGray] }}
      </el-button> -->
      <el-input
        v-model="ballIndex"
        size="small"
        style="width: 92px; margin-bottom: 10px"
        placeholder="期数(默认1)"
      ></el-input>

      <el-button
        style="width: 92px; margin-left: 0; margin-bottom: 10px"
        type="warning"
        size="small"
        @click="getBall"
      >
        带期数和篮球
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
