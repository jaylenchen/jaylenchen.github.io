import { request } from './http'

export function getArticleViewCount(id: any, pageUrl: any, call: (arg0: any) => void) {
  request.get(`/article/view/${id}?pageUrl=${pageUrl}`, {}).then((result) => {
    call(process(result))
  })
}

function process(result: any) {
  if (result.code === 200) {
    return result.data
  }
  else {
    console.log(result.msg)
  }
}

export default { getArticleViewCount }

