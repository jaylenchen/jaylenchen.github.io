import { DefaultTheme } from 'vitepress';

const OPENWIZARD_BASE_PATH = '/technology/project/openwizard'

const openwizard = (subPath = '') =>
  subPath ? `${OPENWIZARD_BASE_PATH}/${subPath.replace(/^\/+/, '')}` : OPENWIZARD_BASE_PATH

// =====Wizard转译器=====
enum WizardTranspiler {
  wizard缩进语法实现 = 'wizard缩进语法实现'
}
const wizardTranspiler = (subPath: string) => openwizard(`wizard-transpiler/${subPath}`)
const wizardTranspilerSidebar = [
  {
    text: WizardTranspiler.wizard缩进语法实现,
    link: wizardTranspiler(WizardTranspiler.wizard缩进语法实现)
  }
]

const mobile = (subPath: string) => openwizard(`mobile/${subPath}`)
const mobileSidebar = [
  {
    text: '移动应用微信登录功能接入',
    link: mobile('移动应用微信登录功能接入')
  }
]

const nav = {
  text: 'Openwizard',
  link: openwizard(),
  activeMatch: '^/technology/project/openwizard'
}

const sidebar: DefaultTheme.Config['sidebar'] = {
  [OPENWIZARD_BASE_PATH]: [
    ...wizardTranspilerSidebar,
    ...mobileSidebar
  ]
}

export default {
  nav,
  sidebar
}
