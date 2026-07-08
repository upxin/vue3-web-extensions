// @ts-nocheck
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
// content.js
let dltTimer = null
let isProcessing = false // 锁：防止观察器自身修改 DOM 导致死循环

// ================= 方法 1: 精准列裁剪与销毁占位（专供 -fb 页面） =================
function removeAwardAndBlueZoneColumns() {
  const table = document.querySelector('#clist table')
  if (!table)
    return false

  console.log('开始重组 -fb 表格矩阵，正在精准对齐前区并释放后区占位...')

  const qianQuTh = Array.from(table.querySelectorAll('th')).find(th =>
    th.textContent.includes('前区') || th.textContent.includes('红球'),
  )
  if (!qianQuTh)
    return false
  const redCols = Number.parseInt(qianQuTh.getAttribute('colspan') || 35)

  const firstHeaderRow = table.querySelector('thead tr:first-child')
  if (firstHeaderRow) {
    const ths = firstHeaderRow.querySelectorAll('th')
    ths.forEach((th) => {
      const text = th.textContent.trim()
      if (['奖号', '后区', '蓝球', '后区提示'].includes(text)) {
        th.remove()
      }
    })

    const redZoneTh = firstHeaderRow.querySelector('th[colspan]')
    if (redZoneTh)
      redZoneTh.setAttribute('colspan', redCols)

    const periodTh = firstHeaderRow.querySelector('th')
    if (periodTh && periodTh.textContent.trim() === '期号') {
      periodTh.setAttribute('rowspan', '2')
    }
  }

  const tfootRow = table.querySelector('tr.tfoot')
  if (tfootRow) {
    tfootRow.querySelectorAll('th').forEach((th) => {
      if (th.textContent.trim() === '奖号')
        th.remove()
    })

    const tfootPeriodTh = tfootRow.querySelector('th')
    if (tfootPeriodTh && tfootPeriodTh.textContent.trim() === '期号') {
      tfootPeriodTh.setAttribute('rowspan', '2')
    }

    while (tfootRow.children.length > (1 + redCols)) {
      tfootRow.lastElementChild.remove()
    }

    const nextRow = tfootRow.nextElementSibling
    if (nextRow) {
      Array.from(nextRow.children).forEach((th) => {
        const text = th.textContent.trim()
        if (['后区', '蓝球', '后区提示'].includes(text)) {
          th.remove()
        }
        else if (['前区', '红球'].includes(text)) {
          th.setAttribute('colspan', redCols)
        }
      })
    }
  }

  const allRows = table.querySelectorAll('tr')
  allRows.forEach((row) => {
    if (row === firstHeaderRow || row === tfootRow || (tfootRow && row === tfootRow.nextElementSibling))
      return

    if (row.parentElement && row.parentElement.tagName === 'THEAD') {
      while (row.children.length > redCols) {
        row.lastElementChild.remove()
      }
    }
    else if (row.parentElement && row.parentElement.tagName === 'TBODY' && !row.getAttribute('v') && !row.classList.contains('tdzz')) {
      if (row.cells && row.cells[1]) {
        row.cells[1].remove()
      }
      while (row.children.length > (1 + redCols)) {
        row.lastElementChild.remove()
      }
    }
    else if (row.getAttribute('v') === 'ball' || row.classList.contains('tdzz')) {
      const firstCell = row.firstElementChild
      if (firstCell && firstCell.getAttribute('colspan') === '2') {
        firstCell.removeAttribute('colspan')
      }
      while (row.children.length > (1 + redCols)) {
        row.lastElementChild.remove()
      }
    }
  })

  return true
}

