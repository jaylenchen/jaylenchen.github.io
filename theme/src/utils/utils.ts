/**
 * 格式化时间
 *
 * @param date 待格式化时间
 * @returns 格式化后的时间(YYYY/MM/dd AM hh:mm)
 */
export function formatDate(date: string | number | Date) {
  const formatDate = new Date(date);
  return formatDate.toLocaleString('zh', {year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric'});
}

/**
 * 获取 URL 路径中的指定参数
 *
 * @param paramName 参数名
 * @returns 参数值
 */
export function getQueryParam(paramName: string) {
  if (typeof window === 'undefined') return null;
  const reg = new RegExp("(^|&)"+ paramName +"=([^&]*)(&|$)");
  let value = decodeURIComponent(window.location.search.substr(1)).match(reg);
  if (value != null) {
    return unescape(value[2]);
  }
  return null;
}

/**
 * 跳转到指定链接
 *
 * @param url 目标 URL
 * @param paramName 参数名
 * @param paramValue 参数值
 */
export function goToLink(url: string, paramName?: string, paramValue?: string) {
  if (typeof window === 'undefined') return;
  
  if (paramName && paramValue) {
    // 如果 URL 已经包含 #，先分离路径和 hash
    const hashIndex = url.indexOf('#')
    const baseUrl = hashIndex !== -1 ? url.substring(0, hashIndex) : url
    const hash = hashIndex !== -1 ? url.substring(hashIndex) : ''
    
    // 检查 baseUrl 是否已经包含查询参数
    const separator = baseUrl.includes('?') ? '&' : '?'
    // 对参数值进行 URL 编码，确保特殊字符（如中文、空格等）被正确处理
    const encodedValue = encodeURIComponent(paramValue)
    
    window.location.href = baseUrl + separator + paramName + '=' + encodedValue + hash
  } else {
    window.location.href = url
  }
}

/**
 * 获取生肖图标
 *
 * @param year 年份
 */
export function getChineseZodiac(year: number) {
  const arr = ['monkey', 'rooster', 'dog', 'pig', 'rat', 'ox', 'tiger', 'rabbit', 'dragon', 'snake', 'horse', 'goat'];
  return arr[year % 12];
}

/**
 * 获取生肖名称
 *
 * @param year 年份
 */
export function getChineseZodiacAlias(year: number) {
  const arr = ['猴年', '鸡年', '狗年', '猪年', '鼠年', '牛年', '虎年', '兔年', '龙年', '蛇年', '马年', '羊年'];
  return arr[year % 12];
}

/**
 * 统计去重后的文章数量（按 path 唯一）
 */
export function countUniqueArticles(articles: Array<{ path?: string }>): number {
  const unique = new Set<string>();
  for (const a of articles || []) {
    if (a && typeof a.path === 'string') unique.add(a.path);
  }
  return unique.size;
}
