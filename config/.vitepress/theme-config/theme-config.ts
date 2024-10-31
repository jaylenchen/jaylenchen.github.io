import { DefaultTheme, LocaleSpecificConfig } from 'vitepress';
import { footer } from './footer';
import { search } from './search';
import { CustomConfig, customConfig } from './custom'
import {nav, sidebar} from '../routes/routes'

export const themeConfig = {
  // 配置首页左上角的icon+title
  logo: '/svgs/avatar.svg', // 首页左上角的icon
  siteTitle: 'jaylenchen的思维随笔', // 首页左上角的title
  outline: {
    level: 'deep',
    label: '目录',
  },
  search,
  nav,
  sidebar,
  footer,
  docFooter: {
    prev: '上一页',
    next: '下一页'
  },
  lastUpdated: {
    text: '最后更新于',
    formatOptions: {
      dateStyle: 'short',
      timeStyle: 'short'
    }
  },
  editLink: {
    pattern: 'https://github.com/jaylenchen/jaylenchen.github.io/edit/main/packages/docs/src/:path',
    text: '在 GitHub 上编辑此页面'
  },
  socialLinks: [
    { icon: 'github', link: 'https://github.com/jaylenchen' },
  ],
  langMenuLabel: '多语言',
  returnToTopLabel: '回到顶部',
  sidebarMenuLabel: '菜单',
  darkModeSwitchLabel: '主题',
  lightModeSwitchTitle: '切换到浅色模式',
  darkModeSwitchTitle: '切换到深色模式',
  customConfig
} satisfies LocaleSpecificConfig<DefaultTheme.Config>['themeConfig'] & {
  customConfig: CustomConfig
}
