import { createApp } from 'vue'
import type { Component } from 'vue'
import { createPinia } from 'pinia'
import App from './Home.vue'
import router from './router'
import { useThemeStore } from '@/stores/theme'

// 按需引入组件与图标，避免把整包 Element Plus 和全部图标塞进首屏
import {
  ElAlert,
  ElButton,
  ElCheckbox,
  ElCollapse,
  ElCollapseItem,
  ElDivider,
  ElDropdown,
  ElDropdownItem,
  ElDropdownMenu,
  ElEmpty,
  ElIcon,
  ElImage,
  ElInput,
  ElLink,
  ElLoading,
  ElProgress,
  ElSkeleton,
  ElSlider,
  ElTag,
} from 'element-plus'
import {
  ArrowDown,
  Clock,
  Film,
  Loading,
  Lock,
  Moon,
  Picture,
  PictureFilled,
  Promotion,
  Refresh,
  Search,
  Star,
  StarFilled,
  Sunny,
  Timer,
  TopRight,
  UploadFilled,
  User,
  VideoPause,
  VideoPlay,
} from '@element-plus/icons-vue'

import 'element-plus/es/components/alert/style/css'
import 'element-plus/es/components/button/style/css'
import 'element-plus/es/components/checkbox/style/css'
import 'element-plus/es/components/collapse/style/css'
import 'element-plus/es/components/collapse-item/style/css'
import 'element-plus/es/components/divider/style/css'
import 'element-plus/es/components/dropdown/style/css'
import 'element-plus/es/components/dropdown-item/style/css'
import 'element-plus/es/components/dropdown-menu/style/css'
import 'element-plus/es/components/empty/style/css'
import 'element-plus/es/components/icon/style/css'
import 'element-plus/es/components/image/style/css'
import 'element-plus/es/components/input/style/css'
import 'element-plus/es/components/link/style/css'
import 'element-plus/es/components/loading/style/css'
import 'element-plus/es/components/notification/style/css'
import 'element-plus/es/components/progress/style/css'
import 'element-plus/es/components/skeleton/style/css'
import 'element-plus/es/components/slider/style/css'
import 'element-plus/es/components/tag/style/css'
import 'element-plus/theme-chalk/dark/css-vars.css'
// 顺序要紧：先声明设计令牌，再让全局样式引用它们
import '@/assets/styles/tokens.scss'
import '@/assets/styles/main.scss'

const pinia = createPinia()
const app = createApp(App)

const components: Record<string, Component> = {
  ElAlert,
  ElButton,
  ElCheckbox,
  ElCollapse,
  ElCollapseItem,
  ElDivider,
  ElDropdown,
  ElDropdownItem,
  ElDropdownMenu,
  ElEmpty,
  ElIcon,
  ElImage,
  ElInput,
  ElLink,
  ElProgress,
  ElSkeleton,
  ElSlider,
  ElTag,
}

const icons: Record<string, Component> = {
  ArrowDown,
  Clock,
  Film,
  Loading,
  Lock,
  Moon,
  Picture,
  PictureFilled,
  Promotion,
  Refresh,
  Search,
  Star,
  StarFilled,
  Sunny,
  Timer,
  TopRight,
  UploadFilled,
  User,
  VideoPause,
  VideoPlay,
}

for (const [name, component] of Object.entries(components)) {
  app.component(name, component)
}
for (const [name, icon] of Object.entries(icons)) {
  app.component(name, icon)
}

app.use(ElLoading)
app.use(router)
app.use(pinia)

// 尽早应用主题，避免首屏闪白
useThemeStore().applyTheme()

app.mount('#app')
