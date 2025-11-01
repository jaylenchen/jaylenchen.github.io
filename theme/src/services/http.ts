import axios from 'axios'

function createBaseInstance() {
  const instance = axios.create({
    timeout: 3000,
  })
  instance.interceptors.response.use((res) => res.data)
  return instance
}

export const request = createBaseInstance()

