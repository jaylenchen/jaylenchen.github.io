const LIFE_BASE_PATH = '/life'

const life = (subPath = '') =>
  subPath ? `${LIFE_BASE_PATH}/${subPath.replace(/^\/+/, '')}` : LIFE_BASE_PATH

const nav = {
  text: '生活',
  link: life(),
  activeMatch: '^/life'
}

const sidebar = {
  [LIFE_BASE_PATH]: [
    {
      text: 'GTD时间管理',
      link: life('GTD时间管理')
    }
  ]
}

export default {
  nav,
  sidebar
}
