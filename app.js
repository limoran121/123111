const products = [
  {
    id: "cake",
    name: "草莓云朵小蛋糕",
    desc: "柔软奶油、当季草莓，适合被认真宠爱的夜晚。",
    category: "sweet",
    tag: "今日最甜",
    price: 29.9,
    image: "./assets/cake.png"
  },
  {
    id: "milk-tea",
    name: "桃桃乌龙奶茶",
    desc: "三分糖、少冰也很好喝，可以按备注调整。",
    category: "drink",
    tag: "少冰推荐",
    price: 18.8,
    image: "./assets/milk-tea.png"
  },
  {
    id: "pudding",
    name: "焦糖布丁双拼",
    desc: "一份焦糖，一份原味，选择困难时就都要。",
    category: "sweet",
    tag: "双倍快乐",
    price: 22.0,
    image: "./assets/pudding.png"
  },
  {
    id: "flower",
    name: "小花和晚安卡",
    desc: "不隆重，但很认真；可以写一句悄悄话。",
    category: "gift",
    tag: "小惊喜",
    price: 36.0,
    image: "./assets/flower.png"
  },
  {
    id: "coffee",
    name: "海盐拿铁",
    desc: "适合加班、追剧、或者只是想被陪一下。",
    category: "drink",
    tag: "提神",
    price: 20.0,
    image: "./assets/coffee.png"
  },
  {
    id: "hug",
    name: "十分钟抱抱券",
    desc: "下单后不接受退款，只接受兑换。",
    category: "gift",
    tag: "隐藏菜单",
    price: 0.0,
    image: "./assets/hug.png"
  }
]

const currency = new Intl.NumberFormat("zh-CN", {
  style: "currency",
  currency: "CNY"
})

let cart = JSON.parse(localStorage.getItem("girlfriendShopCart") || "{}")
let orders = JSON.parse(localStorage.getItem("girlfriendShopOrders") || "[]")
let activeFilter = "all"

const productGrid = document.querySelector("#productGrid")
const cartList = document.querySelector("#cartList")
const ordersList = document.querySelector("#ordersList")
const subtotalEl = document.querySelector("#subtotal")
const deliveryFeeEl = document.querySelector("#deliveryFee")
const grandTotalEl = document.querySelector("#grandTotal")
const floatingCart = document.querySelector("#floatingCart")
const floatingCount = document.querySelector("#floatingCount")
const floatingTotal = document.querySelector("#floatingTotal")
const toast = document.querySelector("#toast")

function money(value) {
  return currency.format(value)
}

function save() {
  localStorage.setItem("girlfriendShopCart", JSON.stringify(cart))
  localStorage.setItem("girlfriendShopOrders", JSON.stringify(orders))
}

function cartItems() {
  return Object.entries(cart)
    .map(([id, qty]) => {
      const product = products.find((item) => item.id === id)
      return product ? { ...product, qty } : null
    })
    .filter(Boolean)
}

function summary() {
  const items = cartItems()
  const count = items.reduce((sum, item) => sum + item.qty, 0)
  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0)
  const delivery = count === 0 || subtotal === 0 || subtotal >= 52 ? 0 : 6
  return { count, subtotal, delivery, total: subtotal + delivery }
}

function renderProducts() {
  const visible = activeFilter === "all"
    ? products
    : products.filter((product) => product.category === activeFilter)

  productGrid.innerHTML = visible.map((product) => `
    <article class="product-card">
      <img src="${product.image}" alt="${product.name}">
      <div class="product-body">
        <span class="tag">${product.tag}</span>
        <h3>${product.name}</h3>
        <p>${product.desc}</p>
        <div class="product-foot">
          <span class="price">${money(product.price)}</span>
          <button class="add-button" type="button" data-add="${product.id}">加入</button>
        </div>
      </div>
    </article>
  `).join("")
}

