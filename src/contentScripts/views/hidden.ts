// @ts-nocheck
import { dlt } from './dlt'
import { isGray } from '~/logic/storage'

// 通用元素隐藏函数（带安全校验）
function hideElementsByClassName(className, count) {
  const elements = document.getElementsByClassName(className)
  if (!elements.length)
    return // 无元素时提前返回

  const maxCount
    = count !== undefined ? Math.min(count, elements.length) : elements.length
  for (let i = 0; i < maxCount; i++) {
    if (elements[i])
      elements[i].style.display = 'none' // 校验元素存在性
  }
}

// 核心清理函数（所有 DOM 操作带安全校验）
function clear() {
  // 隐藏元素列表
  const hideList = [
    { className: 'xp-info' },
    { className: 'zst-number' },
    { className: 'presqu', count: 2 },
    { className: 'btn-pc' },
    { className: 'btn-download' },
    { className: 'header' },
    { className: 'btn-szc' },
    { className: 'cpp-btns' },
  ]

  hideList.forEach((item) => {
    hideElementsByClassName(item.className, item.count)
  })

  // 调整占位元素高度
  const fixedBottomPlaceholder = document.getElementsByClassName(
    'fixed-bottom-placeholder',
  )[0]
  if (fixedBottomPlaceholder) {
    fixedBottomPlaceholder.style.height = '44px'
  }

  // 隐藏特定表格体
  function removeTableBodyWithThbg() {
    // 选择所有直接位于 tbody 下的 .thbg 元素
    const thbgElements = document.querySelectorAll('tbody > .thbg')

    thbgElements.forEach((element) => {
      const tbody = element.closest('tbody') // 找到当前 .thbg 元素的最近 tbody 父元素
      if (tbody) {
        tbody.remove() // 删除 tbody
      }
    })
  }
  removeTableBodyWithThbg()

  // 操作父元素子节点（带存在性校验）
  const parent = document.getElementById('now_gross')
  if (parent) {
    // 先删除第4项（索引3）
    if (parent.children[3])
      parent.removeChild(parent.children[3])
    // 再删除第2项（索引1）
    if (parent.children[1])
      parent.removeChild(parent.children[1])
  }

  // 调整类型列表样式
  const typeList = document.getElementsByClassName('type-list')[0]
  if (typeList) {
    typeList.style.cssText = 'height: 44px; width: 100%;'
  }
}

function setNone(id) {
  if (document.getElementById(id)) {
    document.getElementById(id).style.display = 'none'
  }
}
/**
 * 强制 zst_table 宽度为 100%，直到确认生效后销毁监听
 * @param {HTMLElement} zst_table
 * @param {number} timeoutMs 最长等待时间，超时也销毁，默认 5s
 */
function ensureTableWidth100(zst_table, timeoutMs = 5000) {
  if (!zst_table)
    return

  const apply = () => {
    zst_table.style.width = '100%'
    zst_table.style.maxWidth = '100%'
    zst_table.style.boxSizing = 'border-box'
  }

  apply()

  const isFullWidth = () => {
    const parent = zst_table.parentElement
    if (!parent)
      return false
    // 允许 1~2px 误差（滚动条、亚像素等）
    return Math.abs(zst_table.offsetWidth - parent.clientWidth) <= 2
  }

  // 已经是 100% 就直接结束
  if (isFullWidth())
    return

  // 用 rAF + 定时器双保险，兼容样式被其它脚本改掉的情况
  let stopped = false
  const stop = () => {
    if (stopped)
      return
    stopped = true
    cancelAnimationFrame(rafId)
    clearInterval(timer)
    clearTimeout(timeoutId)
    observer.disconnect()
  }

  // 1. MutationObserver：有人改 style 时立刻再设一次
  const observer = new MutationObserver(() => {
    apply()
    if (isFullWidth())
      stop()
  })
  observer.observe(zst_table, {
    attributes: true,
    attributeFilter: ['style', 'class'],
  })

  // 2. 定时检查是否已满宽
  const timer = setInterval(() => {
    apply()
    if (isFullWidth())
      stop()
  }, 50)

  // 3. rAF 再补几帧（布局刚完成时更稳）
  let rafId = 0
  const tick = () => {
    apply()
    if (isFullWidth()) {
      stop()
      return
    }
    rafId = requestAnimationFrame(tick)
  }
  rafId = requestAnimationFrame(tick)

  // 超时兜底，避免一直监听
  const timeoutId = setTimeout(stop, timeoutMs)
}
export function init() {
  try {
    const currentUrl = window.location.hostname

    if (currentUrl.includes('lotto.sina.cn')) {
      document.documentElement.style.userSelect = 'none'
      document.body.style.maxWidth = 'unset'

      const zstElement = document.getElementById('zst')
      const chartsTable = document.getElementById('chartsTable') // 正确 id
      // 所有 class="zst_table" 的表格（含第二张 2000px 的）
      const zstTables = document.querySelectorAll('table.zst_table')

      const isKl8 = window.location.search.includes('lottoType=kl8')
      const targetWidth = isKl8 ? '100%' : '1200px'

      if (zstElement) {
        zstElement.style.width = targetWidth
        zstElement.style.margin = '0 auto'
        zstElement.style.maxWidth = isKl8 ? '100%' : '1200px'
      }

      // 统一处理所有走势表
      zstTables.forEach((table) => {
        table.style.width = targetWidth
        table.style.maxWidth = isKl8 ? '100%' : '1200px'
        table.style.margin = '0 auto'
        table.style.boxSizing = 'border-box'
      })

      if (chartsTable) {
        chartsTable.style.width = targetWidth
        chartsTable.style.margin = '0 auto'
      }

      // kl8 时强制撑满，并监听直到真正满宽
      if (isKl8) {
        // 父容器也必须是 100%，否则子表 100% 没意义
        if (zstElement) {
          ensureTableWidth100(zstElement)
        }
        zstTables.forEach((table) => {
          ensureTableWidth100(table)
        })
      }

      setNone('wrapper')
      clear()

      const numberTable = document.getElementById('number')
      if (numberTable) {
        numberTable.style.display = 'none'
      }
    }
  }
  catch (error) {
    console.error('初始化失败:', error)
  }
}

export function changeGray() {
  const currentUrl = window.location.hostname
  if (currentUrl.includes('lotto.sina.cn') && document.getElementById('zst')) {
    document.getElementById('zst').style.filter
      = isGray.value === '2' ? 'grayscale(100%)' : ''
  }
}
