import { DefaultTheme } from 'vitepress';

const openwizard = (subPath: string) => '/project/openwizard' + subPath

// =====Wizard转译器=====
enum WizardTranspiler {
  wizard缩进语法实现 = 'wizard缩进语法实现',
  使用nom_combinator = '使用nom_combinator',
  使用nom_multi = '使用nom_multi',
  使用nom_sequence = '使用nom_sequence',
  使用nom_branch = '使用nom_branch'
}
const wizardTranspiler = (subPath: string) => openwizard('/wizard-transpiler/' + subPath)
const wizardTranspilerSidebar = [
  {
    text: WizardTranspiler.wizard缩进语法实现,
    link: wizardTranspiler(WizardTranspiler.wizard缩进语法实现)
  },
  {
    text: WizardTranspiler.使用nom_combinator,
    link: wizardTranspiler(WizardTranspiler.使用nom_combinator)
  },
  {
    text: WizardTranspiler.使用nom_multi,
    link: wizardTranspiler(WizardTranspiler.使用nom_multi)
  },
  {
    text: WizardTranspiler.使用nom_sequence,
    link: wizardTranspiler(WizardTranspiler.使用nom_sequence)
  },
  {
    text: WizardTranspiler.使用nom_branch,
    link: wizardTranspiler(WizardTranspiler.使用nom_branch)
  }
]

const mobile = (subPath: string) => openwizard('/mobile/' + subPath)
const mobileSidebar = [
  {
    text: '移动应用微信登录功能接入',
    link: mobile('移动应用微信登录功能接入')
  }
]

const nav = { text: 'openwizard', link: wizardTranspiler(WizardTranspiler.wizard缩进语法实现) }

const sidebar: DefaultTheme.Config['sidebar'] = {
  [openwizard('/')]: [
    ...wizardTranspilerSidebar,
    ...mobileSidebar
  ]
}

export default {
  nav,
  sidebar
}