// ================= 方法 2: 全屏自滚动、无滚动条与高度补偿控制 =================
function makeTableFillAndScroll() {
  if (isProcessing)
    return

  const clistDom = document.getElementById('clist')
  const table = clistDom ? clistDom.querySelector('table') : null
  if (!table || !clistDom)
    return false

  isProcessing = true // 加锁

  try {
    // 1. 【强力清除广告】无差别斩断表格大容器后面的所有动态广告节点
    const tableZoom = document.querySelector('.tablezoom')
    if (tableZoom) {
      let sibling = tableZoom.nextElementSibling
      while (sibling) {
        if (sibling.tagName !== 'SCRIPT') {
          sibling.style.setProperty('display', 'none', 'important')
        }
        sibling = sibling.nextElementSibling
      }
    }

    // 强行隐藏全页所有可能漏网的弹窗或固定定位广告 iframe
    document.querySelectorAll('iframe').forEach((iframe) => {
      if (!clistDom.contains(iframe)) {
        iframe.style.setProperty('display', 'none', 'important')
      }
    })

    // 锁死外层网页滚动，不让整页往下漏出空白
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'
    window.scrollTo(0, 0)

    // 2. 根据当前 URL 智能判断：只有包含 '-fb' 时才执行切除后区和奖号的手术
    if (window.location.href.includes('-fb')) {
      removeAwardAndBlueZoneColumns()
    }

    // 3. 动态注入完全隐藏滚动条的专属底层 CSS 补丁
    let styleTag = document.getElementById('hide-scrollbar-style')
    if (!styleTag) {
      styleTag = document.createElement('style')
      styleTag.id = 'hide-scrollbar-style'
      styleTag.innerHTML = `
        #clist::-webkit-scrollbar { display: none !important; width: 0 !important; height: 0 !important; }
        #clist { -ms-overflow-style: none !important; scrollbar-width: none !important; }
      `
      document.head.appendChild(styleTag)
    }

    // 4. 应用标准的原生 zoom: 0.6 缩放率
    clistDom.style.transform = 'unset'
    clistDom.style.zoom = '0.6'

    // 5. 动态精确计算剩余屏幕空间，进行 0.6 缩放率的高度的等比逆向补偿
    const updateLayout = () => {
      clistDom.style.height = 'auto' // 先重置，允许准确计算 top 差值

      const rect = clistDom.getBoundingClientRect()
      const remainingHeight = window.innerHeight - rect.top // 肉眼可见的屏幕剩余净高度

      clistDom.style.width = '100vw'

      // ⚠️【核心 Bug 修复】因为缩放了 0.6，CSS 的 1px 只等于屏幕上的 0.6px
      // 必须将实际高度除以 0.6，补回缩放差，表格底边才会精准死死贴在屏幕最底端，彻底消灭大留白！
      const compensatedHeight = remainingHeight / 0.6

      clistDom.style.maxHeight = `${compensatedHeight}px`
      clistDom.style.height = 'auto'
      clistDom.style.overflowX = 'auto'
      clistDom.style.overflowY = 'auto'
      clistDom.style.position = 'relative'
      clistDom.style.display = 'block'

      if (table) {
        table.style.setProperty('margin', '0 auto', 'important')
        table.style.marginBottom = '10px' // 极其微小的安全底部间距
      }
    }

    updateLayout()
    window.removeEventListener('resize', updateLayout)
    window.addEventListener('resize', updateLayout)
  }
  catch (err) {
    console.error('界面布局优化失败:', err)
  }
  finally {
    isProcessing = false // 解锁
  }

  return true
}

// ================= 方法 3: 智能数据监听器（解决切1000期失效） =================
function initAjaxObserver() {
  const targetNode = document.getElementById('clist')
  if (!targetNode)
    return

  const observer = new MutationObserver(() => {
    console.log('检测到网页切换期数或重绘表格，同步应用优化...')
    makeTableFillAndScroll()
  })

  observer.observe(targetNode, { childList: true, subtree: false })
}

// 核心生命周期控制
function dlt() {
  const currentHost = window.location.hostname
  const currentUrl = window.location.href

  if (currentHost.includes('17500.cn') && /dlt-omit-red|ssq-omit-red|dlt-fb|ssq-fb/.test(currentUrl)) {
    if (dltTimer)
      clearInterval(dltTimer)

    if (makeTableFillAndScroll()) {
      initAjaxObserver()
    }
    else {
      let attempts = 0
      dltTimer = setInterval(() => {
        attempts++
        if (makeTableFillAndScroll() || attempts > 50) {
          clearInterval(dltTimer)
          dltTimer = null
          initAjaxObserver()
        }
      }, 100)
    }
  }
}

export function init() {
  dlt()
  try {
    const currentUrl = window.location.hostname // 获取当前页面域名
    // 创建数字选择器（使用默认配置）

    // 仅在目标域名且存储域名匹配时执行
    if (currentUrl.includes('lotto.sina.cn')) {
      document.documentElement.style.userSelect = 'none'
      document.body.style.maxWidth = 'unset'
      const zstElement = document.getElementById('zst')
      const tB = document.getElementById('chartsTable')
      if (zstElement) {
        zstElement.style.width = '1200px'
        zstElement.style.margin = '0 auto'
      }
      if (tB) {
        tB.style.width = '1200px'
        tB.style.margin = '0 auto'
      }

      if (window.location.search.includes('kl8')) {
        tB.style.width = '1400px'
        zstElement.style.width = '1400px'
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
