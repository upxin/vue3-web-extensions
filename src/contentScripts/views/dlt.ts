// content.js
let dltTimer = null
let isProcessing = false // 锁：防止观察器自身修改 DOM 导致死循环

// ================= ⚙️ 核心几何级正方形配置区 ⚙️ =================
const CONFIG_CELL_SIZE_NUM = 26 // 👈 每一个数字正方形格子维持的绝对像素大小
const CONFIG_PERIOD_WIDTH_NUM = 85 // 👈 左侧期号列（以及对齐垫片）的固定像素宽度

// ================= 方法 1: 精准列裁剪、矩阵重组与 JS 绝对三分区划线 =================
function removeAwardAndBlueZoneColumns() {
  const table = document.querySelector('#clist table')
  if (!table)
    return false

  const isSSQ = window.location.href.includes('ssq')

  // 1. 动态探测当前彩种的前区/红球总列数
  const qianQuTh = Array.from(table.querySelectorAll('th')).find(th =>
    th.textContent.includes('前区') || th.textContent.includes('红球'),
  )
  let redCols = isSSQ ? 33 : 35
  if (qianQuTh) {
    redCols = Number.parseInt(qianQuTh.getAttribute('colspan') || redCols)
  }

  // 2. 彻底清除原网页自带的 col 和 colgroup 宽度封印标签
  table.querySelectorAll('col, colgroup').forEach(el => el.remove())

  // 3. 动态注入我们自己的列宽控制器
  const customColgroup = document.createElement('colgroup')
  customColgroup.className = 'matrix-custom-cols'

  const colPeriod = document.createElement('col')
  colPeriod.setAttribute('width', `${CONFIG_PERIOD_WIDTH_NUM}px`)
  customColgroup.appendChild(colPeriod)

  for (let i = 0; i < redCols; i++) {
    const col = document.createElement('col')
    col.setAttribute('width', `${CONFIG_CELL_SIZE_NUM}px`)
    customColgroup.appendChild(col)
  }
  table.insertBefore(customColgroup, table.firstChild)

  // 4. 处理【顶部】大表头第一行（期号、奖号、前区、后区）
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
    if (redZoneTh) {
      redZoneTh.setAttribute('colspan', redCols)
    }

    const periodTh = firstHeaderRow.querySelector('th')
    if (periodTh && periodTh.textContent.trim() === '期号') {
      periodTh.setAttribute('rowspan', '2')
    }
  }

  // 5. 深度清理【底部】伪脚标行
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

  // 6. 依靠“绝对列数控制法”与“智能垫片”遍历并裁剪其余所有普通数据行与辅助行
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

    // ⚠️【降维打击：JS 级绝对三分区划线】
    // 只要不是顶层大表头，任何行修剪完后，最后 redCols 个格子必然是纯净的走势号码列！
    if (row !== firstHeaderRow) {
      const cells = Array.from(row.children)
      if (cells.length >= redCols) {
        const numCells = cells.slice(-redCols) // 精准剥离出当前的号码格子阵列

        // 计算三分区分界点的索引 (大乐透第12和24个号后面，双色球第11和22个号后面)
        const idx1 = isSSQ ? 10 : 11 // 11号球(索引10) 或 12号球(索引11)
        const idx2 = isSSQ ? 21 : 23 // 22号球(索引21) 或 24号球(索引23)

        // 强行单独注入加粗分界线样式，彻底无视任何跨列错位
        if (numCells[idx1]) {
          numCells[idx1].style.setProperty('border-right', '2px solid #222222', 'important')
        }
        if (numCells[idx2]) {
          numCells[idx2].style.setProperty('border-right', '2px solid #222222', 'important')
        }
      }
    }
  })

  return true
}

