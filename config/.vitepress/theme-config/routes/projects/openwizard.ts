import { DefaultTheme } from 'vitepress';

const openwizard = (subPath: string) => '/projects/openwizard' + subPath

// =====Wizard转译器=====
enum WizardTranspiler {
  wizard缩进算法实现 = 'wizard缩进算法实现',
}
const wizardTranspiler = (subPath: string) => openwizard('/wizard-transpiler/' + subPath)
const wizardTranspilerSidebar = {
  text: 'wizard转译器',
  items: [
    {
      text: WizardTranspiler.wizard缩进算法实现,
      link: wizardTranspiler(WizardTranspiler.wizard缩进算法实现)
    },
  ],
  collapsed: true
}

const nav = { text: 'openwizard', link: wizardTranspiler(WizardTranspiler.wizard缩进算法实现) }

const sidebar: DefaultTheme.Config['sidebar'] = {
  [openwizard('/')]: [
    wizardTranspilerSidebar
  ]
}

export default {
  nav,
  sidebar
}
