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
// content.js
let dltTimer = null
let isProcessing = false // 锁：防止观察器自身修改 DOM 导致死循环

// ================= ⚙️ 核心几何级正方形配置区（在此调整基础像素） ⚙️ =================
const CONFIG_CELL_SIZE_NUM = 26 // 👈【核心】你想让数字正方形格子维持的绝对像素大小（比如 24 或 26）
const CONFIG_PERIOD_WIDTH_NUM = 85 // 👈 左侧期号列（以及对齐垫片）的固定像素宽度

// ================= 方法 1: 精准列裁剪与销毁占位（专供 -fb 页面） =================
function removeAwardAndBlueZoneColumns() {
  const table = document.querySelector('#clist table')
  if (!table)
    return false

  // 1. 动态探测当前彩种的前区/红球总列数 (大乐透为35，双色球为33)
  const qianQuTh = Array.from(table.querySelectorAll('th')).find(th =>
    th.textContent.includes('前区') || th.textContent.includes('红球'),
  )
  if (!qianQuTh)
    return false
  const redCols = Number.parseInt(qianQuTh.getAttribute('colspan') || 35)

  // 2. 处理【顶部】大表头第一行（期号、奖号、前区、后区）
  const firstHeaderRow = table.querySelector('thead tr:first-child')
  if (firstHeaderRow) {
    const ths = firstHeaderRow.querySelectorAll('th')
    ths.forEach((th) => {
      const text = th.textContent.trim()
      if (['奖号', '后区', '蓝球', '后区提示'].includes(text)) {
        th.remove()
      }
    })

    // 重置前区的跨列数
    const redZoneTh = firstHeaderRow.querySelector('th[colspan]')
    if (redZoneTh) {
      redZoneTh.setAttribute('colspan', redCols)
    }

    // 强制让顶部的“期号”纵向跨2行
    const periodTh = firstHeaderRow.querySelector('th')
    if (periodTh && periodTh.textContent.trim() === '期号') {
      periodTh.setAttribute('rowspan', '2')
    }
  }

  // 3. 深度清理【底部】伪脚标行（tr.tfoot 及其下一行）
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

  // 4. 依靠“绝对列数控制法”与“智能垫片”遍历并裁剪其余所有普通数据行与辅助行
  const allRows = table.querySelectorAll('tr')
  allRows.forEach((row) => {
    if (row === firstHeaderRow || row === tfootRow || (tfootRow && row === tfootRow.nextElementSibling))
      return

    // A. 第二行表头 (顶部的 01 02 ... 数字行)
    if (row.parentElement && row.parentElement.tagName === 'THEAD') {
      while (row.children.length > redCols) {
        row.lastElementChild.remove()
      }
    }

    // B. tbody 中的历史开奖数据行及混入的重复数字表头行
    else if (row.parentElement && row.parentElement.tagName === 'TBODY' && !row.getAttribute('v') && !row.classList.contains('tdzz')) {
      const firstCellText = row.cells[0] ? row.cells[0].textContent.trim() : ''

      // 智能探测并修复隐藏在 tbody 内部的重复数字表头行的 35 列错位 Bug
      if (firstCellText === '01' || firstCellText === '1') {
        if (!row.querySelector('.matrix-pad-cell')) {
          const pad = document.createElement('td')
          pad.className = 'matrix-pad-cell'
          pad.style.backgroundColor = window.getComputedStyle(row.cells[0]).backgroundColor
          row.insertBefore(pad, row.firstElementChild)
        }
      }
      else {
        if (row.cells && row.cells[1]) {
          const text = row.cells[1].textContent
          if (text.includes(',') || text.includes('+')) {
            row.cells[1].remove()
          }
        }
      }

      while (row.children.length > (1 + redCols)) {
        row.lastElementChild.remove()
      }
    }

    // C. 辅助行（v="ball" 标记行，或者 class="tdzz" 底部次数统计行）
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

// ================= 方法 2: 动态算宽、重构列控与全屏自滚动 =================
function makeTableFillAndScroll() {
  if (isProcessing)
    return

  const clistDom = document.getElementById('clist')
  const table = clistDom ? clistDom.querySelector('table') : null
  if (!table || !clistDom)
    return false

  isProcessing = true // 加锁

  try {
    // 1. 强力清理页面下方所有干扰元素与异步广告
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
    document.querySelectorAll('iframe').forEach((iframe) => {
      if (!clistDom.contains(iframe))
        iframe.style.setProperty('display', 'none', 'important')
    })

    // 锁死外层网页物理滚动
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'
    window.scrollTo(0, 0)

    // 2. 根据当前 URL 判断是否执行 -fb 的手术裁剪与重组
    if (window.location.href.includes('-fb')) {
      removeAwardAndBlueZoneColumns()
    }

    // 3. 🔍【核心重构：动态探测列数并计算绝对像素总宽】
    const qianQuTh = Array.from(table.querySelectorAll('th')).find(th =>
      th.textContent.includes('前区') || th.textContent.includes('红球'),
    )
    let redCols = window.location.href.includes('ssq') ? 33 : 35 // 安全兜底
    if (qianQuTh) {
      redCols = Number.parseInt(qianQuTh.getAttribute('colspan') || redCols)
    }

    // 🧮 黄金数学公式：动态推算总宽度字符串
    const calculatedWidthPx = CONFIG_PERIOD_WIDTH_NUM + (redCols * CONFIG_CELL_SIZE_NUM)
    const styleTableWidth = `${calculatedWidthPx}px`
    const stylePeriodWidth = `${CONFIG_PERIOD_WIDTH_NUM}px`
    const styleCellSize = `${CONFIG_CELL_SIZE_NUM}px`

    console.log(`当前探测列数: ${redCols}, 自动推算并死锁表格总宽度为: ${styleTableWidth}`)

    // 4. 🔨【粉碎原网页 col 封印】注入高精度的列宽分配器
    table.querySelectorAll('col, colgroup').forEach(el => el.remove())
    const customColgroup = document.createElement('colgroup')
    customColgroup.className = 'matrix-custom-cols'

    const colPeriod = document.createElement('col')
    colPeriod.setAttribute('width', stylePeriodWidth)
    customColgroup.appendChild(colPeriod)

    for (let i = 0; i < redCols; i++) {
      const col = document.createElement('col')
      col.setAttribute('width', styleCellSize) // 强行分发绝对像素给每一个列
      customColgroup.appendChild(col)
    }
    table.insertBefore(customColgroup, table.firstChild)

    // 5. 【强力样式注入】彻底接管布局引擎
    let styleTag = document.getElementById('hide-scrollbar-style')
    if (!styleTag) {
      styleTag = document.createElement('style')
      styleTag.id = 'hide-scrollbar-style'
    }

    styleTag.innerHTML = `
      /* 隐藏原生滚动条 */
      #clist::-webkit-scrollbar { display: none !important; width: 0 !important; height: 0 !important; }
      #clist { -ms-overflow-style: none !important; scrollbar-width: none !important; }
      
      /* 强行死锁总宽度，用绝对像素击碎原网媒体查询 */
      #clist table {
        table-layout: fixed !important;
        width: ${styleTableWidth} !important;
        min-width: ${styleTableWidth} !important; 
        max-width: ${styleTableWidth} !important;
        border-collapse: collapse !important;
      }

      /* 强行锁死首列期号列和垫片列的宽度 */
      #clist table thead tr:first-child th:first-child,
      #clist table tbody tr td:first-child,
      #clist table tr.tfoot th:first-child,
      #clist table tr.tdzz td:first-child,
      #clist table tr[v="ball"] td:first-child {
        width: ${stylePeriodWidth} !important;
        min-width: ${stylePeriodWidth} !important;
        max-width: ${stylePeriodWidth} !important;
        white-space: nowrap !important;
        text-align: center !important;
        box-sizing: border-box !important;
      }

      /* 其余数字列：严格继承分配到的像素，锁定为完美正方形 */
      #clist table thead tr:nth-child(2) th,
      #clist table tbody tr td:not(:first-child),
      #clist table tfoot tr th:not(:first-child) {
        width: ${styleCellSize} !important;
        min-width: ${styleCellSize} !important;
        max-width: ${styleCellSize} !important;
        height: ${styleCellSize} !important;
        line-height: ${styleCellSize} !important;
        padding: 0 !important;
        text-align: center !important;
        vertical-align: middle !important;
        box-sizing: border-box !important;
      }

      /* 放行第一行大表头中的前区大格子 */
      #clist table thead tr:first-child th:not(:first-child) {
        width: auto !important;
        min-width: unset !important;
        max-width: unset !important;
      }
    `

    if (!document.getElementById('hide-scrollbar-style')) {
      document.head.appendChild(styleTag)
    }

    // 6. ❌ 彻底废除 zoom 和 transform，实现 1:1 纯净点对点排版
    clistDom.style.transform = 'unset'
    clistDom.style.zoom = 'unset'

    // 7. 动态计算高度，自滚动视口无缝贴合
    const updateLayout = () => {
      const rect = clistDom.getBoundingClientRect()
      const remainingHeight = window.innerHeight - rect.top

      clistDom.style.width = '100vw'
      clistDom.style.maxHeight = `${remainingHeight}px`
      clistDom.style.height = 'auto'
      clistDom.style.overflowX = 'auto'
      clistDom.style.overflowY = 'auto'
      clistDom.style.position = 'relative'
      clistDom.style.display = 'block'

      if (table) {
        table.style.setProperty('margin', '0 auto', 'important')
        table.style.marginBottom = '10px'
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

// ================= 方法 3: 智能数据监听器（解决切换期数及刷新失效） =================
function initAjaxObserver() {
  const targetNode = document.getElementById('clist')
  if (!targetNode)
    return

  const observer = new MutationObserver(() => {
    console.log('检测到网页重绘变动，正在同步重算几何矩阵...')
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