// ================= 方法 2: 动态算宽、去 Hover、内嵌圆球与全屏自滚动 =================
function makeTableFillAndScroll() {
  if (isProcessing)
    return

  const clistDom = document.getElementById('clist')
  const table = clistDom ? clistDom.querySelector('table') : null
  if (!table || !clistDom)
    return false

  isProcessing = true // 加锁

  try {
    // 1. 强力清除页面下方所有干扰元素与异步广告
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
    const isSSQ = window.location.href.includes('ssq')
    if (window.location.href.includes('-fb')) {
      removeAwardAndBlueZoneColumns()
    }

    // 3. 动态探测列数并计算绝对像素总宽
    const qianQuTh = Array.from(table.querySelectorAll('th')).find(th =>
      th.textContent.includes('前区') || th.textContent.includes('红球'),
    )
    let redCols = isSSQ ? 33 : 35
    if (qianQuTh) {
      redCols = Number.parseInt(qianQuTh.getAttribute('colspan') || redCols)
    }

    const calculatedWidthPx = CONFIG_PERIOD_WIDTH_NUM + (redCols * CONFIG_CELL_SIZE_NUM)
    const styleTableWidth = `${calculatedWidthPx}px`
    const stylePeriodWidth = `${CONFIG_PERIOD_WIDTH_NUM}px`
    const styleCellSize = `${CONFIG_CELL_SIZE_NUM}px`

    // 让圆球的半径等于格子尺寸的 40% (26px格子对应直径20px的悬浮圆球)
    const ballRadiusPx = Math.floor(CONFIG_CELL_SIZE_NUM * 0.4)

    // 4. 【样式强力注入】
    let styleTag = document.getElementById('hide-scrollbar-style')
    if (!styleTag) {
      styleTag = document.createElement('style')
      styleTag.id = 'hide-scrollbar-style'
    }

    styleTag.innerHTML = `
      /* 1. 隐藏原生滚动条 */
      #clist::-webkit-scrollbar { display: none !important; width: 0 !important; height: 0 !important; }
      #clist { -ms-overflow-style: none !important; scrollbar-width: none !important; }
      
      /* 2. 强行死锁总宽度 */
      #clist table {
        table-layout: fixed !important;
        width: ${styleTableWidth} !important;
        min-width: ${styleTableWidth} !important; 
        max-width: ${styleTableWidth} !important;
        border-collapse: collapse !important;
      }

      /* 3. 强行锁死首列期号列和垫片列的宽度 */
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

      /* 4. 数字列绝对正方形化，清除 td 上的圆角，默认全部上浅灰线 */
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
        border-radius: 0px !important; 
        border-right: 1px solid #e4e4e4 !important; /* 👈 清理原网自带的所有杂乱黑粗线 */
      }

      /* 5. 彻底干掉未中奖单元格在鼠标滑过时的灰色圆块背景 */
      #clist table tbody tr:hover td:not(.red-bg):not(.blue-bg),
      #clist table tbody tr td:hover:not(.red-bg):not(.blue-bg) {
        background: none !important;
        background-color: transparent !important;
      }

      /* 6. 利用径向渐变，在方格正中央画一个悬浮红圆球，不贴边 */
      #clist table tbody td.red-bg {
        background: radial-gradient(circle ${ballRadiusPx}px, #f03321 95%, transparent 100%) !important;
        color: #ffffff !important;
        font-weight: bold !important;
      }

      /* 7. 同步适配蓝球/后区圆球 */
      #clist table tbody td.blue-bg {
        background: radial-gradient(circle ${ballRadiusPx}px, #1678ff 95%, transparent 100%) !important;
        color: #ffffff !important;
        font-weight: bold !important;
      }

      #clist table thead tr:first-child th:not(:first-child) {
        width: auto !important;
        min-width: unset !important;
        max-width: unset !important;
      }
    `

    if (!document.getElementById('hide-scrollbar-style')) {
      document.head.appendChild(styleTag)
    }

    // 5. 1:1 纯净点对点排版
    clistDom.style.transform = 'unset'
    clistDom.style.zoom = 'unset'

    // 6. 动态计算高度
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

// ================= 方法 3: 智能数据监听器 =================
function initAjaxObserver() {
  const targetNode = document.getElementById('clist')
  if (!targetNode)
    return

  const observer = new MutationObserver(() => {
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

export {
  dlt,
}