function renderCart() {
  const items = cartItems()
  const totals = summary()

  if (!items.length) {
    cartList.innerHTML = `<div class="empty-state">购物车还是空的，先选一点她喜欢的。</div>`
  } else {
    cartList.innerHTML = items.map((item) => `
      <article class="cart-item">
        <img src="${item.image}" alt="${item.name}">
        <div>
          <h3>${item.name}</h3>
          <p>${money(item.price)} / 份</p>
        </div>
        <div class="qty-control" aria-label="${item.name}数量">
          <button class="qty-button" type="button" data-dec="${item.id}">-</button>
          <strong>${item.qty}</strong>
          <button class="qty-button" type="button" data-inc="${item.id}">+</button>
        </div>
      </article>
    `).join("")
  }

  subtotalEl.textContent = money(totals.subtotal)
  deliveryFeeEl.textContent = money(totals.delivery)
  grandTotalEl.textContent = money(totals.total)
  floatingCount.textContent = `${totals.count} 件`
  floatingTotal.textContent = money(totals.total)
  floatingCart.classList.toggle("show", totals.count > 0)
}

function renderOrders() {
  if (!orders.length) {
    ordersList.innerHTML = `<div class="empty-state">还没有订单。生成第一张订单后，它会出现在这里。</div>`
    return
  }

  ordersList.innerHTML = orders.map((order) => `
    <article class="order-card">
      <header>
        <div>
          <h3>${order.id}</h3>
          <small>${order.createdAt}</small>
        </div>
        <span class="status">待投喂</span>
      </header>
      <div class="order-items">
        ${order.items.map((item) => `
          <div class="order-row">
            <span>${item.name} x ${item.qty}</span>
            <strong>${money(item.price * item.qty)}</strong>
          </div>
        `).join("")}
      </div>
      <p class="order-meta">
        ${order.name} · ${order.time}<br>
        ${order.address}<br>
        ${order.note ? `备注：${order.note}<br>` : ""}
        合计：${money(order.total)}
      </p>
    </article>
  `).join("")
}

function showToast(message) {
  toast.textContent = message
  toast.classList.add("show")
  window.clearTimeout(showToast.timer)
  showToast.timer = window.setTimeout(() => {
    toast.classList.remove("show")
  }, 1600)
}

function addToCart(id, qty = 1) {
  cart[id] = Math.max(0, (cart[id] || 0) + qty)
  if (cart[id] === 0) {
    delete cart[id]
  }
  save()
  renderCart()
}

document.querySelector(".filters").addEventListener("click", (event) => {
  const button = event.target.closest("[data-filter]")
  if (!button) return
  activeFilter = button.dataset.filter
  document.querySelectorAll(".filter").forEach((item) => {
    item.classList.toggle("active", item === button)
  })
  renderProducts()
})

productGrid.addEventListener("click", (event) => {
  const button = event.target.closest("[data-add]")
  if (!button) return
  addToCart(button.dataset.add)
  showToast("已经放进购物车啦")
})

cartList.addEventListener("click", (event) => {
  const inc = event.target.closest("[data-inc]")
  const dec = event.target.closest("[data-dec]")
  if (inc) addToCart(inc.dataset.inc, 1)
  if (dec) addToCart(dec.dataset.dec, -1)
})

document.querySelector("#clearCart").addEventListener("click", () => {
  cart = {}
  save()
  renderCart()
  showToast("购物车清空了")
})

document.querySelector("#orderForm").addEventListener("submit", (event) => {
  event.preventDefault()
  const totals = summary()
  const items = cartItems()

  if (!items.length) {
    showToast("先选一点想吃的吧")
    return
  }

  const form = new FormData(event.currentTarget)
  const now = new Date()
  orders.unshift({
    id: `LOVE-${now.getMonth() + 1}${now.getDate()}-${String(now.getTime()).slice(-4)}`,
    createdAt: now.toLocaleString("zh-CN", { hour12: false }),
    name: form.get("name"),
    address: form.get("address"),
    time: form.get("time"),
    note: form.get("note"),
    items,
    total: totals.total
  })

  cart = {}
  save()
  renderCart()
  renderOrders()
  event.currentTarget.reset()
  showToast("订单生成成功，记得去兑现")
  document.querySelector("#orders").scrollIntoView({ behavior: "smooth", block: "start" })
})

renderProducts()
renderCart()
renderOrders()
