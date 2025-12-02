import { baseFetch } from '../wx-utils/fetch/index'

export const getUserInfoAndValid = async (data) => {
  const res = await baseFetch.get({
    url: '/live/api/v1/class/getUserInfoAndValid',
    data,
  })
  return res.data
}

export const userLogin = async (data) => {
  const res = await baseFetch.post({
    url: '/live/api/v1/class/login',
    data,
  })
  return res.data
}

export const joinClass = async (data) => {
  const res = await baseFetch.post({
    url: '/live/api/v1/class/joinClass',
    data,
  })
  return res.data
}

export const getSdkParam = async (data) => {
  const res = await baseFetch.get({
    url: '/live/api/liveRooms/sdk/param',
    data,
  })
  return res.data
}

export const getClass = async (data) => {
  const res = await baseFetch.post({
    url: '/live/api/v1/class/get',
    data,
  })
  return res.data
}

export const getLiveRoomDetail = async (id) => {
  const res = await baseFetch.get({
    url: `/live/api/liveRooms/${id}`,
  })
  return res.data
}

export const getToken = async (data) => {
  const res = await baseFetch.post({
    url: '/live/api/v2/class/token',
    data,
  })
  return res.data
}

export const sendMessage = async (data) => {
  const res = await baseFetch.post({
    url: '/live/api/liveRoom/comments',
    data,
    isShowLoading: false,
  })
  return res.data
}

export const getAttachments = async (data) => {
  const res = await baseFetch.get({
    url: '/live/liveRoom/attachments',
    data: {
      pageIndex: 1,
      pageSize: 100,
      ...data,
    },
  })
  return res.data
}
