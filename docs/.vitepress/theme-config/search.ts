import { DefaultTheme } from 'vitepress'


export const search: DefaultTheme.Config['search'] = {
  provider: 'local',
  options: {
    locales: {
      root: {
        translations: {
          button: {
            buttonText: '搜一搜',
            buttonAriaLabel: '搜一搜'
          },
          modal: {
            noResultsText: '无法找到相关结果',
            resetButtonTitle: '清除查询条件',
            footer: {
              selectText: '选择',
              navigateText: '切换'
            }
          }
        }
      }
    }
  }
}
